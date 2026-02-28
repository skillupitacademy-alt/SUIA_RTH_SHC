import fs from 'fs';
import { db, users, exams, reports } from '../packages/db/src/index';
import { eq, like, and } from 'drizzle-orm';

const VECTOR_IDS = [
  '0A38074C',
  '3683EF33',
  '376ADE43',
  'DAEFE3FE',
  '42E3D9E1',
  'E211B65E'
];

async function run() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (!match) throw new Error('No DATABASE_URL in .env');
    process.env.DATABASE_URL = match[1].replace(/\"/g, '').trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, 'ajayshah@gmail.com')
    });

    if (!user) {
      scriptLogger.info('User not found');
      return;
    }

    scriptLogger.info(`--- Diagnostics for User: ${user.email} ---`);

    for (const vectorId of VECTOR_IDS) {
      // Find exam starting with this ID
      const examMatch = await db.query.exams.findFirst({
        where: and(
            eq(exams.userId, user.id),
            like(exams.id, `${vectorId.toLowerCase()}%`)
        )
      });

      if (!examMatch) {
         scriptLogger.info(`Vector ${vectorId}: Exam ID not found`);
         continue;
      }

      // Check report status
      const report = await db.query.reports.findFirst({
        where: eq(reports.attemptId, examMatch.id)
      });

      scriptLogger.info(`Vector ${vectorId} (Attempt: ${examMatch.id}):`);
      scriptLogger.info(`  Exam Status: ${examMatch.status}`);
      scriptLogger.info(`  Report Status: ${report ? report.status : 'Not Queued'}`);
      if (report?.errorStage) {
          scriptLogger.info(`  Error: ${report.errorStage}`);
      }
      scriptLogger.info('---');
    }
  } catch (e) {
    scriptLogger.error(e);
  }
  process.exit(0);
}

run();

