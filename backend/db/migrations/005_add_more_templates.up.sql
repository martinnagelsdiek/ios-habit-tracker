-- Add more comprehensive habit templates
INSERT INTO habit_templates (name, description, category_id, frequency_type, suggested_frequency_day, suggested_recurs_on_weekday, tags) VALUES

-- More Health & Fitness templates
('Stretch for 10 minutes', 'Daily stretching routine to improve flexibility and reduce muscle tension', 1, 'daily', NULL, false, ARRAY['flexibility', 'stretching', 'wellness', 'recovery']),
('Take stairs instead of elevator', 'Choose stairs over elevators to increase daily physical activity', 1, 'daily', NULL, false, ARRAY['cardio', 'exercise', 'movement', 'stairs']),
('Stand up every hour', 'Combat sedentary lifestyle by standing and moving every hour', 1, 'daily', NULL, false, ARRAY['movement', 'posture', 'health', 'breaks']),
('Track sleep hours', 'Monitor sleep duration and quality for better rest', 1, 'daily', NULL, false, ARRAY['sleep', 'tracking', 'health', 'recovery']),
('Eat a healthy breakfast', 'Start the day with nutritious breakfast', 1, 'daily', NULL, false, ARRAY['nutrition', 'breakfast', 'healthy-eating', 'energy']),
('Take vitamin D', 'Daily vitamin D supplement for bone and immune health', 1, 'daily', NULL, false, ARRAY['supplements', 'vitamins', 'health', 'immunity']),
('Drink green tea', 'Replace one coffee with antioxidant-rich green tea', 1, 'daily', NULL, false, ARRAY['antioxidants', 'tea', 'health', 'hydration']),
('Do push-ups', 'Daily push-ups for upper body strength', 1, 'daily', NULL, false, ARRAY['strength', 'exercise', 'bodyweight', 'fitness']),
('Take cold shower', 'End shower with cold water for health benefits', 1, 'daily', NULL, false, ARRAY['cold-therapy', 'wellness', 'immunity', 'energy']),
('Track calories', 'Monitor daily caloric intake for health goals', 1, 'daily', NULL, false, ARRAY['nutrition', 'tracking', 'calories', 'health']),
('Sports activity', 'Play a sport or physical game', 1, 'weekly', 6, true, ARRAY['sports', 'recreation', 'fitness', 'fun']),
('Bike ride', 'Go for a recreational or commute bike ride', 1, 'weekly', 0, true, ARRAY['cycling', 'cardio', 'outdoor', 'transportation']),
('Swimming', 'Full-body workout through swimming', 1, 'weekly', 3, true, ARRAY['swimming', 'cardio', 'full-body', 'water']),
('Hiking', 'Nature hike for fitness and mental health', 1, 'weekly', 6, true, ARRAY['hiking', 'nature', 'cardio', 'outdoor']),
('Rock climbing', 'Indoor or outdoor climbing for strength and problem-solving', 1, 'weekly', 0, true, ARRAY['climbing', 'strength', 'problem-solving', 'adventure']),

