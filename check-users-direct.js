// Direct database check using the same connection strings from .env.local
const { Client } = require('pg');

// Database URLs from .env.local
const databases = {
  rth: 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/rth_prod?sslmode=require&channel_binding=require',
  skillup: 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require',
  quiz_platform: 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require&channel_binding=require'
};

const testUsers = [
  { email: 'ajayshah@gmail.com', expectedDb: 'rth' },
  { email: 'student@skillupitacademy.com', expectedDb: 'skillup' }
];

async function checkDatabase(dbName, dbUrl) {
  console.log(`\n🔍 Checking ${dbName.toUpperCase()} Database`);
  console.log(`Connection: ${dbUrl.split('@')[1].split('?')[0]}`);
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist');
      return { connected: true, hasUsersTable: false, users: [] };
    }
    
    console.log('✅ Users table exists');
    
    // Get all users
    const usersQuery = await client.query(`
      SELECT id, email, email_verified, is_blocked, created_at, deleted_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Total users found: ${usersQuery.rows.length}`);
    
    if (usersQuery.rows.length > 0) {
      console.log('👥 Recent users:');
      usersQuery.rows.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} (${user.id.substring(0, 8)}...) - Created: ${user.created_at.toISOString().split('T')[0]}`);
      });
    }
    
    // Check for our specific test users
    const testUserResults = [];
    for (const testUser of testUsers) {
      const userQuery = await client.query(`
        SELECT id, email, password_hash, email_verified, is_blocked, created_at, deleted_at
        FROM users 
        WHERE email = $1
      `, [testUser.email]);
      
      if (userQuery.rows.length > 0) {
        const user = userQuery.rows[0];
        console.log(`✅ Found test user: ${testUser.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email Verified: ${user.email_verified}`);
        console.log(`   Is Blocked: ${user.is_blocked}`);
        console.log(`   Deleted: ${user.deleted_at ? 'Yes' : 'No'}`);
        console.log(`   Password Hash: ${user.password_hash ? 'Present' : 'Missing'}`);
        
        testUserResults.push({
          email: testUser.email,
          found: true,
          user: user
        });
      } else {
        console.log(`❌ Test user not found: ${testUser.email}`);
        testUserResults.push({
          email: testUser.email,
          found: false
        });
      }
    }
    
    return { 
      connected: true, 
      hasUsersTable: true, 
      totalUsers: usersQuery.rows.length,
      users: usersQuery.rows,
      testUsers: testUserResults
    };
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return { connected: false, error: error.message };
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Direct Database User Check');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  const results = {};
  
  for (const [dbName, dbUrl] of Object.entries(databases)) {
    results[dbName] = await checkDatabase(dbName, dbUrl);
    
    // Wait a bit between connections
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY REPORT');
  console.log('='.repeat(60));
  
  // Check where each test user should be vs where they are
  for (const testUser of testUsers) {
    console.log(`\n👤 User: ${testUser.email}`);
    console.log(`   Expected in: ${testUser.expectedDb} database`);
    
    let foundIn = [];
    for (const [dbName, result] of Object.entries(results)) {
      if (result.testUsers) {
        const userResult = result.testUsers.find(u => u.email === testUser.email);
        if (userResult && userResult.found) {
          foundIn.push(dbName);
        }
      }
    }
    
    if (foundIn.length === 0) {
      console.log('   ❌ NOT FOUND in any database');
    } else if (foundIn.includes(testUser.expectedDb)) {
      console.log(`   ✅ Found in correct database: ${foundIn.join(', ')}`);
    } else {
      console.log(`   ⚠️  Found in wrong database: ${foundIn.join(', ')} (expected: ${testUser.expectedDb})`);
    }
  }
  
  console.log('\n🔍 DIAGNOSIS:');
  if (testUsers.every(user => {
    const foundIn = [];
    for (const [dbName, result] of Object.entries(results)) {
      if (result.testUsers) {
        const userResult = result.testUsers.find(u => u.email === user.email);
        if (userResult && userResult.found) {
          foundIn.push(dbName);
        }
      }
    }
    return foundIn.includes(user.expectedDb);
  })) {
    console.log('✅ All test users found in correct databases');
    console.log('🔍 Issue is likely in authentication logic or password verification');
  } else {
    console.log('❌ Test users missing or in wrong databases');
    console.log('🔍 Issue is likely in database setup or user migration');
  }
}

main().catch(console.error);