import { db, exams, users } from '@quiz/db';
import { eq, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

// Neon serverless requires a WebSocket polyfill in Node.js
Object.assign(globalThis, { WebSocket });

// Load environment variables for local testing
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api-server/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'secret';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function triggerExport(examId: string, userId: string, format: string): Promise<string> {
  console.log(`\n🚀 Triggering ${format.toUpperCase()} export for exam ${examId}...`);
  // Note: We bypass CSRF by acting as internal/system if possible, or we might need to hit the internal route directly.
  // Actually, the export API expects standard web authentication. 
  // Let's use the internal queue processor or create a job directly if we can't bypass auth.
  // Wait, the API route POST /api/export/trigger requires auth. 
  // However, we can bypass this by instantiating ExportSaga directly if we run this locally against the production DB, 
  // or we need to hit production. If we hit production, we need a valid session token.
  
  // Since we want to test production, maybe we can just create the job directly in the DB 
  // and trigger the Upstash workflow via queueService or ExportSaga directly?
  // Let's just use the JobsService and ExportSaga programmatically!
  throw new Error("This script should run ExportSaga directly to bypass edge authentication for testing.");
}

async function runTest() {
  console.log('🔍 Finding a completed exam for ajayshah@gmail.com...');
  
  const userRows = await db.select().from(users).where(eq(users.email, 'ajayshah@gmail.com')).limit(1);
  if (userRows.length === 0) {
    console.error('❌ User not found');
    process.exit(1);
  }
  const userId = userRows[0].id;

  const examRows = await db.select()
    .from(exams)
    .where(eq(exams.userId, userId))
    .orderBy(desc(exams.startedAt));
    
  // Find completed exam
  const completedExam = examRows.find(e => e.status === 'completed');
  
  if (!completedExam) {
     console.error('❌ No completed exams found for this user.');
     process.exit(1);
  }

  const examId = completedExam.id;
  console.log(`✅ Found completed exam: ${examId}`);

  // We can import ExportSaga and JobsService to run the test
  // We will need tsx to run this.
  console.log('\nTo test in production, please use the web UI or run the following logic from a secure endpoint.');
  console.log('For this script, we will directly invoke the ExportSaga against the DB.');

  const { ExportSaga } = await import('../apps/api-server/src/lib/export/export.saga');
  const { JobsService } = await import('../apps/api-server/src/modules/system/jobs.service');

  const formats = ['pdf', 'json', 'csv'] as const;

  for (const format of formats) {
    console.log(`\n⏳ Initiating ${format.toUpperCase()} generation...`);
    try {
      // Start the saga
      const jobId = await JobsService.createJob({
        userId,
        type: 'EXPORT_SAGA' as any,
        payload: { examId, format }
      }).then(job => job.id);
      
      console.log(`   Job ID created: ${jobId}. Executing synchronously...`);

      // Execute synchronously
      await ExportSaga.execute(jobId, { examId, userId, format: format as any });
      
      // Wait a moment for DB updates
      await sleep(1000);
      const job = await JobsService.getJobStatus(jobId);
      
      if (job?.status === 'completed') {
         console.log(`✅ ${format.toUpperCase()} SUCCESS! Download URL: ${job.result?.downloadUrl}`);
      } else if (job?.status === 'failed') {
         console.error(`❌ ${format.toUpperCase()} FAILED: ${job.result?.error}`);
      } else {
         console.log(`⚠️ ${format.toUpperCase()} finished with status: ${job?.status}`);
      }

    } catch (err: any) {
      console.error(`❌ Error triggering ${format}: ${err.message}`);
    }
  }
  
  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
