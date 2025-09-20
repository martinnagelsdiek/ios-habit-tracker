import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { Habit } from "./create";

interface ListHabitsResponse {
  habits: Habit[];
}

// Retrieves all active habits for the authenticated user.
export const listHabits = api<void, ListHabitsResponse>(
  { auth: true, expose: true, method: "GET", path: "/habits" },
  async () => {
    const auth = getAuthData()!;
    
    const habits = await db.queryAll<{
      id: number;
      user_id: string;
      category_id: number;
      name: string;
      description: string | null;
      frequency_type: string;
      due_date: Date;
      frequency_day: number | null;
      recurs_on_weekday: boolean;
      created_at: Date;
      is_active: boolean;
      reminder_enabled: boolean;
      reminder_time: string | null;
      reminder_days_before: number;
      category_name: string;
      category_color: string;
      category_icon: string;
    }>`
      SELECT h.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM habits h
      JOIN categories c ON h.category_id = c.id
      WHERE h.user_id = ${auth.userID} AND h.is_active = TRUE
      ORDER BY h.created_at DESC
    `;

    return {
      habits: habits.map(h => ({
        id: h.id,
        userId: h.user_id,
        categoryId: h.category_id,
        name: h.name,
        description: h.description,
        frequencyType: h.frequency_type as any,
        dueDate: h.due_date,
        frequencyDay: h.frequency_day,
        recursOnWeekday: h.recurs_on_weekday,
        createdAt: h.created_at,
        isActive: h.is_active,
        categoryName: h.category_name,
        categoryColor: h.category_color,
        categoryIcon: h.category_icon,
        reminderEnabled: h.reminder_enabled,
        reminderTime: h.reminder_time,
        reminderDaysBefore: h.reminder_days_before,
      }))
    };
  }
);
