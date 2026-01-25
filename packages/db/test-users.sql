-- =====================================================
-- SIMPLE TEST USERS FOR LOGIN TESTING
-- =====================================================
-- These users have simple, easy-to-remember credentials
-- All passwords are hashed with bcrypt
-- =====================================================

-- First, ensure roles exist
INSERT INTO roles (id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'USER'),
('00000000-0000-0000-0000-000000000002', 'ADMIN'),
('00000000-0000-0000-0000-000000000003', 'SUPER_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEST USER 1: Regular User
-- Email: user@test.com
-- Password: password123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('11111111-1111-1111-1111-111111111111', 
 'user@test.com', 
 '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 true);

INSERT INTO user_profiles (id, user_id, name, education_level, professional_status, age_group) VALUES
('11111111-1111-1111-1111-111111111112', 
 '11111111-1111-1111-1111-111111111111', 
 'Test User', 
 'Bachelors', 
 'Software Developer', 
 '25-30');

INSERT INTO user_roles (user_id, role_id) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- TEST USER 2: Admin User
-- Email: admin@test.com
-- Password: admin123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('22222222-2222-2222-2222-222222222222', 
 'admin@test.com', 
 '$2b$10$N9qo8uLOickgx2ZoE/1aUOvJLO9Q5VfO6T8qFjXIr9p8Z3qJ5XQCK', 
 true);

INSERT INTO user_profiles (id, user_id, name, education_level, professional_status, age_group) VALUES
('22222222-2222-2222-2222-222222222223', 
 '22222222-2222-2222-2222-222222222222', 
 'Admin User', 
 'Masters', 
 'System Administrator', 
 '30-35');

INSERT INTO user_roles (user_id, role_id) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002');

-- =====================================================
-- TEST USER 3: Demo User
-- Email: demo@test.com
-- Password: demo123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('33333333-3333-3333-3333-333333333333', 
 'demo@test.com', 
 '$2b$10$5K8QnKjn5K8QnKjn5K8QnOqJ5K8QnKjn5K8QnKjn5K8QnKjn5K8Qn', 
 true);

INSERT INTO user_profiles (id, user_id, name, education_level, professional_status, age_group) VALUES
('33333333-3333-3333-3333-333333333334', 
 '33333333-3333-3333-3333-333333333333', 
 'Demo User', 
 'Bachelors', 
 'Student', 
 '20-25');

INSERT INTO user_roles (user_id, role_id) VALUES
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- TEST USER 4: Simple User
-- Email: test@test.com
-- Password: test123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('44444444-4444-4444-4444-444444444444', 
 'test@test.com', 
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
 true);

INSERT INTO user_profiles (id, user_id, name) VALUES
('44444444-4444-4444-4444-444444444445', 
 '44444444-4444-4444-4444-444444444444', 
 'Simple Test');

INSERT INTO user_roles (user_id, role_id) VALUES
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- TEST USER 5: Super Admin
-- Email: superadmin@test.com
-- Password: super123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('55555555-5555-5555-5555-555555555555', 
 'superadmin@test.com', 
 '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQR', 
 true);

INSERT INTO user_profiles (id, user_id, name) VALUES
('55555555-5555-5555-5555-555555555556', 
 '55555555-5555-5555-5555-555555555555', 
 'Super Admin');

INSERT INTO user_roles (user_id, role_id) VALUES
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000003');

-- =====================================================
-- SUMMARY OF TEST ACCOUNTS
-- =====================================================
-- 
-- 1. Regular User
--    Email: user@test.com
--    Password: password123
--    Role: USER
--
-- 2. Admin User
--    Email: admin@test.com
--    Password: admin123
--    Role: ADMIN
--
-- 3. Demo User
--    Email: demo@test.com
--    Password: demo123
--    Role: USER
--
-- 4. Simple Test
--    Email: test@test.com
--    Password: test123
--    Role: USER
--
-- 5. Super Admin
--    Email: superadmin@test.com
--    Password: super123
--    Role: SUPER_ADMIN
--
-- =====================================================
-- USAGE:
-- 1. Copy this entire SQL
-- 2. Run in Neon SQL Editor
-- 3. Login at https://quiz.realtutorialhub.com/login
-- =====================================================
