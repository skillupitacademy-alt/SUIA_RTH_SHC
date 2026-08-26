/**
 * PHASE 11.14C — JAVA IDENTITY FORENSIC TRACE
 * READ-ONLY DATABASE INVESTIGATION
 */

import 'dotenv/config';
import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';

interface TraceResult {
  step: string;
  findings: any;
}

const results: TraceResult[] = [];

function log(message: string): void {
  console.log(message);
}

function section(title: string): void {
  log('');
  log('═'.repeat(60));
  log(title);
  log('═'.repeat(60));
  log('');
}

async function step1_sidebarTableSchema(): Promise<void> {
  section('STEP 1 — SIDEBAR TABLE SCHEMA');
  
  const schemaResult = await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sidebar_trees_v2'
    ORDER BY ordinal_position
  `);
  
  log('tutorial_sidebar_trees_v2 columns:');
  schemaResult.rows.forEach((row: any) => {
    log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  results.push({
    step: 'sidebar_schema',
    findings: schemaResult.rows
  });
}

async function step2_sidebarRowCounts(): Promise<void> {
  section('STEP 2 — SIDEBAR ROW COUNTS');
  
  const statusCounts = await db.execute(sql`
    SELECT status, COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    GROUP BY status
    ORDER BY status
  `);
  
  log('By status:');
  statusCounts.rows.forEach((row: any) => {
    log(`  ${row.status}: ${row.count} rows`);
  });
  
  const brandCounts = await db.execute(sql`
    SELECT brand_id, status, COUNT(*) as count
    FROM tutorial_sidebar_trees_v2
    GROUP BY brand_id, status
    ORDER BY brand_id, status
  `);
  
  log('');
  log('By brand and status:');
  brandCounts.rows.forEach((row: any) => {
    log(`  ${row.brand_id} / ${row.status}: ${row.count} rows`);
  });
  
  results.push({
    step: 'sidebar_counts',
    findings: {
      byStatus: statusCounts.rows,
      byBrand: brandCounts.rows
    }
  });
}

async function step3_allJavaTopics(): Promise<void> {
  section('STEP 3 — ALL JAVA TOPICS');
  
  const javaTopics = await db.execute(sql`
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.subject_id,
      s.name as subject_name,
      s.slug as subject_slug,
      d.name as domain_name,
      d.slug as domain_slug
    FROM tutorial_topics t
    JOIN tutorial_subjects s ON t.subject_id = s.id
    JOIN tutorial_domains d ON s.domain_id = d.id
    WHERE t.name ILIKE '%java%' OR t.slug ILIKE '%java%'
    ORDER BY t.name
  `);
  
  log(`Found ${javaTopics.rows.length} Java topic(s):`);
  log('');
  
  javaTopics.rows.forEach((row: any, idx) => {
    log(`Topic ${idx + 1}:`);
    log(`  ID: ${row.id}`);
    log(`  Name: ${row.name}`);
    log(`  Slug: ${row.slug}`);
    log(`  Hierarchy: ${row.domain_name} → ${row.subject_name} → ${row.name}`);
    log(`  Slugs: ${row.domain_slug} / ${row.subject_slug} / ${row.slug}`);
    log('');
  });
  
  results.push({
    step: 'all_java_topics',
    findings: javaTopics.rows
  });
}

async function step4_allJavaSubtopics(): Promise<void> {
  section('STEP 4 — ALL JAVA SUBTOPICS');
  
  const javaSubtopics = await db.execute(sql`
    SELECT 
      st.id,
      st.name,
      st.slug,
      st.topic_id,
      t.name as topic_name,
      t.slug as topic_slug
    FROM tutorial_subtopics st
    JOIN tutorial_topics t ON st.topic_id = t.id
    WHERE t.name ILIKE '%java%' OR t.slug ILIKE '%java%'
       OR st.name ILIKE '%java%' OR st.slug ILIKE '%java%'
    ORDER BY t.name, st.name
  `);
  
  log(`Found ${javaSubtopics.rows.length} Java subtopic(s):`);
  log('');
  
  javaSubtopics.rows.forEach((row: any, idx) => {
    log(`Subtopic ${idx + 1}:`);
    log(`  ID: ${row.id}`);
    log(`  Name: ${row.name}`);
    log(`  Slug: ${row.slug}`);
    log(`  Topic: ${row.topic_name} (${row.topic_slug})`);
    log('');
  });
  
  results.push({
    step: 'all_java_subtopics',
    findings: javaSubtopics.rows
  });
}

async function step5_javaSidebarRows(): Promise<void> {
  section('STEP 5 — JAVA SIDEBAR ROWS');
  
  // First get all Java topic IDs
  const javaTopicIds = await db.execute(sql`
    SELECT id FROM tutorial_topics
    WHERE name ILIKE '%java%' OR slug ILIKE '%java%'
  `);
  
  if (javaTopicIds.rows.length === 0) {
    log('No Java topics found');
    results.push({
      step: 'java_sidebar_rows',
      findings: []
    });
    return;
  }
  
  const topicIds = javaTopicIds.rows.map((r: any) => r.id);
  
  log(`Searching sidebars for ${topicIds.length} Java topic ID(s)...`);
  log('');
  
  for (const topicId of topicIds) {
    const sidebars = await db.execute(sql`
      SELECT id, brand_id, topic_id, status, published_at
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = ${topicId}
    `);
    
    log(`Topic ID ${topicId}:`);
    if (sidebars.rows.length === 0) {
      log(`  ❌ No sidebar rows found`);
    } else {
      sidebars.rows.forEach((row: any) => {
        log(`  Sidebar ID: ${row.id}`);
        log(`    Brand: ${row.brand_id}`);
        log(`    Status: ${row.status}`);
        log(`    Published: ${row.published_at || 'N/A'}`);
      });
    }
    log('');
  }
  
  results.push({
    step: 'java_sidebar_rows',
    findings: topicIds
  });
}

async function step6_javaNavigationNodes(): Promise<void> {
  section('STEP 6 — JAVA NAVIGATION NODES');
  
  const javaTopicIds = await db.execute(sql`
    SELECT id, name FROM tutorial_topics
    WHERE name ILIKE '%java%' OR slug ILIKE '%java%'
  `);
  
  for (const topic of javaTopicIds.rows as any[]) {
    log(`Topic: ${topic.name} (${topic.id})`);
    log('');
    
    const sidebars = await db.execute(sql`
      SELECT id, brand_id, tree, status
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = ${topic.id}
    `);
    
    if (sidebars.rows.length === 0) {
      log('  ❌ No sidebar found');
      log('');
      continue;
    }
    
    sidebars.rows.forEach((sidebar: any) => {
      log(`  Sidebar: ${sidebar.id} (${sidebar.brand_id} / ${sidebar.status})`);
      
      const tree = sidebar.tree as any;
      
      if (!tree || !tree.topics) {
        log('    ⚠️  Tree structure missing or invalid');
        return;
      }
      
      function printNodes(nodes: any[], indent: string = '    '): void {
        nodes.forEach((node: any) => {
          log(`${indent}Node: ${node.id}`);
          log(`${indent}  Name: ${node.name}`);
          log(`${indent}  Slug: ${node.slug || 'N/A'}`);
          log(`${indent}  Type: ${node.type}`);
          if (node.url) {
            log(`${indent}  URL: ${node.url}`);
          }
          log('');
          
          if (node.children && node.children.length > 0) {
            printNodes(node.children, indent + '  ');
          }
        });
      }
      
      printNodes(tree.topics);
    });
  }
  
  results.push({
    step: 'java_navigation_nodes',
    findings: 'See console output'
  });
}

async function step7_tutorialSectionsSchema(): Promise<void> {
  section('STEP 7 — TUTORIAL_SECTIONS SCHEMA');
  
  const schemaResult = await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sections'
    ORDER BY ordinal_position
  `);
  
  log('tutorial_sections columns:');
  schemaResult.rows.forEach((row: any) => {
    log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  results.push({
    step: 'tutorial_sections_schema',
    findings: schemaResult.rows
  });
}

async function step8_javaTutorialSections(): Promise<void> {
  section('STEP 8 — JAVA TUTORIAL SECTIONS');
  
  const javaSubtopicIds = await db.execute(sql`
    SELECT st.id, st.name
    FROM tutorial_subtopics st
    JOIN tutorial_topics t ON st.topic_id = t.id
    WHERE t.name ILIKE '%java%' OR t.slug ILIKE '%java%'
  `);
  
  log(`Searching tutorial_sections for ${javaSubtopicIds.rows.length} Java subtopic(s)...`);
  log('');
  
  for (const subtopic of javaSubtopicIds.rows as any[]) {
    const sections = await db.execute(sql`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        brand_visibility,
        status,
        version,
        language,
        published_at,
        deleted_at,
        created_at,
        updated_at
      FROM tutorial_sections
      WHERE subtopic_id = ${subtopic.id}
        AND deleted_at IS NULL
      ORDER BY version DESC, created_at DESC
    `);
    
    log(`Subtopic: ${subtopic.name} (${subtopic.id})`);
    if (sections.rows.length === 0) {
      log(`  ❌ No tutorial sections found`);
    } else {
      sections.rows.forEach((section: any) => {
        log(`  Section ID: ${section.id}`);
        log(`    Navigation Node ID: ${section.navigation_node_id}`);
        log(`    Brand: ${section.brand_id}`);
        log(`    Brand Visibility: ${section.brand_visibility}`);
        log(`    Status: ${section.status}`);
        log(`    Version: ${section.version}`);
        log(`    Language: ${section.language}`);
        log(`    Published: ${section.published_at || 'N/A'}`);
      });
    }
    log('');
  }
  
  results.push({
    step: 'java_tutorial_sections',
    findings: 'See console output'
  });
}

async function step9_urlComparison(): Promise<void> {
  section('STEP 9 — URL COMPARISON');
  
  log('FAILING URL:');
  log('  /tutorial-v2/full-stack-development/backend-development/java/whatisjava');
  log('');
  
  log('DATABASE HIERARCHY (Java subtopic):');
  const hierarchy = await db.execute(sql`
    SELECT 
      d.slug as domain_slug,
      s.slug as subject_slug,
      t.slug as topic_slug,
      st.slug as subtopic_slug
    FROM tutorial_subtopics st
    JOIN tutorial_topics t ON st.topic_id = t.id
    JOIN tutorial_subjects s ON t.subject_id = s.id
    JOIN tutorial_domains d ON s.domain_id = d.id
    WHERE st.slug = 'whatisjava'
  `);
  
  if (hierarchy.rows.length > 0) {
    const h = hierarchy.rows[0] as any;
    log(`  Domain:   ${h.domain_slug}`);
    log(`  Subject:  ${h.subject_slug}`);
    log(`  Topic:    ${h.topic_slug}`);
    log(`  Subtopic: ${h.subtopic_slug}`);
    log('');
    
    log('COMPARISON:');
    log(`  Domain:   full-stack-development      vs ${h.domain_slug.padEnd(30)} ${h.domain_slug.startsWith('full-stack-development') ? '⚠️ SUFFIX DIFFERENCE' : '❌ MISMATCH'}`);
    log(`  Subject:  backend-development         vs ${h.subject_slug.padEnd(30)} ${'backend-development' === h.subject_slug ? '✅ MATCH' : '❌ MISMATCH'}`);
    log(`  Topic:    java                        vs ${h.topic_slug.padEnd(30)} ${'java' === h.topic_slug ? '✅ MATCH' : '❌ MISMATCH'}`);
    log(`  Subtopic: whatisjava                  vs ${h.subtopic_slug.padEnd(30)} ${'whatisjava' === h.subtopic_slug ? '✅ MATCH' : '❌ MISMATCH'}`);
  }
  
  results.push({
    step: 'url_comparison',
    findings: hierarchy.rows[0]
  });
}

async function step10_finalClassification(): Promise<void> {
  section('STEP 10 — FINAL CLASSIFICATION');
  
  log('Analysis complete. See detailed findings above.');
  log('');
  log('Classification will be determined based on:');
  log('  - Number of Java topics found');
  log('  - Subject hierarchy (Frontend vs Backend)');
  log('  - Sidebar existence');
  log('  - Navigation node existence');
  log('  - Tutorial section existence');
  log('');
}

async function main(): Promise<void> {
  console.log('');
  console.log('████████████████████████████████████████████████████████████');
  console.log('█                                                          █');
  console.log('█  PHASE 11.14C — JAVA IDENTITY FORENSIC TRACE            █');
  console.log('█  READ-ONLY DATABASE INVESTIGATION                       █');
  console.log('█                                                          █');
  console.log('████████████████████████████████████████████████████████████');
  console.log('');
  
  await step1_sidebarTableSchema();
  await step2_sidebarRowCounts();
  await step3_allJavaTopics();
  await step4_allJavaSubtopics();
  await step5_javaSidebarRows();
  await step6_javaNavigationNodes();
  await step7_tutorialSectionsSchema();
  await step8_javaTutorialSections();
  await step9_urlComparison();
  await step10_finalClassification();
  
  // Save results
  writeFileSync(
    'test-results/tutorial-v2/phase-11-14c-java-identity-trace.json',
    JSON.stringify(results, null, 2)
  );
  
  log('Results saved to: test-results/tutorial-v2/phase-11-14c-java-identity-trace.json');
  log('');
}

main().catch((error) => {
  console.error('');
  console.error('❌ TRACE FAILED');
  console.error('');
  console.error(error.message);
  console.error('');
  process.exitCode = 1;
});
