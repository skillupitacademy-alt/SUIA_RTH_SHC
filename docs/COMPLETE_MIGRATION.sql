-- =====================================================
-- COMPREHENSIVE DATABASE MIGRATION SCRIPT
-- Quiz Platform - Production Database Schema Update
-- =====================================================
-- Run this in Neon Console for: quiz_platform_prod
-- =====================================================

-- 1. CREATE ENUMS
-- =====================================================

-- Status enum for domains, subjects, topics, questions
DO $$ BEGIN
    CREATE TYPE status AS ENUM ('active', 'inactive', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Exam status enum
DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('started', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Question type enum
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('mcq', 'code_mcq');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Difficulty enum
DO $$ BEGIN
    CREATE TYPE difficulty AS ENUM ('simple', 'intermediate', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Users table (likely already exists, but check for missing columns)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Exams table - add status column
ALTER TABLE exams ADD COLUMN IF NOT EXISTS status exam_status NOT NULL DEFAULT 'started';

-- Domains table - add status column
ALTER TABLE domains ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'active';

-- Subjects table - add status and order columns
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'active';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Topics table - add status, complexity_level, and weight columns
ALTER TABLE topics ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'active';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS complexity_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 1;

-- Questions table - add status and tags columns
ALTER TABLE questions ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'active';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags TEXT[];


-- 3. CREATE MISSING TABLES
-- =====================================================

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  education_level TEXT,
  professional_status TEXT,
  age_group TEXT,
  experience_years INTEGER,
  domain_interest TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- User Roles (junction table)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT,
  device TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  metadata TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Revoked Tokens
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification Tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subtopics
CREATE TABLE IF NOT EXISTS subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  depth_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  mapping_type TEXT
);

-- Topic Skills (junction table)
CREATE TABLE IF NOT EXISTS topic_skills (
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, skill_id)
);

-- Results by Dimension
CREATE TABLE IF NOT EXISTS results_by_dimension (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  dimension_type TEXT NOT NULL,
  dimension_id TEXT,
  score INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_subjects_domain_id ON subjects(domain_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_blueprint_id ON exams(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_results_by_dimension_exam_id ON results_by_dimension(exam_id);


-- 5. INSERT DEFAULT ROLES (if not exists)
-- =====================================================

INSERT INTO roles (name) VALUES ('USER')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name) VALUES ('ADMIN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name) VALUES ('SUPER_ADMIN')
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After running this script:
-- 1. Restart your API server
-- 2. Test login and exam creation
-- 3. All schema mismatches should be resolved
-- =====================================================
