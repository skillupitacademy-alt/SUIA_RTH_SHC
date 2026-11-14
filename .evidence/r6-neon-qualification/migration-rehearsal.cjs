const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const evidence = path.resolve('.evidence/r6-neon-qualification');
const url = new URL(process.env.R6_NEON_TEST_URL || '');
if (url.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || url.pathname !== '/people_prod')
    throw Error('Wrong target');
url.hostname = url.hostname.replace('-pooler.', '.');
const database = 'r6b_migrate_' + crypto.randomBytes(5).toString('hex');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), database + '-'));
const pools = [];
let control;
const result = { database, target: { branchId: 'br-young-silence-a1b1ta26', projectId: 'bitter-tree-18287476' }, started: new Date().toISOString(), status: 'RUNNING', normalDrizzleMigrator: true };
async function connect(name) { const target = new URL(url); target.pathname = '/' + name; const pool = new Pool({ connectionString: target.toString(), options: '-c search_path=public', max: 1, statement_timeout: 30000 }); pools.push(pool); const id = (await pool.query("SELECT current_database() AS database,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project")).rows[0]; if (id.database !== name || id.branch !== result.target.branchId || id.project !== result.target.projectId)
    throw Error('Migration isolation mismatch'); return pool; }
(async () => {
    let created = false;
    try {
        control = await connect('people_prod');
        await control.query('CREATE DATABASE "' + database + '"');
        created = true;
        const target = await connect(database);
        const db = drizzle(target);
        const journal = JSON.parse(fs.readFileSync('packages/db-people/migrations/meta/_journal.json', 'utf8'));
        fs.mkdirSync(path.join(folder, 'meta'));
        for (const entry of journal.entries)
            fs.copyFileSync('packages/db-people/migrations/' + entry.tag + '.sql', path.join(folder, entry.tag + '.sql'));
        fs.writeFileSync(path.join(folder, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: journal.entries.filter(entry => entry.idx < 9) }));
        await migrate(db, { migrationsFolder: folder });
        result.before9 = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
        if (result.before9.length !== 9)
            throw Error('Unexpected pre-0009 count');
        if ((await target.query("SELECT to_regclass('public.student_invitations') AS table")).rows[0].table !== null)
            throw Error('0009 unexpectedly present');
        const candidate = fs.readFileSync(path.join(evidence, 'CANDIDATE_UNIQUENESS_REHEARSAL.sql'), 'utf8');
        fs.writeFileSync(path.join(folder, '0010_r6b_disposable_candidate.sql'), candidate);
        const entry = { idx: 10, version: '7', when: 1794618000000, tag: '0010_r6b_disposable_candidate', breakpoints: true };
        fs.writeFileSync(path.join(folder, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: [...journal.entries, entry] }));
        await migrate(db, { migrationsFolder: folder });
        result.after = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
        if (result.after.length !== 11)
            throw Error('Unexpected final ledger count');
        if (!((await target.query("SELECT to_regclass('public.student_invitations') AS table")).rows[0].table))
            throw Error('0009 absent after migration');
        if (!((await target.query("SELECT to_regclass('public.uniq_users_email_platform') AS index")).rows[0].index))
            throw Error('Candidate index absent');
        await migrate(db, { migrationsFolder: folder });
        const replay = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
        if (JSON.stringify(replay) !== JSON.stringify(result.after))
            throw Error('Repeat changed ledger');
        result.repeatIdempotent = true;
        result.status = 'PASS';
    }
    catch (error) {
        result.status = 'FAIL';
        result.error = { code: error.code || error.cause?.code || error.name, message: error.message.replaceAll(decodeURIComponent(url.password), '[REDACTED]') };
    }
    finally {
        for (const p of pools.filter(pool => pool !== control))
            await p.end().catch(() => { });
        if (created && control) {
            await control.query('DROP DATABASE "' + database + '" WITH (FORCE)');
            result.createdDatabaseDeleted = true;
            result.remainingCreatedDatabases = (await control.query('SELECT datname FROM pg_database WHERE datname=$1', [database])).rows;
        }
        await control?.end();
        fs.rmSync(folder, { recursive: true, force: true });
        result.finished = new Date().toISOString();
        fs.writeFileSync(path.join(evidence, 'NORMAL_MIGRATOR_REHEARSAL.json'), JSON.stringify(result, null, 2));
        console.log(JSON.stringify({ status: result.status, error: result.error, createdDatabaseDeleted: result.createdDatabaseDeleted, repeatIdempotent: result.repeatIdempotent }));
    }
})().catch(error => { console.error(error.name); process.exitCode = 1; });
