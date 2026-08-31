import 'dotenv/config';
import { db } from './packages/db-tutorial/src/db';
import { tutorialSubtopics } from './packages/db-tutorial/src/schema/tutorial-subtopics';
import { tutorialTopics } from './packages/db-tutorial/src/schema/tutorial-topics';
import { tutorialSidebarTreesV2 } from './packages/db-tutorial/src/schema/tutorial-sidebar-v2';
import { eq } from 'drizzle-orm';

async function main() {
  const subtopic = await db.select({
    id: tutorialSubtopics.id,
    externalId: tutorialSubtopics.externalId,
    slug: tutorialSubtopics.slug,
    name: tutorialSubtopics.name,
    topicId: tutorialSubtopics.topicId
  }).from(tutorialSubtopics).limit(1);

  if (subtopic.length === 0) {
    console.log('NO SUBTOPICS FOUND');
    process.exit(1);
  }

  console.log('FIRST SUBTOPIC (LIMIT 1):');
  console.log(JSON.stringify(subtopic[0], null, 2));

  const topic = await db.select({
    id: tutorialTopics.id,
    externalId: tutorialTopics.externalId,
    name: tutorialTopics.name
  }).from(tutorialTopics).where(eq(tutorialTopics.id, subtopic[0].topicId));

  console.log('\nPARENT TOPIC:');
  console.log(JSON.stringify(topic[0], null, 2));

  const sidebars = await db.select({
    brandId: tutorialSidebarTreesV2.brandId,
    topicId: tutorialSidebarTreesV2.topicId,
    status: tutorialSidebarTreesV2.status,
    tree: tutorialSidebarTreesV2.tree
  }).from(tutorialSidebarTreesV2).where(eq(tutorialSidebarTreesV2.topicId, topic[0].externalId));

  console.log('\nSIDEBARS FOR THIS TOPIC:');
  for (const sidebar of sidebars) {
    const tree = sidebar.tree as any;
    const nodes = tree?.sections?.flatMap((s: any) => s.pages?.map((p: any) => p.id) || []) || [];
    console.log(JSON.stringify({
      brandId: sidebar.brandId,
      topicId: sidebar.topicId,
      status: sidebar.status,
      nodeIds: nodes.slice(0, 10)
    }, null, 2));
  }

  console.log('\n=== DETERMINISM CHECK ===');
  console.log('Test uses: SELECT ... LIMIT 1');
  console.log('Test expects: whatisjava node');
  console.log('First subtopic topic:', topic[0].name);
  
  const hasWhatisjava = sidebars.some(s => {
    const tree = s.tree as any;
    const nodes = tree?.sections?.flatMap((sec: any) => sec.pages?.map((p: any) => p.id) || []) || [];
    return nodes.includes('whatisjava');
  });
  
  console.log('Does sidebar contain whatisjava?', hasWhatisjava);
  
  if (!hasWhatisjava) {
    console.log('\n❌ FIXTURE MISMATCH: First subtopic does NOT have whatisjava node');
    console.log('This means test fixture is NON-DETERMINISTIC');
  } else {
    console.log('\n✅ First subtopic DOES have whatisjava node (currently works)');
  }

  process.exit(0);
}

main().catch(console.error);
