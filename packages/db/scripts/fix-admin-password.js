require('dotenv').config({ path: 'd:/onlinewebsites/quiz-platform/packages/db/.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    try {
        // Generate correct hash for admin123
        const adminHash = await bcrypt.hash('admin123', 10);
        console.log('New hash for admin123:', adminHash);

        // Verify the new hash works
        const verify = await bcrypt.compare('admin123', adminHash);
        console.log('Verification:', verify);

        // Update admin@test.com
        const res = await pool.query(
            `UPDATE users SET password_hash = $1 WHERE email = 'admin@test.com' RETURNING email`,
            [adminHash]
        );
        console.log('Updated:', res.rows);

        // Also verify superadmin@test.com password
        const superRes = await pool.query(`SELECT password_hash FROM users WHERE email = 'superadmin@test.com'`);
        if (superRes.rows.length > 0) {
            const superMatch = await bcrypt.compare('super123', superRes.rows[0].password_hash);
            console.log('superadmin@test.com password "super123" matches:', superMatch);

            if (!superMatch) {
                const superHash = await bcrypt.hash('super123', 10);
                await pool.query(`UPDATE users SET password_hash = $1 WHERE email = 'superadmin@test.com'`, [superHash]);
                console.log('Fixed superadmin@test.com password too');
            }
        }

        console.log('DONE: All admin passwords fixed');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

fix();
