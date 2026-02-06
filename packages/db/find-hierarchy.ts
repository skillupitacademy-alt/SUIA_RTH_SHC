import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log("🔍 Detailed database analysis...");
    
    try {
        // 1. List ALL Domains
        const allDomains = await sql`SELECT id, name FROM domains`;
        console.log(`\n--- All Domains (${allDomains.length}) ---`);
        console.table(allDomains);

        // 2. Find JavaScript-related topics
        const topics = await sql`SELECT id, name, subject_id FROM topics WHERE name ILIKE '%JavaScript%'`;
        console.log(`\n--- JavaScript Topics found (${topics.length}) ---`);

        for (const topic of topics) {
            console.log(`\nTopic: ${topic.name} (ID: ${topic.id})`);
            
            // Get subtopics
            const subs = await sql`SELECT id, name FROM subtopics WHERE topic_id = ${topic.id}`;
            
            for (const sub of subs) {
                const diffCounts = await sql`
                    SELECT difficulty, COUNT(*) as count 
                    FROM questions 
                    WHERE subtopic_id = ${sub.id} AND status = 'active' 
                    GROUP BY difficulty
                `;
                
                let simple = 0, intermediate = 0, expert = 0;
                diffCounts.forEach(r => {
                    if (r.difficulty === 'simple') simple = parseInt(r.count);
                    if (r.difficulty === 'intermediate') intermediate = parseInt(r.count);
                    if (r.difficulty === 'expert') expert = parseInt(r.count);
                });
                
                console.log(`  -> Subtopic: ${sub.name} (ID: ${sub.id})`);
                console.log(`     Counts: Simple: ${simple}, Intermediate: ${intermediate}, Expert: ${expert} | Total: ${simple + intermediate + expert}`);
            }
            
            // Direct topic count
            const topicDiffCounts = await sql`
                SELECT difficulty, COUNT(*) as count 
                FROM questions 
                WHERE topic_id = ${topic.id} AND subtopic_id IS NULL AND status = 'active'
                GROUP BY difficulty
            `;
            console.log(`  -> Direct Topic Questions:`, JSON.stringify(topicDiffCounts));
        }
    } catch (error) {
        console.error("❌ Database query failed:", error);
    }
}

main().catch(console.error);
