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
-- 6. SUBJECTS (40 records - 4 per enterprise domain)
INSERT INTO subjects (id, domain_id, name, description, "order", status) VALUES
-- Web Development (Domain 1)
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'React.js', 'Frontend library for building UIs', 1, 'active'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Node.js', 'JavaScript runtime for backend', 2, 'active'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Database Systems', 'SQL and NoSQL paradigms', 3, 'active'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Modern Web Technologies', 'TypeScript, performance, and security', 4, 'active'),

-- Data Science (Domain 2)
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'Data Preparation', 'Cleaning and engineering raw data', 1, 'active'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'Machine Learning Fundamentals', 'Supervised and unsupervised basics', 2, 'active'),
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'Advanced Machine Learning', 'Ensemble methods and deep learning', 3, 'active'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000002', 'Data Analysis and Visualization', 'Statistical inference and storytelling', 4, 'active'),

-- Cloud Computing (Domain 3)
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'AWS Fundamentals', 'Amazon Web Services core logic', 1, 'active'),
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000003', 'Azure Services', 'Microsoft Azure platform essentials', 2, 'active'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000003', 'Google Cloud Platform', 'GCP infrastructure and services', 3, 'active'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000003', 'Cloud Architecture & DevOps', 'Patterns and IaC', 4, 'active'),

-- Cybersecurity (Domain 4)
('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000004', 'Network Security', 'Firewalls, VPNs, and Protocols', 1, 'active'),
('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000004', 'Cryptography & PKI', 'Encryption standards and management', 2, 'active'),
('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000004', 'Identity & Access Management', 'IAM, Auth, and RBAC', 3, 'active'),
('40000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000004', 'Security Operations', 'Incidents and operations', 4, 'active'),

-- Mobile Development (Domain 5)
('40000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000005', 'iOS Development', 'Swift and UIKit/SwiftUI', 1, 'active'),
('40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000005', 'Android Development', 'Kotlin and Jetpack Compose', 2, 'active'),
('40000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000005', 'Cross-Platform Frameworks', 'Flutter and React Native', 3, 'active'),
('40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000005', 'Mobile UI/UX', 'Mobile-first design principles', 4, 'active'),

-- DevOps (Domain 6)
('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000006', 'CI/CD Pipelines', 'Automation and delivery', 1, 'active'),
('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000006', 'Containerization & Orchestration', 'Docker and Kubernetes', 2, 'active'),
('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000006', 'Infrastructure as Code', 'Terraform and Ansible', 3, 'active'),
('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000006', 'Observability', 'Monitoring and logging', 4, 'active'),

-- Artificial Intelligence (Domain 7)
('40000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000007', 'Machine Learning Fundamentals', 'Learning paradigms and evaluation', 1, 'active'),
('40000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000007', 'Neural Networks', 'Deep learning architectures', 2, 'active'),
('40000000-0000-0000-0000-000000000027', '30000000-0000-0000-0000-000000000007', 'NLP', 'Natural Language Processing', 3, 'active'),
('40000000-0000-0000-0000-000000000028', '30000000-0000-0000-0000-000000000007', 'Computer Vision', 'Image and video analysis', 4, 'active'),

-- Database Systems (Domain 8)
('40000000-0000-0000-0000-000000000029', '30000000-0000-0000-0000-000000000008', 'SQL & Relational Databases', 'PostgreSQL and MySQL', 1, 'active'),
('40000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000008', 'NoSQL Databases', 'MongoDB and Redis', 2, 'active'),
('40000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000008', 'Database Design', 'Normalization and modeling', 3, 'active'),
('40000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000008', 'Performance Tuning', 'Indexing and optimization', 4, 'active'),

-- Software Architecture (Domain 9)
('40000000-0000-0000-0000-000000000033', '30000000-0000-0000-0000-000000000009', 'Design Patterns', 'GoF and modern patterns', 1, 'active'),
('40000000-0000-0000-0000-000000000034', '30000000-0000-0000-0000-000000000009', 'Architectural Styles', 'Monoliths to Microservices', 2, 'active'),
('40000000-0000-0000-0000-000000000035', '30000000-0000-0000-0000-000000000009', 'System Design', 'Scalability and availability', 3, 'active'),
('40000000-0000-0000-0000-000000000036', '30000000-0000-0000-0000-000000000009', 'Distributed Systems', 'CAP theorem and consensus', 4, 'active'),

