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
      // Load basic habit info (this should work with existing schema)
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

      // Create basic completion record (this should work with existing schema)
      await db.exec`
        INSERT INTO habit_completions (habit_id, completion_date)
        VALUES (${req.habitId}, ${today})
      `;

      // Return basic response (simulated XP values for now)
      return {
        success: true,
        breakdown: {
          habitXP: 20,
          streak: 0,
          mult: 1,
          categoryGain: 20,
          overallGain: 15
        },
        newLevels: {
          overallLeveledUp: false,
          overallNewLevel: 1,
          categoryLeveledUp: false,
          categoryNewLevel: 1,
          categoryRankChanged: false,
          categoryNewRank: 'Novice'
        },
        bars: {
          overallCurrentXP: 0,
          overallNeededXP: 200,
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