import 'dotenv/config';
import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';

async function getJavaIdentity() {
  console.log('Querying Java curriculum hierarchy...\n');
  
  // Get subtopic
  const subtopicResult = await db.execute(sql`
    SELECT id, name, slug, topic_id 
    FROM tutorial_subtopics 
    WHERE slug = 'whatisjava'
  `);
  
  if (subtopicResult.rows.length === 0) {
    console.log('❌ Subtopic not found');
    return;
  }
  
  const subtopic = subtopicResult.rows[0] as any;
  console.log('Subtopic:', subtopic);
  console.log('');
  
  // Get topic
  const topicResult = await db.execute(sql`
    SELECT id, name, slug, subject_id
    FROM tutorial_topics
    WHERE id = ${subtopic.topic_id}
  `);
  
  const topic = topicResult.rows[0] as any;
  console.log('Topic:', topic);
  console.log('');
  
  // Get subject
  const subjectResult = await db.execute(sql`
    SELECT id, name, slug, domain_id
    FROM tutorial_subjects
    WHERE id = ${topic.subject_id}
  `);
  
  const subject = subjectResult.rows[0] as any;
  console.log('Subject:', subject);
  console.log('');
  
  // Get domain
  const domainResult = await db.execute(sql`
    SELECT id, name, slug
    FROM tutorial_domains
    WHERE id = ${subject.domain_id}
  `);
  
  const domain = domainResult.rows[0] as any;
  console.log('Domain:', domain);
  console.log('');
  
  // Get sidebar tree
  console.log('Checking sidebar tree...');
  const sidebarResult = await db.execute(sql`
    SELECT id, brand_id, topic_id, tree
    FROM tutorial_sidebar_trees_v2
    WHERE brand_id = 'skillup'
      AND topic_id = ${topic.id}
      AND status = 'published'
  `);
  
  if (sidebarResult.rows.length === 0) {
    console.log('❌ No published sidebar found for this topic');
    return;
  }
  
  const sidebar = sidebarResult.rows[0] as any;
  console.log('Sidebar ID:', sidebar.id);
  console.log('');
  
  // Parse tree to find navigation nodes
  const tree = sidebar.tree;
  console.log('Navigation tree structure:');
  console.log(JSON.stringify(tree, null, 2));
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('JAVA IDENTITY SUMMARY');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log(`Domain:  ${domain.slug} (${domain.name})`);
  console.log(`Subject: ${subject.slug} (${subject.name})`);
  console.log(`Topic:   ${topic.slug} (${topic.name})`);
  console.log(`Subtopic: ${subtopic.slug} (${subtopic.name})`);
  console.log('');
  
  // Try to find navigation node for this subtopic
  function findNodes(nodes: any[], path: string = ''): void {
    for (const node of nodes) {
      const nodePath = path ? `${path} → ${node.name}` : node.name;
      console.log(`  Node: ${node.id} (${node.name}) [${node.type}]`);
      console.log(`    Path: ${nodePath}`);
      if (node.url) {
        console.log(`    URL: ${node.url}`);
      }
      console.log('');
      
      if (node.children && node.children.length > 0) {
        findNodes(node.children, nodePath);
      }
    }
  }
  
  if (tree.topics && tree.topics.length > 0) {
    console.log('Navigation Nodes:');
    console.log('');
    findNodes(tree.topics);
  }
}

getJavaIdentity().catch(console.error);
