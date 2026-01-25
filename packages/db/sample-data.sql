-- =====================================================
-- QUIZ PLATFORM - SAMPLE DATA (10 RECORDS PER TABLE)
-- =====================================================

-- 1. ROLES (3 records - foundational)
INSERT INTO roles (id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'USER'),
('00000000-0000-0000-0000-000000000002', 'ADMIN'),
('00000000-0000-0000-0000-000000000003', 'SUPER_ADMIN');

-- 2. USERS (10 records)
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('10000000-0000-0000-0000-000000000001', 'john.doe@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000002', 'jane.smith@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000003', 'bob.johnson@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000004', 'alice.williams@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', false),
('10000000-0000-0000-0000-000000000005', 'charlie.brown@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000006', 'diana.prince@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000007', 'edward.norton@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', false),
('10000000-0000-0000-0000-000000000008', 'fiona.apple@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000009', 'george.martin@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true),
('10000000-0000-0000-0000-000000000010', 'hannah.montana@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', true);

-- 3. USER PROFILES (10 records)
INSERT INTO user_profiles (id, user_id, name, education_level, professional_status, age_group, experience_years, domain_interest) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'John Doe', 'Bachelors', 'Software Engineer', '25-30', 5, ARRAY['Web Development', 'Cloud Computing']),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Jane Smith', 'Masters', 'Data Scientist', '30-35', 8, ARRAY['Machine Learning', 'Data Science']),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Bob Johnson', 'Bachelors', 'DevOps Engineer', '25-30', 4, ARRAY['Cloud Computing', 'DevOps']),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Alice Williams', 'PhD', 'Research Scientist', '35-40', 12, ARRAY['Artificial Intelligence', 'Machine Learning']),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Charlie Brown', 'Bachelors', 'Frontend Developer', '20-25', 2, ARRAY['Web Development', 'UI/UX']),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Diana Prince', 'Masters', 'Product Manager', '30-35', 7, ARRAY['Product Management', 'Agile']),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Edward Norton', 'Bachelors', 'Backend Developer', '25-30', 3, ARRAY['Web Development', 'Databases']),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'Fiona Apple', 'Masters', 'Security Engineer', '30-35', 6, ARRAY['Cybersecurity', 'Cloud Computing']),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'George Martin', 'Bachelors', 'Mobile Developer', '25-30', 4, ARRAY['Mobile Development', 'React Native']),
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Hannah Montana', 'Bachelors', 'Full Stack Developer', '20-25', 2, ARRAY['Web Development', 'Mobile Development']);

-- 4. USER ROLES (10 records - assign roles to users)
INSERT INTO user_roles (user_id, role_id) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'), -- John: USER
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'), -- Jane: ADMIN
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'), -- Bob: USER
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003'), -- Alice: SUPER_ADMIN
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001'), -- Charlie: USER
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002'), -- Diana: ADMIN
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001'), -- Edward: USER
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001'), -- Fiona: USER
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001'), -- George: USER
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001'); -- Hannah: USER

-- 5. DOMAINS (10 records)
INSERT INTO domains (id, name, description, category, status) VALUES
('30000000-0000-0000-0000-000000000001', 'Web Development', 'Modern web development technologies and frameworks', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000002', 'Data Science', 'Data analysis, machine learning, and statistics', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000003', 'Cloud Computing', 'Cloud platforms and distributed systems', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000004', 'Cybersecurity', 'Information security and ethical hacking', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000005', 'Mobile Development', 'iOS and Android app development', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000006', 'DevOps', 'CI/CD, automation, and infrastructure', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000007', 'Artificial Intelligence', 'AI, neural networks, and deep learning', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000008', 'Database Systems', 'SQL, NoSQL, and database design', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000009', 'Software Architecture', 'Design patterns and system design', 'Technology', 'active'),
('30000000-0000-0000-0000-000000000010', 'Product Management', 'Product strategy and agile methodologies', 'Business', 'active');

-- 6. SUBJECTS (10 records)
INSERT INTO subjects (id, domain_id, name, description, "order", status) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'React.js', 'Modern React development with hooks and context', 1, 'active'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Node.js', 'Backend development with Node.js and Express', 2, 'active'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Python for Data Science', 'Pandas, NumPy, and data analysis', 1, 'active'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'AWS Fundamentals', 'Amazon Web Services core services', 1, 'active'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 'Network Security', 'Firewalls, VPNs, and network protocols', 1, 'active'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', 'React Native', 'Cross-platform mobile development', 1, 'active'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', 'Docker & Kubernetes', 'Containerization and orchestration', 1, 'active'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000007', 'Machine Learning', 'Supervised and unsupervised learning', 1, 'active'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000008', 'PostgreSQL', 'Relational database design and optimization', 1, 'active'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000009', 'Microservices', 'Distributed system architecture patterns', 1, 'active');

