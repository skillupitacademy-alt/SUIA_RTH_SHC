
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("DATABASE_URL not found");
        return;
    }

    // neon() creates an HTTP fetch connection rather than a WebSocket pool
    const sql = neon(databaseUrl);
    
    try {
        console.log("--- SEARCHING FOR JAVASCRIPT TOPIC (HTTP FETCH) ---");
        
        // 1. Find the topic named 'JavaScript' or containing it
        const topics = await sql`
            SELECT id, name, subject_id 
            FROM topics 
            WHERE name ILIKE 'JavaScript' OR name ILIKE 'Modern JavaScript'
        `;
        
        if (topics.length === 0) {
            console.log("No topic found directly matching 'JavaScript'.");
            
            // Try a broader search
            const broadTopics = await sql`SELECT id, name FROM topics WHERE name ILIKE '%JavaScript%'`;
            if (broadTopics.length > 0) {
                console.log("Found similar topics:");
                broadTopics.forEach(r => console.log(` - ${r.name} (${r.id})`));
            } else {
                console.log("No topics containing 'JavaScript' found at all.");
                return;
            }
        }

        for (const topic of topics) {
            console.log(`\nTOPIC: ${topic.name} (${topic.id})`);
            
            // 2. Count questions directly in topic
            const qCount = await sql`SELECT COUNT(*) as count FROM questions WHERE topic_id = ${topic.id}`;
            console.log(`Questions directly in Topic: ${qCount[0].count}`);
            
            // 3. Find subtopics
            const subtopics = await sql`SELECT id, name FROM subtopics WHERE topic_id = ${topic.id}`;
            console.log(`Subtopics found: ${subtopics.length}`);
            
            for (const subtopic of subtopics) {
                const sqCount = await sql`SELECT COUNT(*) as count FROM questions WHERE subtopic_id = ${subtopic.id}`;
                console.log(` -> SUBTOPIC: ${subtopic.name} (${subtopic.id}) - Questions: ${sqCount[0].count}`);
            }
        }

    } catch (err: any) {
        console.error("Database query (HTTP) failed:");
        console.error(err.message);
    }
}

main();
