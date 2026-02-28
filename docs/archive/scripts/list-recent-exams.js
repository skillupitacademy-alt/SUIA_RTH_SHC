const { Client } = require('pg');
const fs = require('fs');

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
        const res = await client.query(`
            SELECT e.id, u.email, e.status, e.completed_at 
            FROM exams e 
            JOIN users u ON e.user_id = u.id 
            WHERE e.status = 'completed' 
            ORDER BY e.completed_at DESC 
            LIMIT 10
        `);

        fs.writeFileSync('recent_completed_exams.json', JSON.stringify(res.rows, null, 2));
        console.table(res.rows);

    } catch (err) {
        scriptLogger.error('Database Error:', err.message);
    } finally {
        await client.end();
    }
}

main();