-- 7. TOPICS (10 records)
INSERT INTO topics (id, subject_id, name, description, complexity_level, weight, status) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'React Hooks', 'useState, useEffect, and custom hooks', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'React Context API', 'Global state management with Context', 3, 2, 'active'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Express Middleware', 'Request/response pipeline in Express', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000003', 'Pandas DataFrames', 'Data manipulation with Pandas', 2, 4, 'active'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 'EC2 Instances', 'Virtual servers in AWS', 1, 3, 'active'),
('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000005', 'Encryption Basics', 'Symmetric and asymmetric encryption', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000006', 'React Native Components', 'Building mobile UI components', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000007', 'Docker Containers', 'Creating and managing containers', 2, 4, 'active'),
('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000008', 'Linear Regression', 'Predictive modeling basics', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000009', 'SQL Joins', 'INNER, LEFT, RIGHT, and FULL joins', 2, 4, 'active');

-- 8. SKILLS (10 records)
INSERT INTO skills (id, name, category, mapping_type) VALUES
('60000000-0000-0000-0000-000000000001', 'Problem Solving', 'Cognitive', 'conceptual'),
('60000000-0000-0000-0000-000000000002', 'Code Debugging', 'Technical', 'technical'),
('60000000-0000-0000-0000-000000000003', 'API Design', 'Technical', 'technical'),
('60000000-0000-0000-0000-000000000004', 'Data Analysis', 'Technical', 'practical'),
('60000000-0000-0000-0000-000000000005', 'System Design', 'Cognitive', 'conceptual'),
('60000000-0000-0000-0000-000000000006', 'Security Awareness', 'Technical', 'conceptual'),
('60000000-0000-0000-0000-000000000007', 'Performance Optimization', 'Technical', 'practical'),
('60000000-0000-0000-0000-000000000008', 'Testing & QA', 'Technical', 'practical'),
('60000000-0000-0000-0000-000000000009', 'Version Control', 'Technical', 'technical'),
('60000000-0000-0000-0000-000000000010', 'Agile Methodology', 'Process', 'conceptual');

-- 9. TOPIC SKILLS (10 records - map skills to topics)
INSERT INTO topic_skills (topic_id, skill_id) VALUES
('50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002'), -- React Hooks -> Code Debugging
('50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000005'), -- Context API -> System Design
('50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003'), -- Express Middleware -> API Design
('50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004'), -- Pandas -> Data Analysis
('50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005'), -- EC2 -> System Design
('50000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006'), -- Encryption -> Security Awareness
('50000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000002'), -- RN Components -> Code Debugging
('50000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000007'), -- Docker -> Performance Optimization
('50000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000004'), -- Linear Regression -> Data Analysis
('50000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000001'); -- SQL Joins -> Problem Solving

-- 10. QUESTIONS (10 records)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, tags) VALUES
('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'simple', 'mcq', 
 'What hook is used for side effects in React?', 
 '["useState", "useEffect", "useContext", "useReducer"]', 
 'useEffect', 
 'useEffect is specifically designed for handling side effects like data fetching, subscriptions, and DOM manipulation.',
 ARRAY['react', 'hooks']),

('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'intermediate', 'mcq',
 'Which hook would you use to share state across multiple components?',
 '["useState", "useEffect", "useContext", "useMemo"]',
 'useContext',
 'useContext allows you to access context values without prop drilling.',
 ARRAY['react', 'hooks', 'context']),

('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'simple', 'mcq',
 'What is middleware in Express.js?',
 '["A database layer", "Functions that execute during request-response cycle", "A routing mechanism", "A template engine"]',
 'Functions that execute during request-response cycle',
 'Middleware functions have access to request and response objects and can modify them or end the request-response cycle.',
 ARRAY['express', 'nodejs', 'middleware']),

('70000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'intermediate', 'mcq',
 'Which Pandas method is used to read CSV files?',
 '["read_csv()", "load_csv()", "import_csv()", "get_csv()"]',
 'read_csv()',
 'pd.read_csv() is the standard method for reading CSV files into a DataFrame.',
 ARRAY['pandas', 'python', 'data-science']),

('70000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'simple', 'mcq',
 'What does EC2 stand for in AWS?',
 '["Elastic Compute Cloud", "Enhanced Cloud Computing", "Elastic Container Cloud", "Extended Compute Capacity"]',
 'Elastic Compute Cloud',
 'EC2 provides scalable virtual servers in the AWS cloud.',
 ARRAY['aws', 'cloud', 'ec2']),

('70000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'intermediate', 'mcq',
 'What is the difference between symmetric and asymmetric encryption?',
 '["Speed vs Security", "Same key vs Different keys", "Software vs Hardware", "Public vs Private"]',
 'Same key vs Different keys',
 'Symmetric uses the same key for encryption and decryption, while asymmetric uses different keys (public/private).',
 ARRAY['security', 'encryption', 'cryptography']),

