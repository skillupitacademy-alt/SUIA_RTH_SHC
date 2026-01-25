-- =====================================================
-- POPULATE EXAM BLUEPRINTS
-- Dynamic linking to Domains, Subjects, and Topics
-- Distribution: 30% Simple, 30% Intermediate, 40% Expert
-- =====================================================

-- 1. Domain-Level Blueprint: "Web Development Comprehensive"
-- Covers everything under the "Web Development" domain.
INSERT INTO exam_blueprints (name, description, domain_ids, subject_ids, topic_ids, difficulty_distribution)
SELECT
    'Web Development Comprehensive',
    'A comprehensive exam covering all aspects of Web Development.',
    ARRAY[id],
    NULL,
    NULL,
    '{"simple": 30, "intermediate": 30, "expert": 40}'::jsonb
FROM domains WHERE name = 'Web Development'
ON CONFLICT DO NOTHING;

-- 2. Subject-Level Blueprint: "Frontend Development Quiz"
-- Covers everything under "Frontend Development (React.js)".
INSERT INTO exam_blueprints (name, description, domain_ids, subject_ids, topic_ids, difficulty_distribution)
SELECT
    'Frontend Development Quiz',
    'Focuses on React.js and frontend technologies.',
    NULL,
    ARRAY[id],
    NULL,
    '{"simple": 30, "intermediate": 30, "expert": 40}'::jsonb
FROM subjects WHERE name = 'Frontend Development (React.js)'
ON CONFLICT DO NOTHING;

-- 3. Topic-Level Blueprint: "React Fundamentals Quiz"
-- Specific focus on "React Fundamentals".
INSERT INTO exam_blueprints (name, description, domain_ids, subject_ids, topic_ids, difficulty_distribution)
SELECT
    'React Fundamentals Quiz',
    'Test your knowledge of React basics.',
    NULL,
    NULL,
    ARRAY[id],
    '{"simple": 30, "intermediate": 30, "expert": 40}'::jsonb
FROM topics WHERE name = 'React Fundamentals'
ON CONFLICT DO NOTHING;

-- 4. Multi-Subject Blueprint: "Full Stack Challenge"
-- Combines "Frontend Development (React.js)" and "Backend Development (Node.js)".
INSERT INTO exam_blueprints (name, description, domain_ids, subject_ids, topic_ids, difficulty_distribution)
SELECT
    'Full Stack Challenge',
    'Challenge yourself with both Frontend and Backend questions.',
    NULL,
    ARRAY(SELECT id FROM subjects WHERE name IN ('Frontend Development (React.js)', 'Backend Development (Node.js)')),
    NULL,
    '{"simple": 30, "intermediate": 30, "expert": 40}'::jsonb
WHERE EXISTS (SELECT 1 FROM subjects WHERE name = 'Frontend Development (React.js)');
