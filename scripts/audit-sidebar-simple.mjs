import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('\nPOST-IMPLEMENTATION DATABASE AUDIT: tutorial_sidebar_trees_v2\n');

try {
  const result = await pool.query('SELECT COUNT(*) FROM tutorial_sidebar_trees_v2');
  const count = parseInt(result.rows[0].count);
  
  console.log(`Total rows: ${count}\n`);
  
  if (count === 0) {
    console.log('TABLE IS EMPTY - CLEAN STATE');
    console.log('\nRECOMMENDATION: Ready for fresh functional testing\n');
  } else {
    const rows = await pool.query(`
      SELECT id, brand_id, topic_id, status, version, source_format, tree
      FROM tutorial_sidebar_trees_v2
      ORDER BY created_at ASC
    `);
    
    console.log('RECORDS:\n');
    rows.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.brand_id} | topic: ${row.topic_id.slice(0, 8)}... | v${row.version} | ${row.status}`);
      console.log(`   Tree fields: ${Object.keys(row.tree).join(', ')}`);
      
      if (row.tree.brand) console.log('   WARNING: Contains brand');
      if (row.tree.theme) console.log('   WARNING: Contains theme');
      if (row.tree.progress) console.log('   WARNING: Contains progress');
      
      function countUrls(node) {
        let count = node.url ? 1 : 0;
        if (node.children) {
          count += node.children.reduce((sum, child) => sum + countUrls(child), 0);
        }
        return count;
      }
      
      const urlCount = row.tree.topics ? row.tree.topics.reduce((sum, t) => sum + countUrls(t), 0) : 0;
      console.log(`   URLs: ${urlCount}`);
      console.log('');
    });
  }
  
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  await pool.end();
}
