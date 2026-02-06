
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        console.log("--- SEARCHING FOR JAVASCRIPT HIERARCHY ---");

        // 1. Find the Domain
        const domains = await pool.query("SELECT id, name FROM domains WHERE name ILIKE '%FullStack%'");
        console.log(`Domains found: ${domains.rows.length}`);

        for (const domain of domains.rows) {
            console.log(`\nDOMAIN: ${domain.name} (${domain.id})`);

            // 2. Find Subjects
            const subjects = await pool.query("SELECT id, name FROM subjects WHERE domain_id = $1", [domain.id]);
            for (const subject of subjects.rows) {
                console.log(`  SUBJECT: ${subject.name} (${subject.id})`);

                // 3. Find Topics
                const topics = await pool.query("SELECT id, name FROM topics WHERE subject_id = $1", [subject.id]);
                for (const topic of topics.rows) {
                    console.log(`    TOPIC: ${topic.name} (${topic.id})`);

                    // 4. Count Questions in Topic
                    const qCount = await pool.query("SELECT COUNT(*) as count FROM questions WHERE topic_id = $1", [topic.id]);
                    console.log(`      Questions directly in Topic: ${qCount.rows[0].count}`);

                    // 5. Find Subtopics
                    const subtopics = await pool.query("SELECT id, name FROM subtopics WHERE topic_id = $1", [topic.id]);
                    for (const subtopic of subtopics.rows) {
                        const sqCount = await pool.query("SELECT COUNT(*) as count FROM questions WHERE subtopic_id = $1", [subtopic.id]);
                        console.log(`      -> SUBTOPIC: ${subtopic.name} (${subtopic.id}) - Questions: ${sqCount.rows[0].count}`);
                    }
                }
            }
        }

        console.log("\n--- GLOBAL SEARCH FOR 'JAVASCRIPT' TOPICS (Regardless of Domain) ---");
        const globalTopics = await pool.query("SELECT t.id, t.name, s.name as subject_name, d.name as domain_name FROM topics t JOIN subjects s ON t.subject_id = s.id JOIN domains d ON s.domain_id = d.id WHERE t.name ILIKE '%JavaScript%' OR s.name ILIKE '%JavaScript%'");
        for (const gt of globalTopics.rows) {
            const qCount = await pool.query("SELECT COUNT(*) as count FROM questions WHERE topic_id = $1", [gt.id]);
            console.log(`Found Topic: '${gt.name}' in Subject '${gt.subject_name}' (Domain: ${gt.domain_name}) -> Questions: ${qCount.rows[0].count}`);
        }

    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await pool.end();
    }
}

main();
