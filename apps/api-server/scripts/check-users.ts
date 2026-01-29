
import { db } from '@quiz/db';
import { users } from '@quiz/db';
import { desc } from 'drizzle-orm';

async function main() {
  try {
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
  } catch (err) {
  }
  process.exit(0);
}

main();
