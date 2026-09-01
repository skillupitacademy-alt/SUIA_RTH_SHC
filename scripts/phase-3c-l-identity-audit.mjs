import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('PHASE 3C-L: CANONICAL JAVA IDENTITY RECONSTRUCTION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================================
  // PART 1 — MAINDB: RESOLVE BOTH UUIDS
  // ============================================================
  console.log('PART 1 — MAINDB: RESOLVE BOTH UUIDS\n');
  
  const mainBothUuids = await mainPool.query(`
    SELECT
      t.id,
      t.subject_id,
      t.name,
      t.status,
      t.deleted_at,
      t.tutorial_sync_status,
      s.name as subject_name,
      d.name as domain_name
    FROM topics t
    LEFT JOIN subjects s ON s.id = t.subject_id
    LEFT JOIN domains d ON d.id = s.domain_id
    WHERE t.id IN (
      'fb47747d-ac1c-4091-bd8e-a8a7d7378e07',
      '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
    )
    ORDER BY t.created_at
  `);

  console.log('MainDB Topics (both UUIDs):');
  if (mainBothUuids.rows.length === 0) {
    console.log('  ❌ NEITHER UUID exists in MainDB topics table');
  } else {
    mainBothUuids.rows.forEach(row => {
      console.log(`\n  Topic: ${row.name}`);
      console.log(`    ID: ${row.id}`);
      console.log(`    Subject: ${row.subject_name}`);
      console.log(`    Domain: ${row.domain_name}`);
      console.log(`    Status: ${row.status}`);
      console.log(`    Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log(`    Tutorial Sync: ${row.tutorial_sync_status}`);
    });
  }

  // ============================================================
  // PART 2 — MAINDB JAVA LOOKUP BY NAME
  // ============================================================
  console.log('\n\n' + '═'.repeat(60));
  console.log('PART 2 — MAINDB JAVA LOOKUP BY NAME\n');
  
  const mainJava = await mainPool.query(`
    SELECT
      t.id,
      t.name,
      t.subject_id,
      t.status,
      t.deleted_at,
      t.tutorial_sync_status,
      t.created_at,
      s.name as subject_name,
      d.name as domain_name
    FROM topics t
    LEFT JOIN subjects s ON s.id = t.subject_id
    LEFT JOIN domains d ON d.id = s.domain_id
    WHERE lower(t.name) = 'java'
    ORDER BY t.created_at
  `);

  console.log('MainDB Java Topics (by name):');
  if (mainJava.rows.length === 0) {
    console.log('  ❌ NO Java topic found in MainDB');
  } else {
    console.log(`  Found ${mainJava.rows.length} row(s):\n`);
    mainJava.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Subject: ${row.subject_name}`);
      console.log(`     Domain: ${row.domain_name}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });
  }

  // Store authoritative Java ID
  const authoritativeJavaId = mainJava.rows.length > 0 ? mainJava.rows[0].id : null;
  if (authoritativeJavaId) {
    console.log(`✅ AUTHORITATIVE MainDB Java ID: ${authoritativeJavaId}\n`);
  }

  // ============================================================
  // PART 3 — TUTORIALDB JAVA MAPPINGS
  // ============================================================
  console.log('═'.repeat(60));
  console.log('PART 3 — TUTORIALDB JAVA MAPPINGS\n');
  
  const tutorialBothUuids = await tutorialPool.query(`
    SELECT
      id,
      external_id,
      subject_id,
      name,
      slug,
      deleted_at,
      created_at,
      updated_at
    FROM tutorial_topics
    WHERE id IN (
      'fb47747d-ac1c-4091-bd8e-a8a7d7378e07',
      '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
    )
    OR external_id IN (
      'fb47747d-ac1c-4091-bd8e-a8a7d7378e07',
      '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
    )
    ORDER BY created_at
  `);

  console.log('TutorialDB Topics (both UUIDs as id OR external_id):');
  if (tutorialBothUuids.rows.length === 0) {
    console.log('  ❌ NEITHER UUID exists in TutorialDB tutorial_topics');
  } else {
    console.log(`  Found ${tutorialBothUuids.rows.length} row(s):\n`);
    tutorialBothUuids.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name}`);
      console.log(`     Internal ID: ${row.id}`);
      console.log(`     External ID: ${row.external_id}`);
      console.log(`     Slug: ${row.slug}`);
      console.log(`     Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });
  }

  // ============================================================
  // PART 4 — TUTORIALDB JAVA BY NAME
  // ============================================================
  console.log('═'.repeat(60));
  console.log('PART 4 — TUTORIALDB JAVA BY NAME\n');
  
  const tutorialJava = await tutorialPool.query(`
    SELECT
      id,
      external_id,
      subject_id,
      name,
      slug,
      deleted_at,
      created_at,
      updated_at
    FROM tutorial_topics
    WHERE lower(name) = 'java'
    ORDER BY created_at
  `);

  console.log('TutorialDB Java Topics (by name):');
  if (tutorialJava.rows.length === 0) {
    console.log('  ❌ NO Java topic in TutorialDB');
  } else {
    console.log(`  Found ${tutorialJava.rows.length} row(s):\n`);
    tutorialJava.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name}`);
      console.log(`     Internal ID: ${row.id}`);
      console.log(`     External ID: ${row.external_id}`);
      console.log(`     Slug: ${row.slug}`);
      console.log(`     Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });
  }

  // ============================================================
  // PART 5 — VERIFY ARCHITECTURAL INVARIANT
  // ============================================================
  console.log('═'.repeat(60));
  console.log('PART 5 — VERIFY ARCHITECTURAL INVARIANT\n');
  console.log('Architecture Contract:');
  console.log('  MainDB topics.id → TutorialDB tutorial_topics.external_id\n');

  if (!authoritativeJavaId) {
    console.log('❌ CANNOT VERIFY: No Java topic in MainDB');
  } else if (tutorialJava.rows.length === 0) {
    console.log('❌ CANNOT VERIFY: No Java topic in TutorialDB');
  } else {
    console.log('Checking invariant for each TutorialDB Java row:\n');
    tutorialJava.rows.forEach((row, i) => {
      const matches = row.external_id === authoritativeJavaId;
      const status = matches ? '✅ PASS' : '❌ FAIL';
      console.log(`  Row ${i + 1}: ${row.name}`);
      console.log(`    tutorial_topics.external_id = ${row.external_id}`);
      console.log(`    MainDB Java topics.id       = ${authoritativeJavaId}`);
      console.log(`    Match: ${status}`);
      if (!matches) {
        console.log(`    ⚠️  INVARIANT VIOLATION DETECTED`);
      }
      console.log('');
    });
  }

  // ============================================================
  // PART 6 — RESOLVE SIDEBAR RECORDS
  // ============================================================
  console.log('═'.repeat(60));
  console.log('PART 6 — RESOLVE SIDEBAR RECORDS\n');
  
  const sidebarBothUuids = await tutorialPool.query(`
    SELECT
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version,
      published_at,
      created_at,
      updated_at
    FROM tutorial_sidebar_trees_v2
    WHERE topic_id IN (
      'fb47747d-ac1c-4091-bd8e-a8a7d7378e07',
      '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
    )
    ORDER BY created_at
  `);

  console.log('Sidebars with topic_id matching either UUID:');
  if (sidebarBothUuids.rows.length === 0) {
    console.log('  ❌ NO sidebar records with either UUID');
  } else {
    console.log(`  Found ${sidebarBothUuids.rows.length} row(s):\n`);
    sidebarBothUuids.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. Sidebar ${row.id}`);
      console.log(`     Brand: ${row.brand_id}`);
      console.log(`     Topic ID: ${row.topic_id}`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Version: ${row.version}`);
      console.log(`     Published: ${row.published_at || 'N/A'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });
  }

  console.log('All Published Sidebars:');
  const publishedSidebars = await tutorialPool.query(`
    SELECT
      id,
      brand_id,
      domain_id,
      subject_id,
      topic_id,
      active_subtopic_id,
      status,
      version,
      published_at,
      created_at
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
    ORDER BY created_at
  `);

  if (publishedSidebars.rows.length === 0) {
    console.log('  ❌ NO published sidebars');
  } else {
    console.log(`  Found ${publishedSidebars.rows.length} published sidebar(s):\n`);
    publishedSidebars.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. Sidebar ${row.id}`);
      console.log(`     Brand: ${row.brand_id}`);
      console.log(`     Topic ID: ${row.topic_id}`);
      console.log(`     Version: ${row.version}`);
      console.log(`     Published: ${row.published_at}`);
      console.log('');
    });
  }

  // ============================================================
  // PART 7 — RESOLVE SIDEBAR TOPIC_ID AGAINST ALL IDENTITIES
  // ============================================================
  console.log('═'.repeat(60));
  console.log('PART 7 — SIDEBAR TOPIC_ID IDENTITY RESOLUTION\n');

  if (publishedSidebars.rows.length === 0) {
    console.log('No published sidebars to analyze');
  } else {
    console.log('| Sidebar ID | topic_id | MainDB Match | TutorialDB ID Match | TutorialDB Ext Match |');
    console.log('|------------|----------|--------------|---------------------|----------------------|');
    
    for (const sidebar of publishedSidebars.rows) {
      const topicId = sidebar.topic_id;
      
      // Check MainDB match
      const mainMatch = mainJava.rows.some(r => r.id === topicId) ? '✅ YES' : '❌ NO';
      
      // Check TutorialDB internal ID match
      const tutorialIdMatch = tutorialJava.rows.some(r => r.id === topicId) ? '✅ YES' : '❌ NO';
      
      // Check TutorialDB external_id match
      const tutorialExtMatch = tutorialJava.rows.some(r => r.external_id === topicId) ? '✅ YES' : '❌ NO';
      
      console.log(`| ${sidebar.id.substring(0, 8)}... | ${topicId.substring(0, 8)}... | ${mainMatch} | ${tutorialIdMatch} | ${tutorialExtMatch} |`);
    }
    console.log('');
  }

  await mainPool.end();
  await tutorialPool.end();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('PART 1-7 COMPLETE - Continue with code inspection...');
  console.log('═══════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  await mainPool.end();
  await tutorialPool.end();
  process.exit(1);
}
