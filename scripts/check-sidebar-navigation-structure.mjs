import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nSIDEBAR NAVIGATION STRUCTURE SAMPLE\n');

try {
  const sidebar = await pool.query(`
    SELECT id, brand_id, tree
    FROM tutorial_sidebar_trees_v2
    LIMIT 1
  `);
  
  if (sidebar.rows.length === 0) {
    console.log('No sidebar data found');
  } else {
    const row = sidebar.rows[0];
    console.log(`Brand: ${row.brand_id}`);
    console.log(`\nTree structure (first 2 levels):`);
    
    const tree = row.tree;
    if (tree && tree.children && tree.children.length > 0) {
      for (const child of tree.children.slice(0, 2)) {
        console.log(`\n  Node:`);
        console.log(`    id: ${child.id || 'N/A'}`);
        console.log(`    type: ${child.type || 'N/A'}`);
        console.log(`    label: ${child.label || 'N/A'}`);
        console.log(`    slug: ${child.slug || 'N/A'}`);
        
        if (child.children && child.children.length > 0) {
          console.log(`    children: ${child.children.length}`);
          const firstChild = child.children[0];
          console.log(`      └─ First child:`);
          console.log(`         id: ${firstChild.id || 'N/A'}`);
          console.log(`         type: ${firstChild.type || 'N/A'}`);
          console.log(`         label: ${firstChild.label || 'N/A'}`);
        }
      }
    }
    
    console.log(`\nnavigationNodeId IS LIKELY: node.id field in tree JSONB structure`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
