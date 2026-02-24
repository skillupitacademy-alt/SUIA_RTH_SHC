const { Client } = require('pg');
const fs = require('fs');

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (!match) {
        console.error('No DATABASE_URL in .env');
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
        const searchTerm = '%Ajay Shah%';
        const res = await client.query('SELECT u.email, p.name, u.id, u.is_blocked, u.deleted_at FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE p.name ILIKE $1', [searchTerm]);

        fs.writeFileSync('name_search.json', JSON.stringify(res.rows, null, 2));
        console.log(`Found ${res.rows.length} users matching "${searchTerm}"`);
        console.table(res.rows);

    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await client.end();
    }
}

main();
