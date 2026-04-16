const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    // List all users
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.is_blocked,
        u.email_verified,
        u.created_at,
        up.name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `;
    
    const users = await client.query(usersQuery);
    
    console.log('📋 Recent users in RTH database:');
    if (users.rows.length === 0) {
      console.log('  No users found');
    } else {
      users.rows.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} (${user.name || 'No name'})`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Blocked: ${user.is_blocked}`);
        console.log(`     Verified: ${user.email_verified}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

listUsers();