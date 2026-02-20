require('dotenv').config({ path: 'd:/onlinewebsites/quiz-platform/packages/db/.env' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    const res = await pool.query(
      `SELECT u.id, u.email, r.name as role 
       FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id 
       WHERE u.email = 'root@system.internal'`
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

verify();
