import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import path from 'path';

neonConfig.webSocketConstructor = WebSocket;

import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics';
import { tutorialContent } from '../packages/db-tutorial/src/schema/tutorial-content';
import { eq, or, ilike } from 'drizzle-orm';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL_TUTORIAL;

async function checkSubtopic() {
  if (!connectionString) {
    console.error('DATABASE_URL_TUTORIAL not found');
    return;
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log('Querying tutorial_subtopics table for "component-architecture"...');

  // Search by slug or name
  const subtopics = await db.select().from(tutorialSubtopics).where(
    or(
      eq(tutorialSubtopics.slug, 'component-architecture'),
      ilike(tutorialSubtopics.name, '%component%architecture%')
    )
  );

  if (subtopics.length === 0) {
    console.log('❌ No subtopics found matching "component-architecture".');
  } else {
    for (const st of subtopics) {
      console.log('\n--- Subtopic Record ---');
      console.log(`ID (UUID): ${st.id}`);
      console.log(`Slug:      ${st.slug}`);
      console.log(`Name:      ${st.name}`);
      console.log(`Topic ID:  ${st.topicId}`);

      const contents = await db.select({
          id: tutorialContent.id,
          subtopicId: tutorialContent.subtopicId,
          contentType: tutorialContent.contentType,
          difficulty: tutorialContent.difficulty
      }).from(tutorialContent).where(eq(tutorialContent.subtopicId, st.id));

      console.log(`\nLinked Content Records: ${contents.length}`);
      contents.forEach(c => {
          console.log(`- Content ID: ${c.id} | Linked to Subtopic ID: ${c.subtopicId} | Type: ${c.contentType}`);
      });
    }
  }

  await pool.end();
}

checkSubtopic().catch(console.error);