-- Product Management (Domain 10)
('40000000-0000-0000-0000-000000000037', '30000000-0000-0000-0000-000000000010', 'Product Strategy', 'Market research and vision', 1, 'active'),
('40000000-0000-0000-0000-000000000038', '30000000-0000-0000-0000-000000000010', 'Agile Methodologies', 'Scrum and Kanban', 2, 'active'),
('40000000-0000-0000-0000-000000000039', '30000000-0000-0000-0000-000000000010', 'UX Fundamentals', 'User research and wireframing', 3, 'active'),
('40000000-0000-0000-0000-000000000040', '30000000-0000-0000-0000-000000000010', 'Analytics & Growth', 'KPIs and A/B testing', 4, 'active');



-- 7. TOPICS (10 records)
INSERT INTO topics (id, subject_id, name, description, complexity_level, weight, status) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'React Hooks', 'useState, useEffect, and custom hooks', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'React Context API', 'Global state management with Context', 3, 2, 'active'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Express Middleware', 'Request/response pipeline in Express', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000004', '43000000-0000-0000-0000-000000000001', 'Pandas DataFrames', 'Data manipulation with Pandas', 2, 4, 'active'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-00000000000a', 'EC2 Instances', 'Virtual servers in AWS', 1, 3, 'active'),
('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', 'Encryption Basics', 'Symmetric and asymmetric encryption', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004', 'React Native Components', 'Building mobile UI components', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000022', 'Docker Containers', 'Creating and managing containers', 2, 4, 'active'),
('50000000-0000-0000-0000-000000000009', '43000000-0000-0000-0000-000000000002', 'Linear Regression', 'Predictive modeling basics', 2, 3, 'active'),
('50000000-0000-0000-0000-000000000010', '41000000-0000-0000-0000-000000000009', 'SQL Joins', 'INNER, LEFT, RIGHT, and FULL joins', 2, 4, 'active');

-- 8. SKILLS (10 records)
INSERT INTO skills (id, name, category, mapping_type) VALUES
('90000000-0000-0000-0000-000000000001', 'Problem Solving', 'Cognitive', 'conceptual'),
('90000000-0000-0000-0000-000000000002', 'Code Debugging', 'Technical', 'technical'),
('90000000-0000-0000-0000-000000000003', 'API Design', 'Technical', 'technical'),
('90000000-0000-0000-0000-000000000004', 'Data Analysis', 'Technical', 'practical'),
('90000000-0000-0000-0000-000000000005', 'System Design', 'Cognitive', 'conceptual'),
('90000000-0000-0000-0000-000000000006', 'Security Awareness', 'Technical', 'conceptual'),
('90000000-0000-0000-0000-000000000007', 'Performance Optimization', 'Technical', 'practical'),
('90000000-0000-0000-0000-000000000008', 'Testing & QA', 'Technical', 'practical'),
('90000000-0000-0000-0000-000000000009', 'Version Control', 'Technical', 'technical'),
('90000000-0000-0000-0000-000000000010', 'Agile Methodology', 'Process', 'conceptual');

-- 9. TOPIC SKILLS (10 records - map skills to topics)
INSERT INTO topic_skills (topic_id, skill_id) VALUES
('50000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002'), -- React Hooks -> Code Debugging
('50000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000005'), -- Context API -> System Design
('50000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000003'), -- Express Middleware -> API Design
('50000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000004'), -- Pandas -> Data Analysis
('50000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000005'), -- EC2 -> System Design
('50000000-0000-0000-0000-000000000006', '90000000-0000-0000-0000-000000000006'), -- Encryption -> Security Awareness
('50000000-0000-0000-0000-000000000007', '90000000-0000-0000-0000-000000000002'), -- RN Components -> Code Debugging
('50000000-0000-0000-0000-000000000008', '90000000-0000-0000-0000-000000000007'), -- Docker -> Performance Optimization
('50000000-0000-0000-0000-000000000009', '90000000-0000-0000-0000-000000000004'), -- Linear Regression -> Data Analysis
('50000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000001'); -- SQL Joins -> Problem Solving

