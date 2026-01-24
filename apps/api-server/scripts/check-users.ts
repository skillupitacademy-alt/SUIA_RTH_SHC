
import { db } from '@quiz/db';
import { users } from '@quiz/db';
import { desc } from 'drizzle-orm';

async function main() {
  console.log('Checking users in DB...');
  try {
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
    console.log('Recent users:', recentUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
  }
  process.exit(0);
}

main();
