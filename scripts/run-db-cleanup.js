#!/usr/bin/env node
/**
 * 🧹 DATABASE ROLE CLEANUP - Node.js Executor
 * 
 * Executes the role cleanup using the application's database connection
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runCleanup() {
  console.log('🧹 DATABASE ROLE CLEANUP - Node.js Executor');
  console.log('===========================================\n');

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📊 Step 1: Checking current role state...\n');

    // Check for issues first
    const checkQuery = `
      SELECT 
        'Roles with uppercase' as issue,
        COUNT(*) as count
      FROM roles
      WHERE name != LOWER(name)
      
      UNION ALL
      
      SELECT 
        'Duplicate role names' as issue,
        COUNT(*) - COUNT(DISTINCT LOWER(name)) as count
      FROM roles
      
      UNION ALL
      
      SELECT 
        'Duplicate user-role assignments' as issue,
        COUNT(*) - COUNT(DISTINCT (user_id, role_id)) as count
      FROM user_roles;
    `;

    const issues = await pool.query(checkQuery);
    console.log('Current issues:');
    issues.rows.forEach(row => {
      console.log(`  - ${row.issue}: ${row.count}`);
    });

    if (issues.rows.every(row => row.count === '0')) {
      console.log('\n✅ No issues found! Database is already clean.');
      return;
    }

    console.log('\n🔧 Step 2: Running cleanup operations...\n');

    // Start transaction
    await pool.query('BEGIN');

    // 1. Create backup tables
    console.log('Creating backup tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles_backup AS 
      SELECT * FROM roles
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles_backup AS 
      SELECT * FROM user_roles
    `);

    // 2. Check for duplicate user-role assignments (should be none based on table structure)
    console.log('Checking for duplicate user-role assignments...');
    const dupCheck = await pool.query(`
      SELECT 
        user_id,
        role_id,
        COUNT(*) as count
      FROM user_roles
      GROUP BY user_id, role_id
      HAVING COUNT(*) > 1
    `);
    
    if (dupCheck.rows.length > 0) {
      console.log(`  Found ${dupCheck.rows.length} duplicate assignments - cleaning up...`);
      // Since there's no ID column, we need to delete and re-insert
      for (const dup of dupCheck.rows) {
        await pool.query(`
          DELETE FROM user_roles 
          WHERE user_id = $1 AND role_id = $2
        `, [dup.user_id, dup.role_id]);
        
        await pool.query(`
          INSERT INTO user_roles (user_id, role_id) 
          VALUES ($1, $2)
        `, [dup.user_id, dup.role_id]);
      }
    } else {
      console.log('  ✅ No duplicate user-role assignments found');
    }

    // 3. Find and merge duplicate roles
    console.log('Finding roles that will become duplicates after normalization...');
    const potentialDuplicates = await pool.query(`
      SELECT 
        LOWER(name) as normalized_name,
        ARRAY_AGG(id::text ORDER BY name) as all_ids,
        ARRAY_AGG(name ORDER BY name) as original_names,
        COUNT(*) as count
      FROM roles
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1
    `);

    if (potentialDuplicates.rows.length > 0) {
      console.log(`  Found ${potentialDuplicates.rows.length} sets of roles that will become duplicates`);
      
      for (const dup of potentialDuplicates.rows) {
        const keepId = dup.all_ids[0]; // Keep the first one alphabetically
        const deleteIds = dup.all_ids.slice(1); // Delete the rest
        
        console.log(`  Merging "${dup.normalized_name}" variants: [${dup.original_names.join(', ')}]`);
        console.log(`    Keeping ID: ${keepId}, deleting: ${deleteIds.join(', ')}`);
        
        // Update user_roles to use canonical role ID
        if (deleteIds.length > 0) {
          // First, check for potential conflicts
          const conflicts = await pool.query(`
            SELECT DISTINCT ur1.user_id
            FROM user_roles ur1
            JOIN user_roles ur2 ON ur1.user_id = ur2.user_id
            WHERE ur1.role_id = $1::uuid 
              AND ur2.role_id = ANY($2::uuid[])
          `, [keepId, deleteIds]);

          if (conflicts.rows.length > 0) {
            console.log(`    Found ${conflicts.rows.length} users with conflicting role assignments - removing conflicts first`);
            
            // Remove assignments to the roles we're about to delete for users who already have the canonical role
            await pool.query(`
              DELETE FROM user_roles 
              WHERE role_id = ANY($1::uuid[])
                AND user_id IN (
                  SELECT user_id FROM user_roles WHERE role_id = $2::uuid
                )
            `, [deleteIds, keepId]);
          }

          // Now safely update remaining assignments
          const updateResult = await pool.query(`
            UPDATE user_roles 
            SET role_id = $1::uuid
            WHERE role_id = ANY($2::uuid[])
          `, [keepId, deleteIds]);
          console.log(`    Moved ${updateResult.rowCount} user assignments to canonical role`);

          // Delete duplicate role records
          const deleteResult = await pool.query(`
            DELETE FROM roles 
            WHERE id = ANY($1::uuid[])
          `, [deleteIds]);
          console.log(`    Deleted ${deleteResult.rowCount} duplicate role records`);
        }
      }
    } else {
      console.log('  No potential duplicates found');
    }

    // 4. Now normalize role names to lowercase (safe since duplicates are merged)
    console.log('Normalizing remaining role names to lowercase...');
    const normalizeResult = await pool.query(`
      UPDATE roles 
      SET name = LOWER(name)
      WHERE name != LOWER(name)
    `);
    console.log(`  Updated ${normalizeResult.rowCount} role names`);

    // 5. Double-check for any remaining duplicates
    // 4. Double-check for any remaining duplicates
    console.log('Checking for any remaining duplicate roles...');
    const remainingDuplicates = await pool.query(`
      SELECT 
        name,
        COUNT(*) as count,
        ARRAY_AGG(id::text ORDER BY name) as ids
      FROM roles
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (remainingDuplicates.rows.length > 0) {
      console.log(`  ⚠️  Still found ${remainingDuplicates.rows.length} duplicate role names - cleaning up...`);
      
      for (const dup of remainingDuplicates.rows) {
        const keepId = dup.ids[0]; // Keep the first
        const deleteIds = dup.ids.slice(1); // Delete the rest
        
        console.log(`  Cleaning up remaining duplicates for "${dup.name}"`);
        
        // Move user assignments
        if (deleteIds.length > 0) {
          await pool.query(`
            UPDATE user_roles 
            SET role_id = $1::uuid
            WHERE role_id = ANY($2::uuid[])
          `, [keepId, deleteIds]);

          // Delete duplicate records
          await pool.query(`
            DELETE FROM roles 
            WHERE id = ANY($1::uuid[])
          `, [deleteIds]);
        }
      }
    } else {
      console.log('  ✅ No remaining duplicates found');
    }

    // 6. Add constraints (with error handling)
    console.log('Adding database constraints...');
    
    try {
      await pool.query(`
        ALTER TABLE roles 
        ADD CONSTRAINT roles_name_lowercase 
        CHECK (name = LOWER(name))
      `);
      console.log('  ✅ Added lowercase constraint');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ⚠️  Lowercase constraint already exists');
      } else {
        throw e;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE roles 
        ADD CONSTRAINT roles_name_unique 
        UNIQUE (name)
      `);
      console.log('  ✅ Added unique name constraint');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ⚠️  Unique name constraint already exists');
      } else {
        throw e;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE user_roles 
        ADD CONSTRAINT user_roles_unique 
        UNIQUE (user_id, role_id)
      `);
      console.log('  ✅ Added unique user-role constraint');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ⚠️  Unique user-role constraint already exists');
      } else {
        throw e;
      }
    }

    // Commit transaction
    await pool.query('COMMIT');

    console.log('\n📋 Step 3: Final validation...\n');

    // Validate cleanup
    const finalCheck = await pool.query(checkQuery);
    console.log('Final state:');
    finalCheck.rows.forEach(row => {
      const status = row.count === '0' ? '✅' : '❌';
      console.log(`  ${status} ${row.issue}: ${row.count}`);
    });

    // Check for users without roles
    const usersWithoutRoles = await pool.query(`
      SELECT 
        u.id,
        u.email
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.user_id IS NULL
      LIMIT 5
    `);

    if (usersWithoutRoles.rows.length > 0) {
      console.log('\n⚠️  WARNING: Found users without roles:');
      usersWithoutRoles.rows.forEach(user => {
        console.log(`    - ${user.email} (ID: ${user.id})`);
      });
      console.log('   This may need manual investigation.');
    } else {
      console.log('\n✅ All users have roles assigned');
    }

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Test RBAC functionality');
    console.log('   2. Check application logs for RBAC_AUDIT entries');
    console.log('   3. Verify both GRANTED and DENIED access logs');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    
    try {
      await pool.query('ROLLBACK');
      console.log('🔄 Transaction rolled back');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runCleanup();