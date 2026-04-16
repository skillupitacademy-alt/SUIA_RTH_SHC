// This script tests the exact same flow as the UserRepository
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

// Import the RTH schema
const { users: rthUsers, userProfiles: rthUserProfiles, roles: rthRoles, userRoles: rthUserRoles } = require('./packages/db-rth/src/schema/index.js');

async function testRepository() {
  // Create RTH database connection
  const client = postgres(process.env.DATABASE_DIRECT_URL_RTH);
  const db = drizzle(client, { 
    schema: { 
      users: rthUsers, 
      userProfiles: rthUserProfiles, 
      roles: rthRoles, 
      userRoles: rthUserRoles 
    } 
  });

  try {
    console.log('🔍 Testing UserRepository.findByEmail logic...');

    const email = 'ajayshah@gmail.com';

    // Test 1: Direct query using drizzle query API (what the repo uses)
    console.log('\n1️⃣ Testing db.query.users.findFirst (Repository method):');
    
    try {
      const user = await db.query.users.findFirst({
        where: eq(rthUsers.email, email),
      });

      if (user) {
        console.log('✅ User found via query API');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password Hash: ${user.passwordHash ? 'EXISTS' : 'MISSING'}`);
      } else {
        console.log('❌ User NOT found via query API');
      }
    } catch (error) {
      console.log('❌ Query API failed:', error.message);
    }

    // Test 2: Direct select query
    console.log('\n2️⃣ Testing direct select query:');
    
    try {
      const users = await db.select().from(rthUsers).where(eq(rthUsers.email, email));
      
      if (users.length > 0) {
        console.log('✅ User found via select query');
        console.log(`   ID: ${users[0].id}`);
        console.log(`   Email: ${users[0].email}`);
        console.log(`   Password Hash: ${users[0].passwordHash ? 'EXISTS' : 'MISSING'}`);
      } else {
        console.log('❌ User NOT found via select query');
      }
    } catch (error) {
      console.log('❌ Select query failed:', error.message);
    }

    // Test 3: Test hydrateUserDetails logic
    console.log('\n3️⃣ Testing hydrateUserDetails logic:');
    
    try {
      const user = await db.query.users.findFirst({
        where: eq(rthUsers.email, email),
      });

      if (user) {
        // Get profile
        const profile = await db.query.userProfiles.findFirst({
          where: eq(rthUserProfiles.userId, user.id),
        });

        // Get roles
        const roleRows = await db
          .select({
            roleId: rthRoles.id,
            roleName: rthRoles.name,
          })
          .from(rthUserRoles)
          .innerJoin(rthRoles, eq(rthUserRoles.roleId, rthRoles.id))
          .where(eq(rthUserRoles.userId, user.id));

        const hydratedUser = {
          ...user,
          profile,
          userRoles: roleRows.map((roleRow) => ({
            roleId: roleRow.roleId,
            role: {
              id: roleRow.roleId,
              name: roleRow.roleName,
            },
          })),
        };

        console.log('✅ User hydration successful');
        console.log(`   Profile: ${profile ? 'EXISTS' : 'MISSING'}`);
        console.log(`   Roles: ${roleRows.length} found`);
        console.log(`   Role names: ${roleRows.map(r => r.roleName).join(', ')}`);
      }
    } catch (error) {
      console.log('❌ Hydration failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
  }
}

testRepository();