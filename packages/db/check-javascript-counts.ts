
import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Force use of fetch even in environments where WebSocket might be preferred
// This often fixes the "fetch failed" error in certain Node.js environments
if (typeof global.WebSocket === 'undefined') {
    // Some versions of the driver check for this
}

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL not found");
        return;
    }

    const pool = new Pool({ connectionString: databaseUrl });
    
    try {
        console.log("--- SEARCHING FOR JAVASCRIPT TOPIC ---");
        
        // 1. Find the topic named 'JavaScript' or containing it
        const topicQuery = `
            SELECT id, name, subject_id 
            FROM topics 
            WHERE name ILIKE 'JavaScript' OR name ILIKE 'Modern JavaScript'
        `;
        const topicRes = await pool.query(topicQuery);
        
        if (topicRes.rows.length === 0) {
            console.log("No topic found directly matching 'JavaScript'.");
            
            // Try a broader search
            const broadTopicRes = await pool.query("SELECT id, name FROM topics WHERE name ILIKE '%JavaScript%'");
            if (broadTopicRes.rows.length > 0) {
                console.log("Found similar topics:");
                broadTopicRes.rows.forEach(r => console.log(` - ${r.name} (${r.id})`));
            } else {
                console.log("No topics containing 'JavaScript' found at all.");
                return;
            }
        }

        for (const topic of topicRes.rows) {
            console.log(`\nTOPIC: ${topic.name} (${topic.id})`);
            
            // 2. Count questions directly in topic
            const qCountRes = await pool.query("SELECT COUNT(*) as count FROM questions WHERE topic_id = $1", [topic.id]);
            console.log(`Questions directly in Topic: ${qCountRes.rows[0].count}`);
            
            // 3. Find subtopics
            const subtopicsRes = await pool.query("SELECT id, name FROM subtopics WHERE topic_id = $1", [topic.id]);
            console.log(`Subtopics found: ${subtopicsRes.rows.length}`);
            
            for (const subtopic of subtopicsRes.rows) {
                const sqCountRes = await pool.query("SELECT COUNT(*) as count FROM questions WHERE subtopic_id = $1", [subtopic.id]);
                console.log(` -> SUBTOPIC: ${subtopic.name} (${subtopic.id}) - Questions: ${sqCountRes.rows[0].count}`);
            }
        }

    } catch (err: any) {
        console.error("Database query failed:");
        console.error(err.message);
        if (err.detail) console.error("Detail:", err.detail);
    } finally {
        await pool.end();
    }
}

main();
