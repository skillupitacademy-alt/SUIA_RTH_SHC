const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("--- FINAL VERIFICATION ---");

        // Check topics columns
        const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'topics'");
        console.log("TOPICS_COLUMNS:", columns.rows.map(r => r.column_name).join(", "));

        // Check notifications table
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications'");
        console.log("NOTIFICATIONS_TABLE_EXISTS:", tables.rows.length > 0);

        // Action: Add columns if missing
        if (!columns.rows.some(r => r.column_name === 'learning_url')) {
            console.log("Adding learning_url...");
            await client.query('ALTER TABLE "topics" ADD COLUMN "learning_url" text');
        }
        if (!columns.rows.some(r => r.column_name === 'detailed_notes_path')) {
            console.log("Adding detailed_notes_path...");
            await client.query('ALTER TABLE "topics" ADD COLUMN "detailed_notes_path" text');
        }

        console.log("Phase 1 Surgical Fix Completed.");

    } catch (err) {
        console.error("DIAGNOSTIC_ERROR:", err.message);
    } finally {
        await client.end();
    }
}
main();
