const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment from api-server since it has the DB URL
dotenv.config({ path: path.join(__dirname, '../../apps/api-server/.env.local') });

async function main() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        console.log("--- TABLE COUNTS ---");
        const tables = ['domains', 'subjects', 'topics', 'subtopics', 'questions', 'skills'];
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT count(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: ERROR - ${e.message}`);
            }
        }

    } catch (err) {
        console.error("CONNECTION ERROR:", err.message);
    } finally {
        await client.end();
    }
}
main();
