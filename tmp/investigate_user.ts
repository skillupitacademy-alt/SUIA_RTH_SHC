
import { db, users, loginAttempts, auditLogs } from '@quiz/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api-server/.env.local') });

async function investigate() {
  const email = 'ajayshah@gmail.com';
  console.log(`Investigating user: ${email}`);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log('User not found.');
    return;
  }

  console.log('User found:', {
    id: user.id,
    isBlocked: user.isBlocked,
    lastActiveAt: user.lastActiveAt,
    updatedAt: user.updatedAt,
  });

  const attempts = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.userId, user.id),
  });

  if (attempts) {
    console.log('Login Attempts:', {
      attempts: attempts.attempts,
      lockedUntil: attempts.lockedUntil,
      updatedAt: attempts.updatedAt,
    });
  } else {
    console.log('No login attempts recorded.');
  }

  const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000);
  const logs = await db.query.auditLogs.findMany({
    where: and(
      eq(auditLogs.userId, user.id),
      gt(auditLogs.createdAt, thirtySixHoursAgo)
    ),
    orderBy: [desc(auditLogs.createdAt)],
  });

  console.log(`Audit Logs (last 36h): ${logs.length} entries`);
  logs.forEach(log => {
    console.log(`- ${log.createdAt.toISOString()}: ${log.action} | IP: ${log.ip} | Metadata: ${log.metadata}`);
  });
}

investigate().catch(console.error);
