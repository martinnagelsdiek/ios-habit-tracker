import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface GetUpcomingRemindersResponse {
  reminders: ReminderNotification[];
}

export interface ReminderNotification {
  id: number;
  habitId: number;
  habitName: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  reminderDate: Date;
  reminderTime: string;
  notificationType: string;
}

export interface MarkReminderSentRequest {
  habitId: number;
  reminderDate: string; // YYYY-MM-DD format
  notificationType: string;
}

// Gets upcoming reminders for a user based on their habit settings
export const getUpcomingReminders = api<void, GetUpcomingRemindersResponse>(
  { auth: true, expose: true, method: "GET", path: "/habits/reminders" },
  async () => {
    const auth = getAuthData()!;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get habits with reminders enabled
    const habitsWithReminders = await db.queryAll<{
      id: number;
      name: string;
      category_name: string;
      category_color: string;
      category_icon: string;
      due_date: Date;
      reminder_time: string;
      reminder_days_before: number;
      frequency_type: string;
      frequency_day: number | null;
      recurs_on_weekday: boolean;
    }>`
      SELECT h.id, h.name, c.name as category_name, c.color as category_color, c.icon as category_icon,
             h.due_date, h.reminder_time, h.reminder_days_before, h.frequency_type, h.frequency_day, h.recurs_on_weekday
      FROM habits h
      JOIN categories c ON h.category_id = c.id
      WHERE h.user_id = ${auth.userID} 
        AND h.is_active = TRUE 
        AND h.reminder_enabled = TRUE
        AND h.reminder_time IS NOT NULL
    `;

    const reminders: ReminderNotification[] = [];

    for (const habit of habitsWithReminders) {
      // Calculate the reminder date based on due date and days before
      const dueDate = new Date(habit.due_date);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - habit.reminder_days_before);
      
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      
      // Only include reminders for today and future dates
      if (reminderDateStr >= today) {
        // Check if reminder was already sent
        const alreadySent = await db.queryRow`
          SELECT id FROM reminder_notifications 
          WHERE habit_id = ${habit.id} 
            AND reminder_date = ${reminderDateStr}
            AND notification_type = 'habit_due'
        `;
        
        if (!alreadySent) {
          reminders.push({
            id: 0, // Will be set when notification is created
            habitId: habit.id,
            habitName: habit.name,
            categoryName: habit.category_name,
            categoryColor: habit.category_color,
            categoryIcon: habit.category_icon,
            reminderDate: reminderDate,
            reminderTime: habit.reminder_time,
            notificationType: 'habit_due'
          });
        }
      }
    }

    return { reminders };
  }
);

// Marks a reminder as sent to avoid duplicate notifications
export const markReminderSent = api<MarkReminderSentRequest, { success: boolean }>(
  { auth: true, expose: true, method: "POST", path: "/habits/reminders/sent" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Verify habit belongs to user
    const habit = await db.queryRow`
      SELECT id FROM habits 
      WHERE id = ${req.habitId} AND user_id = ${auth.userID}
    `;
    
    if (!habit) {
      throw APIError.notFound("habit not found");
    }

    await db.exec`
      INSERT INTO reminder_notifications (habit_id, user_id, reminder_date, reminder_time, notification_type)
      SELECT ${req.habitId}, ${auth.userID}, ${req.reminderDate}, 
             (SELECT reminder_time FROM habits WHERE id = ${req.habitId}),
             ${req.notificationType}
      WHERE NOT EXISTS (
        SELECT 1 FROM reminder_notifications 
        WHERE habit_id = ${req.habitId} 
          AND reminder_date = ${req.reminderDate}
          AND notification_type = ${req.notificationType}
      )
    `;

    return { success: true };
  }
);

// Gets notification history for debugging/admin purposes
export const getReminderHistory = api<void, { notifications: any[] }>(
  { auth: true, expose: true, method: "GET", path: "/habits/reminders/history" },
  async () => {
    const auth = getAuthData()!;
    
    const notifications = await db.queryAll`
      SELECT rn.*, h.name as habit_name, c.name as category_name
      FROM reminder_notifications rn
      JOIN habits h ON rn.habit_id = h.id
      JOIN categories c ON h.category_id = c.id
      WHERE rn.user_id = ${auth.userID}
      ORDER BY rn.sent_at DESC
      LIMIT 50
    `;

    return { notifications };
  }
);