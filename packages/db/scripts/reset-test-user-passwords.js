const path = require('path');
const fs = require('fs');

const envCandidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', 'apps', 'api-server', '.env.local'),
    path.join(__dirname, '..', '..', '..', '.env.local'),
];

for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath, override: true });
        break;
    }
}
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TARGETS = [
    { email: 'k6-test@loadtest.example.com', password: 'K6Test!234' },
    { email: 'k6-lockout@loadtest.example.com', password: 'K6Lockout!234' },
    { email: 'ajayshah@gmail.com', password: 'AjayReset!234' },
];

async function run() {
    try {
        await pool.query('SELECT 1');
        const updates = [];

        for (const target of TARGETS) {
            const passwordHash = await bcrypt.hash(target.password, 12);
            const result = await pool.query(
                `
                UPDATE users
                SET password_hash = $1
                WHERE email = $2
                RETURNING email
                `,
                [passwordHash, target.email]
            );

            if (result.rowCount === 0) {
                console.log(`Skipped missing user: ${target.email}`);
                continue;
            }

            updates.push({
                email: target.email,
                password: target.password,
            });
        }

        if (updates.length === 0) {
            console.log('No matching users were updated.');
            return;
        }

        console.log('Updated users:');
        for (const item of updates) {
            console.log(`- ${item.email}: ${item.password}`);
        }
        console.log('Passwords were stored as bcrypt hashes only.');
    } catch (error) {
        console.error('Error resetting passwords:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
