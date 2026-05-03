import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  console.log('\n=== TUTORIAL DATABASE MIGRATION STATUS ===\n');
  
  // Check if drizzle migrations table exists
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '__drizzle_migrations'
    ) as exists
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('❌ __drizzle_migrations table NOT FOUND');
    console.log('   This means Drizzle migrations have NEVER been run on this database.\n');
  } else {
    console.log('✅ __drizzle_migrations table exists\n');
    
    // Get applied migrations
    const migrations = await pool.query(`
      SELECT id, hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at ASC
    `);
    
    console.log(`Applied migrations: ${migrations.rows.length}\n`);
    migrations.rows.forEach((m, i) => {
      console.log(`${i + 1}. ${m.hash}`);
      console.log(`   Created: ${m.created_at}`);
    });
  }
  
  // Check for specific Phase 1 P0 tables
  console.log('\n=== PHASE 1 P0 TABLE CHECK ===\n');
  
  const p1Tables = [
    'tutorial_sections',
    'tutorial_subsections',
    'educational_architectures',
    'ui_architectures',
    'ai_generation_orchestration',
    'ai_section_generation_jobs',
    'prompt_templates',
    'content_review_queue',
    'content_deployments',
    'ai_generation_metrics',
    'analytics_learning_metrics',
    'analytics_architecture_performance',
    'analytics_brand_business'
  ];
  
  for (const table of p1Tables) {
    const exists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `, [table]);
    
    const status = exists.rows[0].exists ? '✅' : '❌';
    console.log(`${status} ${table}`);
  }
  
  // Check for enums
  console.log('\n=== ENUM CHECK ===\n');
  
  const enums = await pool.query(`
    SELECT typname 
    FROM pg_type 
    WHERE typtype = 'e' 
    ORDER BY typname
  `);
  
  console.log(`Total enums: ${enums.rows.length}\n`);
  enums.rows.forEach(e => console.log(`  - ${e.typname}`));
  
} catch (err) {
  console.error('ERROR:', err.message);
  console.error(err);
} finally {
  await pool.end();
}
