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
    
    try {
      // Load basic habit info first
      const habit = await db.queryRow<{
        id: number;
        user_id: string;
        category_id: number;
      }>`
        SELECT h.id, h.user_id, h.category_id
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

      // Try to get leveling fields, use defaults if they don't exist
      let difficulty = 'normal';
      let cadence = 'daily';
      let target = null;

      try {
        const levelingFields = await db.queryRow<{
          difficulty: string;
          cadence: string;
          target: number | null;
        }>`
          SELECT difficulty, cadence, target
          FROM habits
          WHERE id = ${req.habitId}
        `;
        if (levelingFields) {
          difficulty = levelingFields.difficulty || 'normal';
          cadence = levelingFields.cadence || 'daily';
          target = levelingFields.target;
        }
      } catch (err) {
        console.log("Leveling fields not available, using defaults");
      }

      // Calculate XP with actual leveling logic if tables exist
      let breakdown = {
        habitXP: 20, // default
        streak: 0,
        mult: 1,
        categoryGain: 20,
        overallGain: 15
      };

      if (difficulty && cadence) {
        try {
          // Try to compute actual XP
          const xpCalc = computeXP({
            difficulty: difficulty as any,
            cadence: cadence as any,
            streakCount: 0, // simplified for now
            amount: req.amount,
            target: target || undefined,
            todayFracFromHabit: 0 // simplified for now
          });
          breakdown = xpCalc;
        } catch (err) {
          console.log("XP calculation failed, using defaults");
        }
      }

      // Try to update leveling tables if they exist
      let levelingResult = {
        overallLeveledUp: false,
        overallNewLevel: 1,
        categoryLeveledUp: false,
        categoryNewLevel: 1,
        categoryRankChanged: false,
        categoryNewRank: 'Novice'
      };

      try {
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

        // Apply XP gains
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
          WHERE user_id = ${userId}
        `;

        levelingResult.overallLeveledUp = overallResult.leveledUp;
        levelingResult.overallNewLevel = overallResult.newLevel;

        // Handle category progress
        try {
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

          const categoryResult = awardCategory({
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
            WHERE user_id = ${userId} AND category_id = ${habit.category_id}
          `;

          levelingResult.categoryLeveledUp = categoryResult.leveledUp;
          levelingResult.categoryNewLevel = categoryResult.newLevel;
          levelingResult.categoryRankChanged = categoryResult.rankChanged;
          levelingResult.categoryNewRank = categoryResult.newRank;
        } catch (err) {
          console.log("Category progress update failed:", err);
        }
      } catch (err) {
        console.log("Leveling tables not available or update failed:", err);
      }

      // Create basic completion record (this should always work)
      await db.exec`
        INSERT INTO habit_completions (habit_id, completion_date)
        VALUES (${req.habitId}, ${today})
      `;

      return {
        success: true,
        breakdown,
        newLevels: levelingResult,
        bars: {
          overallCurrentXP: 0,
          overallNeededXP: xpNeededForNext(levelingResult.overallNewLevel),
          categoryXP: 0,
          categoryNeededXP: 200
        }
      };
    } catch (error) {
      console.error("Error in completeHabit:", error);
      throw APIError.internal("Failed to complete habit", error as Error);
    }
  }
);