-- 10. QUESTIONS (10 records)
INSERT INTO questions (id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, tags) VALUES
('60000000-0000-0000-0000-000000001001', '50000000-0000-0000-0000-000000000001', 'simple', 'mcq', 
 'What hook is used for side effects in React?', 
 '["useState", "useEffect", "useContext", "useReducer"]', 
 'useEffect', 
 'useEffect is specifically designed for handling side effects like data fetching, subscriptions, and DOM manipulation.',
 ARRAY['react', 'hooks']),

('60000000-0000-0000-0000-000000001002', '50000000-0000-0000-0000-000000000001', 'intermediate', 'mcq',
 'Which hook would you use to share state across multiple components?',
 '["useState", "useEffect", "useContext", "useMemo"]',
 'useContext',
 'useContext allows you to access context values without prop drilling.',
 ARRAY['react', 'hooks', 'context']),

('60000000-0000-0000-0000-000000001003', '50000000-0000-0000-0000-000000000003', 'simple', 'mcq',
 'What is middleware in Express.js?',
 '["A database layer", "Functions that execute during request-response cycle", "A routing mechanism", "A template engine"]',
 'Functions that execute during request-response cycle',
 'Middleware functions have access to request and response objects and can modify them or end the request-response cycle.',
 ARRAY['express', 'nodejs', 'middleware']),

('60000000-0000-0000-0000-000000001004', '50000000-0000-0000-0000-000000000004', 'intermediate', 'mcq',
 'Which Pandas method is used to read CSV files?',
 '["read_csv()", "load_csv()", "import_csv()", "get_csv()"]',
 'read_csv()',
 'pd.read_csv() is the standard method for reading CSV files into a DataFrame.',
 ARRAY['pandas', 'python', 'data-science']),

('60000000-0000-0000-0000-000000001005', '50000000-0000-0000-0000-000000000005', 'simple', 'mcq',
 'What does EC2 stand for in AWS?',
 '["Elastic Compute Cloud", "Enhanced Cloud Computing", "Elastic Container Cloud", "Extended Compute Capacity"]',
 'Elastic Compute Cloud',
 'EC2 provides scalable virtual servers in the AWS cloud.',
 ARRAY['aws', 'cloud', 'ec2']),

('60000000-0000-0000-0000-000000001006', '50000000-0000-0000-0000-000000000006', 'intermediate', 'mcq',
 'What is the difference between symmetric and asymmetric encryption?',
 '["Speed vs Security", "Same key vs Different keys", "Software vs Hardware", "Public vs Private"]',
 'Same key vs Different keys',
 'Symmetric uses the same key for encryption and decryption, while asymmetric uses different keys (public/private).',
 ARRAY['security', 'encryption', 'cryptography']),

('60000000-0000-0000-0000-000000001007', '50000000-0000-0000-0000-000000000008', 'simple', 'mcq',
 'What command creates a Docker container?',
 '["docker create", "docker run", "docker start", "docker build"]',
 'docker run',
 'docker run creates and starts a container from an image in one command.',
 ARRAY['docker', 'containers', 'devops']),

('60000000-0000-0000-0000-000000001008', '50000000-0000-0000-0000-000000000009', 'intermediate', 'mcq',
 'What type of algorithm is Linear Regression?',
 '["Unsupervised", "Supervised", "Reinforcement", "Semi-supervised"]',
 'Supervised',
 'Linear Regression is a supervised learning algorithm that predicts continuous values.',
 ARRAY['machine-learning', 'regression', 'supervised']),

('60000000-0000-0000-0000-000000001009', '50000000-0000-0000-0000-000000000010', 'simple', 'mcq',
 'Which SQL JOIN returns all rows from both tables?',
 '["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"]',
 'FULL OUTER JOIN',
 'FULL OUTER JOIN returns all rows from both tables, with NULLs where there is no match.',
 ARRAY['sql', 'joins', 'database']),