-- More Productivity templates
('Check and clear notifications', 'Manage device notifications to reduce distractions', 2, 'daily', NULL, false, ARRAY['focus', 'notifications', 'digital-wellness', 'productivity']),
('Write tomorrow''s priorities', 'Plan next day''s top 3 priorities before bed', 2, 'daily', NULL, false, ARRAY['planning', 'priorities', 'evening', 'organization']),
('Time-block calendar', 'Schedule specific time blocks for important tasks', 2, 'daily', NULL, false, ARRAY['time-management', 'calendar', 'scheduling', 'focus']),
('Single-task focus', 'Work on one task at a time without multitasking', 2, 'daily', NULL, false, ARRAY['focus', 'single-tasking', 'concentration', 'efficiency']),
('Take productivity breaks', 'Regular 5-minute breaks every 25-50 minutes of work', 2, 'daily', NULL, false, ARRAY['breaks', 'pomodoro', 'rest', 'productivity']),
('Declutter workspace', 'Remove unnecessary items from work area', 2, 'daily', NULL, false, ARRAY['organization', 'workspace', 'declutter', 'focus']),
('Review daily goals', 'Check progress on daily objectives', 2, 'daily', NULL, false, ARRAY['goals', 'review', 'progress', 'reflection']),
('Learn keyboard shortcuts', 'Practice new software shortcuts for efficiency', 2, 'daily', NULL, false, ARRAY['efficiency', 'shortcuts', 'technology', 'skills']),
('Backup important files', 'Ensure critical files are backed up', 2, 'weekly', 5, true, ARRAY['backup', 'data', 'security', 'organization']),
('Update task management system', 'Review and update todo lists and project status', 2, 'weekly', 1, true, ARRAY['task-management', 'organization', 'review', 'planning']),
('Learn new productivity tool', 'Explore tools that could improve workflow', 2, 'monthly', 1, false, ARRAY['tools', 'learning', 'efficiency', 'workflow']),

-- More Mindfulness templates
('Mindful commute', 'Practice mindfulness during travel time', 3, 'daily', NULL, false, ARRAY['mindfulness', 'commute', 'awareness', 'travel']),
('Body scan meditation', 'Progressive relaxation and body awareness', 3, 'daily', NULL, false, ARRAY['meditation', 'body-scan', 'relaxation', 'awareness']),
('Mindful eating lunch', 'Eat one meal slowly and mindfully', 3, 'daily', NULL, false, ARRAY['mindful-eating', 'lunch', 'awareness', 'nutrition']),
('Loving-kindness meditation', 'Practice compassion meditation for self and others', 3, 'daily', NULL, false, ARRAY['meditation', 'compassion', 'kindness', 'love']),
('Notice 5 things', 'Mindfully observe 5 things in your environment', 3, 'daily', NULL, false, ARRAY['mindfulness', 'awareness', 'observation', 'present']),
('Mindful walking', 'Take a slow, awareness-focused walk', 3, 'daily', NULL, false, ARRAY['walking', 'mindfulness', 'movement', 'awareness']),
('Technology pause', 'Take mindful breaks from all screens', 3, 'daily', NULL, false, ARRAY['digital-detox', 'mindfulness', 'breaks', 'awareness']),
('Mindful morning routine', 'Perform morning activities with full attention', 3, 'daily', NULL, false, ARRAY['morning', 'mindfulness', 'routine', 'awareness']),
('Evening gratitude', 'Reflect on positive moments from the day', 3, 'daily', NULL, false, ARRAY['gratitude', 'evening', 'reflection', 'positivity']),
('Mindful dishwashing', 'Use chores as mindfulness practice', 3, 'daily', NULL, false, ARRAY['mindfulness', 'chores', 'awareness', 'meditation']),
('Silent meditation retreat', 'Longer silent meditation session', 3, 'weekly', 0, true, ARRAY['meditation', 'silence', 'retreat', 'deep-practice']),
('Mindfulness workshop', 'Attend mindfulness or meditation class', 3, 'monthly', 15, false, ARRAY['workshop', 'learning', 'community', 'practice']),

-- More Learning templates
('Watch educational YouTube', 'Learn from educational video content', 4, 'daily', NULL, false, ARRAY['learning', 'youtube', 'video', 'education']),
('Flashcard review', 'Study flashcards for memory retention', 4, 'daily', NULL, false, ARRAY['memory', 'flashcards', 'review', 'retention']),
('News reading', 'Stay informed with quality news sources', 4, 'daily', NULL, false, ARRAY['news', 'current-events', 'reading', 'awareness']),
('Technical skill practice', 'Practice specific technical or professional skill', 4, 'daily', NULL, false, ARRAY['skills', 'technical', 'practice', 'professional']),
('Teach someone else', 'Explain something you learned to reinforce knowledge', 4, 'daily', NULL, false, ARRAY['teaching', 'knowledge', 'communication', 'learning']),
('Research new topic', 'Explore a completely new subject area', 4, 'daily', NULL, false, ARRAY['research', 'exploration', 'curiosity', 'knowledge']),
('Take notes on learning', 'Document key insights and learnings', 4, 'daily', NULL, false, ARRAY['notes', 'documentation', 'reflection', 'learning']),
('Join online discussion', 'Participate in educational forums or communities', 4, 'daily', NULL, false, ARRAY['community', 'discussion', 'online', 'learning']),
('Library visit', 'Spend time at library for focused learning', 4, 'weekly', 6, true, ARRAY['library', 'focus', 'books', 'quiet']),
('Attend lecture or seminar', 'Participate in educational events', 4, 'monthly', 15, false, ARRAY['lecture', 'seminar', 'learning', 'events']),

