require('dotenv').config({ path: 'd:/onlinewebsites/quiz-platform/packages/db/.env' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnose() {
  try {
    // 1. Check user exists and status
    const userRes = await pool.query(`
      SELECT id, email, email_verified, is_blocked, password_hash, last_active_at 
      FROM users WHERE email = 'admin@test.com'
    `);
    console.log('=== USER RECORD ===');
    console.log(JSON.stringify(userRes.rows, null, 2));

    if (userRes.rows.length === 0) {
      console.log('USER NOT FOUND!');
      return;
    }

    const userId = userRes.rows[0].id;

    // 2. Check roles assigned
    const roleRes = await pool.query(`
      SELECT r.name as role_name, r.id as role_id
      FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = $1
    `, [userId]);
    console.log('\n=== ASSIGNED ROLES ===');
    console.log(JSON.stringify(roleRes.rows, null, 2));

    // 3. Check profile exists
    const profileRes = await pool.query(`
      SELECT id, name FROM user_profiles WHERE user_id = $1
    `, [userId]);
    console.log('\n=== PROFILE ===');
    console.log(JSON.stringify(profileRes.rows, null, 2));

    // 4. Check if account is locked
    const lockRes = await pool.query(`
      SELECT * FROM login_attempts WHERE ip IS NOT NULL 
      ORDER BY updated_at DESC LIMIT 5
    `);
    console.log('\n=== RECENT LOGIN ATTEMPTS ===');
    console.log(JSON.stringify(lockRes.rows, null, 2));

    // 5. Verify password hash matches admin123
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('admin123', userRes.rows[0].password_hash);
    console.log('\n=== PASSWORD CHECK ===');
    console.log('Password "admin123" matches hash:', match);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

diagnose();
