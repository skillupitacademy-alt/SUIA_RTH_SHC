const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod?sslmode=require';

async function main() {
    const client = new Client({ connectionString });
    const userEmail = 'ajayshah@gmail.com';

    try {
        await client.connect();
        console.log(`--- Connected to DB. Investigating: ${userEmail} ---`);

        // 1. Get User ID
        const userRes = await client.query("SELECT id FROM users WHERE email = $1", [userEmail]);
        if (userRes.rows.length === 0) {
            console.log('User not found in quiz_platform_prod database.');

            // Helpful: list a few users to see what's there
            const someUsers = await client.query("SELECT email FROM users LIMIT 5");
            console.log('Sample users in DB:', someUsers.rows.map(r => r.email).join(', '));
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`USER_FOUND: ${userId}`);

        // 2. Performance Trend (Score History)
        // logic: last 10 completed exams, chronologically
        const scoreHistory = await client.query(`
            SELECT 
                DATE(completed_at) as exam_date, 
                total_score 
            FROM exams 
            WHERE user_id = $1 
              AND status = 'completed' 
              AND total_score IS NOT NULL 
            ORDER BY completed_at ASC 
            LIMIT 10
        `, [userId]);

        // 3. Mastery Trend (Daily Accuracy)
        // logic: average accuracy across all dimension results per day
        const masteryTrend = await client.query(`
            SELECT 
                DATE(created_at) as exam_date, 
                AVG(accuracy) as avg_accuracy 
            FROM results_by_dimension 
            WHERE exam_id IN (SELECT id FROM exams WHERE user_id = $1) 
            GROUP BY DATE(created_at) 
            ORDER BY exam_date ASC
        `, [userId]);

        console.log('\n--- PERFORMANCE_TREND_DATA (Score History) ---');
        console.table(scoreHistory.rows);

        console.log('\n--- MASTERY_TREND_DATA (Average Accuracy per Day) ---');
        console.table(masteryTrend.rows.map(r => ({ ...r, avg_accuracy: Math.round(r.avg_accuracy) + '%' })));

    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await client.end();
    }
}

main();
