/**
 * INSPECT CURRICULUM HIERARCHY
 * 
 * Discovers and displays the authoritative curriculum hierarchy
 * stored in TutorialDB:
 * 
 *   Domain → Subject → Topic → Subtopic
 * 
 * This script identifies which tables contain the curriculum foundation
 * that must be preserved during Tutorial V2 data reset.
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';

interface TableSchema {
  tableName: string;
  columns: string[];
  rowCount: number;
  sampleData?: any[];
}

async function inspectTable(tableName: string, limit: number = 3): Promise<TableSchema> {
  console.log(`\nInspecting: ${tableName}`);
  console.log('─'.repeat(60));

  // Get column info
  const columnResult = await tutorialDb.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position
  `);

  const columns = columnResult.rows.map((row: any) => `${row.column_name} (${row.data_type})`);

  // Get row count
  const countResult = await tutorialDb.execute(
    sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`
  );
  const rowCount = Number((countResult.rows[0] as any).count);

  console.log(`Columns: ${columns.length}`);
  columns.forEach(col => console.log(`  - ${col}`));
  console.log(`\nRow count: ${rowCount}`);

  // Get sample data if table has rows
  let sampleData: any[] = [];
  if (rowCount > 0) {
    const sampleResult = await tutorialDb.execute(
      sql`SELECT * FROM ${sql.identifier(tableName)} LIMIT ${limit}`
    );
    sampleData = sampleResult.rows as any[];

    console.log(`\nSample data (first ${Math.min(limit, rowCount)} rows):`);
    sampleData.forEach((row, idx) => {
      console.log(`\n  Row ${idx + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        const displayValue = typeof value === 'string' && value.length > 50
          ? value.substring(0, 50) + '...'
          : value;
        console.log(`    ${key}: ${displayValue}`);
      });
    });
  }

  return {
    tableName,
    columns,
    rowCount,
    sampleData,
  };
}

async function inspectCurriculumHierarchy(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TUTORIAL CURRICULUM HIERARCHY INSPECTION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const tables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
  ];

  const results: TableSchema[] = [];

  for (const tableName of tables) {
    try {
      const schema = await inspectTable(tableName);
      results.push(schema);
    } catch (error: any) {
      console.log(`\n❌ Error inspecting ${tableName}:`);
      console.log(`   ${error.message}`);
    }
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CURRICULUM HIERARCHY SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const totalRows = results.reduce((sum, r) => sum + r.rowCount, 0);

  console.log('Table                        Rows');
  console.log('─'.repeat(60));
  results.forEach(r => {
    console.log(`${r.tableName.padEnd(28)} ${String(r.rowCount).padStart(6)}`);
  });
  console.log('─'.repeat(60));
  console.log(`${'TOTAL'.padEnd(28)} ${String(totalRows).padStart(6)}`);
  console.log('');

  // Verify hierarchy relationships
  console.log('═══════════════════════════════════════════════════════════');
  console.log('HIERARCHY RELATIONSHIP VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Check Domain → Subject relationship
    const domainSubjectCheck = await tutorialDb.execute(sql`
      SELECT 
        d.name as domain_name,
        COUNT(DISTINCT s.id) as subject_count
      FROM tutorial_domains d
      LEFT JOIN tutorial_subjects s ON s.domain_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    console.log('Domain → Subject:');
    domainSubjectCheck.rows.forEach((row: any) => {
      console.log(`  ${row.domain_name.padEnd(40)} → ${row.subject_count} subjects`);
    });

    console.log('');

    // Check Subject → Topic relationship
    const subjectTopicCheck = await tutorialDb.execute(sql`
      SELECT 
        s.name as subject_name,
        COUNT(DISTINCT t.id) as topic_count
      FROM tutorial_subjects s
      LEFT JOIN tutorial_topics t ON t.subject_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.name
      LIMIT 10
    `);

    console.log('Subject → Topic (first 10):');
    subjectTopicCheck.rows.forEach((row: any) => {
      console.log(`  ${row.subject_name.padEnd(40)} → ${row.topic_count} topics`);
    });

    console.log('');

    // Check Topic → Subtopic relationship
    const topicSubtopicCheck = await tutorialDb.execute(sql`
      SELECT 
        t.name as topic_name,
        COUNT(DISTINCT st.id) as subtopic_count
      FROM tutorial_topics t
      LEFT JOIN tutorial_subtopics st ON st.topic_id = t.id
      GROUP BY t.id, t.name
      ORDER BY t.name
      LIMIT 10
    `);

    console.log('Topic → Subtopic (first 10):');
    topicSubtopicCheck.rows.forEach((row: any) => {
      console.log(`  ${row.topic_name.padEnd(40)} → ${row.subtopic_count} subtopics`);
    });

  } catch (error: any) {
    console.log('❌ Error verifying relationships:');
    console.log(`   ${error.message}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CONCLUSION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('The authoritative curriculum hierarchy is stored in:');
  console.log('');
  console.log('  1. tutorial_domains      (Domain level)');
  console.log('  2. tutorial_subjects     (Subject level)');
  console.log('  3. tutorial_topics       (Topic level)');
  console.log('  4. tutorial_subtopics    (Subtopic level)');
  console.log('');
  console.log('These tables define the canonical curriculum structure and');
  console.log('MUST NOT be deleted during Tutorial V2 data reset.');
  console.log('');
  console.log('They are referenced by:');
  console.log('  - tutorial_sections.subtopic_id → tutorial_subtopics.id');
  console.log('  - tutorial_sidebar_trees_v2 (navigation references)');
  console.log('  - tutorial_progress (learner tracking)');
  console.log('');
}

async function main(): Promise<void> {
  try {
    await inspectCurriculumHierarchy();
  } catch (error: any) {
    console.error('');
    console.error('❌ INSPECTION FAILED');
    console.error('');
    console.error(error.message);
    console.error('');
    process.exitCode = 1;
  }
}

main();
