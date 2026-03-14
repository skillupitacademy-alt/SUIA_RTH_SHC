import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Load environment variables
const projectRoot = path.resolve(process.cwd());
dotenv.config({ path: path.join(projectRoot, 'apps/api-server/.env.local') });

async function audit() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("=== TARGETED DATABASE AUDIT FOR ajayshah@gmail.com ===");

        // 0. Find User ID
        const userRes = await pool.query("SELECT id FROM users WHERE email = 'ajayshah@gmail.com'");
        if (userRes.rows.length === 0) {
            console.error("User 'ajayshah@gmail.com' not found.");
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`Found User ID: ${userId}`);

        // 1. Stuck Exams Audit
        console.log("\n1. Checking for stuck exams (> 1 hour in non-terminal state)...");
        const stuckExams = await pool.query(`
            SELECT id, status, started_at 
            FROM exams 
            WHERE user_id = $1
            AND status IN ('started', 'processing') 
            AND started_at < NOW() - INTERVAL '1 hour'
        `, [userId]);
        console.log(`Found ${stuckExams.rows.length} stuck exams.`);
        stuckExams.rows.forEach(r => console.log(`  - Exam ${r.id} (Status: ${r.status}, Started: ${r.started_at})`));

        // 2. Completed Exams without Dimension Data
        console.log("\n2. Checking for completed exams missing dimension analytics...");
        const missingAnalytics = await pool.query(`
            SELECT e.id, e.completed_at
            FROM exams e
            LEFT JOIN results_by_dimension rbd ON e.id = rbd.exam_id
            WHERE e.user_id = $1
            AND e.status = 'completed'
            AND rbd.id IS NULL
        `, [userId]);
        console.log(`Found ${missingAnalytics.rows.length} completed exams missing analytics.`);
        missingAnalytics.rows.forEach(r => console.log(`  - Exam ${r.id} (Completed: ${r.completed_at})`));

        // 3. Score Consistency Audit
        console.log("\n3. Verifying score consistency (exams vs exam_questions)...");
        const scoreMismatches = await pool.query(`
            SELECT e.id, e.total_score, SUM(CASE WHEN eq.is_correct = true THEN 1 ELSE 0 END) as calculated_score
            FROM exams e
            JOIN exam_questions eq ON e.id = eq.exam_id
            WHERE e.user_id = $1
            AND e.status = 'completed'
            GROUP BY e.id, e.total_score
            HAVING e.total_score != SUM(CASE WHEN eq.is_correct = true THEN 1 ELSE 0 END)
        `, [userId]);
        console.log(`Found ${scoreMismatches.rows.length} score mismatches.`);
        scoreMismatches.rows.forEach(r => console.log(`  - Exam ${r.id} (DB Score: ${r.total_score}, Calculated: ${r.calculated_score})`));

        // 4. Stuck Report Jobs Audit
        console.log("\n4. Checking for stuck report generation jobs...");
        const stuckJobs = await pool.query(`
            SELECT id, exam_id, status, created_at, error_message
            FROM report_jobs
            WHERE user_id = $1
            AND status IN ('queued', 'processing')
            AND created_at < NOW() - INTERVAL '30 minutes'
        `, [userId]);
        console.log(`Found ${stuckJobs.rows.length} stuck report jobs.`);
        stuckJobs.rows.forEach(r => console.log(`  - Job ${r.id} (Exam: ${r.exam_id}, Status: ${r.status}, Created: ${r.created_at})`));

        // 5. Failed Reports Audit
        console.log("\n5. Checking for failed reports in 'reports' table...");
        const deepDive = await pool.query(`
            SELECT eq.id, eq.is_correct, eq.user_answer, q.question_text
            FROM exam_questions eq
            JOIN questions q ON eq.question_id = q.id
            WHERE eq.exam_id = '23987c38-dbce-4d68-b7bb-5df80b8caa5f'
        `);
        console.log(`Found ${deepDive.rows.length} total questions in exam_questions for this attempt.`);
        deepDive.rows.forEach(r => console.log(`  - [Correct: ${r.is_correct}] Ans: ${r.user_answer} | Q: ${r.question_text.substring(0, 50)}...`));
        const failedReports = await pool.query(`
            SELECT id, attempt_id, error_stage, updated_at
            FROM reports
            WHERE user_id = $1
            AND status = 'failed'
        `, [userId]);
        console.log(`Found ${failedReports.rows.length} failed report entries.`);
        failedReports.rows.forEach(r => console.log(`  - Report ${r.id} (Exam: ${r.attempt_id}, Stage: ${r.error_stage}, Failed At: ${r.updated_at})`));

        // 6. Recent Exams Summary
        console.log("\n6. Recent Exams for this user:");
        const recentExams = await pool.query(`
            SELECT id, status, total_score, completed_at
            FROM exams
            WHERE user_id = $1
            ORDER BY started_at DESC
            LIMIT 10
        `, [userId]);
        recentExams.rows.forEach(r => console.log(`  - Exam ${r.id} (Status: ${r.status}, Score: ${r.total_score}, Completed: ${r.completed_at})`));

        // 7. Global Check for any corruption (not just this user)
        console.log("\n7. Global Audit: Any recent completed exams missing analytics (across all users)?");
         const globalMissing = await pool.query(`
            SELECT e.id, e.user_id, e.completed_at
            FROM exams e
            LEFT JOIN results_by_dimension rbd ON e.id = rbd.exam_id
            WHERE e.status = 'completed'
            AND e.completed_at > NOW() - INTERVAL '2 days'
            AND rbd.id IS NULL
        `);
        console.log(`Found ${globalMissing.rows.length} recent completed exams missing analytics globally.`);
        globalMissing.rows.forEach(r => console.log(`  - Exam ${r.id} (User: ${r.user_id}, Completed: ${r.completed_at})`));

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        await pool.end();
    }
}

audit();
