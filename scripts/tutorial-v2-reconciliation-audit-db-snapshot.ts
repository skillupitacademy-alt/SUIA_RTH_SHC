import { db } from '../packages/db-tutorial/src/db';

async function captureCompleteDBSnapshot() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TUTORIAL V2 DATABASE RECONCILIATION AUDIT');
  console.log('READ-ONLY SNAPSHOT');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. tutorial_sections columns
  console.log('─────────────────────────────────────────────────────────');
  console.log('1. tutorial_sections TABLE COLUMNS');
  console.log('─────────────────────────────────────────────────────────');
  
  const columns = await db.execute(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tutorial_sections'
    ORDER BY ordinal_position
  `);
  
  console.log(JSON.stringify(columns.rows, null, 2));
  
  // 2. tutorial_sections constraints
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('2. tutorial_sections CONSTRAINTS');
  console.log('─────────────────────────────────────────────────────────');
  
  const constraints = await db.execute(`
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
    AND tc.table_name = 'tutorial_sections'
    ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position
  `);
  
  console.log(JSON.stringify(constraints.rows, null, 2));
  
  // 3. tutorial_sections indexes
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('3. tutorial_sections INDEXES');
  console.log('─────────────────────────────────────────────────────────');
  
  const indexes = await db.execute(`
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'tutorial_sections'
    ORDER BY indexname
  `);
  
  console.log(JSON.stringify(indexes.rows, null, 2));
  
  // 4. Foreign keys TO tutorial_sections
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('4. FOREIGN KEYS REFERENCING tutorial_sections');
  console.log('─────────────────────────────────────────────────────────');
  
  const incomingFKs = await db.execute(`
    SELECT 
      tc.table_name AS referencing_table,
      kcu.column_name AS referencing_column,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'tutorial_sections'
    AND tc.table_schema = 'public'
  `);
  
  console.log(JSON.stringify(incomingFKs.rows, null, 2));
  
  // 5. Foreign keys FROM tutorial_sections
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('5. FOREIGN KEYS FROM tutorial_sections');
  console.log('─────────────────────────────────────────────────────────');
  
  const outgoingFKs = await db.execute(`
    SELECT 
      kcu.column_name AS column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tutorial_sections'
    AND tc.table_schema = 'public'
  `);
  
  console.log(JSON.stringify(outgoingFKs.rows, null, 2));
  
  // 6. Legacy tables check
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('6. LEGACY TUTORIAL TABLES');
  console.log('─────────────────────────────────────────────────────────');
  
  const legacyTables = await db.execute(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'tutorial_subsections',
      'tutorial_content',
      'tutorial_video_links',
      'tutorial_section_notes',
      'tutorial_section_laymen',
      'tutorial_section_technical',
      'tutorial_section_interviews',
      'tutorial_section_summaries',
      'tutorial_section_quizzes',
      'tutorial_section_projects'
    )
    ORDER BY table_name
  `);
  
  console.log(JSON.stringify(legacyTables.rows, null, 2));
  
  // 7. Enums
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('7. TUTORIAL-RELATED ENUMS');
  console.log('─────────────────────────────────────────────────────────');
  
  const enums = await db.execute(`
    SELECT 
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN (
      'section_type',
      'tutorial_difficulty',
      'subsection_type',
      'section_status'
    )
    ORDER BY t.typname, e.enumsortorder
  `);
  
  console.log(JSON.stringify(enums.rows, null, 2));
  
  // 8. Row counts
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('8. ROW COUNTS');
  console.log('─────────────────────────────────────────────────────────');
  
  const tutorialSectionsCount = await db.execute(`
    SELECT COUNT(*) as count FROM tutorial_sections
  `);
  
  console.log('tutorial_sections:', tutorialSectionsCount.rows[0]);
  
  // 9. Sample content structure
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('9. SAMPLE CONTENT STRUCTURE (First 3 rows)');
  console.log('─────────────────────────────────────────────────────────');
  
  const sampleContent = await db.execute(`
    SELECT 
      id,
      subtopic_id,
      brand_id,
      status,
      version,
      jsonb_typeof(content) as content_type,
      jsonb_array_length(content->'blocks') as blocks_count,
      created_at
    FROM tutorial_sections
    ORDER BY created_at DESC
    LIMIT 3
  `);
  
  console.log(JSON.stringify(sampleContent.rows, null, 2));
  
  // 10. V2 Identity Verification
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('10. V2 IDENTITY VERIFICATION');
  console.log('─────────────────────────────────────────────────────────');
  
  console.log('\nV2 EXPECTED:');
  console.log('  - UNIQUE(subtopic_id, brand_id)');
  console.log('  - NO section_type column');
  console.log('  - NO difficulty column in tutorial_sections');
  console.log('  - content is JSONB containing TutorialDocument');
  
  console.log('\nCHECKING...');
  
  const hasSubtopicId = columns.rows.some((col: any) => col.column_name === 'subtopic_id');
  const hasBrandId = columns.rows.some((col: any) => col.column_name === 'brand_id');
  const hasSectionType = columns.rows.some((col: any) => col.column_name === 'section_type');
  const hasDifficulty = columns.rows.some((col: any) => col.column_name === 'difficulty');
  const hasContent = columns.rows.some((col: any) => col.column_name === 'content');
  
  const hasV2UniqueConstraint = constraints.rows.some((c: any) => 
    c.constraint_name === 'uq_tutorial_v2_identity' ||
    c.constraint_name === 'tutorial_sections_subtopic_id_brand_id_unique'
  );
  
  console.log('\n✓ RESULTS:');
  console.log(`  subtopic_id column: ${hasSubtopicId ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  brand_id column: ${hasBrandId ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  content column: ${hasContent ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`  section_type column: ${hasSectionType ? '❌ EXISTS (V1)' : '✅ REMOVED (V2)'}`);
  console.log(`  difficulty column: ${hasDifficulty ? '❌ EXISTS (V1)' : '✅ REMOVED (V2)'}`);
  console.log(`  V2 UNIQUE constraint: ${hasV2UniqueConstraint ? '✅ EXISTS' : '❌ MISSING'}`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('DATABASE SNAPSHOT COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  process.exit(0);
}

captureCompleteDBSnapshot().catch(console.error);
