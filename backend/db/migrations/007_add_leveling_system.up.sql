-- Add leveling system tables and columns

-- User overall progress tracking
CREATE TABLE user_progress (
  user_id TEXT PRIMARY KEY,
  overall_level INTEGER NOT NULL DEFAULT 1 CHECK (overall_level >= 1 AND overall_level <= 100),
  overall_current_xp INTEGER NOT NULL DEFAULT 0 CHECK (overall_current_xp >= 0),
  overall_total_xp INTEGER NOT NULL DEFAULT 0 CHECK (overall_total_xp >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category-specific progress tracking  
CREATE TABLE category_progress (
  user_id TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  rank TEXT NOT NULL DEFAULT 'Novice' CHECK (rank IN ('Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

-- Streak tracking for habits
CREATE TABLE streaks (
  user_id TEXT NOT NULL,
  habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'custom')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  last_completed_on DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, habit_id)
);

-- Add leveling-related columns to habits
ALTER TABLE habits 
ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('trivial', 'easy', 'normal', 'hard', 'epic')),
ADD COLUMN cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly', 'custom')),
ADD COLUMN target INTEGER CHECK (target > 0),
ADD COLUMN unit TEXT;

-- Add XP tracking to habit completions
ALTER TABLE habit_completions
ADD COLUMN xp_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN amount INTEGER CHECK (amount > 0);

-- Indexes for performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_category_progress_user_id ON category_progress(user_id);
CREATE INDEX idx_category_progress_category_id ON category_progress(category_id);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_streaks_habit_id ON streaks(habit_id);
CREATE INDEX idx_habit_completions_xp_applied ON habit_completions(xp_applied);