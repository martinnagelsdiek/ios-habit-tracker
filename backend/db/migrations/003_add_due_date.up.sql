-- Add due date and update recurrence system
ALTER TABLE habits 
ADD COLUMN due_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN recurs_on_weekday BOOLEAN DEFAULT false; -- for weekly habits: true = same weekday, false = exact date

-- Update frequency_day to be more specific about its purpose
COMMENT ON COLUMN habits.frequency_day IS 'For weekly: day of week (0-6) when recurs_on_weekday=true. For monthly/quarterly/semi-annually: day of month. Ignored for daily and annually.';
COMMENT ON COLUMN habits.recurs_on_weekday IS 'For weekly habits: true = recur on same weekday as due_date, false = recur on exact due_date. For other frequencies: controls whether to use weekday pattern vs exact date.';
COMMENT ON COLUMN habits.due_date IS 'The date when this habit is first due and basis for calculating future occurrences.';

-- Create index on due_date for efficient querying
CREATE INDEX idx_habits_due_date ON habits(due_date);