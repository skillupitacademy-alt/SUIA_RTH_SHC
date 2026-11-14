import fs from 'node:fs';
import path from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import WebSocket from 'ws';
import { migratePeople } from '../../packages/db-people/src/migration-compatibility';

neonConfig.webSocketConstructor = WebSocket;
const state = JSON.parse(fs.readFileSync('.local-secrets/r6-e2e-runtime.json', 'utf8'));
const target = new URL(state.databases.people);
if (target.hostname !== 'ep-fragrant-brook-a1mhx5dm.ap-southeast-1.aws.neon.tech' || !target.pathname.startsWith('/' + state.run + '_')) throw new Error('Unexpected disposable migration target');
const check = new PgPool({ connectionString: target.toString(), max: 1 });
const pool = new Pool({ connectionString: target.toString(), max: 1 });
check.on('error', () => undefined); pool.on('error', () => undefined);
try {
  const row = (await check.query("SELECT current_database() AS database,current_setting('neon.project_id') AS project,current_setting('neon.branch_id') AS branch")).rows[0];
  if (row.database !== target.pathname.slice(1) || row.project !== 'bitter-tree-18287476' || row.branch !== 'br-young-silence-a1b1ta26') throw new Error('Migration identity mismatch');
  const receipt = await migratePeople(pool, path.resolve('packages/db-people/migrations'));
  if (receipt.executed.map(r => r.tag).join(',') !== '0009_student_invitations,0010_normalized_platform_email') throw new Error('Unexpected pending migration batch');
  fs.writeFileSync('.evidence/r6-e2e/MIGRATION_RECEIPT.json', JSON.stringify({ target: row, receipt }, null, 2));
  console.log('Isolated 0009/0010 migration PASS');
} catch {
  console.error('Isolated migration failed; diagnostic sanitized'); process.exitCode = 1;
} finally { await pool.end(); await check.end(); }
