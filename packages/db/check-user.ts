const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../apps/api-server/.env.local') });

async function main() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        console.log("--- USER CHECK ---");
        const res = await client.query("SELECT id, email, name, role, \"isAdmin\" FROM users WHERE id::text LIKE 'RH-9012-AD' OR email LIKE '%RH-9012-AD%' OR name LIKE '%RH-9012-AD%'");
        if (res.rows.length === 0) {
            console.log("No user found with pattern RH-9012-AD");
            const allUsers = await client.query("SELECT id, email, role, \"isAdmin\" FROM users LIMIT 5");
            console.log("Sample users:", allUsers.rows);
        } else {
            console.log("User found:", res.rows);
        }

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
    }
}
main();
