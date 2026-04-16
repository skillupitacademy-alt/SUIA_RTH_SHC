const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createTestUserProduction() {
  console.log('🔄 Creating test user in production RTH database...');
  
  const email = 'test.debug@realtutorialhub.com';
  const password = 'testing123';
  const name = 'Test Debug User';
  
  // Use production RTH database
  const dbUrl = process.env.DATABASE_URL_RTH;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL_RTH not found in environment variables');
    return;
  }
  
  console.log('🗄️ Connecting to production RTH database...');
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to production RTH database');

    // Check if user already exists
    const existingUserQuery = 'SELECT id, email FROM users WHERE email = $1';
    const existingResult = await client.query(existingUserQuery, [email]);
    
    if (existingResult.rows.length > 0) {
      console.log('⚠️ Test user already exists, updating password...');
      
      // Update existing user's password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = NOW() 
        WHERE email = $2
        RETURNING id, email
      `;
      
      const updateResult = await client.query(updateQuery, [passwordHash, email]);
      console.log(`✅ Updated existing user: ${updateResult.rows[0].email}`);
      
    } else {
      console.log('🆕 Creating new test user...');
      
      // Generate password hash
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      console.log(`🔐 Generated password hash: ${passwordHash.substring(0, 20)}...`);

      // Create new user
      const insertUserQuery = `
        INSERT INTO users (email, password_hash, email_verified, is_blocked, created_at, updated_at)
        VALUES ($1, $2, true, false, NOW(), NOW())
        RETURNING id, email
      `;
      
      const userResult = await client.query(insertUserQuery, [email, passwordHash]);
      const userId = userResult.rows[0].id;
      
      console.log(`✅ Created user: ${userResult.rows[0].email} (ID: ${userId})`);
      
      // Create user profile
      const insertProfileQuery = `
        INSERT INTO user_profiles (user_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING user_id, name
      `;
      
      const profileResult = await client.query(insertProfileQuery, [userId, name]);
      console.log(`✅ Created profile: ${profileResult.rows[0].name}`);
      
      // Assign user role
      const getRoleQuery = 'SELECT id FROM roles WHERE name = $1';
      const roleResult = await client.query(getRoleQuery, ['user']);
      
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        
        const insertUserRoleQuery = `
          INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          RETURNING user_id, role_id
        `;
        
        await client.query(insertUserRoleQuery, [userId, roleId]);
        console.log(`✅ Assigned 'user' role`);
      }
    }
    
    // Test password verification
    const verifyQuery = 'SELECT password_hash FROM users WHERE email = $1';
    const verifyResult = await client.query(verifyQuery, [email]);
    
    if (verifyResult.rows.length > 0) {
      const testResult = await bcrypt.compare(password, verifyResult.rows[0].password_hash);
      console.log(`🧪 Password verification test: ${testResult ? 'PASS' : 'FAIL'}`);
    }
    
    console.log('\n🔑 Test user credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ You can now test login with this user');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

createTestUserProduction();