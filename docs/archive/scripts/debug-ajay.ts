import { config } from 'dotenv';
config();

import { db, users, exams } from '../packages/db/src/index';
import { eq, count } from 'drizzle-orm';

const TARGET_EMAIL = 'ajayshah@gmail.com';

async function main() {
    scriptLogger.info(`[Diagnostic] Investigating visibility for: ${TARGET_EMAIL}`);

    // 1. Check User Existence
    const user = await db.query.users.findFirst({
        where: eq(users.email, TARGET_EMAIL)
    });

    if (!user) {
        scriptLogger.error(`ERROR: User ${TARGET_EMAIL} NOT FOUND in 'users' table.`);
        process.exit(1);
    }

    scriptLogger.info(`SUCCESS: User found. ID: ${user.id}`);

    // 2. Check Exam Records
    const examCounts = await db.select({
        status: exams.status,
        count: count()
    })
    .from(exams)
    .where(eq(exams.userId, user.id))
    .groupBy(exams.status);

    scriptLogger.info('\nExam Status Breakdown:');
    if (examCounts.length === 0) {
        scriptLogger.info('NO EXAM RECORDS FOUND for this user ID.');
    } else {
        console.table(examCounts);
    }

    // 3. Check for any 'orphaned' exams or type issues
    const sampleExams = await db.query.exams.findMany({
        where: eq(exams.userId, user.id),
        limit: 5,
        orderBy: (exams, { desc }) => [desc(exams.createdAt)]
    });

    if (sampleExams.length > 0) {
        scriptLogger.info('\nRecent Exam Samples:');
        sampleExams.forEach(e => {
            scriptLogger.info(`- ID: ${e.id} | Status: ${e.status} | Created: ${e.createdAt}`);
        });
    }

    process.exit(0);
}

main().catch(err => {
    scriptLogger.error(err);
    process.exit(1);
});

