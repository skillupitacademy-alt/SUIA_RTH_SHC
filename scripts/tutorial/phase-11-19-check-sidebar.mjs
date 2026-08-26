/**
 * PHASE 11.19 — Check Published Sidebar in TutorialDB
 */

import { dbHttp, tutorialSidebarTreesV2 } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Querying published sidebars from TutorialDB...\n');

  const rows = await dbHttp
    .select()
    .from(tutorialSidebarTreesV2)
    .where(eq(tutorialSidebarTreesV2.status, 'published'));

  console.log(`Found ${rows.length} published sidebar(s)\n`);

  for (const row of rows) {
    console.log('═'.repeat(70));
    console.log(`Sidebar ID: ${row.id}`);
    console.log(`Brand: ${row.brandId}`);
    console.log(`Topic ID: ${row.topicId}`);
    console.log(`Status: ${row.status}`);
    console.log(`Version: ${row.version}`);
    console.log(`Published At: ${row.publishedAt}`);
    console.log('─'.repeat(70));

    // Extract first 3 page nodes from tree
    const tree = row.tree;
    console.log(`\nTree topics: ${tree.topics?.length || 0}`);

    if (tree.topics && tree.topics.length > 0) {
      const topic = tree.topics[0];
      console.log(`\nFirst topic:`);
      console.log(`  ID: ${topic.id}`);
      console.log(`  Name: ${topic.name}`);
      console.log(`  Slug: ${topic.slug}`);
      console.log(`  Children: ${topic.children?.length || 0}`);

      if (topic.children && topic.children.length > 0) {
        const group = topic.children[0];
        console.log(`\nFirst group:`);
        console.log(`  ID: ${group.id}`);
        console.log(`  Name: ${group.name}`);
        console.log(`  Slug: ${group.slug}`);
        console.log(`  Children: ${group.children?.length || 0}`);

        if (group.children && group.children.length > 0) {
          console.log(`\nFirst 3 page nodes:`);
          for (let i = 0; i < Math.min(3, group.children.length); i++) {
            const page = group.children[i];
            console.log(`  ${i + 1}. ID: ${page.id}`);
            console.log(`     Name: ${page.name}`);
            console.log(`     Slug: ${page.slug}`);
            console.log(`     URL: ${page.url}`);
            console.log(`     Type: ${page.type}`);
          }
        }
      }
    }

    console.log('═'.repeat(70));
    console.log();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
