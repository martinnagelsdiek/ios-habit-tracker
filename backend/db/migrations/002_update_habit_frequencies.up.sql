-- Add frequency type and completion day tracking
ALTER TABLE habits 
DROP COLUMN target_frequency,
ADD COLUMN frequency_type TEXT NOT NULL DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually')),
ADD COLUMN frequency_day INTEGER; -- day of week (0-6 for weekly), day of month (1-31 for monthly), day of year (1-365 for yearly), etc.

-- Update habit_completions to support the new frequency system
-- Add a day_completed column to track which specific day was completed for non-daily habits
ALTER TABLE habit_completions
ADD COLUMN day_completed INTEGER; -- tracks the specific day within the frequency period that was completed

-- Update indexes
CREATE INDEX idx_habits_frequency_type ON habits(frequency_type);
CREATE INDEX idx_habit_completions_day_completed ON habit_completions(day_completed);