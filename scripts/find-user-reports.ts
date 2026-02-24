import fs from 'fs';
import { db, users, reports } from '../packages/db/src/index';
import { eq } from 'drizzle-orm';

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
      console.log('User not found');
      return;
    }

    const userReports = await db.query.reports.findMany({
      where: eq(reports.userId, user.id),
      limit: 20,
      orderBy: (r, { desc }) => [desc(r.updatedAt)]
    });

    console.log(JSON.stringify(userReports, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
