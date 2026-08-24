#!/usr/bin/env tsx
/**
 * SYNC COMPLETE PYTHON SUBTOPIC - Production Service
 * 
 * Uses HierarchySyncService.sync() to synchronize "Complete Python" subtopic.
 * 
 * This invokes the SAME production sync logic that runs automatically on
 * create/update operations via API routes.
 * 
 * Root cause: Subtopic existed before auto-sync was implemented.
 * Fix: One-time manual sync using production service.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment
config({ path: resolve(process.cwd(), '.env.local') });

const COMPLETE_PYTHON_SUBTOPIC_ID = '5b1cfc3d-8744-4ae6-903c-ea79aaf648a0';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   SYNC COMPLETE PYTHON VIA HierarchySyncService         ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function sync() {
  try {
    console.log('[STEP 1] Import HierarchySyncService...\n');
    
    // Dynamic import to ensure DB connections are initialized after env is loaded
    const { HierarchySyncService } = await import(
      '../apps/api-server/src/modules/hierarchy/hierarchy-sync.service.js'
    );

    console.log('✅ Service loaded\n');

    console.log('[STEP 2] Sync subtopic via production service...\n');
    console.log(`   Subtopic ID: ${COMPLETE_PYTHON_SUBTOPIC_ID}`);
    console.log('   Invoking: HierarchySyncService.sync("subtopic", id)\n');

    const startTime = Date.now();
    await HierarchySyncService.sync('subtopic', COMPLETE_PYTHON_SUBTOPIC_ID);
    const duration = Date.now() - startTime;

    console.log(`✅ Sync completed in ${duration}ms\n`);

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ SYNC COMPLETE');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('The HierarchySyncService has:');
    console.log('1. ✅ Synced domain → tutorial_domains');
    console.log('2. ✅ Synced subject → tutorial_subjects');
    console.log('3. ✅ Synced topic → tutorial_topics');
    console.log('4. ✅ Synced subtopic → tutorial_subtopics (external_id mapping)');
    console.log('5. ✅ Updated MainDB sync status\n');

    console.log('Next step:');
    console.log('  Run: node scripts/diagnose-completpython-mapping.mjs');
    console.log('  Expected: tutorial_subtopics mapping now exists\n');

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    
    if (error.message?.includes('Cannot find module')) {
      console.error('\n💡 Tip: The service might need to be compiled first.');
      console.error('   Try: cd apps/api-server && pnpm build\n');
    }
    
    process.exit(1);
  }
}

sync();