('60000000-0000-0000-0000-000000001010', '50000000-0000-0000-0000-000000000001', 'expert', 'mcq',
 'What is the purpose of useCallback hook?',
 '["Memoize values", "Memoize functions", "Handle side effects", "Manage state"]',
 'Memoize functions',
 'useCallback returns a memoized version of the callback function to prevent unnecessary re-renders.',
 ARRAY['react', 'hooks', 'performance']);

-- 11. EXAM BLUEPRINTS (10 records)
-- 11. EXAM BLUEPRINTS (Based on Enterprise UI - 10 Qs, 45 Mins, 30-30-40 Mixed Distribution)
INSERT INTO exam_blueprints (id, name, description, domain_ids, subject_ids, total_questions, time_limit, difficulty_distribution) VALUES
-- Web Development
('80000000-0000-0000-0000-000000000001', 'Web Development Enterprise Exam', 'Master industry-standard practices and tools in Web Development', 
 ARRAY['30000000-0000-0000-0000-000000000001']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Data Science
('80000000-0000-0000-0000-000000000002', 'Data Science Enterprise Exam', 'Master industry-standard practices and tools in Data Science', 
 ARRAY['30000000-0000-0000-0000-000000000002']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000008']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Cloud Computing
('80000000-0000-0000-0000-000000000003', 'Cloud Computing Enterprise Exam', 'Master industry-standard practices and tools in Cloud Computing', 
 ARRAY['30000000-0000-0000-0000-000000000003']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000012']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Cybersecurity
('80000000-0000-0000-0000-000000000004', 'Cybersecurity Enterprise Exam', 'Master industry-standard practices and tools in Cybersecurity', 
 ARRAY['30000000-0000-0000-0000-000000000004']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000016']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Mobile Development
('80000000-0000-0000-0000-000000000005', 'Mobile Development Enterprise Exam', 'Master industry-standard practices and tools in Mobile Development', 
 ARRAY['30000000-0000-0000-0000-000000000005']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000020']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- DevOps
('80000000-0000-0000-0000-000000000006', 'DevOps Enterprise Exam', 'Master industry-standard practices and tools in DevOps', 
 ARRAY['30000000-0000-0000-0000-000000000006']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000024']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Artificial Intelligence
('80000000-0000-0000-0000-000000000007', 'Artificial Intelligence Enterprise Exam', 'Master industry-standard practices and tools in Artificial Intelligence', 
 ARRAY['30000000-0000-0000-0000-000000000007']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000025', '40000000-0000-0000-0000-000000000026', '40000000-0000-0000-0000-000000000027', '40000000-0000-0000-0000-000000000028']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Database Systems
('80000000-0000-0000-0000-000000000008', 'Database Systems Enterprise Exam', 'Master industry-standard practices and tools in Database Systems', 
 ARRAY['30000000-0000-0000-0000-000000000008']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000029', '40000000-0000-0000-0000-000000000030', '40000000-0000-0000-0000-000000000031', '40000000-0000-0000-0000-000000000032']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Software Architecture
('80000000-0000-0000-0000-000000000009', 'Software Architecture Enterprise Exam', 'Master industry-standard practices and tools in Software Architecture', 
 ARRAY['30000000-0000-0000-0000-000000000009']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000033', '40000000-0000-0000-0000-000000000034', '40000000-0000-0000-0000-000000000035', '40000000-0000-0000-0000-000000000036']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}'),

-- Product Management
('80000000-0000-0000-0000-000000000010', 'Product Management Enterprise Exam', 'Master industry-standard practices and tools in Product Management', 
 ARRAY['30000000-0000-0000-0000-000000000010']::uuid[], 
 ARRAY['40000000-0000-0000-0000-000000000037', '40000000-0000-0000-0000-000000000038', '40000000-0000-0000-0000-000000000039', '40000000-0000-0000-0000-000000000040']::uuid[], 
 10, 45, '{"simple": 30, "intermediate": 30, "expert": 40}');





-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================

-- NOTES:
-- 1. Password hash is a placeholder - use bcrypt to generate real hashes
-- 2. UUIDs are sequential for easy reference - use gen_random_uuid() in production
-- 3. Timestamps will be auto-generated by database defaults
-- 4. Adjust data as needed for your specific use case
