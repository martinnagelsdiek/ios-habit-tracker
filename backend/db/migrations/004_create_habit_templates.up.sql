-- Create habit templates table
CREATE TABLE habit_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually')),
  suggested_frequency_day INTEGER, -- suggested day for weekly/monthly habits
  suggested_recurs_on_weekday BOOLEAN DEFAULT false,
  tags TEXT[], -- searchable tags for the template
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient querying by category
CREATE INDEX idx_habit_templates_category ON habit_templates(category_id);

-- Insert pre-made habit templates organized by category
-- Health & Fitness templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Drink 8 glasses of water', 'Stay hydrated by drinking at least 8 glasses of water throughout the day', 1, 'daily', NULL, false, ARRAY['health', 'hydration', 'wellness']),
('Take vitamins', 'Remember to take your daily vitamins and supplements', 1, 'daily', NULL, false, ARRAY['health', 'supplements', 'nutrition']),
('Morning workout', 'Start your day with 30 minutes of exercise', 1, 'daily', NULL, false, ARRAY['fitness', 'exercise', 'morning', 'energy']),
('Evening walk', 'Take a relaxing 20-minute walk in the evening', 1, 'daily', NULL, false, ARRAY['fitness', 'walking', 'evening', 'relaxation']),
('Yoga practice', 'Practice yoga for flexibility and mindfulness', 1, 'daily', NULL, false, ARRAY['fitness', 'yoga', 'flexibility', 'mindfulness']),
('Gym session', 'Hit the gym for strength training and cardio', 1, 'weekly', 1, true, ARRAY['fitness', 'gym', 'strength', 'cardio']),
('Meal prep', 'Prepare healthy meals for the week ahead', 1, 'weekly', 0, true, ARRAY['nutrition', 'meal-prep', 'healthy-eating']),
('Weigh yourself', 'Track your weight for health monitoring', 1, 'weekly', 1, true, ARRAY['health', 'weight', 'tracking']),
('Doctor checkup', 'Schedule and attend regular health checkups', 1, 'quarterly', 1, false, ARRAY['health', 'medical', 'checkup']),
('Dental cleaning', 'Visit the dentist for regular teeth cleaning', 1, 'quarterly', 15, false, ARRAY['health', 'dental', 'teeth']);

-- Productivity templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Morning planning', 'Plan your day every morning with a to-do list', 2, 'daily', NULL, false, ARRAY['productivity', 'planning', 'morning', 'organization']),
('Evening reflection', 'Reflect on the day and plan for tomorrow', 2, 'daily', NULL, false, ARRAY['productivity', 'reflection', 'evening', 'self-improvement']),
('Email inbox zero', 'Clear your email inbox completely', 2, 'daily', NULL, false, ARRAY['productivity', 'email', 'organization', 'communication']),
('Deep work session', 'Dedicate 2 hours to focused, uninterrupted work', 2, 'daily', NULL, false, ARRAY['productivity', 'focus', 'deep-work', 'concentration']),
('Learn something new', 'Spend 30 minutes learning a new skill or topic', 2, 'daily', NULL, false, ARRAY['productivity', 'learning', 'growth', 'education']),
('Weekly review', 'Review your goals and progress from the past week', 2, 'weekly', 0, true, ARRAY['productivity', 'review', 'goals', 'planning']),
('Organize workspace', 'Clean and organize your work area', 2, 'weekly', 5, true, ARRAY['productivity', 'organization', 'workspace', 'cleaning']),
('Monthly goals review', 'Review and set goals for the upcoming month', 2, 'monthly', 1, false, ARRAY['productivity', 'goals', 'planning', 'review']);

