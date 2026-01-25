-- =====================================================
-- EXAM BLUEPRINTS - PRODUCTION ALIGNMENT
-- Based on Enterprise UI (10 Qs, 45 Mins, 30-30-40 Distribution)
-- =====================================================

-- 0. Clean up existing blueprints to avoid duplicates if necessary
-- DELETE FROM exam_blueprints;

-- 1. Cloud Computing Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000004', 'Cloud Computing Enterprise Exam', 'Master industry-standard practices and tools in Cloud Computing', 
 ARRAY['30000000-0000-0000-0000-000000000003']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 2. Web Development Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000001', 'Web Development Enterprise Exam', 'Master industry-standard practices and tools in Web Development', 
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 3. Data Science Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000003', 'Data Science Enterprise Exam', 'Master industry-standard practices and tools in Data Science', 
 ARRAY['30000000-0000-0000-0000-000000000002']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000003']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 4. DevOps Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000007', 'DevOps Enterprise Exam', 'Master industry-standard practices and tools in DevOps', 
 ARRAY['30000000-0000-0000-0000-000000000006']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000007']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 5. Cybersecurity Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000005', 'Cybersecurity Enterprise Exam', 'Master industry-standard practices and tools in Cybersecurity', 
 ARRAY['30000000-0000-0000-0000-000000000004']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000005']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 6. Artificial Intelligence Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000008', 'Artificial Intelligence Enterprise Exam', 'Master industry-standard practices and tools in Artificial Intelligence', 
 ARRAY['30000000-0000-0000-0000-000000000007']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000008']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;

-- 7. Database Systems Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000009', 'Database Systems Enterprise Exam', 'Master industry-standard practices and tools in Database Systems', 
 ARRAY['30000000-0000-0000-0000-000000000008']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000009']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 name = EXCLUDED.name,
 description = EXCLUDED.description,
 domain_ids = EXCLUDED.domain_ids,
 subject_ids = EXCLUDED.subject_ids,
 total_questions = EXCLUDED.total_questions,
 time_limit = EXCLUDED.time_limit,
 difficulty_distribution = EXCLUDED.difficulty_distribution;
