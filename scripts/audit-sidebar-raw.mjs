import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('═══════════════════════════════════════════════════════════');
console.log('SIDEBAR TREE RAW DATA INSPECTION');
console.log('═══════════════════════════════════════════════════════════\n');

async function inspect() {
  try {
    const javaTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';
    
    const sidebar = await tutorialDb.query(`
      SELECT id, brand_id, topic_id, tree, created_at, updated_at
      FROM tutorial_sidebar_trees_v2 
      WHERE topic_id = $1
    `, [javaTopicId]);
    
    if (sidebar.rows.length === 0) {
      console.log('❌ No sidebar tree found');
      return;
    }
    
    const row = sidebar.rows[0];
    console.log('Sidebar Tree Record:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`ID: ${row.id}`);
    console.log(`Brand: ${row.brand_id}`);
    console.log(`Topic ID: ${row.topic_id}`);
    console.log(`Created: ${row.created_at}`);
    console.log(`Updated: ${row.updated_at}`);
    console.log('\nRAW TREE JSONB:');
    console.log(JSON.stringify(row.tree, null, 2));
    
    // Check all sidebar trees
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('ALL SIDEBAR TREES IN DATABASE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const allSidebars = await tutorialDb.query(`
      SELECT id, brand_id, topic_id, 
             jsonb_typeof(tree) as tree_type,
             created_at, updated_at
      FROM tutorial_sidebar_trees_v2
      ORDER BY created_at DESC
    `);
    
    console.log(`Total sidebar trees: ${allSidebars.rows.length}\n`);
    
    allSidebars.rows.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.id}`);
      console.log(`   Brand: ${s.brand_id}`);
      console.log(`   Topic: ${s.topic_id}`);
      console.log(`   Tree type: ${s.tree_type}`);
      console.log(`   Created: ${s.created_at}`);
      console.log(`   Updated: ${s.updated_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ INSPECTION FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await tutorialDb.end();
  }
}

inspect();
