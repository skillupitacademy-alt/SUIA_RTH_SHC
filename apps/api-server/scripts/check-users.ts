
import { db } from '@quiz/db';
import { users } from '@quiz/db';
import { desc } from 'drizzle-orm';

async function main() {
  try {
    await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
  } catch (err) {
    console.error('Failed to query users', err);
  }
  process.exit(0);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
