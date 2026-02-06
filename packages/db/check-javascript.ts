
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as domainSchema from './src/schema/domain';
import * as questionSchema from './src/schema/question';
import { eq, and, ilike } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function checkJavaScript() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool, { schema: { ...domainSchema, ...questionSchema } });

    console.log("🔍 Searching for FullStack Domain...");
    const domains = await db.select().from(domainSchema.domains).where(ilike(domainSchema.domains.name, '%FullStack%'));
    console.log(`Found ${domains.length} domains matching 'FullStack'.`);
    
    for (const domain of domains) {
        console.log(`\n--- Domain: ${domain.name} (ID: ${domain.id}) ---`);
        const subjects = await db.select().from(domainSchema.subjects).where(eq(domainSchema.subjects.domainId, domain.id));
        
        for (const subject of subjects) {
            console.log(`  Subject: ${subject.name} (ID: ${subject.id})`);
            const topics = await db.select().from(domainSchema.topics).where(eq(domainSchema.topics.subjectId, subject.id));
            
            for (const topic of topics) {
                console.log(`    Topic: ${topic.name} (ID: ${topic.id})`);
                
                // Count questions directly linked to this topic
                const topicQuestions = await db.select().from(questionSchema.questions).where(eq(questionSchema.questions.topicId, topic.id));
                console.log(`      Questions in Topic: ${topicQuestions.length}`);
                
                const subtopics = await db.select().from(domainSchema.subtopics).where(eq(domainSchema.subtopics.topicId, topic.id));
                for (const subtopic of subtopics) {
                    const subtopicQuestions = await db.select().from(questionSchema.questions).where(eq(questionSchema.questions.subtopicId, subtopic.id));
                    console.log(`      -> Subtopic: ${subtopic.name} (ID: ${subtopic.id}) - Questions: ${subtopicQuestions.length}`);
                }
            }
        }
    }
    
    await pool.end();
}

checkJavaScript().catch(console.error);
