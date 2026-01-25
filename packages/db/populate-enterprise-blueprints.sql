-- =====================================================
-- ENTERPRISE EXAM BLUEPRINTS - CONSOLIDATED ALIGNMENT (NORMALIZED)
-- Based on UI/UX (10 Qs, 45 Mins, 30-30-40 Mixed Distribution)
-- =====================================================

-- 1. Web Development Enterprise Exam
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000001', 'Web Development Enterprise Exam', 'Master industry-standard practices and tools in Web Development', 
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 2. Data Science
('80000000-0000-0000-0000-000000000002', 'Data Science Enterprise Exam', 'Master industry-standard practices and tools in Data Science', 
 ARRAY['30000000-0000-0000-0000-000000000002']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000008']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 3. Cloud Computing
('80000000-0000-0000-0000-000000000003', 'Cloud Computing Enterprise Exam', 'Master industry-standard practices and tools in Cloud Computing', 
 ARRAY['30000000-0000-0000-0000-000000000003']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000012']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 4. Cybersecurity
('80000000-0000-0000-0000-000000000004', 'Cybersecurity Enterprise Exam', 'Master industry-standard practices and tools in Cybersecurity', 
 ARRAY['30000000-0000-0000-0000-000000000004']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000016']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 5. Mobile Development
('80000000-0000-0000-0000-000000000005', 'Mobile Development Enterprise Exam', 'Master industry-standard practices and tools in Mobile Development', 
 ARRAY['30000000-0000-0000-0000-000000000005']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000020']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 6. DevOps
('80000000-0000-0000-0000-000000000006', 'DevOps Enterprise Exam', 'Master industry-standard practices and tools in DevOps', 
 ARRAY['30000000-0000-0000-0000-000000000006']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000024']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 7. Artificial Intelligence
('80000000-0000-0000-0000-000000000007', 'Artificial Intelligence Enterprise Exam', 'Master industry-standard practices and tools in Artificial Intelligence', 
 ARRAY['30000000-0000-0000-0000-000000000007']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000025', '40000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000027', '40000000-0000-0000-0000-000000000028']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 8. Database Systems
('80000000-0000-0000-0000-000000000008', 'Database Systems Enterprise Exam', 'Master industry-standard practices and tools in Database Systems', 
 ARRAY['30000000-0000-0000-0000-000000000008']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000029', '40000000-0000-0000-0000-000000000030', '40000000-0000-0000-0000-000000000031', '40000000-0000-0000-0000-000000000032']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 9. Software Architecture
('80000000-0000-0000-0000-000000000009', 'Software Architecture Enterprise Exam', 'Master industry-standard practices and tools in Software Architecture', 
 ARRAY['30000000-0000-0000-0000-000000000009']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000033', '40000000-0000-0000-0000-000000000034', '40000000-0000-0000-0000-000000000035', '40000000-0000-0000-0000-000000000036']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;

-- 10. Product Management
('80000000-0000-0000-0000-000000000010', 'Product Management Enterprise Exam', 'Master industry-standard practices and tools in Product Management', 
 ARRAY['30000000-0000-0000-0000-000000000010']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000037', '40000000-0000-0000-0000-000000000038', '40000000-0000-0000-0000-000000000039', '40000000-0000-0000-0000-000000000040']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}')
ON CONFLICT (id) DO UPDATE SET
 domain_ids = EXCLUDED.domain_ids, subject_ids = EXCLUDED.subject_ids;
