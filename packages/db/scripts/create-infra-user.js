require('dotenv').config({ path: 'd:/onlinewebsites/quiz-platform/packages/db/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        const userId = '00000000-0000-0000-0000-000000000010';
        const profileId = '00000000-0000-0000-0000-000000000011';
        const email = 'root@system.internal';
        const passwordHash = '$2b$10$DhgwlnUPMFlMUl8E0XQwOO4edD5.K3tNLS2ZdcgrEygsigodo7pQ.';

        console.log('Starting transaction...');
        await client.query('BEGIN');

        // 1. Ensure infrastructure role exists
        console.log('Ensuring infrastructure role exists...');
        await client.query(`
      INSERT INTO roles (name) 
      VALUES ('infrastructure') 
      ON CONFLICT (name) DO NOTHING
    `);

        // 2. Insert/Update User
        console.log(`Upserting user: ${email}...`);
        await client.query(`
      INSERT INTO users (id, email, password_hash, email_verified)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [userId, email, passwordHash]);

        // 3. User Profile
        console.log('Setting up user profile...');
        await client.query(`
      INSERT INTO user_profiles (id, user_id, name)
      SELECT $2, $1, 'Root Administrator'
      WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = $1)
    `, [userId, profileId]);

        // 4. Assign Role
        console.log('Assigning infrastructure role to user...');
        await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, id FROM roles 
      WHERE name = 'infrastructure'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = $1 
        AND role_id = (SELECT id FROM roles WHERE name = 'infrastructure')
      )
    `, [userId]);

        await client.query('COMMIT');
        console.log('DONE: Infrastructure user created successfully');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('ERROR during user creation:', e.message);
        console.error(e.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
