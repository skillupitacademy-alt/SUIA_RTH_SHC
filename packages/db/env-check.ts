
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from '@neondatabase/serverless';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
        console.log("DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 15));
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log("Attempting query...");
        const res = await pool.query("SELECT 1 as connected");
        console.log("Result:", res.rows[0]);
    } catch (err: unknown) {
        console.error("Query failed!");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
    } finally {
        await pool.end();
    }
}
main();