-- Mindfulness templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Morning meditation', 'Start your day with 10 minutes of meditation', 3, 'daily', NULL, false, ARRAY['mindfulness', 'meditation', 'morning', 'peace']),
('Gratitude journal', 'Write down 3 things you are grateful for', 3, 'daily', NULL, false, ARRAY['mindfulness', 'gratitude', 'journaling', 'positivity']),
('Evening meditation', 'End your day with calming meditation', 3, 'daily', NULL, false, ARRAY['mindfulness', 'meditation', 'evening', 'relaxation']),
('Breathing exercises', 'Practice deep breathing for 5 minutes', 3, 'daily', NULL, false, ARRAY['mindfulness', 'breathing', 'stress-relief', 'calm']),
('Mindful eating', 'Eat one meal mindfully without distractions', 3, 'daily', NULL, false, ARRAY['mindfulness', 'eating', 'awareness', 'nutrition']),
('Nature connection', 'Spend time in nature mindfully', 3, 'weekly', 6, true, ARRAY['mindfulness', 'nature', 'outdoor', 'connection']),
('Digital detox', 'Take a break from all digital devices for 2 hours', 3, 'weekly', 0, true, ARRAY['mindfulness', 'digital-detox', 'screen-time', 'balance']);

-- Learning templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Read for 30 minutes', 'Read books, articles, or educational content', 4, 'daily', NULL, false, ARRAY['learning', 'reading', 'knowledge', 'books']),
('Language practice', 'Practice a foreign language for 20 minutes', 4, 'daily', NULL, false, ARRAY['learning', 'language', 'communication', 'culture']),
('Online course', 'Complete one lesson of an online course', 4, 'daily', NULL, false, ARRAY['learning', 'online-course', 'education', 'skills']),
('Podcast learning', 'Listen to an educational podcast during commute', 4, 'daily', NULL, false, ARRAY['learning', 'podcast', 'audio', 'commute']),
('Practice coding', 'Code for at least 1 hour to improve programming skills', 4, 'daily', NULL, false, ARRAY['learning', 'coding', 'programming', 'technology']),
('Watch documentary', 'Watch an educational documentary', 4, 'weekly', 6, true, ARRAY['learning', 'documentary', 'education', 'knowledge']),
('Museum or exhibition', 'Visit a museum, gallery, or educational exhibition', 4, 'monthly', 15, false, ARRAY['learning', 'museum', 'culture', 'art']);

-- Social & Relationships templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Call family', 'Have a meaningful conversation with family members', 5, 'weekly', 0, true, ARRAY['social', 'family', 'relationships', 'communication']),
('Text a friend', 'Reach out to a friend to stay connected', 5, 'daily', NULL, false, ARRAY['social', 'friends', 'relationships', 'communication']),
('Quality time with partner', 'Spend uninterrupted time with your partner', 5, 'daily', NULL, false, ARRAY['social', 'partner', 'relationships', 'love']),
('Meet new people', 'Attend social events or activities to meet new people', 5, 'weekly', 5, true, ARRAY['social', 'networking', 'new-people', 'events']),
('Plan social activity', 'Organize or join a social gathering with friends', 5, 'weekly', 6, true, ARRAY['social', 'planning', 'friends', 'activities']),
('Write thank you note', 'Express gratitude to someone who helped you', 5, 'weekly', 1, true, ARRAY['social', 'gratitude', 'appreciation', 'kindness']);

-- Hobbies & Creativity templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES
('Creative writing', 'Write creatively for 30 minutes', 6, 'daily', NULL, false, ARRAY['creativity', 'writing', 'expression', 'imagination']),
('Draw or sketch', 'Practice drawing or sketching for artistic development', 6, 'daily', NULL, false, ARRAY['creativity', 'drawing', 'art', 'visual']),
('Play musical instrument', 'Practice playing your musical instrument', 6, 'daily', NULL, false, ARRAY['creativity', 'music', 'instrument', 'practice']),
('Photography walk', 'Go out and take creative photos', 6, 'weekly', 6, true, ARRAY['creativity', 'photography', 'outdoor', 'art']),
('Craft project', 'Work on a hands-on craft or DIY project', 6, 'weekly', 0, true, ARRAY['creativity', 'crafts', 'diy', 'hands-on']),
('Cook new recipe', 'Try cooking a new recipe or cuisine', 6, 'weekly', 0, true, ARRAY['creativity', 'cooking', 'culinary', 'exploration']);