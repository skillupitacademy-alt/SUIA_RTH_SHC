import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

try {
  console.log('\n=== SCHEMA COMPARISON: CODE vs PRODUCTION ===\n');
  
  // Expected tables from schema files
  const expectedTables = [
    // Legacy system (in code)
    'tutorial_content',
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_content_versions',
    'tutorial_content_audit',
    'tutorial_assignments',
    'assignment_progress',
    'assignment_help_requests',
    'tutorial_projects',
    'tutorial_project_submissions',
    'tutorial_progress',
    'tutorial_video_links',
    'badges',
    'student_badges',
    'certificates',
    'remediation_triggers',
    'domain_content_config',
    'content_generation_jobs',
    'subtopic_flow_progress',
    'student_streaks',
    'live_session_requests',
    
    // Phase 1 P0 (in code)
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
  
  // Get actual tables from production
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  const actualTables = result.rows.map(r => r.table_name);
  
  console.log('📊 EXPECTED (from code): ' + expectedTables.length + ' tables');
  console.log('📊 ACTUAL (production): ' + actualTables.length + ' tables\n');
  
  // Find missing tables (in code but not in production)
  const missingTables = expectedTables.filter(t => !actualTables.includes(t));
  
  // Find extra tables (in production but not in code)
  const extraTables = actualTables.filter(t => !expectedTables.includes(t));
  
  if (missingTables.length > 0) {
    console.log('❌ MISSING IN PRODUCTION (' + missingTables.length + ' tables):');
    missingTables.forEach(t => console.log('   - ' + t));
    console.log('');
  }
  
  if (extraTables.length > 0) {
    console.log('⚠️  EXTRA IN PRODUCTION (' + extraTables.length + ' tables):');
    extraTables.forEach(t => console.log('   - ' + t));
    console.log('');
  }
  
  const matchingTables = expectedTables.filter(t => actualTables.includes(t));
  console.log('✅ MATCHING (' + matchingTables.length + ' tables):');
  matchingTables.forEach(t => console.log('   - ' + t));
  
  // Determine which migration created the database
  console.log('\n=== MIGRATION ANALYSIS ===\n');
  
  if (missingTables.includes('tutorial_sections')) {
    console.log('🔍 Phase 1 P0 modular system NOT deployed');
    console.log('   Migrations 0000-0010 exist but were never applied');
  }
  
  if (actualTables.includes('tutorial_content') && !actualTables.includes('tutorial_sections')) {
    console.log('🔍 Database appears to be created from LEGACY schema only');
    console.log('   Likely created manually or from early migration (0000-0006)');
  }
  
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  await pool.end();
}
