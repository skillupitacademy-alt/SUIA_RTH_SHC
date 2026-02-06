const https = require('https');

const API_KEY = 'npg_y5iSrBlo4FMn';
const HOST = 'ep-round-cherry-a1ogr3gr.ap-southeast-1.aws.neon.tech';

async function runQuery(query) {
    const data = JSON.stringify({ query });

    const options = {
        hostname: HOST,
        port: 443,
        path: '/sql',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    resolve({ error: 'Failed to parse JSON', body });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log("--- 1. Searching Domains for 'FullStack' ---");
    const domains = await runQuery("SELECT id, name FROM domains WHERE name ILIKE '%FullStack%'");
    console.log("Domains:", JSON.stringify(domains, null, 2));

    console.log("\n--- 2. Searching Subjects for 'Front End' or 'JavaScript' ---");
    const subjects = await runQuery("SELECT id, name, domain_id FROM subjects WHERE name ILIKE '%Front%End%' OR name ILIKE '%JavaScript%'");
    console.log("Subjects:", JSON.stringify(subjects, null, 2));

    console.log("\n--- 3. Searching Topics for 'Front End' or 'JavaScript' ---");
    const topics = await runQuery("SELECT id, name, subject_id FROM topics WHERE name ILIKE '%Front%End%' OR name ILIKE '%JavaScript%'");
    console.log("Topics:", JSON.stringify(topics, null, 2));

    if (topics.rows && topics.rows.length > 0) {
        for (const topic of topics.rows) {
            console.log(`\n--- 4. Checking Subtopics for Topic: ${topic.name} (ID: ${topic.id}) ---`);
            const subtopics = await runQuery(`SELECT id, name FROM subtopics WHERE topic_id = '${topic.id}'`);
            console.log(`Subtopics for ${topic.name}:`, JSON.stringify(subtopics, null, 2));

            if (subtopics.rows && subtopics.rows.length > 0) {
                for (const sub of subtopics.rows) {
                    const countRes = await runQuery(`SELECT COUNT(*) as count FROM questions WHERE subtopic_id = '${sub.id}' AND status = 'active'`);
                    console.log(`  -> Subtopic: ${sub.name} (ID: ${sub.id}) - Active Questions: ${countRes.rows?.[0]?.count || 0}`);
                }
            }

            const topicCount = await runQuery(`SELECT COUNT(*) as count FROM questions WHERE topic_id = '${topic.id}' AND subtopic_id IS NULL AND status = 'active'`);
            console.log(`  -> Direct Topic Questions: ${topicCount.rows?.[0]?.count || 0}`);
        }
    }
}

main().catch(console.error);
