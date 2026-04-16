const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

async function createTestUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    const email = 'test.login@realtutorialhub.com';
    const password = 'testing123';
    const name = 'Test Login User';

    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Test user already exists, updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 12);
      await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
      
      console.log(`✅ Updated password for ${email}`);
    } else {
      console.log('🔨 Creating new test user...');
      
      // Create new user
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);
      
      await client.query(`
        INSERT INTO users (id, email, password_hash, email_verified, is_blocked, created_at, updated_at)
        VALUES ($1, $2, $3, true, false, NOW(), NOW())
      `, [userId, email, passwordHash]);

      // Create user profile
      await client.query(`
        INSERT INTO user_profiles (id, user_id, name, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [uuidv4(), userId, name]);

      // Assign user role
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['user']);
      if (roleResult.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userId, roleResult.rows[0].id]);
      }

      console.log(`✅ Created test user: ${email}`);
    }

    console.log(`\n🔑 Test credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🧪 Test this login at: https://user.realtutorialhub.com/login`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();