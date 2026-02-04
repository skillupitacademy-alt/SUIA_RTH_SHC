const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkMigrations() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        const res = await client.query('SELECT * FROM "__drizzle_migrations"');
        console.log('Applied Migrations:', res.rows);
    } catch (e) {
        console.error('Error fetching migrations:', e.message);
    } finally {
        await client.end();
    }
}

checkMigrations();
