import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CompleteHabitRequest {
  habitId: number;
  date?: string; // YYYY-MM-DD format, defaults to today
}

interface CompleteHabitResponse {
  success: boolean;
  message: string;
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
      await db.exec`
        INSERT INTO habit_completions (habit_id, completion_date)
        VALUES (${req.habitId}, ${completionDate})
        ON CONFLICT (habit_id, completion_date) DO NOTHING
      `;
      
      return {
        success: true,
        message: "Habit marked as complete"
      };
    } catch (err) {
      throw APIError.internal("failed to complete habit", err as Error);
    }
  }
);
