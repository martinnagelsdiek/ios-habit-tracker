import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { 
  computeXP, 
  awardOverall, 
  awardCategory, 
  Difficulty, 
  Cadence,
  mapRank,
  xpNeededForNext
} from "./engine";

export interface LevelingCompleteRequest {
  habitId: number;
  amount?: number;
}

export interface LevelingCompleteResponse {
  success: boolean;
  breakdown: {
    habitXP: number;
    streak: number;
    mult: number;
    categoryGain: number;
    overallGain: number;
  };
  newLevels: {
    overallLeveledUp: boolean;
    overallNewLevel: number;
    categoryLeveledUp: boolean;
    categoryNewLevel: number;
    categoryRankChanged: boolean;
    categoryNewRank: string;
  };
  bars: {
    overallCurrentXP: number;
    overallNeededXP: number;
    categoryXP: number;
    categoryNeededXP: number;
  };
}

export const completeHabit = api<LevelingCompleteRequest, LevelingCompleteResponse>(
  { auth: true, expose: true, method: "POST", path: "/leveling/complete" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const today = new Date().toISOString().split('T')[0];
    
    // Load habit with category info
    const habit = await db.queryRow<{
      id: number;
      user_id: string;
      category_id: number;
      difficulty: Difficulty;
      cadence: Cadence;
      target: number | null;
    }>`
      SELECT h.id, h.user_id, h.category_id, h.difficulty, h.cadence, h.target
      FROM habits h
      WHERE h.id = ${req.habitId} AND h.user_id = ${userId}
    `;
    
    if (!habit) {
      throw APIError.notFound("habit not found");
    }

    // Check if already completed today (idempotency)
    const existingCompletion = await db.queryRow`
      SELECT id FROM habit_completions 
      WHERE habit_id = ${req.habitId} AND completion_date = ${today}
    `;
    
    if (existingCompletion) {
      throw APIError.invalidArgument("habit already completed today");
    }

    // Get or create streak
    let streak = await db.queryRow<{
      count: number;
      last_completed_on: string | null;
    }>`
      SELECT count, last_completed_on 
      FROM streaks 
      WHERE user_id = ${userId} AND habit_id = ${req.habitId}
    `;
    
    if (!streak) {
      await db.exec`
        INSERT INTO streaks (user_id, habit_id, cadence, count, last_completed_on)
        VALUES (${userId}, ${req.habitId}, ${habit.cadence}, 0, NULL)
      `;
      streak = { count: 0, last_completed_on: null };
    }

    // Update streak with grace period logic
    const lastDate = streak.last_completed_on ? new Date(streak.last_completed_on) : null;
    const todayDate = new Date(today);
    let newStreakCount = streak.count;
    
    if (habit.cadence === "daily") {
      if (!lastDate) {
        newStreakCount = 1;
      } else {
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          newStreakCount = streak.count + 1;
        } else if (daysDiff === 0) {
          // Same day, no change to streak
        } else {
          newStreakCount = 1; // Reset streak
        }
      }
    } else if (habit.cadence === "weekly") {
      // ISO week logic - simplified for now
      if (!lastDate) {
        newStreakCount = 1;
      } else {
        const weeksDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (weeksDiff === 1) {
          newStreakCount = streak.count + 1;
        } else if (weeksDiff === 0) {
          // Same week, no change
        } else {
          newStreakCount = 1; // Reset
        }
      }
    }

    // Calculate today's XP fraction from this habit
    const todayXP = await db.queryRow<{ total_xp: number | null }>`
      SELECT COALESCE(SUM(
        CASE 
          WHEN hc.xp_applied THEN 
            -- Estimate XP from previous completions (simplified)
            CASE h.difficulty
              WHEN 'trivial' THEN 5
              WHEN 'easy' THEN 10
              WHEN 'normal' THEN 20
              WHEN 'hard' THEN 35
              WHEN 'epic' THEN 60
            END
          ELSE 0
        END
      ), 0) as total_xp
      FROM habit_completions hc
      JOIN habits h ON hc.habit_id = h.id
      WHERE h.user_id = ${userId} 
        AND hc.completion_date = ${today}
        AND hc.habit_id = ${req.habitId}
    `;

    const todayTotalXP = await db.queryRow<{ total_xp: number | null }>`
      SELECT COALESCE(SUM(
        CASE 
          WHEN hc.xp_applied THEN 
            CASE h.difficulty
              WHEN 'trivial' THEN 5
              WHEN 'easy' THEN 10
              WHEN 'normal' THEN 20
              WHEN 'hard' THEN 35
              WHEN 'epic' THEN 60
            END
          ELSE 0
        END
      ), 0) as total_xp
      FROM habit_completions hc
      JOIN habits h ON hc.habit_id = h.id
      WHERE h.user_id = ${userId} AND hc.completion_date = ${today}
    `;

    const habitTodayXP = todayXP?.total_xp || 0;
    const totalTodayXP = todayTotalXP?.total_xp || 0;
    const todayFracFromHabit = totalTodayXP > 0 ? habitTodayXP / totalTodayXP : 0;

    // Compute XP
    const xpBreakdown = computeXP({
      difficulty: habit.difficulty,
      cadence: habit.cadence,
      streakCount: newStreakCount,
      amount: req.amount,
      target: habit.target || undefined,
      todayFracFromHabit
    });

    // Get or create user progress
    let userProgress = await db.queryRow<{
      overall_level: number;
      overall_current_xp: number;
      overall_total_xp: number;
    }>`
      SELECT overall_level, overall_current_xp, overall_total_xp
      FROM user_progress
      WHERE user_id = ${userId}
    `;

    if (!userProgress) {
      await db.exec`
        INSERT INTO user_progress (user_id, overall_level, overall_current_xp, overall_total_xp)
        VALUES (${userId}, 1, 0, 0)
      `;
      userProgress = { overall_level: 1, overall_current_xp: 0, overall_total_xp: 0 };
    }

    // Get or create category progress
    let categoryProgress = await db.queryRow<{
      level: number;
      xp: number;
      rank: string;
    }>`
      SELECT level, xp, rank
      FROM category_progress
      WHERE user_id = ${userId} AND category_id = ${habit.category_id}
    `;

    if (!categoryProgress) {
      await db.exec`
        INSERT INTO category_progress (user_id, category_id, level, xp, rank)
        VALUES (${userId}, ${habit.category_id}, 1, 0, 'Novice')
      `;
      categoryProgress = { level: 1, xp: 0, rank: 'Novice' };
    }

    // Award XP
    const overallResult = awardOverall({
      overallLevel: userProgress.overall_level,
      overallCurrentXP: userProgress.overall_current_xp,
      overallTotalXP: userProgress.overall_total_xp
    }, xpBreakdown.overallGain);

    const categoryResult = awardCategory({
      level: categoryProgress.level,
      xp: categoryProgress.xp,
      rank: categoryProgress.rank as any
    }, xpBreakdown.categoryGain);

    // Update database
    await db.exec`
      UPDATE user_progress 
      SET overall_level = ${overallResult.newLevel},
          overall_current_xp = ${userProgress.overall_current_xp},
          overall_total_xp = ${userProgress.overall_total_xp},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    await db.exec`
      UPDATE category_progress 
      SET level = ${categoryResult.newLevel},
          xp = ${categoryProgress.xp},
          rank = ${categoryResult.newRank},
          updated_at = NOW()
      WHERE user_id = ${userId} AND category_id = ${habit.category_id}
    `;

    await db.exec`
      UPDATE streaks
      SET count = ${newStreakCount},
          last_completed_on = ${today},
          updated_at = NOW()
      WHERE user_id = ${userId} AND habit_id = ${req.habitId}
    `;

    // Create completion record
    await db.exec`
      INSERT INTO habit_completions (habit_id, completion_date, xp_applied, amount)
      VALUES (${req.habitId}, ${today}, TRUE, ${req.amount || null})
    `;

    return {
      success: true,
      breakdown: xpBreakdown,
      newLevels: {
        overallLeveledUp: overallResult.leveledUp,
        overallNewLevel: overallResult.newLevel,
        categoryLeveledUp: categoryResult.leveledUp,
        categoryNewLevel: categoryResult.newLevel,
        categoryRankChanged: categoryResult.rankChanged,
        categoryNewRank: categoryResult.newRank
      },
      bars: {
        overallCurrentXP: userProgress.overall_current_xp,
        overallNeededXP: xpNeededForNext(overallResult.newLevel),
        categoryXP: categoryProgress.xp,
        categoryNeededXP: categoryResult.newLevel < 100 ? 
          Math.round(100 * Math.pow(categoryResult.newLevel + 1, 1.6)) : 0
      }
    };
  }
);