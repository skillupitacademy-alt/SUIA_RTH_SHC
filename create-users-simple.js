#!/usr/bin/env node

/**
 * Simple Test User Creation Script
 * Creates test users by directly executing SQL statements
 */

const bcrypt = require('bcryptjs');

async function main() {
  console.log('🔧 Test User Creation - SQL Generation');
  console.log('=====================================');
  
  // Generate the exact password hashes
  const rthHash = '$2b$12$cNd4ybUJu0drHK8Vk53JY.C0U.2bzmKoshoRnvfyEli3EVaDJTTZm';
  const skillupHash = '$2b$12$iv598PqwDQgtxFO3VS2KE./O3N6PM36NpAg949u2f88LXMkLplfzu';
  
  // Verify hashes work
  const rthValid = await bcrypt.compare('testing', rthHash);
  const skillupValid = await bcrypt.compare('testing', skillupHash);
  
  console.log('🔑 Password Hash Verification:');
  console.log(`  RTH Hash: ${rthValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`  SkillUp Hash: ${skillupValid ? '✅ VALID' : '❌ INVALID'}`);
  
  console.log('\n📋 SQL Statements to Execute:');
  console.log('==============================');
  
  console.log('\n-- 1. RTH Database (rth_prod) - Create ajayshah@gmail.com');
  console.log('-- Execute these statements in rth_prod database:');
  console.log(`
-- Check if user already exists
SELECT id, email FROM users WHERE email = 'ajayshah@gmail.com';

-- If user doesn't exist, create it:
INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
VALUES (
  'ajayshah@gmail.com',
  '${rthHash}',
  true,
  false,
  NOW(),
  NOW()
);

-- Create user profile
INSERT INTO user_profiles (user_id, name, created_at, updated_at)
SELECT id, 'Ajay Shah', NOW(), NOW()
FROM users WHERE email = 'ajayshah@gmail.com';

-- Assign USER role (check if role exists first)
SELECT id, name FROM roles WHERE name = 'USER';

-- If USER role exists, assign it:
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'ajayshah@gmail.com' AND r.name = 'USER';

-- Verify user creation
SELECT 
  u.id, 
  u.email, 
  u.email_verified, 
  u.is_blocked, 
  p.name, 
  r.name as role
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'ajayshah@gmail.com';
`);

  console.log('\n-- 2. SkillUp Database (skillup_prod) - Create student@skillupitacademy.com');
  console.log('-- Execute these statements in skillup_prod database:');
  console.log(`
-- Check if user already exists
SELECT id, email FROM users WHERE email = 'student@skillupitacademy.com';

-- If user doesn't exist, create it:
INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
VALUES (
  'student@skillupitacademy.com',
  '${skillupHash}',
  true,
  false,
  NOW(),
  NOW()
);

-- Create user profile
INSERT INTO user_profiles (user_id, name, created_at, updated_at)
SELECT id, 'SkillUp Student', NOW(), NOW()
FROM users WHERE email = 'student@skillupitacademy.com';

-- Assign USER role (check if role exists first)
SELECT id, name FROM roles WHERE name = 'USER';

-- If USER role exists, assign it:
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'student@skillupitacademy.com' AND r.name = 'USER';

-- Verify user creation
SELECT 
  u.id, 
  u.email, 
  u.email_verified, 
  u.is_blocked, 
  p.name, 
  r.name as role
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'student@skillupitacademy.com';
`);

  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Connect to your rth_prod database');
  console.log('2. Execute the RTH SQL statements above');
  console.log('3. Connect to your skillup_prod database');
  console.log('4. Execute the SkillUp SQL statements above');
  console.log('5. Test login at:');
  console.log('   - https://user.realtutorialhub.com/login');
  console.log('   - https://user.skillupitacademy.com/login');
  console.log('');
  console.log('📧 Test Credentials:');
  console.log('   RTH: ajayshah@gmail.com / testing');
  console.log('   SkillUp: student@skillupitacademy.com / testing');
}

main().catch(console.error);