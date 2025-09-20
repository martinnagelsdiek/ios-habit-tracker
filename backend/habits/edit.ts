import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { Habit, FrequencyType } from "./create";

export interface EditHabitRequest {
  id: number;
  name?: string;
  description?: string;
  categoryId?: number;
  frequencyType?: FrequencyType;
  dueDate?: string; // YYYY-MM-DD format
  frequencyDay?: number;
  recursOnWeekday?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:MM format
  reminderDaysBefore?: number;
}

// Updates an existing habit for the authenticated user.
export const editHabit = api<EditHabitRequest, Habit>(
  { auth: true, expose: true, method: "PUT", path: "/habits/:id" },
  async (req) => {
    try {
      const auth = getAuthData()!;
      console.log("Edit habit request:", JSON.stringify(req, null, 2));
    
    // Check if habit exists and belongs to user
    const existingHabit = await db.queryRow`
      SELECT id, name, description, category_id, frequency_type, due_date, frequency_day, recurs_on_weekday, reminder_enabled, reminder_time, reminder_days_before FROM habits 
      WHERE id = ${req.id} AND user_id = ${auth.userID} AND is_active = true
    `;
    console.log("Existing habit:", existingHabit);
    if (!existingHabit) {
      throw APIError.notFound("habit not found");
    }

    // Use existing values if not provided in request
    const name = req.name !== undefined ? req.name : existingHabit.name;
    const description = req.description !== undefined ? req.description : existingHabit.description;
    const categoryId = req.categoryId !== undefined ? req.categoryId : existingHabit.category_id;
    const frequencyType = req.frequencyType !== undefined ? req.frequencyType : existingHabit.frequency_type;
    const dueDate = req.dueDate !== undefined ? req.dueDate : existingHabit.due_date.toISOString().split('T')[0];
    const frequencyDay = req.frequencyDay !== undefined ? req.frequencyDay : existingHabit.frequency_day;
    const recursOnWeekday = req.recursOnWeekday !== undefined ? req.recursOnWeekday : existingHabit.recurs_on_weekday;
    const reminderEnabled = req.reminderEnabled !== undefined ? req.reminderEnabled : existingHabit.reminder_enabled;
    const reminderTime = req.reminderTime !== undefined ? req.reminderTime : (req.reminderEnabled === false ? null : existingHabit.reminder_time);
    const reminderDaysBefore = req.reminderDaysBefore !== undefined ? req.reminderDaysBefore : (req.reminderEnabled === false ? 0 : existingHabit.reminder_days_before);

    // If categoryId is being updated, verify the new category exists
    if (req.categoryId !== undefined) {
      const category = await db.queryRow`
        SELECT id FROM categories WHERE id = ${categoryId}
      `;
      if (!category) {
        throw APIError.invalidArgument("category not found");
      }
    }

    console.log("Values to update:", {
      name, description, categoryId, frequencyType, dueDate, 
      frequencyDay, recursOnWeekday, reminderEnabled, reminderTime, reminderDaysBefore
    });

    // Update the habit
    await db.exec`
      UPDATE habits 
      SET name = ${name}, description = ${description || null}, category_id = ${categoryId}, frequency_type = ${frequencyType}, due_date = ${dueDate}, frequency_day = ${frequencyDay}, recurs_on_weekday = ${recursOnWeekday}, reminder_enabled = ${reminderEnabled}, reminder_time = ${reminderTime}, reminder_days_before = ${reminderDaysBefore}
      WHERE id = ${req.id} AND user_id = ${auth.userID}
    `;

    // Fetch the updated habit with category info
    const updatedHabit = await db.queryRow<{
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
      WHERE h.id = ${req.id} AND h.user_id = ${auth.userID}
    `;

    if (!updatedHabit) {
      throw APIError.internal("failed to fetch updated habit");
    }

    return {
      id: updatedHabit.id,
      userId: updatedHabit.user_id,
      categoryId: updatedHabit.category_id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      frequencyType: updatedHabit.frequency_type as FrequencyType,
      dueDate: updatedHabit.due_date,
      frequencyDay: updatedHabit.frequency_day,
      recursOnWeekday: updatedHabit.recurs_on_weekday,
      createdAt: updatedHabit.created_at,
      isActive: updatedHabit.is_active,
      categoryName: updatedHabit.category_name,
      categoryColor: updatedHabit.category_color,
      categoryIcon: updatedHabit.category_icon,
      reminderEnabled: updatedHabit.reminder_enabled,
      reminderTime: updatedHabit.reminder_time,
      reminderDaysBefore: updatedHabit.reminder_days_before,
    };
    } catch (error) {
      console.error("Edit habit error:", error);
      console.error("Request data:", JSON.stringify(req, null, 2));
      throw error;
    }
  }
);