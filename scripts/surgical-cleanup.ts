import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Load environment variables
const projectRoot = path.resolve(process.cwd());
dotenv.config({ path: path.join(projectRoot, 'apps/api-server/.env.local') });

const CORRUPTED_EXAM_ID = '23987c38-dbce-4d68-b7bb-5df80b8caa5f';

async function cleanup() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log(`=== SURGICAL CLEANUP FOR EXAM: ${CORRUPTED_EXAM_ID} ===`);

        // Start transaction (manual SQL since we are using raw pool)
        await pool.query('BEGIN');

        console.log("Deleting associated data...");

        // 1. Delete from report_jobs
        const res1 = await pool.query('DELETE FROM report_jobs WHERE exam_id = $1', [CORRUPTED_EXAM_ID]);
        console.log(`- Deleted ${res1.rowCount} jobs from report_jobs`);

        // 2. Delete from reports
        const res2 = await pool.query('DELETE FROM reports WHERE attempt_id = $1', [CORRUPTED_EXAM_ID]);
        console.log(`- Deleted ${res2.rowCount} entries from reports`);

        // 3. Delete from results_by_dimension
        const res3 = await pool.query('DELETE FROM results_by_dimension WHERE exam_id = $1', [CORRUPTED_EXAM_ID]);
        console.log(`- Deleted ${res3.rowCount} analytics rows from results_by_dimension`);

        // 4. Delete from exam_questions
        const res4 = await pool.query('DELETE FROM exam_questions WHERE exam_id = $1', [CORRUPTED_EXAM_ID]);
        console.log(`- Deleted ${res4.rowCount} questions from exam_questions`);

        // 5. Delete from exams
        const res5 = await pool.query('DELETE FROM exams WHERE id = $1', [CORRUPTED_EXAM_ID]);
        console.log(`- Deleted ${res5.rowCount} records from exams`);

        if (res5.rowCount === 0) {
            console.log("WARNING: Exam record not found in 'exams' table.");
        }

        await pool.query('COMMIT');
        console.log("\nCleanup successfully committed.");

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Cleanup failed. Transaction rolled back.", err);
    } finally {
        await pool.end();
    }
}

cleanup();
