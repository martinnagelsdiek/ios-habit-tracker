import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface UncompleteHabitRequest {
  habitId: number;
  date?: string; // YYYY-MM-DD format, defaults to today
}

interface UncompleteHabitResponse {
  success: boolean;
  message: string;
}

// Removes completion for a habit on a specific date.
export const uncompleteHabit = api<UncompleteHabitRequest, UncompleteHabitResponse>(
  { auth: true, expose: true, method: "DELETE", path: "/habits/complete" },
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

    await db.exec`
      DELETE FROM habit_completions 
      WHERE habit_id = ${req.habitId} AND completion_date = ${completionDate}
    `;
    
    return {
      success: true,
      message: "Habit completion removed"
    };
  }
);
