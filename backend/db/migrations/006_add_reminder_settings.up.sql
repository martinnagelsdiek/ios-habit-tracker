-- Add reminder settings to habits table
ALTER TABLE habits 
ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_time TIME DEFAULT NULL,
ADD COLUMN reminder_days_before INTEGER DEFAULT 0; -- 0 = same day, 1 = 1 day before, etc.

-- Add reminder notifications table to track sent notifications
CREATE TABLE reminder_notifications (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'habit_due', -- 'habit_due', 'habit_overdue'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, reminder_date, notification_type)
);

CREATE INDEX idx_reminder_notifications_habit_id ON reminder_notifications(habit_id);
CREATE INDEX idx_reminder_notifications_user_id ON reminder_notifications(user_id);
CREATE INDEX idx_reminder_notifications_date ON reminder_notifications(reminder_date);