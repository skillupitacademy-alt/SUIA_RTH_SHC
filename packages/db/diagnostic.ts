
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        console.log("--- SEARCHING FOR JAVASCRIPT HIERARCHY ---");
        
        const domainsRes = await pool.query("SELECT id, name FROM domains WHERE name ILIKE '%FullStack%'");
        console.log(`Domains found: ${domainsRes.rows.length}`);
        
        for (const domain of domainsRes.rows) {
            console.log(`\nDOMAIN: ${domain.name} (${domain.id})`);
            
            const subjectsRes = await pool.query("SELECT id, name FROM subjects WHERE domain_id = $1", [domain.id]);
            for (const subject of subjectsRes.rows) {
                console.log(`  SUBJECT: ${subject.name} (${subject.id})`);
                
                const topicsRes = await pool.query("SELECT id, name FROM topics WHERE subject_id = $1", [subject.id]);
                for (const topic of topicsRes.rows) {
                    console.log(`    TOPIC: ${topic.name} (${topic.id})`);
                    
                    const qCountRes = await pool.query("SELECT COUNT(*) as count FROM questions WHERE topic_id = $1", [topic.id]);
                    console.log(`      Questions directly in Topic: ${qCountRes.rows[0].count}`);
                    
                    const subtopicsRes = await pool.query("SELECT id, name FROM subtopics WHERE topic_id = $1", [topic.id]);
                    for (const subtopic of subtopicsRes.rows) {
                        const sqCountRes = await pool.query("SELECT COUNT(*) as count FROM questions WHERE subtopic_id = $1", [subtopic.id]);
                        console.log(`      -> SUBTOPIC: ${subtopic.name} (${subtopic.id}) - Questions: ${sqCountRes.rows[0].count}`);
                    }
                }
            }
        }
        
        console.log("\n--- GLOBAL SEARCH FOR 'JAVASCRIPT' TOPICS ---");
        const globalTopicsRes = await pool.query(`
            SELECT t.id, t.name, s.name as subject_name, d.name as domain_name 
            FROM topics t 
            JOIN subjects s ON t.subject_id = s.id 
            JOIN domains d ON s.domain_id = d.id 
            WHERE t.name ILIKE '%JavaScript%' OR s.name ILIKE '%JavaScript%'
        `);
        for (const gt of globalTopicsRes.rows) {
             const qCountRes = await pool.query("SELECT COUNT(*) as count FROM questions WHERE topic_id = $1", [gt.id]);
             console.log(`Found Topic: '${gt.name}' in Subject '${gt.subject_name}' (Domain: ${gt.domain_name}) -> Questions: ${qCountRes.rows[0].count}`);
        }

    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await pool.end();
    }
}

main();
