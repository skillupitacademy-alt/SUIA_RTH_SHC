import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SCHEMA FORENSIC AUDIT');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================================
  // TUTORIAL_TOPICS SCHEMA
  // ============================================================
  console.log('1. TUTORIAL_TOPICS SCHEMA (TutorialDB)\n');
  
  const tutorialTopicsSchema = await tutorialPool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'tutorial_topics'
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  tutorialTopicsSchema.rows.forEach(col => {
    console.log(`  ${col.column_name}`);
    console.log(`    Type: ${col.data_type}`);
    console.log(`    Nullable: ${col.is_nullable}`);
    if (col.column_default) console.log(`    Default: ${col.column_default}`);
  });

  // Check for foreign keys
  const tutorialTopicsFKs = await tutorialPool.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tutorial_topics'
  `);

  if (tutorialTopicsFKs.rows.length > 0) {
    console.log('\n  Foreign Keys:');
    tutorialTopicsFKs.rows.forEach(fk => {
      console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  } else {
    console.log('\n  Foreign Keys: NONE');
  }

  // Check for unique constraints
  const tutorialTopicsUnique = await tutorialPool.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      AND tc.table_name = 'tutorial_topics'
  `);

  console.log('\n  Unique/PK Constraints:');
  tutorialTopicsUnique.rows.forEach(uc => {
    console.log(`    ${uc.constraint_name}: ${uc.column_name}`);
  });

  // ============================================================
  // TUTORIAL_SIDEBAR_TREES_V2 SCHEMA
  // ============================================================
  console.log('\n\n2. TUTORIAL_SIDEBAR_TREES_V2 SCHEMA (TutorialDB)\n');
  
  const sidebarSchema = await tutorialPool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'tutorial_sidebar_trees_v2'
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  sidebarSchema.rows.forEach(col => {
    console.log(`  ${col.column_name}`);
    console.log(`    Type: ${col.data_type}`);
    console.log(`    Nullable: ${col.is_nullable}`);
    if (col.column_default) console.log(`    Default: ${col.column_default}`);
  });

  const sidebarFKs = await tutorialPool.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tutorial_sidebar_trees_v2'
  `);

  if (sidebarFKs.rows.length > 0) {
    console.log('\n  Foreign Keys:');
    sidebarFKs.rows.forEach(fk => {
      console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  } else {
    console.log('\n  Foreign Keys: NONE');
  }

  const sidebarUnique = await tutorialPool.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      AND tc.table_name = 'tutorial_sidebar_trees_v2'
    ORDER BY tc.constraint_type, tc.constraint_name
  `);

  console.log('\n  Unique/PK Constraints:');
  const constraints = {};
  sidebarUnique.rows.forEach(uc => {
    if (!constraints[uc.constraint_name]) {
      constraints[uc.constraint_name] = [];
    }
    constraints[uc.constraint_name].push(uc.column_name);
  });
  Object.entries(constraints).forEach(([name, cols]) => {
    console.log(`    ${name}: (${cols.join(', ')})`);
  });

  // ============================================================
  // MAIN DB TOPICS SCHEMA
  // ============================================================
  console.log('\n\n3. TOPICS SCHEMA (MainDB)\n');
  
  const mainTopicsSchema = await mainPool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'topics'
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  mainTopicsSchema.rows.forEach(col => {
    console.log(`  ${col.column_name}`);
    console.log(`    Type: ${col.data_type}`);
    console.log(`    Nullable: ${col.is_nullable}`);
    if (col.column_default) console.log(`    Default: ${col.column_default}`);
  });

  const mainTopicsFKs = await mainPool.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'topics'
  `);

  if (mainTopicsFKs.rows.length > 0) {
    console.log('\n  Foreign Keys:');
    mainTopicsFKs.rows.forEach(fk => {
      console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  } else {
    console.log('\n  Foreign Keys: NONE');
  }

  await tutorialPool.end();
  await mainPool.end();
} catch (error) {
  console.error('Error:', error.message);
  await tutorialPool.end();
  await mainPool.end();
  process.exit(1);
}
