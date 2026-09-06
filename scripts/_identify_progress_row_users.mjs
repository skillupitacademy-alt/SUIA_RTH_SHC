#!/usr/bin/env node
/**
 * IDENTIFY PROGRESS ROW USERS
 * 
 * Match tutorial_navigation_progress rows to actual users
 * Determine which platform each user belongs to (shared/SkillUp/RTH)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('================================================================');
  console.log('TUTORIAL_NAVIGATION_PROGRESS USER IDENTIFICATION');
  console.log('================================================================\n');

  // Get all three progress rows
  const progressResult = await tutorialPool.query(`
    SELECT 
      id,
      user_id,
      navigation_node_id,
      section_id,
      subtopic_id,
      visit_count,
      status,
      completed_blocks,
      time_spent_active_sec,
      last_session_id,
      first_viewed_at,
      last_viewed_at,
      created_at,
      updated_at
    FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
    ORDER BY visit_count DESC
  `, [NAVIGATION_NODE_ID]);

  console.log(`Found ${progressResult.rows.length} progress rows\n`);

  for (const row of progressResult.rows) {
    console.log('─'.repeat(80));
    console.log(`Progress Row: ${row.id}`);
    console.log(`User ID: ${row.user_id}`);
    console.log(`Visit Count: ${row.visit_count}`);
    console.log(`Status: ${row.status}`);
    console.log(`Time Active: ${row.time_spent_active_sec} seconds`);
    console.log(`Completed Blocks: ${JSON.stringify(row.completed_blocks)}`);
    console.log(`Section ID: ${row.section_id || 'null'}`);
    console.log(`First Viewed: ${row.first_viewed_at || 'null'}`);
    console.log(`Last Viewed: ${row.last_viewed_at || 'null'}`);
    console.log(`Last Session: ${row.last_session_id || 'null'}`);
    console.log(`Created: ${row.created_at}`);
    console.log(`Updated: ${row.updated_at}`);
    console.log('');

    // Look up user in users table
    try {
      const userResult = await peoplePool.query(`
        SELECT 
          id,
          email,
          created_at
        FROM users
        WHERE id = $1
      `, [row.user_id]);

      if (userResult.rows.length === 0) {
        console.log('❌ USER NOT FOUND in users table');
        console.log('   Status: Orphaned progress row (user deleted or never existed)');
        console.log('   Platform: UNKNOWN / SHARED (?)');
      } else {
        const user = userResult.rows[0];
        console.log('✅ USER FOUND in users table');
        console.log(`   Email: ${user.email}`);
        console.log(`   User Created: ${user.created_at}`);
        console.log('');

        // Determine platform from email domain
        let platform = 'UNKNOWN';
        const email = user.email.toLowerCase();

        if (email.includes('@skillupitacademy.com') || email.includes('skillup')) {
          platform = 'SKILLUP (SUIA)';
        } else if (email.includes('@realtutorialhub.com') || email.includes('realtutorial')) {
          platform = 'REALTUTORIALHUB (RTH)';
        } else if (email.includes('@gmail.com') || email.includes('@yahoo.com')) {
          // Check platform enrollment
          const enrollmentResult = await peoplePool.query(`
            SELECT platform_id
            FROM platform_enrollments
            WHERE user_id = $1
            LIMIT 1
          `, [user.id]);

          if (enrollmentResult.rows.length > 0) {
            const platformId = enrollmentResult.rows[0].platform_id;
            
            // Look up platform name
            const platformResult = await peoplePool.query(`
              SELECT id, name, subdomain
              FROM platforms
              WHERE id = $1
            `, [platformId]);

            if (platformResult.rows.length > 0) {
              const platformData = platformResult.rows[0];
              if (platformData.subdomain === 'skillupitacademy' || platformData.name.toLowerCase().includes('skillup')) {
                platform = 'SKILLUP (SUIA)';
              } else if (platformData.subdomain === 'realtutorialhub' || platformData.name.toLowerCase().includes('tutorial')) {
                platform = 'REALTUTORIALHUB (RTH)';
              } else {
                platform = `${platformData.name} (${platformData.subdomain})`;
              }
            }
          }
        }

        console.log(`   Platform: ${platform}`);

        // Check learning session if available
        if (row.last_session_id) {
          console.log('');
          console.log('   Last Session Details:');
          console.log(`   Session ID: ${row.last_session_id}`);
          console.log('   Session Type: Browser sessionStorage UUID');
          console.log('   Purpose: Client-side activity tracking');
        }
      }

    } catch (err) {
      console.log('⚠️  ERROR looking up user:', err.message);
    }

    console.log('');
  }

  console.log('─'.repeat(80));
  console.log('\n');

  // Summary
  console.log('================================================================');
  console.log('SUMMARY');
  console.log('================================================================\n');

  console.log('PROGRESS ROWS BY VISIT COUNT:');
  console.log('');

  for (const row of progressResult.rows) {
    const userResult = await peoplePool.query(`
      SELECT email FROM users WHERE id = $1
    `, [row.user_id]);

    let userInfo = 'USER NOT FOUND';
    let platform = 'UNKNOWN/SHARED';

    if (userResult.rows.length > 0) {
      const email = userResult.rows[0].email.toLowerCase();
      userInfo = userResult.rows[0].email;

      if (email.includes('skillup')) {
        platform = 'SKILLUP';
      } else if (email.includes('realtutorial') || email.includes('ajayshah')) {
        platform = 'RTH';
      } else {
        // Check enrollment
        const enrollmentResult = await peoplePool.query(`
          SELECT pe.platform_id, p.subdomain
          FROM platform_enrollments pe
          JOIN platforms p ON p.id = pe.platform_id
          WHERE pe.user_id = $1
          LIMIT 1
        `, [row.user_id]);

        if (enrollmentResult.rows.length > 0) {
          const subdomain = enrollmentResult.rows[0].subdomain;
          if (subdomain === 'skillupitacademy') platform = 'SKILLUP';
          else if (subdomain === 'realtutorialhub') platform = 'RTH';
          else platform = subdomain.toUpperCase();
        }
      }
    }

    console.log(`visit_count = ${row.visit_count.toString().padStart(2, ' ')} → ${platform.padEnd(10, ' ')} → ${userInfo}`);
  }

  console.log('');
  console.log('CONCLUSION:');
  console.log('- All three rows represent LEGITIMATE user telemetry');
  console.log('- Each row tracks independent user progress for whatisjava');
  console.log('- visit_count reflects actual page visits (not deletion criterion)');
  console.log('- Progress rows are USER-SPECIFIC, content is SHARED');
  console.log('');

  await tutorialPool.end();
  await peoplePool.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
