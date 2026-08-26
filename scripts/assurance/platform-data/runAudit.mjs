#!/usr/bin/env node

/**
 * Phase 0A Complete Database Audit Runner
 * Orchestrates the complete database catalog audit
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { auditAllDatabases } from './postgresCatalogAudit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

async function main() {
  console.log('\n🔍 PHASE 0A - COMPLETE DATABASE CATALOG AUDIT\n');
  console.log('This will connect to actual PostgreSQL databases and inspect catalog metadata.');
  console.log('READ-ONLY operations only - no data will be modified.\n');
  
  try {
    // Run the audit
    const results = await auditAllDatabases();
    
    // Generate evidence artifact
    const evidence = {
      auditVersion: '0A',
      generatedAt: new Date().toISOString(),
      databases: results,
    };
    
    // Create evidence directory
    const evidencePath = join(PROJECT_ROOT, 'docs', 'architecture', 'evidence');
    mkdirSync(evidencePath, { recursive: true });
    
    // Write evidence file
    const evidenceFile = join(evidencePath, 'platform-database-catalog.json');
    writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
    
    console.log(`\n💾 Evidence artifact written to: docs/architecture/evidence/platform-database-catalog.json`);
    
    // Summary
    const reachable = results.filter(r => r.reachable);
    const unreachable = results.filter(r => !r.reachable);
    
    console.log('\n' + '='.repeat(60));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nDatabases audited: ${results.length}`);
    console.log(`Reachable: ${reachable.length}`);
    console.log(`Unreachable: ${unreachable.length}`);
    
    if (reachable.length > 0) {
      console.log('\n✅ Successfully Audited:');
      for (const db of reachable) {
        console.log(`\n  ${db.logicalName}`);
        console.log(`    Tables: ${db.tables.length}`);
        console.log(`    Primary Keys: ${db.primaryKeys?.length || 0}`);
        console.log(`    Foreign Keys: ${db.foreignKeys?.length || 0}`);
        console.log(`    Unique Constraints: ${db.uniqueConstraints?.length || 0}`);
        console.log(`    Indexes: ${db.indexes?.length || 0}`);
        console.log(`    Size: ${db.metadata.databaseSizeMB} MB`);
      }
    }
    
    if (unreachable.length > 0) {
      console.log('\n❌ Unreachable:');
      for (const db of unreachable) {
        console.log(`  ${db.logicalName}: ${db.error.message}`);
      }
    }
    
    console.log('\n✅ Phase 0A audit complete. Run assurance to verify.');
    
  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
