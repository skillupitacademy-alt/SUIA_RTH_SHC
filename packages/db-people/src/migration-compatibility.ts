import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { Pool } from '@neondatabase/serverless';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const COMPATIBILITY_REVISION = 'people-0007-exact-objects-v1';
const PINNED = {
  '0005_people_perf_indexes': '283b7a351d43c0b185bd58b6c6f3bd0cc9e7867d61e41acac317e49a5e4a94e5',
  '0006_skillhubcore_subscription_schema': '4a582468d983f70ce7401787af16a854a74739b693f804eb3cae5da5ed1d5184',
  '0007_long_sentinels': 'ac832a23a2a42236bdd0326f72d0779b830188f8a5391b75638d6489634fc5b6',
};
const PINNED_TIMESTAMPS: Record<string, number> = {
  '0005_people_perf_indexes': 1774550945793,
  '0006_skillhubcore_subscription_schema': 1774591239501,
  '0007_long_sentinels': 1774935418558,
};
const objects = [
  { name: 'subscription_features_plan_id_subscription_plans_id_fk', table: 'subscription_features', column: 'plan_id', referenced: 'subscription_plans' },
  { name: 'user_features_cache_user_id_users_id_fk', table: 'user_features_cache', column: 'user_id', referenced: 'users' },
  { name: 'idx_subscription_features_plan', table: 'subscription_features', columns: ['plan_id', 'feature_key'], classes: ['uuid_ops', 'enum_ops'] },
  { name: 'idx_subscription_plans_active', table: 'subscription_plans', columns: ['is_active', 'name'], classes: ['bool_ops', 'text_ops'] },
  { name: 'idx_user_features_cache_user', table: 'user_features_cache', columns: ['user_id', 'cached_at'], classes: ['uuid_ops', 'timestamptz_ops'] },
  { name: 'idx_subscriptions_user_active', table: 'subscriptions', columns: ['user_id', 'status'], classes: ['uuid_ops', 'enum_ops'], predicate: "(status = 'active'::people_subscription_status)" },
  { name: 'idx_sso_sessions_family', table: 'sso_sessions', columns: ['jwt_family', 'revoked_at'], classes: ['text_ops', 'timestamptz_ops'] },
];
const digest = (text: string) => createHash('sha256').update(text).digest('hex');

function guardedStatement(object: typeof objects[number], original?: string): string {
  const identity = `'public.${object.table}'::regclass`;
  let exists: string;
  let equivalent: string;
  if (object.referenced !== undefined) {
    exists = `SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE connamespace='public'::regnamespace AND conname='${object.name}')`;
    equivalent = `SELECT count(*) = 1 AND bool_and(
      conrelid=${identity} AND contype='f' AND confrelid='public.${object.referenced}'::regclass
      AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=${identity} AND attname='${object.column}')]::smallint[]
      AND confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.${object.referenced}'::regclass AND attname='id')]::smallint[]
      AND confdeltype='c' AND confupdtype='a' AND confmatchtype='s'
      AND NOT condeferrable AND NOT condeferred AND convalidated
    ) FROM pg_constraint WHERE connamespace='public'::regnamespace AND conname='${object.name}'`;
  } else {
    const columns = object.columns ?? [];
    const classes = object.classes ?? [];
    const names = columns.map(column => `'${column}'`).join(',');
    const classNames = classes.map(name => `'${name}'`).join(',');
    const predicate = object.predicate === undefined ? 'i.indpred IS NULL' : `pg_get_expr(i.indpred,i.indrelid)='${object.predicate.replace(/'/g, "''")}'`;
    exists = `SELECT to_regclass('public.${object.name}') IS NOT NULL`;
    equivalent = `SELECT count(*)=1 AND bool_and(
      i.indrelid=${identity} AND c.relkind='i' AND am.amname='btree'
      AND i.indisvalid AND i.indisready AND i.indislive
      AND NOT i.indisunique AND NOT i.indisprimary AND NOT i.indisexclusion
      AND i.indnkeyatts=2 AND i.indnatts=2 AND i.indexprs IS NULL AND (${predicate})
      AND ARRAY(SELECT a.attname::text FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(num,ord)
        JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.num ORDER BY k.ord)=ARRAY[${names}]::text[]
      AND ARRAY(SELECT op.opcname::text FROM unnest(i.indclass::oid[]) WITH ORDINALITY cl(oid,ord)
        JOIN pg_opclass op ON op.oid=cl.oid WHERE op.opcnamespace='pg_catalog'::regnamespace AND op.opcdefault ORDER BY cl.ord)=ARRAY[${classNames}]::text[]
      AND NOT EXISTS(SELECT 1 FROM unnest(i.indoption::smallint[]) opt WHERE opt<>0)
      AND ARRAY(SELECT collation_oid FROM unnest(i.indcollation::oid[]) WITH ORDINALITY co(collation_oid,ord) ORDER BY ord)
        =ARRAY(SELECT a.attcollation FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(num,ord)
          JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.num ORDER BY k.ord)
    ) FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid JOIN pg_am am ON am.oid=c.relam
      WHERE c.relnamespace='public'::regnamespace AND c.relname='${object.name}'`;
  }
  return `DO $people_compat$
DECLARE present boolean; matches boolean; decision text;
BEGIN
  ${exists} INTO present;
  IF NOT present THEN
    ${original === undefined ? `RAISE EXCEPTION 'PeopleDB applied object missing: ${object.name}' USING ERRCODE='P0001';` : original.trim()}
    decision := 'created';
  ELSE
    decision := '${original === undefined ? 'validated_applied' : 'equivalent_existing'}';
  END IF;
  ${equivalent} INTO matches;
  IF matches IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'PeopleDB compatibility definition mismatch: ${object.name}' USING ERRCODE='P0001';
  END IF;
  RAISE NOTICE 'people-migration-compat:%', json_build_object('object','${object.name}','decision',decision)::text;
END $people_compat$;`;
}

