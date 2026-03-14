import { db } from '@quiz/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

Object.assign(globalThis, { WebSocket });

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api-server/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function cleanup() {
  console.log('🧹 Cleaning up ghost jobs...\n');

  // 1. Fix stale background_jobs stuck in 'pending' or 'processing'
  const staleJobs = await db.execute(sql`
    UPDATE background_jobs 
    SET status = 'failed', 
        result = '{"error": "Auto-cleaned: stale ghost job"}'::jsonb,
        updated_at = NOW()
    WHERE status IN ('pending', 'processing')
    AND updated_at < NOW() - INTERVAL '2 minutes'
    RETURNING id, status, type
  `);
  console.log(`✅ Cleaned ${staleJobs.rowCount ?? 0} stale background jobs`);

  // 2. Fix stale reports stuck in 'pending' or 'generating'
  const staleReports = await db.execute(sql`
    UPDATE reports 
    SET status = 'failed',
        error_stage = 'Auto-cleaned: stale ghost report',
        updated_at = NOW()
    WHERE status IN ('pending', 'generating')
    AND updated_at < NOW() - INTERVAL '2 minutes'
    RETURNING id, status
  `);
  console.log(`✅ Cleaned ${staleReports.rowCount ?? 0} stale report records`);

  console.log('\n🎉 Ghost job cleanup complete!');
  process.exit(0);
}

cleanup().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
