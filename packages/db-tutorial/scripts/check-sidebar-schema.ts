/**
 * Check sidebar schema and content
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkSidebarSchema() {
  console.log('========================================');
  console.log('Sidebar Schema & Content');
  console.log('========================================\n');

  try {
    // Get sidebar schema
    const schema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sidebar_trees_v2'
      ORDER BY ordinal_position;
    `);

    console.log('tutorial_sidebar_trees_v2 columns:\n');
    for (const row of schema.rows) {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    }
    console.log('');

    // Get all sidebar rows
    const sidebar = await db.execute(sql`
      SELECT * FROM tutorial_sidebar_trees_v2;
    `);

    console.log(`Total sidebar rows: ${sidebar.rows.length}\n`);

    for (const row of sidebar.rows) {
      console.log('Sidebar Entry:');
      console.log(`  ID: ${row.id}`);
      console.log(`  Topic ID: ${row.topic_id || 'null'}`);
      console.log(`  Brand: ${row.brand_id || 'null'}`);
      console.log(`  Created: ${row.created_at}`);
      
      // Parse tree_data
      if (row.tree_data) {
        const treeData = typeof row.tree_data === 'string' 
          ? JSON.parse(row.tree_data) 
          : row.tree_data;
        
        console.log(`\n  Tree Structure:`);
        console.log('  ' + JSON.stringify(treeData, null, 2).split('\n').join('\n  '));
      }
      console.log('\n---\n');
    }

    console.log('========================================');
    console.log('Check Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    process.exit(1);
  }
}

checkSidebarSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