-- More Social & Relationships templates
('Compliment someone', 'Give genuine compliments to brighten someone''s day', 5, 'daily', NULL, false, ARRAY['kindness', 'compliments', 'positivity', 'social']),
('Active listening practice', 'Focus completely on listening in conversations', 5, 'daily', NULL, false, ARRAY['listening', 'communication', 'empathy', 'relationships']),
('Check on elderly neighbor', 'Show care for elderly community members', 5, 'weekly', 3, true, ARRAY['community', 'elderly', 'care', 'kindness']),
('Write in shared journal', 'Maintain communication through shared writing', 5, 'weekly', 0, true, ARRAY['communication', 'writing', 'sharing', 'family']),
('Plan surprise gesture', 'Organize small surprises for loved ones', 5, 'weekly', 2, true, ARRAY['surprises', 'gestures', 'love', 'thoughtfulness']),
('Host dinner party', 'Bring people together over food', 5, 'monthly', 15, false, ARRAY['hosting', 'dinner', 'gathering', 'food']),
('Join community group', 'Participate in local community activities', 5, 'weekly', 4, true, ARRAY['community', 'groups', 'local', 'participation']),
('Send handwritten note', 'Write personal notes to maintain connections', 5, 'weekly', 0, true, ARRAY['handwriting', 'notes', 'personal', 'communication']),
('Practice conflict resolution', 'Work on resolving disagreements constructively', 5, 'weekly', 1, true, ARRAY['conflict', 'resolution', 'communication', 'growth']),
('Volunteer for cause', 'Give time to meaningful volunteer work', 5, 'weekly', 6, true, ARRAY['volunteering', 'service', 'community', 'giving']),

-- More Hobbies & Creativity templates
('Doodle or sketch', 'Simple artistic expression throughout the day', 6, 'daily', NULL, false, ARRAY['art', 'doodle', 'creativity', 'expression']),
('Listen to new music', 'Discover and appreciate different musical genres', 6, 'daily', NULL, false, ARRAY['music', 'discovery', 'appreciation', 'culture']),
('Creative problem solving', 'Apply creativity to solve daily challenges', 6, 'daily', NULL, false, ARRAY['creativity', 'problem-solving', 'innovation', 'thinking']),
('Garden or tend plants', 'Care for plants and connect with nature', 6, 'daily', NULL, false, ARRAY['gardening', 'plants', 'nature', 'growth']),
('Practice handwriting', 'Improve penmanship and letter formation', 6, 'daily', NULL, false, ARRAY['handwriting', 'practice', 'skill', 'motor']),
('Learn magic trick', 'Master simple magic tricks for entertainment', 6, 'weekly', 0, true, ARRAY['magic', 'entertainment', 'skill', 'fun']),
('Origami folding', 'Practice paper folding art', 6, 'weekly', 3, true, ARRAY['origami', 'paper', 'art', 'precision']),
('Board game session', 'Play strategic or creative board games', 6, 'weekly', 5, true, ARRAY['games', 'strategy', 'social', 'fun']),
('Visit art gallery', 'Appreciate visual arts and exhibitions', 6, 'monthly', 15, false, ARRAY['art', 'gallery', 'culture', 'appreciation']),
('Try new recipe cuisine', 'Explore cooking from different cultures', 6, 'weekly', 0, true, ARRAY['cooking', 'culture', 'exploration', 'food']),

