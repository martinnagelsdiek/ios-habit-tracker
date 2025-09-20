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
} from "../leveling/engine";

interface CompleteHabitRequest {
  habitId: number;
  date?: string; // YYYY-MM-DD format, defaults to today
  amount?: number;
}

interface CompleteHabitResponse {
  success: boolean;
  message: string;
  levelingData?: {
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
  };
}

// Marks a habit as complete for a specific date.
export const completeHabit = api<CompleteHabitRequest, CompleteHabitResponse>(
  { auth: true, expose: true, method: "POST", path: "/habits/complete" },
  async (req) => {
    const auth = getAuthData()!;
    const completionDate = req.date || new Date().toISOString().split('T')[0];
    
    // Verify habit belongs to user
    const habit = await db.queryRow`
      SELECT id FROM habits WHERE id = ${req.habitId} AND user_id = ${auth.userID}
    `;
    if (!habit) {
      throw APIError.notFound("habit not found");
    }

    try {
      // Check if already completed (for idempotency)
      const existingCompletion = await db.queryRow`
        SELECT id FROM habit_completions 
        WHERE habit_id = ${req.habitId} AND completion_date = ${completionDate}
      `;
      
      if (existingCompletion) {
        return {
          success: true,
          message: "Habit already completed for this date"
        };
      }

      // Get habit details including category for leveling
      const habitDetails = await db.queryRow<{
        id: number;
        user_id: string;
        category_id: number;
        difficulty?: string;
        cadence?: string;
        target?: number;
      }>`
        SELECT h.id, h.user_id, h.category_id, h.difficulty, h.cadence, h.target
        FROM habits h
        WHERE h.id = ${req.habitId}
      `;

      if (!habitDetails) {
        throw APIError.notFound("habit not found");
      }

      // Insert completion record
      await db.exec`
        INSERT INTO habit_completions (habit_id, completion_date)
        VALUES (${req.habitId}, ${completionDate})
      `;

      // Calculate and apply leveling XP
      let levelingData;
      try {
        // Use defaults if leveling fields don't exist
        const difficulty = (habitDetails.difficulty || 'normal') as Difficulty;
        const cadence = (habitDetails.cadence || 'daily') as Cadence;
        const target = habitDetails.target;

        // Calculate XP
        const breakdown = computeXP({
          difficulty,
          cadence,
          streakCount: 0, // simplified for now
          amount: req.amount,
          target: target || undefined,
          todayFracFromHabit: 0 // simplified for now
        });

        // Get or create user progress
        let userProgress = await db.queryRow<{
          overall_level: number;
          overall_current_xp: number;
          overall_total_xp: number;
        }>`
          SELECT overall_level, overall_current_xp, overall_total_xp
          FROM user_progress
          WHERE user_id = ${auth.userID}
        `;

        if (!userProgress) {
          await db.exec`
            INSERT INTO user_progress (user_id, overall_level, overall_current_xp, overall_total_xp)
            VALUES (${auth.userID}, 1, 0, 0)
          `;
          userProgress = { overall_level: 1, overall_current_xp: 0, overall_total_xp: 0 };
        }

        // Apply overall XP gains
        const overallResult = awardOverall({
          overallLevel: userProgress.overall_level,
          overallCurrentXP: userProgress.overall_current_xp,
          overallTotalXP: userProgress.overall_total_xp
        }, breakdown.overallGain);

        // Update user progress
        await db.exec`
          UPDATE user_progress 
          SET overall_level = ${overallResult.newLevel},
              overall_current_xp = ${userProgress.overall_current_xp},
              overall_total_xp = ${userProgress.overall_total_xp},
              updated_at = NOW()
          WHERE user_id = ${auth.userID}
        `;

        // Handle category progress
        let categoryResult = {
          leveledUp: false,
          newLevel: 1,
          rankChanged: false,
          newRank: 'Novice'
        };

        try {
          let categoryProgress = await db.queryRow<{
            level: number;
            xp: number;
            rank: string;
          }>`
            SELECT level, xp, rank
            FROM category_progress
            WHERE user_id = ${auth.userID} AND category_id = ${habitDetails.category_id}
          `;

          if (!categoryProgress) {
            await db.exec`
              INSERT INTO category_progress (user_id, category_id, level, xp, rank)
              VALUES (${auth.userID}, ${habitDetails.category_id}, 1, 0, 'Novice')
            `;
            categoryProgress = { level: 1, xp: 0, rank: 'Novice' };
          }

          categoryResult = awardCategory({
            level: categoryProgress.level,
            xp: categoryProgress.xp,
            rank: categoryProgress.rank as any
          }, breakdown.categoryGain);

          await db.exec`
            UPDATE category_progress 
            SET level = ${categoryResult.newLevel},
                xp = ${categoryProgress.xp},
                rank = ${categoryResult.newRank},
                updated_at = NOW()
            WHERE user_id = ${auth.userID} AND category_id = ${habitDetails.category_id}
          `;
        } catch (err) {
          console.log("Category progress update failed:", err);
        }

        levelingData = {
          breakdown,
          newLevels: {
            overallLeveledUp: overallResult.leveledUp,
            overallNewLevel: overallResult.newLevel,
            categoryLeveledUp: categoryResult.leveledUp,
            categoryNewLevel: categoryResult.newLevel,
            categoryRankChanged: categoryResult.rankChanged,
            categoryNewRank: String(categoryResult.newRank)
          }
        };
      } catch (err) {
        console.log("Leveling calculation failed, continuing without XP:", err);
      }
      
      return {
        success: true,
        message: "Habit marked as complete",
        levelingData
      };
    } catch (err) {
      throw APIError.internal("failed to complete habit", err as Error);
    }
  }
);
