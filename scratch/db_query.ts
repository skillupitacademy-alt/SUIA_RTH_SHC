import { db, tutorialSections, tutorialSubtopics } from '@quiz/db-tutorial';
import { eq, and, isNull } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

async function main() {
  console.log('Querying subtopic whatisjavascript...');
  const subtopics = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(eq(tutorialSubtopics.slug, 'whatisjavascript'), isNull(tutorialSubtopics.deletedAt)));

  console.log('Found subtopics:', subtopics);

  if (subtopics.length === 0) {
    console.log('No active subtopic found with slug whatisjavascript');
    return;
  }

  const subtopicId = subtopics[0].id;
  const sections = await db
    .select()
    .from(tutorialSections)
    .where(and(eq(tutorialSections.subtopicId, subtopicId), isNull(tutorialSections.deletedAt)));

  console.log(`Found ${sections.length} sections for whatisjavascript:`);
  for (const s of sections) {
    console.log(`- ID: ${s.id}, Type: ${s.sectionType}, Has Content: ${s.content ? 'Yes' : 'No'}`);
    if (s.sectionType === 'layman' || s.sectionType === 'overview') {
      console.log('Content preview:', JSON.stringify(s.content, null, 2));
    }
  }
}

main().catch(console.error);
