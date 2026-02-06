
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as domainSchema from './src/schema/domain';
import * as questionSchema from './src/schema/question';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function checkHierarchy() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle(pool, { schema: { ...domainSchema, ...questionSchema } });

    console.log("--- DOMAINS ---");
    const domains = await db.select().from(domainSchema.domains);
    for (const d of domains) {
        console.log(`Domain: ${d.name} (${d.id})`);
    }

    console.log("\n--- TOPICS & QUESTIONS ---");
    const topicList = await db.select({
        id: domainSchema.topics.id,
        name: domainSchema.topics.name,
        subjectId: domainSchema.topics.subjectId
    }).from(domainSchema.topics);

    for (const t of topicList) {
        const qCount = await db.select({ count: sql<number>`count(*)` })
            .from(questionSchema.questions)
            .where(sql`${questionSchema.questions.topicId} = ${t.id}`);
        
        console.log(`Topic: ${t.name} (ID: ${t.id}) -> Questions: ${qCount[0].count}`);
        
        const subList = await db.select().from(domainSchema.subtopics).where(sql`${domainSchema.subtopics.topicId} = ${t.id}`);
        for (const s of subList) {
            const sqCount = await db.select({ count: sql<number>`count(*)` })
                .from(questionSchema.questions)
                .where(sql`${questionSchema.questions.subtopicId} = ${s.id}`);
            console.log(`  -> Subtopic: ${s.name} -> Questions: ${sqCount[0].count}`);
        }
    }

    await pool.end();
}

checkHierarchy().catch(console.error);
