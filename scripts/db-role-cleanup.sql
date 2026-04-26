-- 🧹 DATABASE ROLE CLEANUP SCRIPT
-- 
-- Fixes role inconsistencies:
-- 1. Normalizes all roles to lowercase
-- 2. Removes duplicate role assignments
-- 3. Adds constraints to prevent future issues

-- ============================================================
-- STEP 1: BACKUP (ALWAYS DO THIS FIRST)
-- ============================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS roles_backup AS 
SELECT * FROM roles;

CREATE TABLE IF NOT EXISTS user_roles_backup AS 
SELECT * FROM user_roles;

-- ============================================================
-- STEP 2: NORMALIZE ROLE NAMES TO LOWERCASE
-- ============================================================

-- Update role names to lowercase
UPDATE roles 
SET name = LOWER(name)
WHERE name != LOWER(name);

-- Verify
SELECT name, COUNT(*) as count 
FROM roles 
GROUP BY name 
ORDER BY name;

-- ============================================================
-- STEP 3: MERGE DUPLICATE ROLES
-- ============================================================

-- Find duplicate roles (same name, different IDs)
WITH duplicate_roles AS (
  SELECT 
    LOWER(name) as normalized_name,
    MIN(id) as keep_id,
    ARRAY_AGG(id) as all_ids
  FROM roles
  GROUP BY LOWER(name)
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicate_roles;

-- Update user_roles to use the canonical role ID
UPDATE user_roles ur
SET role_id = dr.keep_id
FROM duplicate_roles dr
WHERE ur.role_id = ANY(dr.all_ids)
  AND ur.role_id != dr.keep_id;

-- Delete duplicate role records
DELETE FROM roles r
WHERE EXISTS (
  SELECT 1 
  FROM duplicate_roles dr
  WHERE r.id = ANY(dr.all_ids)
    AND r.id != dr.keep_id
);

-- ============================================================
-- STEP 4: REMOVE DUPLICATE USER-ROLE ASSIGNMENTS
-- ============================================================

-- Find duplicate assignments
SELECT user_id, role_id, COUNT(*) as count
FROM user_roles
GROUP BY user_id, role_id
HAVING COUNT(*) > 1;

-- Keep only the oldest assignment for each user-role pair
DELETE FROM user_roles
WHERE id NOT IN (
  SELECT MIN(id)
  FROM user_roles
  GROUP BY user_id, role_id
);

-- ============================================================
-- STEP 5: ADD CONSTRAINTS TO PREVENT FUTURE ISSUES
-- ============================================================

-- Ensure role names are always lowercase
ALTER TABLE roles 
ADD CONSTRAINT roles_name_lowercase 
CHECK (name = LOWER(name));

-- Ensure unique role names
ALTER TABLE roles 
ADD CONSTRAINT roles_name_unique 
UNIQUE (name);

-- Ensure unique user-role assignments
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_unique 
UNIQUE (user_id, role_id);

-- ============================================================
-- STEP 6: VALIDATION
-- ============================================================

-- Check for any remaining issues
SELECT 
  'Roles with uppercase' as check_name,
  COUNT(*) as count
FROM roles
WHERE name != LOWER(name)

UNION ALL

SELECT 
  'Duplicate role names' as check_name,
  COUNT(*) - COUNT(DISTINCT name) as count
FROM roles

UNION ALL

SELECT 
  'Duplicate user-role assignments' as check_name,
  COUNT(*) - COUNT(DISTINCT (user_id, role_id)) as count
FROM user_roles;

-- ============================================================
-- STEP 7: VERIFY USER ACCESS
-- ============================================================

-- Check that all users still have roles
SELECT 
  u.id,
  u.email,
  ARRAY_AGG(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email
HAVING COUNT(r.id) = 0;

-- If any users have no roles, investigate before proceeding

-- ============================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ============================================================

-- If something goes wrong, restore from backup:
-- 
-- TRUNCATE roles CASCADE;
-- INSERT INTO roles SELECT * FROM roles_backup;
-- 
-- TRUNCATE user_roles CASCADE;
-- INSERT INTO user_roles SELECT * FROM user_roles_backup;