export function preparePeopleMigrations(migrationsFolder: string) {
  const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder, 'meta/_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const migrations = readMigrationFiles({ migrationsFolder });
  for (const [tag, hash] of Object.entries(PINNED)) {
    const index = journal.entries.findIndex(entry => entry.tag === tag);
    if (index < 0 || migrations[index]?.hash !== hash || journal.entries[index]?.when !== PINNED_TIMESTAMPS[tag]) throw new Error(`PeopleDB pinned migration mismatch: ${tag}`);
  }
  let replacements = 0;
  const prepared = migrations.map((migration, index) => {
    const statements = journal.entries[index].tag === '0007_long_sentinels'
      ? migration.sql.map(statement => {
        const object = objects.find(candidate => statement.includes(`"${candidate.name}"`));
        if (object === undefined) return statement;
        replacements++;
        return guardedStatement(object, statement);
      })
      : migration.sql;
    return { ...migration, sql: statements, originalHash: migration.hash, executedHash: digest(statements.join('--> statement-breakpoint')), tag: journal.entries[index].tag };
  });
  if (replacements !== 7) throw new Error('PeopleDB compatibility statement count mismatch');
  if (prepared.some((migration, index) => index > 0 && migration.folderMillis <= prepared[index - 1].folderMillis)) {
    throw new Error('PeopleDB journal timestamps must be strictly increasing');
  }
  return prepared;
}

export async function migratePeople(pool: Pool, migrationsFolder: string) {
  const migrations = preparePeopleMigrations(migrationsFolder);
  const client = await pool.connect();
  const decisions: Array<{ object: string; decision: string }> = [];
  const notice = (message: { message?: string }) => {
    if (message.message?.startsWith('people-migration-compat:')) {
      decisions.push(JSON.parse(message.message.slice('people-migration-compat:'.length)) as { object: string; decision: string });
    }
  };
  client.on('notice', notice);
  let stage = 'ledger-preflight';
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL search_path=public; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='120s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('quiz.people.migrations.v1'))");
    await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await client.query('CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations(id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)');
    await client.query('LOCK TABLE drizzle.__drizzle_migrations IN EXCLUSIVE MODE');
    const applied = await client.query<{ hash: string; created_at: string }>('SELECT hash,created_at FROM drizzle.__drizzle_migrations ORDER BY created_at,id');
    for (const [index, row] of applied.rows.entries()) {
      if (migrations[index]?.originalHash !== row.hash || migrations[index]?.folderMillis !== Number(row.created_at)) {
        throw new Error('PeopleDB applied migration ledger does not match the source prefix');
      }
    }
    if (applied.rows.length >= 8) {
      stage = 'applied-object-validation';
      for (const object of objects) await client.query(guardedStatement(object));
    }
    const executed = [];
    for (const migration of migrations.slice(applied.rows.length)) {
      for (const [index, statement] of migration.sql.entries()) {
        stage = `${migration.tag}:${index}`;
        await client.query(statement);
      }
      await client.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)', [migration.originalHash, migration.folderMillis]);
      executed.push({ tag: migration.tag, originalHash: migration.originalHash, executedHash: migration.executedHash });
    }
    await client.query('COMMIT');
    return { compatibilityRevision: COMPATIBILITY_REVISION, committed: true, executed, decisions };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'MIGRATION_REJECTED';
    // Driver errors can retain connection credentials. Return only a safe code.
    throw new Error(`PeopleDB migration failed (${code}) at ${stage}; transaction rolled back`);
  } finally {
    client.removeListener('notice', notice);
    client.release();
  }
}
