import { db } from './packages/db-tutorial/src/db.js';
import { tutorialSubtopics } from './packages/db-tutorial/src/schema/tutorial-subtopics.js';
import { tutorialTopics } from './packages/db-tutorial/src/schema/tutorial-topics.js';
import { tutorialSidebarTreesV2 } from './packages/db-tutorial/src/schema/tutorial-sidebar-v2.js';
import { eq } from 'drizzle-orm';

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
  treePreview: tutorialSidebarTreesV2.tree
}).from(tutorialSidebarTreesV2).where(eq(tutorialSidebarTreesV2.topicId, topic[0].externalId));

console.log('\nSIDEBARS FOR THIS TOPIC:');
for (const sidebar of sidebars) {
  const tree = sidebar.treePreview;
  const nodes = tree?.sections?.flatMap(s => s.pages?.map(p => p.id) || []) || [];
  console.log(JSON.stringify({
    brandId: sidebar.brandId,
    topicId: sidebar.topicId,
    status: sidebar.status,
    nodeIds: nodes.slice(0, 5)
  }, null, 2));
}

console.log('\n=== DETERMINISM CHECK ===');
console.log('Test uses: SELECT ... LIMIT 1');
console.log('Test expects: whatisjava node');
console.log('First subtopic topic:', topic[0].name);
console.log('Does sidebar contain whatisjava?', sidebars.some(s => {
  const tree = s.treePreview;
  const nodes = tree?.sections?.flatMap(sec => sec.pages?.map(p => p.id) || []) || [];
  return nodes.includes('whatisjava');
}));

process.exit(0);
