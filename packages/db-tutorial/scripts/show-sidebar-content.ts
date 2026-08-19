/**
 * Show full sidebar content
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function showSidebarContent() {
  console.log('========================================');
  console.log('Full Sidebar Content');
  console.log('========================================\n');

  try {
    const sidebar = await db.execute(sql`
      SELECT 
        id,
        brand_id,
        domain_id,
        subject_id,
        topic_id,
        active_subtopic_id,
        tree,
        source_format,
        status,
        version
      FROM tutorial_sidebar_trees_v2;
    `);

    for (const row of sidebar.rows) {
      console.log('Sidebar Entry:');
      console.log(`  ID: ${row.id}`);
      console.log(`  Brand: ${row.brand_id}`);
      console.log(`  Domain ID: ${row.domain_id}`);
      console.log(`  Subject ID: ${row.subject_id}`);
      console.log(`  Topic ID: ${row.topic_id}`);
      console.log(`  Active Subtopic: ${row.active_subtopic_id || 'none'}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Version: ${row.version}`);
      console.log(`  Source Format: ${row.source_format}`);
      
      // Parse and display tree
      if (row.tree) {
        const tree = typeof row.tree === 'string' ? JSON.parse(row.tree) : row.tree;
        console.log(`\n  Navigation Tree:\n`);
        console.log(JSON.stringify(tree, null, 2));
      }
      console.log('\n---\n');
    }

    // Get hierarchy details
    console.log('Hierarchy Details:\n');
    const hierarchy = await db.execute(sql`
      SELECT 
        td.name as domain_name,
        td.slug as domain_slug,
        ts.name as subject_name,
        ts.slug as subject_slug,
        tt.name as topic_name,
        tt.slug as topic_slug
      FROM tutorial_sidebar_trees_v2 st
      LEFT JOIN tutorial_domains td ON st.domain_id = td.id
      LEFT JOIN tutorial_subjects ts ON st.subject_id = ts.id
      LEFT JOIN tutorial_topics tt ON st.topic_id = tt.id;
    `);

    for (const row of hierarchy.rows) {
      console.log(`  Domain: ${row.domain_name} (/${row.domain_slug})`);
      console.log(`  Subject: ${row.subject_name} (/${row.subject_slug})`);
      console.log(`  Topic: ${row.topic_name} (/${row.topic_slug})`);
    }

    console.log('\n========================================');
    console.log('Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    process.exit(1);
  }
}

showSidebarContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
