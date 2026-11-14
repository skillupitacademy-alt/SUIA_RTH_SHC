import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';

import '../drizzle.config';
import { migratePeople } from '../src/migration-compatibility';

neonConfig.webSocketConstructor = WebSocket;
const connectionString = process.env.DATABASE_DIRECT_URL_PEOPLE ?? process.env.DATABASE_URL_PEOPLE;
if (typeof connectionString !== 'string' || connectionString.trim() === '') {
  throw new Error('PeopleDB migration connection must be configured');
}
const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15000 });
pool.on('error', () => undefined);
try {
  const receipt = await migratePeople(pool, folder);
  if (process.env.PEOPLE_MIGRATION_RECEIPT) {
    fs.writeFileSync(process.env.PEOPLE_MIGRATION_RECEIPT, JSON.stringify(receipt, null, 2));
  }
  console.log(JSON.stringify(receipt));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'PeopleDB migration failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
