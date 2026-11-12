const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Pool, neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = require('ws');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'packages/db-tutorial/migrations');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
async function main() {
  const env = require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local')));
  const connectionString = env.DATABASE_DIRECT_URL_TUTORIAL || env.DATABASE_URL_TUTORIAL;
  const url = new URL(connectionString);
  if (hash(url.hostname + url.pathname).slice(0, 12) !== 'd69fe9af7c33') throw new Error('wrong target');
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
  const c = await pool.connect();
  let ledger;
  try {
    await c.query('BEGIN READ ONLY');
    await c.query("SET LOCAL statement_timeout='10s'");
    ledger = (await c.query('SELECT hash,created_at::text FROM drizzle.__drizzle_migrations ORDER BY created_at,id')).rows;
  } finally { await c.query('ROLLBACK'); c.release(); await pool.end(); }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
  const candidates = [];
  for (const f of files) {
    const b = fs.readFileSync(path.join(dir, f));
    const lf = b.toString().replace(/\r\n/g, '\n');
    for (const [format, contents] of [['working-tree', b], ['LF', lf], ['CRLF', lf.replace(/\n/g, '\r\n')]]) candidates.push({ file: f, format, hash: hash(contents) });
  }
  const otherSql = execFileSync('git', ['ls-files', '--', '*.sql'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim().split('\n').filter(Boolean);
  for (const relative of otherSql) {
    if (relative.startsWith('packages/db-tutorial/migrations/')) continue;
    const full = path.join(root, relative);
    if (!fs.existsSync(full) || fs.statSync(full).size > 2 * 1024 * 1024) continue;
    const b = fs.readFileSync(full);
    const lf = b.toString().replace(/\r\n/g, '\n');
    for (const [format, contents] of [['working-tree', b], ['LF', lf], ['CRLF', lf.replace(/\n/g, '\r\n')]]) candidates.push({ file: relative, format, hash: hash(contents) });
  }
  const journal = JSON.parse(fs.readFileSync(path.join(dir, 'meta/_journal.json'))).entries;
  const rows = ledger.map(r => ({ ...r, sourceMatches: candidates.filter(x => x.hash === r.hash), journalAtTimestamp: journal.filter(j => String(j.when) === r.created_at).map(j => j.tag) }));
  // Historical Git traversal is optional and bounded; current catalog reconciliation
  // never depends on fetching missing history or rewriting migration records.
  const unresolved = new Set(rows.filter(r => !r.sourceMatches.length).map(r => r.hash));
  for (const f of process.argv.includes('--scan-history') ? files : []) {
    if (!unresolved.size) break;
    const relative = `packages/db-tutorial/migrations/${f}`;
    const commits = execFileSync('git', ['log', '-n', '20', '--format=%H', '--', relative], { cwd: root, encoding: 'utf8', timeout: 15000, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' } }).trim().split('\n').filter(Boolean);
    for (const commit of commits) {
      let blob;
      try { blob = execFileSync('git', ['show', `${commit}:${relative}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { continue; }
      const text = blob.toString().replace(/\r\n/g, '\n');
      for (const contents of [blob, Buffer.from(text), Buffer.from(text.replace(/\n/g, '\r\n'))]) {
        const h = hash(contents);
        if (unresolved.has(h)) {
          const row = rows.find(r => r.hash === h);
          row.historicalMatch = { commit, file: f };
          unresolved.delete(h);
        }
      }
    }
  }
  const last = Math.max(...ledger.map(r => Number(r.created_at)));
  const report = { timestamp: new Date().toISOString(), boundary: 'Read-only database ledger and local Git hash provenance; no migration history altered.', targetFingerprint: 'd69fe9af7c33', rows,
    unmatchedHashes: [...unresolved],
    pendingByDrizzleTimestamp: journal.filter(j => j.when > last),
    timestampSkippedWithoutMatchingCurrentHash: journal.filter(j => j.when <= last && !ledger.some(r => candidates.some(x => x.file === `${j.tag}.sql` && x.hash === r.hash))).map(j => j.tag),
    manualProgressPatch: { path: 'packages/db-tutorial/src/migrations/manual/20261112_progress_tenant_empty_table.sql', hash: hash(fs.readFileSync(path.join(root, 'packages/db-tutorial/src/migrations/manual/20261112_progress_tenant_empty_table.sql'))), receipt: '.evidence/continuation-20261112/progress-tenant-execution.json' },
  };
  fs.writeFileSync(path.join(__dirname, 'migration-reconciliation.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ledgerEntries: ledger.length, currentSourceMatches: rows.filter(r => r.sourceMatches.length).length, historicalMatches: rows.filter(r => r.historicalMatch).length, unresolved: unresolved.size, pendingByDrizzleTimestamp: report.pendingByDrizzleTimestamp.map(j => j.tag) }));
}
main().catch(e => { console.error(JSON.stringify({ name: e.name, code: e.code })); process.exitCode = 1; });
