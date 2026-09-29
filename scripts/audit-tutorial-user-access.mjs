#!/usr/bin/env node

/**
 * READ-ONLY USER ACCESS AUDIT
 * 
 * Purpose: Compare why same tutorial works for one SkillUp user but not another
 * 
 * Evidence:
 * - student@skillupitacademy.com → 404
 * - ajayshah@gmail.com           → 200
 * - Same brand (skillup)
 * - Same tutorial (what-is-java-12efacf1/whatisjava)
 * 
 * HYPOTHESIS: User enrollment/access control difference
 * 
 * READ-ONLY - NO MUTATIONS
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const TUTORIAL_SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const TUTORIAL_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n============================================================');
    console.log('READ-ONLY USER ACCESS AUDIT');
    console.log('============================================================\n');

    console.log('Tutorial:');
    console.log('  Subtopic: what-is-java-12efacf1');
    console.log('  Navigation: whatisjava');
    console.log('  Subtopic ID:', TUTORIAL_SUBTOPIC_ID);
    console.log('  External ID:', TUTORIAL_EXTERNAL_ID);
    console.log('');

    // Get user IDs
    console.log('STEP 1: Identify Users\n');
    
    const studentResult = await mainPool.query(
      `SELECT id, email, is_blocked, email_verified FROM users WHERE email = $1`,
      ['student@skillupitacademy.com']
    );

    const ajayResult = await mainPool.query(
      `SELECT id, email, is_blocked, email_verified FROM users WHERE email = $1`,
      ['ajayshah@gmail.com']
    );

    if (studentResult.rows.length === 0) {
      console.log('❌ student@skillupitacademy.com NOT FOUND in MainDB');
      return;
    }

    if (ajayResult.rows.length === 0) {
      console.log('❌ ajayshah@gmail.com NOT FOUND in MainDB');
      return;
    }

    const studentUser = studentResult.rows[0];
    const ajayUser = ajayResult.rows[0];

    console.log('User 1 (404):');
    console.log('  Email:', studentUser.email);
    console.log('  ID:', studentUser.id);
    console.log('  Blocked:', studentUser.is_blocked);
    console.log('  Verified:', studentUser.email_verified);
    console.log('');

    console.log('User 2 (200):');
    console.log('  Email:', ajayUser.email);
    console.log('  ID:', ajayUser.id);
    console.log('  Blocked:', ajayUser.is_blocked);
    console.log('  Verified:', ajayUser.email_verified);
    console.log('');

    // Check roles
    console.log('STEP 2: Check User Roles\n');

    const studentRoles = await mainPool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [studentUser.id]
    );

    const ajayRoles = await mainPool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [ajayUser.id]
    );

    console.log('User 1 Roles:', studentRoles.rows.map(r => r.name).join(', ') || 'NONE');
    console.log('User 2 Roles:', ajayRoles.rows.map(r => r.name).join(', ') || 'NONE');
    console.log('');

    // Check enrollments (if table exists)
    console.log('STEP 3: Check Tutorial Enrollments\n');

    try {
      const studentEnrollments = await mainPool.query(
        `SELECT * FROM enrollments 
         WHERE user_id = $1 
           AND tutorial_id = $2`,
        [studentUser.id, TUTORIAL_EXTERNAL_ID]
      );

      const ajayEnrollments = await mainPool.query(
        `SELECT * FROM enrollments 
         WHERE user_id = $1 
           AND tutorial_id = $2`,
        [ajayUser.id, TUTORIAL_EXTERNAL_ID]
      );

      console.log('User 1 Enrollments:', studentEnrollments.rows.length);
      console.log('User 2 Enrollments:', ajayEnrollments.rows.length);

      if (studentEnrollments.rows.length > 0) {
        console.log('\nUser 1 Enrollment Details:');
        studentEnrollments.rows.forEach((e, idx) => {
          console.log(`  [${idx}] Status: ${e.status}, Created: ${e.created_at}`);
        });
      }

      if (ajayEnrollments.rows.length > 0) {
        console.log('\nUser 2 Enrollment Details:');
        ajayEnrollments.rows.forEach((e, idx) => {
          console.log(`  [${idx}] Status: ${e.status}, Created: ${e.created_at}`);
        });
      }
      console.log('');
    } catch (err) {
      if (err.code === '42P01') {
        console.log('⚠️  enrollments table does not exist in MainDB');
        console.log('');
      } else {
        throw err;
      }
    }

    // Check tutorial access permissions (if table exists)
    console.log('STEP 4: Check Tutorial Access Permissions\n');

    try {
      const studentAccess = await mainPool.query(
        `SELECT * FROM tutorial_access 
         WHERE user_id = $1 
           AND tutorial_id = $2`,
        [studentUser.id, TUTORIAL_EXTERNAL_ID]
      );

      const ajayAccess = await mainPool.query(
        `SELECT * FROM tutorial_access 
         WHERE user_id = $1 
           AND tutorial_id = $2`,
        [ajayUser.id, TUTORIAL_EXTERNAL_ID]
      );

      console.log('User 1 Access Records:', studentAccess.rows.length);
      console.log('User 2 Access Records:', ajayAccess.rows.length);
      console.log('');
    } catch (err) {
      if (err.code === '42P01') {
        console.log('⚠️  tutorial_access table does not exist in MainDB');
        console.log('');
      } else {
        throw err;
      }
    }

    // Check user profiles
    console.log('STEP 5: Check User Profiles\n');

    try {
      const studentProfile = await mainPool.query(
        `SELECT * FROM user_profiles WHERE user_id = $1`,
        [studentUser.id]
      );

      const ajayProfile = await mainPool.query(
        `SELECT * FROM user_profiles WHERE user_id = $1`,
        [ajayUser.id]
      );

      if (studentProfile.rows.length > 0) {
        console.log('User 1 Profile: EXISTS');
        console.log('  Fields:', Object.keys(studentProfile.rows[0]).join(', '));
      } else {
        console.log('User 1 Profile: NOT FOUND');
      }
      console.log('');

      if (ajayProfile.rows.length > 0) {
        console.log('User 2 Profile: EXISTS');
        console.log('  Fields:', Object.keys(ajayProfile.rows[0]).join(', '));
      } else {
        console.log('User 2 Profile: NOT FOUND');
      }
      console.log('');
    } catch (err) {
      console.log('⚠️  Error checking user_profiles:', err.message);
      console.log('');
    }

    // Check tutorial progress
    console.log('STEP 6: Check Tutorial Navigation Progress\n');

    const studentProgress = await tutorialPool.query(
      `SELECT * FROM tutorial_navigation_progress 
       WHERE user_id = $1 
         AND navigation_node_id = $2`,
      [studentUser.id, NAVIGATION_NODE_ID]
    );

    const ajayProgress = await tutorialPool.query(
      `SELECT * FROM tutorial_navigation_progress 
       WHERE user_id = $1 
         AND navigation_node_id = $2`,
      [ajayUser.id, NAVIGATION_NODE_ID]
    );

    console.log('User 1 Progress Records:', studentProgress.rows.length);
    console.log('User 2 Progress Records:', ajayProgress.rows.length);
    console.log('');

    // Summary
    console.log('============================================================');
    console.log('SUMMARY');
    console.log('============================================================\n');

    console.log('USER COMPARISON:');
    console.log('');
    console.log('                          User 1 (404)         User 2 (200)');
    console.log('Email:                   ', studentUser.email.padEnd(20), ajayUser.email);
    console.log('Account Status:          ', 
      (studentUser.is_blocked ? 'BLOCKED' : 'Active').padEnd(20),
      (ajayUser.is_blocked ? 'BLOCKED' : 'Active')
    );
    console.log('Email Verified:          ', 
      String(studentUser.email_verified).padEnd(20),
      String(ajayUser.email_verified)
    );
    console.log('Roles:                   ',
      (studentRoles.rows.map(r => r.name).join(', ') || 'NONE').padEnd(20),
      (ajayRoles.rows.map(r => r.name).join(', ') || 'NONE')
    );
    console.log('');

    console.log('HYPOTHESIS:');
    console.log('');
    
    const differences = [];
    
    if (studentUser.is_blocked !== ajayUser.is_blocked) {
      differences.push('Account blocked status differs');
    }
    
    if (studentUser.email_verified !== ajayUser.email_verified) {
      differences.push('Email verification differs');
    }
    
    const studentRoleNames = studentRoles.rows.map(r => r.name).sort();
    const ajayRoleNames = ajayRoles.rows.map(r => r.name).sort();
    if (JSON.stringify(studentRoleNames) !== JSON.stringify(ajayRoleNames)) {
      differences.push(`User roles differ: [${studentRoleNames.join(', ')}] vs [${ajayRoleNames.join(', ')}]`);
    }

    if (differences.length === 0) {
      console.log('⚠️  NO OBVIOUS DIFFERENCES FOUND');
      console.log('');
      console.log('The 404 may be caused by:');
      console.log('  - Application-level access control');
      console.log('  - Session/cookie differences');
      console.log('  - Server-side route protection');
      console.log('  - Cache/runtime state');
    } else {
      console.log('✅ DIFFERENCES FOUND:');
      differences.forEach((diff, idx) => {
        console.log(`  ${idx + 1}. ${diff}`);
      });
    }

    console.log('');
    console.log('NO DATABASE MUTATIONS PERFORMED');
    console.log('============================================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await mainPool.end();
    await tutorialPool.end();
  }
}

main().catch(console.error);
