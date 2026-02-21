const https = require('https');

const connectionString = 'postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/quiz_platform_prod';

async function runQuery(query) {
    const data = JSON.stringify({ query });

    const options = {
        hostname: 'ep-round-cherry-a1ogr3gr.ap-southeast-1.aws.neon.tech',
        port: 443,
        path: '/sql',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer npg_y5iSrBlo4FMn',
            'Neon-Connection-String': connectionString,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const userEmail = 'ajayshah@gmail.com';
    console.log(`--- Investigating Data for User: ${userEmail} ---`);

    // 1. Get User ID
    const userResult = await runQuery(`SELECT id, name FROM users WHERE email = '${userEmail}'`);
    if (!userResult.rows || userResult.rows.length === 0) {
        console.log('User not found');
        return;
    }
    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].name;
    console.log(`USER_ID: ${userId} (${userName})`);

    // 2. Score History (Performance Trend)
    console.log('\n--- Fetching Performance Trend (Score History) ---');
    const scoreHistory = await runQuery(`
        SELECT 
            DATE(completed_at) as exam_date, 
            total_score 
        FROM exams 
        WHERE user_id = '${userId}' 
          AND status = 'completed' 
          AND total_score IS NOT NULL 
        ORDER BY completed_at ASC 
        LIMIT 10
    `);
    console.log('SCORE_HISTORY_DATA:', JSON.stringify(scoreHistory.rows, null, 2));

    // 3. Mastery Trend
    console.log('\n--- Fetching Mastery Trend ---');
    const masteryTrend = await runQuery(`
        SELECT 
            DATE(created_at) as exam_date, 
            AVG(accuracy) as avg_accuracy 
        FROM results_by_dimension 
        WHERE exam_id IN (SELECT id FROM exams WHERE user_id = '${userId}') 
        GROUP BY DATE(created_at) 
        ORDER BY exam_date ASC
    `);
    console.log('MASTERY_TREND_DATA:', JSON.stringify(masteryTrend.rows, null, 2));
}

main().catch(console.error);
