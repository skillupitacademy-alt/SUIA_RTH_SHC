
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables in database:");
        res.rows.forEach(r => console.log(` - ${r.table_name}`));
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}
main();