-- Financial & Life Management templates (new category suggestions)
('Track daily expenses', 'Monitor spending to improve financial awareness', 2, 'daily', NULL, false, ARRAY['finance', 'tracking', 'money', 'budgeting']),
('Review bank statements', 'Check financial accounts for accuracy', 2, 'weekly', 1, true, ARRAY['finance', 'banking', 'review', 'money']),
('Learn about investing', 'Study investment principles and options', 4, 'daily', NULL, false, ARRAY['investing', 'finance', 'learning', 'wealth']),
('Declutter one area', 'Organize and simplify one space daily', 2, 'daily', NULL, false, ARRAY['declutter', 'organization', 'minimalism', 'space']),
('Review insurance policies', 'Check insurance coverage and updates', 2, 'quarterly', 1, false, ARRAY['insurance', 'protection', 'finance', 'planning']),

-- Professional Development templates
('Network with colleague', 'Build professional relationships', 2, 'daily', NULL, false, ARRAY['networking', 'professional', 'relationships', 'career']),
('Update resume/portfolio', 'Keep professional documents current', 2, 'monthly', 1, false, ARRAY['resume', 'portfolio', 'career', 'professional']),
('Industry news reading', 'Stay current with professional field', 4, 'daily', NULL, false, ARRAY['industry', 'news', 'professional', 'trends']),
('Skill certification study', 'Work toward professional certifications', 4, 'daily', NULL, false, ARRAY['certification', 'study', 'professional', 'skills']),
('Attend industry meetup', 'Participate in professional gatherings', 5, 'monthly', 15, false, ARRAY['meetup', 'industry', 'networking', 'professional']),

-- Environmental & Sustainability templates
('Use reusable bags', 'Reduce plastic waste with reusable shopping bags', 1, 'daily', NULL, false, ARRAY['environment', 'sustainability', 'waste-reduction', 'eco']),
('Take public transport', 'Choose eco-friendly transportation options', 1, 'daily', NULL, false, ARRAY['transportation', 'environment', 'sustainability', 'eco']),
('Recycle properly', 'Sort and recycle waste according to guidelines', 1, 'daily', NULL, false, ARRAY['recycling', 'waste', 'environment', 'sustainability']),
('Reduce energy usage', 'Turn off lights and electronics when not needed', 1, 'daily', NULL, false, ARRAY['energy', 'conservation', 'environment', 'sustainability']),
('Buy local produce', 'Support local farmers and reduce food miles', 1, 'weekly', 6, true, ARRAY['local', 'food', 'sustainability', 'community']),

-- Personal Development & Self-Care templates
('Practice self-compassion', 'Treat yourself with kindness and understanding', 3, 'daily', NULL, false, ARRAY['self-compassion', 'kindness', 'mental-health', 'growth']),
('Set daily intention', 'Choose a positive intention to guide your day', 3, 'daily', NULL, false, ARRAY['intention', 'purpose', 'mindfulness', 'focus']),
('Celebrate small wins', 'Acknowledge and appreciate daily accomplishments', 3, 'daily', NULL, false, ARRAY['celebration', 'wins', 'positivity', 'achievement']),
('Practice saying no', 'Set healthy boundaries by declining unnecessary commitments', 5, 'weekly', 1, true, ARRAY['boundaries', 'saying-no', 'self-care', 'balance']),
('Personal reflection', 'Spend time thinking about personal growth and values', 3, 'weekly', 0, true, ARRAY['reflection', 'growth', 'values', 'self-awareness']),
('Spa or self-care ritual', 'Dedicate time to physical and mental self-care', 1, 'weekly', 0, true, ARRAY['self-care', 'spa', 'relaxation', 'wellness']),
('Vision board update', 'Work on visual representation of goals and dreams', 2, 'monthly', 1, false, ARRAY['vision', 'goals', 'visualization', 'dreams']);