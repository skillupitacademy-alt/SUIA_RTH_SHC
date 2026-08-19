/**
 * Check sidebar and section relationships
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkSidebarAndSections() {
  console.log('========================================');
  console.log('Sidebar & Section Relationships');
  console.log('========================================\n');

  try {
    // Check sidebar
    const sidebar = await db.execute(sql`
      SELECT 
        id,
        subtopic_id,
        brand_id,
        tree_data,
        created_at
      FROM tutorial_sidebar_trees_v2
      LIMIT 5;
    `);

    console.log(`tutorial_sidebar_trees_v2: ${sidebar.rows.length} rows\n`);

    for (const row of sidebar.rows) {
      console.log(`Sidebar ID: ${row.id}`);
      console.log(`Subtopic ID: ${row.subtopic_id}`);
      console.log(`Brand: ${row.brand_id}`);
      console.log(`Created: ${row.created_at}`);
      
      // Parse tree_data to see structure
      if (row.tree_data) {
        const treeData = typeof row.tree_data === 'string' 
          ? JSON.parse(row.tree_data) 
          : row.tree_data;
        
        console.log(`\nSidebar Structure:`);
        console.log(JSON.stringify(treeData, null, 2));
      }
      console.log('\n---\n');
    }

    // Check what the subtopic is
    const subtopicCheck = await db.execute(sql`
      SELECT 
        ts.id,
        ts.name,
        ts.slug,
        tt.name as topic_name,
        tsub.name as subject_name,
        td.name as domain_name
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON ts.topic_id = tt.id
      LEFT JOIN tutorial_subjects tsub ON tt.subject_id = tsub.id
      LEFT JOIN tutorial_domains td ON tsub.domain_id = td.id
      WHERE ts.id IN (
        SELECT subtopic_id FROM tutorial_sidebar_trees_v2
      );
    `);

    if (subtopicCheck.rows.length > 0) {
      console.log('Subtopic Details:\n');
      for (const row of subtopicCheck.rows) {
        console.log(`Domain: ${row.domain_name}`);
        console.log(`Subject: ${row.subject_name}`);
        console.log(`Topic: ${row.topic_name}`);
        console.log(`Subtopic: ${row.name} (${row.slug})`);
        console.log(`Subtopic ID: ${row.id}`);
      }
      console.log('');
    }

    // Now check ALL section-related tables for this subtopic
    const subtopicIds = sidebar.rows.map(r => r.subtopic_id).filter(Boolean);
    
    if (subtopicIds.length > 0) {
      const subtopicId = subtopicIds[0];
      
      console.log(`\nChecking all section tables for subtopic: ${subtopicId}\n`);

      // Check tutorial_sections (modular)
      const sections = await db.execute(sql`
        SELECT COUNT(*) FROM tutorial_sections WHERE subtopic_id = ${subtopicId};
      `);
      console.log(`tutorial_sections: ${sections.rows[0]?.count || 0} rows`);

      // Check individual section tables
      const sectionTables = [
        'tutorial_section_notes',
        'tutorial_section_overview',
        'tutorial_section_technical',
        'tutorial_section_practice',
        'tutorial_section_quiz',
        'tutorial_section_code',
        'tutorial_section_project',
        'tutorial_section_interview',
        'tutorial_section_real_life',
        'tutorial_section_summary',
        'tutorial_section_ai_tutor',
        'tutorial_section_assignment'
      ];

      for (const table of sectionTables) {
        try {
          const count = await db.execute(sql.raw(
            `SELECT COUNT(*) FROM ${table} WHERE subtopic_id = '${subtopicId}';`
          ));
          const rowCount = count.rows[0]?.count || 0;
          if (rowCount > 0) {
            console.log(`${table}: ${rowCount} rows ✅`);
            
            // Get sample data
            const sample = await db.execute(sql.raw(
              `SELECT id, status, difficulty, created_at FROM ${table} WHERE subtopic_id = '${subtopicId}' LIMIT 1;`
            ));
            if (sample.rows.length > 0) {
              const row = sample.rows[0];
              console.log(`  Sample: ID=${row.id}, status=${row.status}, difficulty=${row.difficulty}`);
            }
          } else {
            console.log(`${table}: 0 rows`);
          }
        } catch (e) {
          console.log(`${table}: error or doesn't exist`);
        }
      }
    }

    console.log('\n========================================');
    console.log('Check Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    process.exit(1);
  }
}

checkSidebarAndSections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