('70000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000008', 'simple', 'mcq',
 'What command creates a Docker container?',
 '["docker create", "docker run", "docker start", "docker build"]',
 'docker run',
 'docker run creates and starts a container from an image in one command.',
 ARRAY['docker', 'containers', 'devops']),

('70000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000009', 'intermediate', 'mcq',
 'What type of algorithm is Linear Regression?',
 '["Unsupervised", "Supervised", "Reinforcement", "Semi-supervised"]',
 'Supervised',
 'Linear Regression is a supervised learning algorithm that predicts continuous values.',
 ARRAY['machine-learning', 'regression', 'supervised']),

('70000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000010', 'simple', 'mcq',
 'Which SQL JOIN returns all rows from both tables?',
 '["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"]',
 'FULL OUTER JOIN',
 'FULL OUTER JOIN returns all rows from both tables, with NULLs where there is no match.',
 ARRAY['sql', 'joins', 'database']),

('70000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000001', 'expert', 'mcq',
 'What is the purpose of useCallback hook?',
 '["Memoize values", "Memoize functions", "Handle side effects", "Manage state"]',
 'Memoize functions',
 'useCallback returns a memoized version of the callback function to prevent unnecessary re-renders.',
 ARRAY['react', 'hooks', 'performance']);

-- 11. EXAM BLUEPRINTS (10 records)
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, topic_ids, total_questions, time_limit, difficulty_distribution) VALUES
('80000000-0000-0000-0000-000000000001', 'React Fundamentals Quiz', 'Basic React concepts and hooks', 
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000001']::uuid[], 
 ARRAY['50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002']::uuid[], 
 10, 30, '{"simple": 40, "intermediate": 40, "expert": 20}'),

('80000000-0000-0000-0000-000000000002', 'Node.js Backend Assessment', 'Express and Node.js fundamentals',
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000002']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000003']::uuid[],
 15, 45, '{"simple": 30, "intermediate": 50, "expert": 20}'),

('80000000-0000-0000-0000-000000000003', 'Data Science Basics', 'Python and Pandas fundamentals',
 ARRAY['30000000-0000-0000-0000-000000000002']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000003']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000004']::uuid[],
 12, 40, '{"simple": 40, "intermediate": 40, "expert": 20}'),

('80000000-0000-0000-0000-000000000004', 'AWS Cloud Practitioner', 'AWS fundamentals and services',
 ARRAY['30000000-0000-0000-0000-000000000003']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000004']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000005']::uuid[],
 20, 60, '{"simple": 50, "intermediate": 30, "expert": 20}'),

('80000000-0000-0000-0000-000000000005', 'Security Fundamentals', 'Basic cybersecurity concepts',
 ARRAY['30000000-0000-0000-0000-000000000004']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000005']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000006']::uuid[],
 10, 30, '{"simple": 40, "intermediate": 40, "expert": 20}'),

('80000000-0000-0000-0000-000000000006', 'Mobile Development Quiz', 'React Native basics',
 ARRAY['30000000-0000-0000-0000-000000000005']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000006']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000007']::uuid[],
 10, 30, '{"simple": 40, "intermediate": 40, "expert": 20}'),

('80000000-0000-0000-0000-000000000007', 'DevOps Essentials', 'Docker and containerization',
 ARRAY['30000000-0000-0000-0000-000000000006']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000007']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000008']::uuid[],
 15, 45, '{"simple": 30, "intermediate": 50, "expert": 20}'),

('80000000-0000-0000-0000-000000000008', 'Machine Learning Basics', 'Introduction to ML algorithms',
 ARRAY['30000000-0000-0000-0000-000000000007']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000008']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000009']::uuid[],
 12, 40, '{"simple": 30, "intermediate": 50, "expert": 20}'),

('80000000-0000-0000-0000-000000000009', 'Database Design Quiz', 'SQL and database fundamentals',
 ARRAY['30000000-0000-0000-0000-000000000008']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000009']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000010']::uuid[],
 10, 30, '{"simple": 40, "intermediate": 40, "expert": 20}'),

('80000000-0000-0000-0000-000000000010', 'Full Stack Assessment', 'Comprehensive web development quiz',
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[],
 ARRAY['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002']::uuid[],
 ARRAY['50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003']::uuid[],
 20, 60, '{"simple": 30, "intermediate": 40, "expert": 30}');

-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================

-- NOTES:
-- 1. Password hash is a placeholder - use bcrypt to generate real hashes
-- 2. UUIDs are sequential for easy reference - use gen_random_uuid() in production
-- 3. Timestamps will be auto-generated by database defaults
-- 4. Adjust data as needed for your specific use case
