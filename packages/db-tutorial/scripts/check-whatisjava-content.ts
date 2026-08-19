/**
 * Check "What Is Java" content
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkWhatIsJavaContent() {
  console.log('========================================');
  console.log('"What Is Java" Content Check');
  console.log('========================================\n');

  const subtopicId = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

  try {
    // Get subtopic details
    const subtopic = await db.execute(sql`
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
      WHERE ts.id = ${subtopicId};
    `);

    if (subtopic.rows.length === 0) {
      console.log('❌ Subtopic not found!');
      return;
    }

    const sub = subtopic.rows[0];
    console.log('Subtopic Details:');
    console.log(`  Name: ${sub.name}`);
    console.log(`  Slug: ${sub.slug}`);
    console.log(`  ID: ${sub.id}`);
    console.log(`  Topic: ${sub.topic_name}`);
    console.log(`  Subject: ${sub.subject_name}`);
    console.log(`  Domain: ${sub.domain_name}`);
    console.log('');

    // Check tutorial_sections (modular system - Definition D1)
    console.log('## Checking tutorial_sections (modular - Definition D1)\n');
    const sections = await db.execute(sql`
      SELECT 
        id,
        section_type,
        difficulty,
        status,
        version,
        brand_id,
        generated_by_ai,
        created_at
      FROM tutorial_sections
      WHERE subtopic_id = ${subtopicId};
    `);

    console.log(`Found ${sections.rows.length} sections\n`);

    if (sections.rows.length > 0) {
      for (const row of sections.rows) {
        console.log(`  Section ID: ${row.id}`);
        console.log(`    Type: ${row.section_type}`);
        console.log(`    Difficulty: ${row.difficulty}`);
        console.log(`    Status: ${row.status}`);
        console.log(`    Version: ${row.version}`);
        console.log(`    Brand: ${row.brand_id}`);
        console.log(`    AI Generated: ${row.generated_by_ai}`);
        console.log(`    Created: ${row.created_at}`);
        
        // Check for Definition blocks
        const blocks = await db.execute(sql`
          SELECT 
            block->>'type' as block_type,
            block->>'version' as block_version,
            block->>'id' as block_id
          FROM tutorial_sections,
            jsonb_array_elements(content->'blocks') AS block
          WHERE id = ${row.id};
        `);

        if (blocks.rows.length > 0) {
          console.log(`    Blocks:`);
          for (const block of blocks.rows) {
            console.log(`      - ${block.block_type} ${block.block_version || '(no version)'} (${block.block_id})`);
          }
        }
        console.log('');
      }
    }

    // Check individual section tables (old system)
    console.log('## Checking individual section tables (old system)\n');
    
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
      'tutorial_section_summary'
    ];

    let foundInOldSystem = false;

    for (const table of sectionTables) {
      try {
        const count = await db.execute(sql.raw(
          `SELECT COUNT(*) FROM ${table} WHERE subtopic_id = '${subtopicId}';`
        ));
        const rowCount = Number(count.rows[0]?.count || 0);
        
        if (rowCount > 0) {
          foundInOldSystem = true;
          console.log(`  ${table}: ${rowCount} rows ✅`);
          
          // Get sample content
          const sample = await db.execute(sql.raw(
            `SELECT id, status, difficulty, created_at FROM ${table} WHERE subtopic_id = '${subtopicId}' LIMIT 1;`
          ));
          if (sample.rows.length > 0) {
            const row = sample.rows[0];
            console.log(`    ID: ${row.id}`);
            console.log(`    Status: ${row.status}`);
            console.log(`    Difficulty: ${row.difficulty}`);
            console.log(`    Created: ${row.created_at}`);
          }
        }
      } catch (e) {
        // Table doesn't exist or error
      }
    }

    if (!foundInOldSystem) {
      console.log('  No content found in individual section tables');
    }

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');

    if (sections.rows.length > 0) {
      console.log('✅ Content exists in tutorial_sections (NEW MODULAR SYSTEM)');
      console.log('   This is the Definition D1 implementation target!\n');
    } else if (foundInOldSystem) {
      console.log('⚠️  Content exists in old individual tables');
      console.log('   Needs migration to tutorial_sections for D1\n');
    } else {
      console.log('❌ NO CONTENT FOUND');
      console.log('   Need to create content for this subtopic\n');
    }

  } catch (error) {
    console.error('❌ Error:');
    console.error(error);
    process.exit(1);
  }
}

checkWhatIsJavaContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
