const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { rootCertificates } = require('node:tls');
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
function save() { fs.writeFileSync(path.join(evidence, 'RECOVERY_REHEARSAL.json'), JSON.stringify(result, null, 2)); }
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
        const prior = (await control.query('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
        await control.query('CREATE DATABASE "' + sourceName + '"');
        resources.push({ database: sourceName, created: true });
        await control.query('CREATE DATABASE "' + restoreName + '"');
        resources.push({ database: restoreName, created: true });
        const schemaFile = path.join(work, 'schema.sql');
        command('pg_dump', ['--schema-only', '--no-owner', '--no-acl', '--file', schemaFile], 'people_prod');
        result.schemaDumpSha256 = checksum(schemaFile);
        command('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', schemaFile], sourceName);
        const fixture = await connect(sourceName);
        const a = crypto.randomUUID(), b = crypto.randomUUID();
        try {
            for (const entry of prior)
                await fixture.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)', [entry.hash, entry.created_at]);
            for (const [id, platform] of [[a, 'skillup'], [b, 'realtutorialhub']]) {
                await fixture.query('INSERT INTO users(id,email,password_hash,platform,external_id,external_brand) VALUES($1,$2,$3,$4,$5,$6)', [id, run + '@example.invalid', 'synthetic-inert-never-authenticates', platform, crypto.randomUUID(), platform]);
                await fixture.query('INSERT INTO platform_access(user_id,platform) VALUES($1,$2)', [id, platform]);
            }
            await fixture.query("INSERT INTO auth_audit_log(actor_id,action,platform,success,metadata) VALUES($1,'r6b_recovery_synthetic','skillup',true,$2::jsonb)", [a, JSON.stringify({ synthetic: true, run })]);
        }
        finally {
            await fixture.end();
        }
        result.before = await fingerprints(sourceName);
        if (result.before.users.count !== 2)
            throw new Error('Recovery source is not synthetic-only');
        const backup = path.join(work, 'synthetic.dump');
        command('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', backup], sourceName);
        result.backup = { sha256: checksum(backup), bytes: fs.statSync(backup).size, sourceRows: 2 };
        command('pg_restore', ['--no-owner', '--no-acl', '--exit-on-error', '--dbname', restoreName, backup], restoreName);
        result.after = await fingerprints(restoreName);
        result.fingerprintsMatch = JSON.stringify(result.before) === JSON.stringify(result.after);
        if (!result.fingerprintsMatch)
            throw new Error('Restored fingerprints differ');
        result.status = 'PASS';
    }
    catch (error) {
        result.status = 'FAIL';
        result.error = { code: error.code || error.name, message: error.message.replaceAll(url.password, '[REDACTED]') };
    }
    finally {
        for (const resource of resources.slice().reverse()) {
            try {
                if (!resource.database.startsWith(run + '_') || ![sourceName, restoreName].includes(resource.database))
                    throw new Error('Unowned cleanup target');
                await control.query('DROP DATABASE "' + resource.database + '" WITH (FORCE)');
                resource.deleted = true;
            }
            catch (error) {
                resource.cleanupError = { code: error.code || error.name, message: error.message };
            }
        }
        if (control) {
            result.remainingCreatedDatabases = (await control.query('SELECT datname FROM pg_database WHERE datname=ANY($1::text[])', [[sourceName, restoreName]])).rows;
            await control.end();
        }
        result.finished = new Date().toISOString();
        fs.rmSync(work, { recursive: true, force: true });
        result.localSyntheticBackupFilesRemoved = true;
        save();
        console.log(JSON.stringify({ status: result.status, error: result.error, fingerprintsMatch: result.fingerprintsMatch, resources: result.resources, remainingCreatedDatabases: result.remainingCreatedDatabases }, null, 2));
    }
}
main().catch(error => { console.error(error.name); process.exitCode = 1; });
