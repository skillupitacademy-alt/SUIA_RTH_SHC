-- =====================================================
-- DEFINITIVE TEST USERS FOR LOGIN TESTING
-- =====================================================

-- First, ensure roles exist
INSERT INTO roles (id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'USER'),
('00000000-0000-0000-0000-000000000002', 'ADMIN'),
('00000000-0000-0000-0000-000000000003', 'SUPER_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ADMIN USER
-- Email: admin@test.com
-- Password: admin123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('22222222-2222-2222-2222-222222222222', 
 'admin@test.com', 
 '$2b$10$LhJOAWGdHQ9AAELuaBuV3uvCFS6SzV4aPhHwcjnnbWNa3aEkMkrzq', 
 true)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO user_profiles (id, user_id, name) VALUES
('22222222-2222-2222-2222-222222222223', 
 '22222222-2222-2222-2222-222222222222', 
 'Admin User')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUPER ADMIN
-- Email: superadmin@test.com
-- Password: super123
-- =====================================================
INSERT INTO users (id, email, password_hash, email_verified) VALUES
('55555555-5555-5555-5555-555555555555', 
 'superadmin@test.com', 
 '$2b$10$frCYmHvCiSEVwLSj7WugVeuMVJtMp3gAxwYqQae.Wm8N0gYd6XQae', 
 true)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO user_profiles (id, user_id, name) VALUES
('55555555-5555-5555-5555-555555555556', 
 '55555555-5555-5555-5555-555555555555', 
 'Super Admin')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
