import { db, reports, users } from '../packages/db/src/index';
import { count, eq } from 'drizzle-orm';

const TARGET_EMAIL = 'ajayshah@gmail.com';

async function audit() {
  scriptLogger.info('--- Deep Audit: User Report Pipeline ---');
  
  // 1. Get User
  const user = await db.query.users.findFirst({
    where: eq(users.email, TARGET_EMAIL)
  });

  if (!user) {
    scriptLogger.error(`User ${TARGET_EMAIL} not found`);
    process.exit(1);
  }

  scriptLogger.info(`Auditing User: ${user.email} (${user.id})`);

  // 2. Status Summary
  const statusCounts = await db.select({
    status: reports.status,
    count: count()
  })
  .from(reports)
  .where(eq(reports.userId, user.id))
  .groupBy(reports.status);
  
  scriptLogger.info('\nStatus Breakdown:');
  console.table(statusCounts);
  
  // 3. Recent Failures
  const failures = await db.query.reports.findMany({
    where: (reports, { and, eq }) => and(eq(reports.status, 'failed'), eq(reports.userId, user.id)),
    limit: 10,
    orderBy: (reports, { desc }) => [desc(reports.updatedAt)]
  });
  
  if (failures.length > 0) {
    scriptLogger.info('\nRecent Failures:');
    failures.forEach(f => {
      scriptLogger.info(`- ${f.attemptId}: ${f.errorStage || 'Unknown error'}`);
    });
  }

  // 4. Stalled Generations (Generating for > 5 mins)
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const stalled = await db.query.reports.findMany({
    where: (reports, { and, eq, lt }) => and(
        eq(reports.status, 'generating'), 
        eq(reports.userId, user.id),
        lt(reports.updatedAt, fiveMinsAgo)
    ),
    limit: 10
  });

  if (stalled.length > 0) {
    scriptLogger.info('\nStalled Generations (>5 mins):');
    stalled.forEach(s => {
      scriptLogger.info(`- ${s.attemptId} (Last updated: ${s.updatedAt})`);
    });
  }

  process.exit(0);
}

audit().catch(err => {
  scriptLogger.error(err);
  process.exit(1);
});

