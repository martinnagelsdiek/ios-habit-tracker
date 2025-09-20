import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface ProcessNotificationsResponse {
  processed: number;
  sent: number;
  errors: string[];
}

export interface NotificationSettings {
  email?: boolean;
  browser?: boolean;
  sound?: boolean;
}

export interface UpdateNotificationSettingsRequest {
  settings: NotificationSettings;
}

// Process pending reminder notifications (this would typically be called by a cron job)
export const processReminders = api<void, ProcessNotificationsResponse>(
  { auth: false, expose: true, method: "POST", path: "/habits/notifications/process" },
  async () => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let processed = 0;
    let sent = 0;
    const errors: string[] = [];

    try {
      // Get all users with habits that need reminders today
      const habitsNeedingReminders = await db.queryAll<{
        user_id: string;
        habit_id: number;
        habit_name: string;
        category_name: string;
        reminder_time: string;
        reminder_date: string;
      }>`
        SELECT DISTINCT 
          h.user_id,
          h.id as habit_id,
          h.name as habit_name,
          c.name as category_name,
          h.reminder_time,
          (h.due_date - INTERVAL (h.reminder_days_before || ' days'))::date::text as reminder_date
        FROM habits h
        JOIN categories c ON h.category_id = c.id
        WHERE h.is_active = TRUE 
          AND h.reminder_enabled = TRUE
          AND h.reminder_time IS NOT NULL
          AND (h.due_date - INTERVAL (h.reminder_days_before || ' days'))::date = ${today}::date
          AND h.reminder_time <= ${currentTime}::time
          AND NOT EXISTS (
            SELECT 1 FROM reminder_notifications rn 
            WHERE rn.habit_id = h.id 
              AND rn.reminder_date = (h.due_date - INTERVAL (h.reminder_days_before || ' days'))::date
              AND rn.notification_type = 'habit_due'
          )
      `;

      for (const habit of habitsNeedingReminders) {
        processed++;
        
        try {
          // In a real implementation, you would send actual notifications here
          // For now, we'll just log the notification and mark it as sent
          console.log(`Reminder: ${habit.habit_name} (${habit.category_name}) for user ${habit.user_id}`);
          
          // Mark as sent in database
          await db.exec`
            INSERT INTO reminder_notifications (habit_id, user_id, reminder_date, reminder_time, notification_type)
            VALUES (${habit.habit_id}, ${habit.user_id}, ${habit.reminder_date}, ${habit.reminder_time}, 'habit_due')
          `;
          
          sent++;
        } catch (error) {
          errors.push(`Failed to send reminder for habit ${habit.habit_id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Error processing reminders: ${error}`);
    }

    return {
      processed,
      sent,
      errors
    };
  }
);

// Get user's notification settings (placeholder for future implementation)
export const getNotificationSettings = api<void, NotificationSettings>(
  { auth: true, expose: true, method: "GET", path: "/habits/notifications/settings" },
  async () => {
    // For now, return default settings
    // In the future, these could be stored in a user_settings table
    return {
      email: false,
      browser: true,
      sound: true
    };
  }
);

// Update user's notification settings (placeholder for future implementation)  
export const updateNotificationSettings = api<UpdateNotificationSettingsRequest, { success: boolean }>(
  { auth: true, expose: true, method: "PUT", path: "/habits/notifications/settings" },
  async (req) => {
    const auth = getAuthData()!;
    
    // For now, just return success
    // In the future, store these settings in a user_settings table
    console.log(`Updated notification settings for user ${auth.userID}:`, req.settings);
    
    return { success: true };
  }
);

// Test endpoint to trigger a sample notification
export const testNotification = api<{ habitId: number }, { success: boolean }>(
  { auth: true, expose: true, method: "POST", path: "/habits/notifications/test" },
  async (req) => {
    const auth = getAuthData()!;
    
    const habit = await db.queryRow`
      SELECT h.name, c.name as category_name 
      FROM habits h
      JOIN categories c ON h.category_id = c.id
      WHERE h.id = ${req.habitId} AND h.user_id = ${auth.userID}
    `;
    
    if (!habit) {
      throw APIError.notFound("habit not found");
    }
    
    console.log(`Test notification: ${habit.name} (${habit.category_name}) for user ${auth.userID}`);
    
    return { success: true };
  }
);