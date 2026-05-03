#!/usr/bin/env tsx
/**
 * Check Admin Roles in Both Brand Databases
 * Verifies if both admins have proper admin roles
 */

import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAdminRoles() {
  console.log('\n🔍 Checking Admin Roles in Both Brand Databases\n');

  const databases = [
    { 
      name: 'rth_prod', 
      url: process.env.DATABASE_URL_RTH!,
      email: 'admin@realtutorialhub.com'
    },
    { 
      name: 'skillup_prod', 
      url: process.env.DATABASE_URL_SKILLUP!,
      email: 'admin@skillupitacademy.com'
    },
  ];

  for (const db of databases) {
    console.log('='.repeat(60));
    console.log(`📦 Database: ${db.name}`);
    console.log(`👤 Email: ${db.email}`);
    console.log('='.repeat(60));

    try {
      const sql = neon(db.url);

      // Get user details
      const users = await sql`
        SELECT id, email, email_verified, is_blocked
        FROM users
        WHERE email = ${db.email}
      `;

      if (users.length === 0) {
        console.log(`❌ User NOT found\n`);
        continue;
      }

      const user = users[0];
      console.log(`✅ User found: ${user.id}`);
      console.log(`   Email verified: ${user.email_verified}`);
      console.log(`   Is blocked: ${user.is_blocked}`);

      // Get roles
      const roles = await sql`
        SELECT r.id, r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
      `;

      console.log(`\n📋 Roles (${roles.length}):`);
      if (roles.length === 0) {
        console.log(`   ❌ NO ROLES ASSIGNED!`);
      } else {
        roles.forEach(role => {
          const isAdmin = role.name.toLowerCase().includes('admin');
          console.log(`   ${isAdmin ? '✅' : '⚠️ '} ${role.name} (ID: ${role.id})`);
        });
      }

      // Check if has admin role
      const hasAdminRole = roles.some(r => 
        r.name.toLowerCase() === 'admin' || 
        r.name.toLowerCase() === 'super_admin' ||
        r.name.toLowerCase() === 'infrastructure'
      );

      console.log(`\n🔐 Admin Access: ${hasAdminRole ? '✅ YES' : '❌ NO'}`);
      console.log('');

    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('✅ Check complete\n');
}

checkAdminRoles();
