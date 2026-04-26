#!/usr/bin/env node
/**
 * 🧹 SIMPLE ROLE CLEANUP
 * 
 * Direct approach to fix role duplicates
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function simpleCleanup() {
  console.log('🧹 SIMPLE ROLE CLEANUP');
  console.log('=====================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Step 1: Check current state
    console.log('📊 Current role state:');
    const roles = await pool.query(`
      SELECT id, name FROM roles ORDER BY name
    `);
    
    roles.rows.forEach(role => {
      console.log(`  - ${role.name} (${role.id})`);
    });

    // Step 2: Manual cleanup of specific duplicates
    console.log('\n🔧 Cleaning up specific duplicates...\n');

    // Fix admin roles: Keep 'admin', remove 'ADMIN'
    console.log('1. Fixing admin roles...');
    const adminRoles = await pool.query(`
      SELECT id, name FROM roles WHERE LOWER(name) = 'admin' ORDER BY name
    `);
    
    if (adminRoles.rows.length > 1) {
      const keepRole = adminRoles.rows.find(r => r.name === 'admin') || adminRoles.rows[0];
      const deleteRoles = adminRoles.rows.filter(r => r.id !== keepRole.id);
      
      console.log(`   Keeping: ${keepRole.name} (${keepRole.id})`);
      
      for (const deleteRole of deleteRoles) {
        console.log(`   Removing: ${deleteRole.name} (${deleteRole.id})`);
        
        // Move user assignments
        const moved = await pool.query(`
          UPDATE user_roles 
          SET role_id = $1 
          WHERE role_id = $2 
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur2 
              WHERE ur2.user_id = user_roles.user_id 
                AND ur2.role_id = $1
            )
        `, [keepRole.id, deleteRole.id]);
        
        // Delete conflicting assignments
        await pool.query(`
          DELETE FROM user_roles 
          WHERE role_id = $1
        `, [deleteRole.id]);
        
        // Delete role
        await pool.query(`
          DELETE FROM roles WHERE id = $1
        `, [deleteRole.id]);
        
        console.log(`     Moved ${moved.rowCount} assignments and deleted role`);
      }
    }

    // Fix student roles: Keep 'student', remove 'STUDENT'
    console.log('2. Fixing student roles...');
    const studentRoles = await pool.query(`
      SELECT id, name FROM roles WHERE LOWER(name) = 'student' ORDER BY name
    `);
    
    if (studentRoles.rows.length > 1) {
      const keepRole = studentRoles.rows.find(r => r.name === 'student') || studentRoles.rows[0];
      const deleteRoles = studentRoles.rows.filter(r => r.id !== keepRole.id);
      
      console.log(`   Keeping: ${keepRole.name} (${keepRole.id})`);
      
      for (const deleteRole of deleteRoles) {
        console.log(`   Removing: ${deleteRole.name} (${deleteRole.id})`);
        
        // Move user assignments
        const moved = await pool.query(`
          UPDATE user_roles 
          SET role_id = $1 
          WHERE role_id = $2 
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur2 
              WHERE ur2.user_id = user_roles.user_id 
                AND ur2.role_id = $1
            )
        `, [keepRole.id, deleteRole.id]);
        
        // Delete conflicting assignments
        await pool.query(`
          DELETE FROM user_roles 
          WHERE role_id = $1
        `, [deleteRole.id]);
        
        // Delete role
        await pool.query(`
          DELETE FROM roles WHERE id = $1
        `, [deleteRole.id]);
        
        console.log(`     Moved ${moved.rowCount} assignments and deleted role`);
      }
    }

    // Fix user roles: Keep 'user', remove 'USER'
    console.log('3. Fixing user roles...');
    const userRoles = await pool.query(`
      SELECT id, name FROM roles WHERE LOWER(name) = 'user' ORDER BY name
    `);
    
    if (userRoles.rows.length > 1) {
      const keepRole = userRoles.rows.find(r => r.name === 'user') || userRoles.rows[0];
      const deleteRoles = userRoles.rows.filter(r => r.id !== keepRole.id);
      
      console.log(`   Keeping: ${keepRole.name} (${keepRole.id})`);
      
      for (const deleteRole of deleteRoles) {
        console.log(`   Removing: ${deleteRole.name} (${deleteRole.id})`);
        
        // Move user assignments
        const moved = await pool.query(`
          UPDATE user_roles 
          SET role_id = $1 
          WHERE role_id = $2 
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur2 
              WHERE ur2.user_id = user_roles.user_id 
                AND ur2.role_id = $1
            )
        `, [keepRole.id, deleteRole.id]);
        
        // Delete conflicting assignments
        await pool.query(`
          DELETE FROM user_roles 
          WHERE role_id = $1
        `, [deleteRole.id]);
        
        // Delete role
        await pool.query(`
          DELETE FROM roles WHERE id = $1
        `, [deleteRole.id]);
        
        console.log(`     Moved ${moved.rowCount} assignments and deleted role`);
      }
    }

    // Step 3: Final verification
    console.log('\n📋 Final verification...');
    const finalRoles = await pool.query(`
      SELECT id, name FROM roles ORDER BY name
    `);
    
    console.log('Final roles:');
    finalRoles.rows.forEach(role => {
      console.log(`  - ${role.name} (${role.id})`);
    });

    // Check for duplicates
    const duplicates = await pool.query(`
      SELECT 
        LOWER(name) as normalized_name,
        COUNT(*) as count
      FROM roles
      GROUP BY LOWER(name)
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length === 0) {
      console.log('\n✅ No duplicate roles found!');
      console.log('\n🎉 Role cleanup completed successfully!');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Test RBAC functionality');
      console.log('   2. Check application logs for RBAC_AUDIT entries');
      console.log('   3. Verify both GRANTED and DENIED access logs');
    } else {
      console.log('\n⚠️  Still found duplicates:');
      duplicates.rows.forEach(dup => {
        console.log(`  - ${dup.normalized_name}: ${dup.count} instances`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

simpleCleanup();