const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { neon } = require('@neondatabase/serverless');
const { envPath } = require('../../config/envPaths.js');

const APPLY_MODE = process.argv.includes('--apply');

const candidateEnvPaths = [
  envPath('apps/api-server/.env.local'),
  envPath('apps/api-server/.env'),
  envPath('packages/db/.env.local'),
  envPath('packages/db/.env'),
  envPath('.env.local'),
  envPath('.env'),
];

for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL environment variable is not set');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta/_journal.json');

function computeJournalPlan() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    throw new Error(`Journal file not found at ${JOURNAL_PATH}`);
  }

  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
  const entries = journal.entries ?? [];

  return entries.map((entry) => {
    const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file missing: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');

    return {
      tag: entry.tag,
      idx: entry.idx,
      created_at: String(entry.when),
      hash,
    };
  });
}

async function ensureRegistry(sql) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

async function main() {
  console.log(`[INFO] Starting Drizzle Migration Baseline (${APPLY_MODE ? 'APPLY' : 'DRY RUN'} Mode)...`);

  const plan = computeJournalPlan();
  console.log(`[INFO] Found ${plan.length} migration entries in journal.`);

  const sql = neon(DATABASE_URL);

  if (APPLY_MODE) {
    await ensureRegistry(sql);
    console.log('[INFO] Ensured "drizzle.__drizzle_migrations" exists.');
  }

  const tableCheck = await sql`SELECT to_regclass('drizzle.__drizzle_migrations') as reg`;
  if (!tableCheck[0]?.reg) {
    console.log('[INFO] Migration registry missing. Run with --apply to create and baseline it.');
    return;
  }

  const existingRows = await sql`
    SELECT id, hash, created_at::text as created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at, id
  `;

  const existingByCreatedAt = new Map();
  for (const row of existingRows) {
    if (!existingByCreatedAt.has(row.created_at)) {
      existingByCreatedAt.set(row.created_at, row);
    }
  }

  const toInsert = [];
  const toUpdate = [];

  for (const expected of plan) {
    const current = existingByCreatedAt.get(expected.created_at);
    if (!current) {
      toInsert.push(expected);
      continue;
    }

    if (current.hash !== expected.hash) {
      toUpdate.push({
        id: current.id,
        created_at: expected.created_at,
        fromHash: current.hash,
        toHash: expected.hash,
        tag: expected.tag,
      });
    }
  }

  const knownCreatedAt = new Set(plan.map((p) => p.created_at));
  const extras = existingRows.filter((row) => !knownCreatedAt.has(row.created_at));

  if (toInsert.length === 0 && toUpdate.length === 0 && extras.length === 0) {
    console.log('[INFO] Registry already in sync with journal.');
    return;
  }

  if (toInsert.length > 0) {
    console.log(`\n[PLAN] Missing entries to insert (${toInsert.length}):`);
    for (const item of toInsert) {
      console.log(`  - ${item.tag} (${item.created_at})`);
    }
  }

  if (toUpdate.length > 0) {
    console.log(`\n[PLAN] Hash mismatches to update (${toUpdate.length}):`);
    for (const item of toUpdate) {
      console.log(`  - ${item.tag} (${item.created_at})`);
      console.log(`    from: ${item.fromHash}`);
      console.log(`    to  : ${item.toHash}`);
    }
  }

  if (extras.length > 0) {
    console.log(`\n[INFO] Extra ledger rows not present in journal (${extras.length}):`);
    for (const row of extras) {
      console.log(`  - id=${row.id}, created_at=${row.created_at}, hash=${row.hash}`);
    }
  }

  if (!APPLY_MODE) {
    console.log('\n[INFO] Dry run complete. Re-run with --apply to reconcile ledger metadata.');
    return;
  }

  for (const item of toUpdate) {
    await sql`
      UPDATE drizzle.__drizzle_migrations
      SET hash = ${item.toHash}
      WHERE id = ${item.id}
    `;
    console.log(`  [APPLY] Updated hash for ${item.tag}`);
  }

  for (const item of toInsert) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${item.hash}, ${item.created_at})
    `;
    console.log(`  [APPLY] Inserted ${item.tag}`);
  }

  console.log('\n[SUCCESS] Ledger reconciliation complete.');
}

main().catch((error) => {
  console.error('[ERROR] Database operation failed:', error);
  process.exit(1);
});
