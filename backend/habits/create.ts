import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

export interface CreateHabitRequest {
  name: string;
  description?: string;
  categoryId: number;
  frequencyType: FrequencyType;
  dueDate: string; // YYYY-MM-DD format
  frequencyDay?: number; // day of week (0-6 for weekly), day of month (1-31 for monthly), etc.
  recursOnWeekday?: boolean; // for weekly/other frequencies: true = same weekday pattern, false = exact date
}

export interface Habit {
  id: number;
  userId: string;
  categoryId: number;
  name: string;
  description: string | null;
  frequencyType: FrequencyType;
  dueDate: Date;
  frequencyDay: number | null;
  recursOnWeekday: boolean;
  createdAt: Date;
  isActive: boolean;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

// Creates a new habit for the authenticated user.
export const createHabit = api<CreateHabitRequest, Habit>(
  { auth: true, expose: true, method: "POST", path: "/habits" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Verify category exists
    const category = await db.queryRow`
      SELECT id, name, color, icon FROM categories WHERE id = ${req.categoryId}
    `;
    if (!category) {
      throw APIError.invalidArgument("category not found");
    }

    const habit = await db.queryRow<{
      id: number;
      user_id: string;
      category_id: number;
      name: string;
      description: string | null;
      frequency_type: FrequencyType;
      due_date: Date;
      frequency_day: number | null;
      recurs_on_weekday: boolean;
      created_at: Date;
      is_active: boolean;
    }>`
      INSERT INTO habits (user_id, category_id, name, description, frequency_type, due_date, frequency_day, recurs_on_weekday)
      VALUES (${auth.userID}, ${req.categoryId}, ${req.name}, ${req.description || null}, ${req.frequencyType}, ${req.dueDate}, ${req.frequencyDay || null}, ${req.recursOnWeekday || false})
      RETURNING *
    `;

    if (!habit) {
      throw APIError.internal("failed to create habit");
    }

    return {
      id: habit.id,
      userId: habit.user_id,
      categoryId: habit.category_id,
      name: habit.name,
      description: habit.description,
      frequencyType: habit.frequency_type,
      dueDate: habit.due_date,
      frequencyDay: habit.frequency_day,
      recursOnWeekday: habit.recurs_on_weekday,
      createdAt: habit.created_at,
      isActive: habit.is_active,
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
    };
  }
);
