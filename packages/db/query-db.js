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
    console.log("--- Checking Topics ---");
    const topics = await runQuery("SELECT id, name FROM topics WHERE name ILIKE '%Javascript%'");
    console.log("Topics found:", JSON.stringify(topics, null, 2));

    if (topics.rows && topics.rows.length > 0) {
        const topicId = topics.rows[0].id;
        console.log(`\n--- Checking Subtopics & Questions for Topic: ${topics.rows[0].name} (ID: ${topicId}) ---`);
        const results = await runQuery(`
      SELECT 
        st.name as subtopic_name, 
        COUNT(q.id) as question_count
      FROM subtopics st
      LEFT JOIN questions q ON st.id = q.subtopic_id
      WHERE st.topic_id = '${topicId}'
      GROUP BY st.name
      ORDER BY st.name;
    `);
        console.log("Results:", JSON.stringify(results, null, 2));
    } else {
        console.log("No topics matching 'Javascript' found. Searching for all topics (limit 20)...");
        const allTopics = await runQuery("SELECT name FROM topics LIMIT 20");
        console.log("Sample topics:", JSON.stringify(allTopics, null, 2));
    }
}

main().catch(console.error);
