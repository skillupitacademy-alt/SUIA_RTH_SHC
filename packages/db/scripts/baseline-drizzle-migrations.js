const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
const APPLY_MODE = process.argv.includes('--apply');

if (!DATABASE_URL) {
    console.error('[ERROR] DATABASE_URL environment variable is not set');
    process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta/_journal.json');

async function main() {
    console.log(`[INFO] Starting Drizzle Migration Baseline (${APPLY_MODE ? 'APPLY' : 'DRY RUN'} Mode)...`);

    // 1. Read Journal
    if (!fs.existsSync(JOURNAL_PATH)) {
        console.error(`[ERROR] Journal file not found at ${JOURNAL_PATH}`);
        process.exit(1);
    }

    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
    const entries = journal.entries;

    console.log(`[INFO] Found ${entries.length} migration entries in journal.`);

    // 2. Prepare Plan
    const plan = [];

    for (const entry of entries) {
        const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
        if (!fs.existsSync(sqlPath)) {
            console.error(`[ERROR] Migration file missing: ${sqlPath}`);
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');

        plan.push({
            id: entry.idx, // Not strictly used for insertion order reliance, but good for ref
            tag: entry.tag,
            created_at: entry.when, // folderMillis
            hash: hash
        });
    }

    // 3. Connect to DB
    const sql = neon(DATABASE_URL);

    try {
        // 4. Ensure Registry Exists
        if (APPLY_MODE) {
            await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
            await sql`
            CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            )
        `;
            console.log('[INFO] Ensured "drizzle.__drizzle_migrations" table exists.');
        }

        // Check if table exists (for dry run or apply verification)
        const tableCheck = await sql`SELECT to_regclass('drizzle.__drizzle_migrations') as reg`;
        const tableExists = !!tableCheck[0].reg;

        let existingRows = [];
        if (tableExists) {
            existingRows = await sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations`;
        } else {
            if (!APPLY_MODE) {
                console.log('[INFO] "drizzle.__drizzle_migrations" table does not exist (will be created in --apply mode).');
            }
        }

        // 5. Compare and Plan Inserts
        const toInsert = [];
        const existingSet = new Set(existingRows.map(r => `${r.hash}-${r.created_at}`));

        for (const item of plan) {
            const key = `${item.hash}-${item.created_at}`;
            if (!existingSet.has(key)) {
                toInsert.push(item);
            }
        }

        if (toInsert.length === 0) {
            console.log('[INFO] No new migrations to baseline. Registry is up to date.');
            return;
        }

        // 6. Execute or Print
        if (!APPLY_MODE) {
            console.log(`\n[PLAN] Would insert ${toInsert.length} rows into drizzle.__drizzle_migrations:`);
            toInsert.forEach((item, index) => {
                console.log(`  ${index + 1}. [${item.tag}]`);
                console.log(`     - Hash: ${item.hash}`);
                console.log(`     - Created At: ${item.created_at}`);
                console.log(`     - SQL: INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('${item.hash}', '${item.created_at}');`);
            });
            console.log('\n[INFO] Run with --apply to execute these changes.');
        } else {
            console.log(`\n[APPLY] Inserting ${toInsert.length} rows...`);

            // Direct execution (Neon HTTP driver doesn't support interactive transactions easily)
            for (const item of toInsert) {
                await sql`
              INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
              VALUES (${item.hash}, ${item.created_at})
            `;
                console.log(`  - Inserted: ${item.tag}`);
            }

            console.log('\n[SUCCESS] Baseline complete.');

            const finalRows = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
            console.log('[INFO] Current Registry State:');
            finalRows.forEach(r => console.log(`  [${r.id}] ${r.created_at} | ${r.hash}`));
        }

    } catch (error) {
        console.error('[ERROR] Database operation failed:', error);
        process.exit(1);
    }
}

main();
