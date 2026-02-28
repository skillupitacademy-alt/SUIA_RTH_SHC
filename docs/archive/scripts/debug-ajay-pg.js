const { Client } = require('pg');
const fs = require('fs');

async function auditUser(client, email) {
    scriptLogger.info(`\n--- Auditing: ${email} ---`);
    const results = {
        email,
        user: null,
        examStats: [],
        recentExams: []
    };

    const userRes = await client.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
        scriptLogger.info(`User ${email} NOT FOUND.`);
        results.error = 'User not found';
        return results;
    }

    const user = userRes.rows[0];
    results.user = user;
    scriptLogger.info(`User ID: ${user.id}`);

    const examCountRes = await client.query('SELECT status, COUNT(*) as count FROM exams WHERE user_id = $1 GROUP BY status', [user.id]);
    results.examStats = examCountRes.rows;
    console.table(examCountRes.rows);

    const lastExamsRes = await client.query('SELECT id, status, started_at FROM exams WHERE user_id = $1 ORDER BY started_at DESC LIMIT 5', [user.id]);
    results.recentExams = lastExamsRes.rows;
    lastExamsRes.rows.forEach(e => {
        scriptLogger.info(`- ${e.id} | ${e.status} | ${e.started_at}`);
    });

    return results;
}

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (!match) {
        scriptLogger.error('No DATABASE_URL in .env');
        process.exit(1);
    }
    const connectionString = match[1].replace(/\"/g, '').trim();

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        const ajayshah = await auditUser(client, 'ajayshah@gmail.com');
        const ajay_shah = await auditUser(client, 'ajay.shah@gmail.com');

        fs.writeFileSync('diag_ajay_comparison.json', JSON.stringify({ ajayshah, ajay_shah }, null, 2));
        scriptLogger.info('\nResults written to diag_ajay_comparison.json');

    } catch (err) {
        scriptLogger.error('Database Error:', err.message);
    } finally {
        await client.end();
    }
}

main();

