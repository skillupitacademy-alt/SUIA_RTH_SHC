import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

import { db } from './db';
import { tutorialSections } from './schema/tutorial-sections';
import { tutorialSubtopics } from './schema/tutorial-subtopics';
import { eq, and } from 'drizzle-orm';

async function main() {
  // 1. Find the subtopic UUID by slug
  const subtopic = await db.select({ id: tutorialSubtopics.id })
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.slug, 'whatisjavascript'))
    .limit(1);

  if (subtopic.length === 0) {
    console.log('No subtopic found with slug "whatisjavascript"');
    return;
  }

  const subtopicUuid = subtopic[0].id;
  console.log(`Found subtopic UUID: ${subtopicUuid}`);

  // 2. Delete only the layman section for this subtopic
  console.log('Deleting layman section...');
  const result = await db.delete(tutorialSections)
    .where(
      and(
        eq(tutorialSections.subtopicId, subtopicUuid),
        eq(tutorialSections.sectionType, 'layman')
      )
    )
    .returning({ id: tutorialSections.id, sectionType: tutorialSections.sectionType });

  console.log('Deleted records:', result.length, result);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
