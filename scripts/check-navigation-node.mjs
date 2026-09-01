import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
const TARGET_NODE_ID = 'what-is-java';

console.log('Checking navigation node properties...\n');

const result = await tutorialDb.query(`
  SELECT tree
  FROM tutorial_sidebar_trees_v2
  WHERE topic_id = $1
  AND brand_id = 'shared'
  AND status = 'published'
`, [TOPIC_ID]);

if (result.rows.length === 0) {
  console.log('❌ Sidebar not found');
  await tutorialDb.end();
  process.exit(1);
}

const tree = result.rows[0].tree;

function findNode(nodes, targetId) {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

const node = findNode(tree.topics, TARGET_NODE_ID);

if (!node) {
  console.log(`❌ Node '${TARGET_NODE_ID}' not found in sidebar`);
} else {
  console.log(`✅ Node '${TARGET_NODE_ID}' found:\n`);
  console.log(`   id: ${node.id}`);
  console.log(`   name: ${node.name}`);
  console.log(`   type: ${node.type}`);
  console.log(`   slug: ${node.slug}`);
  console.log(`   url: ${node.url}`);
  console.log(`   icon: ${node.icon}`);
  console.log('');
  
  // Validation checks from getPublishedTutorialPagePayload
  const isPage = node.type === 'page';
  const hasUrl = !!node.url;
  const hasSlug = !!node.slug;
  const validationPasses = hasUrl && hasSlug;
  
  console.log('Validation checks:');
  console.log(`   type === 'page': ${isPage}`);
  console.log(`   has url: ${hasUrl}`);
  console.log(`   has slug: ${hasSlug}`);
  console.log(`   validation passes: ${validationPasses}`);
  
  if (!validationPasses) {
    console.log('');
    console.log('❌ VALIDATION FAILS!');
    console.log('This explains why getPublishedTutorialPagePayload returns null.');
  } else {
    console.log('');
    console.log('✅ Node validation should pass');
  }
}

await tutorialDb.end();
