CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE habits (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  target_frequency INTEGER NOT NULL DEFAULT 1, -- times per day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE habit_completions (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date DATE NOT NULL,
  UNIQUE(habit_id, completion_date)
);

-- Insert default categories
INSERT INTO categories (name, color, icon) VALUES
  ('Strength', '#ef4444', 'Dumbbell'),
  ('Flexibility', '#f97316', 'Zap'),
  ('Endurance', '#eab308', 'Activity'),
  ('Skills', '#22c55e', 'Target'),
  ('Intelligence', '#3b82f6', 'Brain'),
  ('Social', '#8b5cf6', 'Users'),
  ('Physical Health', '#ec4899', 'Heart'),
  ('Mental Health', '#06b6d4', 'Smile'),
  ('Memories', '#84cc16', 'Camera'),
  ('Professional Life', '#f59e0b', 'Briefcase'),
  ('Finance', '#10b981', 'DollarSign');

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_category_id ON habits(category_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completion_date);
