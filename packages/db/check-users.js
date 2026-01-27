const { neon } = require('@neondatabase/serverless');
const path = require('path');
const dotenv = require('dotenv');

// Load env from api-server .env.local where the Neon URL is likely stored
const envPath = path.resolve(__dirname, '../../apps/api-server/.env.local');
dotenv.config({ path: envPath });

async function checkUsers() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL not found in " + envPath);
        process.exit(1);
    }

    console.log("Connecting to:", dbUrl.replace(/:[^:@]+@/, ':***@')); // Hide password in logs

    const sql = neon(dbUrl);

    try {
        console.log("Searching for any user with 'quizplatform' in email...");
        const result = await sql`
            SELECT u.email, r.name as role_name, u.email_verified 
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.email LIKE '%quizplatform%'
        `;

        if (result.length === 0) {
            console.log("No admin users found.");
        } else {
            console.log("Found Admin Users:");
            console.table(result);
        }
    } catch (err) {
        console.error("Error querying database:", err);
    }
}

checkUsers();
