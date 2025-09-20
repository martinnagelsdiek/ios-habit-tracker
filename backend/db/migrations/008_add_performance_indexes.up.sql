-- Add indexes for performance optimization

-- Index for category_progress lookups
CREATE INDEX IF NOT EXISTS idx_category_progress_user_category 
ON category_progress(user_id, category_id);

-- Index for habit_completions date range queries
CREATE INDEX IF NOT EXISTS idx_habit_completions_date 
ON habit_completions(completion_date);

-- Composite index for the join query in summary
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date 
ON habit_completions(habit_id, completion_date);

-- Index for habits by user and category
CREATE INDEX IF NOT EXISTS idx_habits_user_category 
ON habits(user_id, category_id);