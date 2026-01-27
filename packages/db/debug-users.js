const { neon } = require('@neondatabase/serverless');
const path = require('path');
const dotenv = require('dotenv');

// Load env from api-server .env.local
const envPath = path.resolve(__dirname, '../../apps/api-server/.env.local');
dotenv.config({ path: envPath });

async function debugUsers() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(dbUrl);

    try {
        console.log("--- DATABASE DIAGNOSTICS ---");

        console.log("\n1. Checking Users Table:");
        const users = await sql`SELECT id, email, password_hash, email_verified FROM users WHERE email IN ('admin@test.com', 'superadmin@test.com', 'user@test.com')`;
        console.table(users);

        if (users.length > 0) {
            console.log("\n2. Checking Roles for Found Users:");
            const userRoles = await sql`
                SELECT u.email, r.name as role_name 
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.email IN ('admin@test.com', 'superadmin@test.com', 'user@test.com')
            `;
            console.table(userRoles);
        }

        console.log("\n3. Checking All Available Roles:");
        const allRoles = await sql`SELECT * FROM roles`;
        console.table(allRoles);

    } catch (err) {
        console.error("Error:", err);
    }
}

debugUsers();
