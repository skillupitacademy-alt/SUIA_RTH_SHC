const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { rootCertificates } = require('node:tls');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const evidence = path.resolve('.evidence/r6-neon-qualification');
const url = new URL(process.env.R6_NEON_TEST_URL || '');
if (url.hostname !== 'ep-fragrant-brook-a1mhx5dm-pooler.ap-southeast-1.aws.neon.tech' || url.pathname !== '/people_prod')
    throw new Error('Explicit allowlisted test URL required');
url.hostname = url.hostname.replace('-pooler.', '.');
const run = 'r6b_recovery_' + crypto.randomBytes(5).toString('hex');
const sourceName = run + '_source';
const restoreName = run + '_restore';
const resources = [];
const result = { run, started: new Date().toISOString(), target: { project: 'bitter-tree-18287476', branch: 'br-young-silence-a1b1ta26' }, recoveryMethod: 'PostgreSQL pg_dump custom-format logical backup and pg_restore of a schema-matched synthetic-only database', commands: [], resources, status: 'RUNNING', limitations: ['No Neon snapshot/PITR operation executed', 'No shared database backup or restoration executed', 'Synthetic recovery database contains inherited schema definitions and only synthetic data plus copied migration hashes'] };
const work = fs.mkdtempSync(path.join(os.tmpdir(), run + '-'));
const certificateFile = path.join(work, 'trusted-public-roots.pem');
fs.writeFileSync(certificateFile, rootCertificates.join('\n'));
const checksum = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function save() { fs.writeFileSync(path.join(evidence, 'PENDING_UPGRADE_REHEARSAL.json'), JSON.stringify(result, null, 2)); }
async function connect(database) {
    const target = new URL(url);
    target.pathname = '/' + database;
    const client = new Client({ connectionString: target.toString(), connectionTimeoutMillis: 15000, statement_timeout: 30000, options: '-c search_path=public' });
    await client.connect();
    const row = (await client.query(`SELECT current_database() AS database,current_setting('neon.branch_id') AS branch,current_setting('neon.project_id') AS project`)).rows[0];
    if (row.database !== database || row.branch !== result.target.branch || row.project !== result.target.project) {
        await client.end();
        throw new Error('Unexpected recovery target');
    }
    return client;
}
function command(name, args, database) {
    const clients = JSON.parse(fs.readFileSync(path.join(evidence, 'CLIENT_UTILITIES.json'), 'utf8'));
    const env = { ...process.env, PGHOST: url.hostname, PGPORT: '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: database, PGSSLMODE: 'verify-full', PGSSLROOTCERT: certificateFile, PGCONNECT_TIMEOUT: '15', PGAPPNAME: 'r6b-disposable-recovery' };
    for (const key of Object.keys(env))
        if (/DATABASE_URL|UPSTASH|QSTASH|SMTP|RESEND|OPENAI|GEMINI/.test(key))
            delete env[key];
    const started = new Date().toISOString();
    const output = spawnSync(path.join(clients.clientDirectory, name + '.exe'), args, { env, windowsHide: true, encoding: 'utf8', timeout: 180000 });
    result.commands.push({ utility: name, args, database, started, finished: new Date().toISOString(), exitCode: output.status, stderr: output.stderr?.replaceAll(url.password, '[REDACTED]') });
    save();
    if (output.status !== 0)
        throw new Error('Recovery utility failed: ' + name);
    return output.stdout;
}
async function fingerprints(database) {
    const client = await connect(database);
    try {
        return {
            users: (await client.query(`SELECT md5(jsonb_agg(to_jsonb(u) ORDER BY id)::text) AS hash,count(*)::int AS count FROM users u`)).rows[0],
            grants: (await client.query(`SELECT md5(jsonb_agg(to_jsonb(p) ORDER BY id)::text) AS hash,count(*)::int AS count FROM platform_access p`)).rows[0],
            audit: (await client.query(`SELECT md5(jsonb_agg(to_jsonb(a) ORDER BY id)::text) AS hash,count(*)::int AS count FROM auth_audit_log a`)).rows[0],
            ledger: (await client.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows,
            indexes: (await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE tablename IN ('users','platform_access','student_invitations') ORDER BY indexname")).rows,
        };
    }
    finally {
        await client.end();
    }
}
async function main() {
    let control;
    try {
        control = await connect('people_prod');
        await control.query('CREATE DATABASE "' + sourceName + '"');
        resources.push({ database: sourceName, created: true });
        const schemaFile = path.join(work, 'schema.sql');
        command('pg_dump', ['--schema-only', '--no-owner', '--no-acl', '--file', schemaFile], 'people_prod');
        command('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', schemaFile], sourceName);
        const target = await connect(sourceName);
        try {
            // This is an empty, assignment-created schema fixture. Restore the inherited
            // pre-0009 schema shape and exact original ledger rows without replaying 0000-0008.
            await target.query('DROP TABLE public.student_invitations');
            await target.query('DROP INDEX public.uniq_users_email_platform');
            await target.query('ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE(email)');
            const baseline = JSON.parse(fs.readFileSync(path.join(evidence, 'MIGRATION_BASELINE.json'), 'utf8'));
            for (const row of baseline.initialLedger)
                await target.query('INSERT INTO drizzle.__drizzle_migrations(id,hash,created_at) VALUES($1,$2,$3)', [row.id, row.hash, row.created_at]);
            await target.query("SELECT setval(pg_get_serial_sequence('drizzle.__drizzle_migrations','id'),(SELECT max(id) FROM drizzle.__drizzle_migrations))");
            result.before = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
            const migrations = path.join(work, 'migrations');
            fs.mkdirSync(path.join(migrations, 'meta'), { recursive: true });
            const journal = JSON.parse(fs.readFileSync('packages/db-people/migrations/meta/_journal.json', 'utf8'));
            for (const entry of journal.entries)
                fs.copyFileSync('packages/db-people/migrations/' + entry.tag + '.sql', path.join(migrations, entry.tag + '.sql'));
            const candidate = fs.readFileSync(path.join(evidence, 'CANDIDATE_UNIQUENESS_REHEARSAL.sql'), 'utf8');
            fs.writeFileSync(path.join(migrations, '0010_r6b_disposable_candidate.sql'), candidate);
            const entry = { idx: 10, version: '7', when: 1794618000000, tag: '0010_r6b_disposable_candidate', breakpoints: true };
            fs.writeFileSync(path.join(migrations, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: [...journal.entries, entry] }));
            await migrate(drizzle(target), { migrationsFolder: migrations });
            result.after = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
            if (result.after.length !== result.before.length + 2 || JSON.stringify(result.after.slice(0, result.before.length)) !== JSON.stringify(result.before))
                throw Error('Upgrade ledger mismatch');
            await migrate(drizzle(target), { migrationsFolder: migrations });
            const repeat = (await target.query('SELECT id,hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
            result.repeatIdempotent = JSON.stringify(repeat) === JSON.stringify(result.after);
            if (!result.repeatIdempotent)
                throw Error('Repeat changed ledger');
            result.indexes = (await target.query("SELECT indexname,indexdef FROM pg_indexes WHERE tablename IN ('users','student_invitations') ORDER BY indexname")).rows;
            result.status = 'PASS';
            result.mode = 'Normal Drizzle pending upgrade against a schema-matched pre-0009 fixture with exact inherited ledger; fresh historical replay is separately failed';
        }
        finally {
            await target.end();
        }
    }
    catch (error) {
        result.status = 'FAIL';
        result.error = { code: error.code || error.cause?.code || error.name, message: error.message.replaceAll(url.password, '[REDACTED]') };
    }
    finally {
        for (const resource of resources.slice().reverse()) {
            try {
                if (!resource.database.startsWith(run + '_'))
                    throw Error('Unowned cleanup');
                await control.query('DROP DATABASE "' + resource.database + '" WITH (FORCE)');
                resource.deleted = true;
            }
            catch (error) {
                resource.cleanupError = { code: error.code || error.name };
            }
        }
        if (control) {
            result.remainingCreatedDatabases = (await control.query('SELECT datname FROM pg_database WHERE datname=ANY($1::text[])', [[sourceName, restoreName]])).rows;
            await control.end();
        }
        result.finished = new Date().toISOString();
        fs.rmSync(work, { recursive: true, force: true });
        result.recoveryMethod = undefined;
        result.limitations = ['Fresh historical migration replay failed separately with SQLSTATE 42710'];
        save();
        console.log(JSON.stringify({ status: result.status, error: result.error, repeatIdempotent: result.repeatIdempotent, resources: result.resources }));
    }
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
