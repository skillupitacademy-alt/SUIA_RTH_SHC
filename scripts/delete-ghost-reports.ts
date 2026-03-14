import WebSocket from 'ws';
Object.assign(globalThis, { WebSocket });

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api-server/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { db } from '@quiz/db';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(
    sql`DELETE FROM reports WHERE status = 'failed' AND error_stage LIKE '%Auto-cleaned%' RETURNING id, status, error_stage`
  );
  console.log('Deleted', res.rowCount ?? 0, 'stale failed report(s)');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
