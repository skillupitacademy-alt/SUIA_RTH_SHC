const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'migrations');
const journalPath = path.join(migrationsDir, 'meta', '_journal.json');

function fail(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(journalPath)) {
  fail(`Journal not found: ${journalPath}`);
}

const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
const entries = Array.isArray(journal.entries) ? journal.entries : [];

const expectedSql = entries.map((entry) => `${entry.tag}.sql`);
const expectedSet = new Set(expectedSql);

const rootFiles = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((item) => item.isFile())
  .map((item) => item.name);

const actualSql = rootFiles.filter((name) => name.endsWith('.sql')).sort();

const missing = expectedSql.filter((name) => !actualSql.includes(name));
const extras = actualSql.filter((name) => !expectedSet.has(name));

if (missing.length > 0) {
  fail(`Journal references missing migration SQL files: ${missing.join(', ')}`);
}

if (extras.length > 0) {
  fail(
    `Non-chain SQL files found in migrations root: ${extras.join(', ')}. Move them under migrations/manual/.`
  );
}

const seenIdx = new Set();
for (const entry of entries) {
  if (seenIdx.has(entry.idx)) {
    fail(`Duplicate journal idx detected: ${entry.idx}`);
  }
  seenIdx.add(entry.idx);
}

console.log(
  `[OK] Drizzle chain valid. Journal entries: ${entries.length}, SQL files in root: ${actualSql.length}.`
);
