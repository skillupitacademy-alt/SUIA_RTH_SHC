
const { db, exams, examBlueprints, users } = require('@quiz/db');
const { eq } = require('drizzle-orm');

async function debugInsert() {
    console.log('--- Debugging Exams Insert ---');

    // 1. Get a test user
    const user = await db.query.users.findFirst();
    if (!user) {
        console.error('No users found in DB');
        return;
    }
    console.log('Using User:', user.id);

    try {
        const [exam] = await db.insert(exams).values({
            userId: user.id,
            status: 'started',
            totalScore: 0,
        }).returning();

        console.log('Inserted Exam:', JSON.stringify(exam, null, 2));

        if (exam && exam.id) {
            console.log('SUCCESS: exam.id is', exam.id);
        } else {
            console.log('FAILURE: exam.id is', exam?.id);
        }

        // Cleanup
        await db.delete(exams).where(eq(exams.id, exam.id));
        console.log('Cleanup complete');

    } catch (err) {
        console.error('Insert failed:', err);
    }
}

debugInsert().then(() => process.exit(0));
