#!/usr/bin/env node

/**
 * Phase 0A.2.1 Complete Catalog Audit Runner
 * 
 * Audits ALL 7 production databases.
 * PASS requires: 7 configured, 7 reachable, 7 audited, 7 identity-verified.
 * 
 * READ-ONLY operations only.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  discoverAllDatabases,
  sanitizeDiscovery,
  assertCompleteDiscovery,
} from './completeDatabaseDiscovery.mjs';

import { auditAllDatabases } from './postgresCatalogAuditV2.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

const EVIDENCE_DIR = join(PROJECT_ROOT, 'docs', 'architecture', 'evidence');
const EVIDENCE_FILE = join(EVIDENCE_DIR, 'complete-platform-catalog.json');

function createEvidence(discovery, audits) {
  const discoveryMap = new Map(discovery.map(d => [d.logicalName, d]));
  
  return {
    auditVersion: '0A.2.1',
    generatedAt: new Date().toISOString(),
    scope: 'ALL_CONFIGURED_PLATFORM_DATABASES',
    
    security: {
      credentialsIncluded: false,
      readOnly: true,
    },
    
    summary: {
      databasesDiscovered: discovery.length,
      databasesConfigured: discovery.filter(d => d.configured).length,
      databasesReachable: audits.filter(d => d.reachable).length,
      databasesAudited: audits.filter(d => d.audited).length,
      databasesWithIdentityMatch: audits.filter(d => d.databaseIdentityMatch).length,
    },
    
    databases: audits.map(audit => ({
      ...audit,
      discovery: sanitizeDiscovery(discoveryMap.get(audit.logicalName)),
    })),
  };
}

function validateResults(discovery, audits) {
  assertCompleteDiscovery(discovery);
  
  if (discovery.length !== 7) {
    throw new Error(`Expected 7 databases, discovered ${discovery.length}`);
  }
  
  const configured = discovery.filter(d => d.configured);
  if (configured.length !== 7) {
    throw new Error(`Expected 7 configured, found ${configured.length}`);
  }
  
  const reachable = audits.filter(d => d.reachable);
  if (reachable.length !== 7) {
    const unreachable = audits.filter(d => !d.reachable).map(d => d.logicalName);
    throw new Error(`Only ${reachable.length}/7 reachable. Unreachable: ${unreachable.join(', ')}`);
  }
  
  const audited = audits.filter(d => d.audited);
  if (audited.length !== 7) {
    const failed = audits.filter(d => !d.audited).map(d => d.logicalName);
    throw new Error(`Only ${audited.length}/7 audited. Failed: ${failed.join(', ')}`);
  }
  
  const identityMatched = audits.filter(d => d.databaseIdentityMatch);
  if (identityMatched.length !== 7) {
    const mismatched = audits.filter(d => !d.databaseIdentityMatch).map(d => d.logicalName);
    throw new Error(`Only ${identityMatched.length}/7 identity-verified. Mismatched: ${mismatched.join(', ')}`);
  }
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('PHASE 0A.2.1 — COMPLETE 7-DATABASE CATALOG AUDIT');
  console.log('============================================================');
  console.log('');
  console.log('READ-ONLY PostgreSQL metadata inspection.');
  console.log('No schema or application data will be modified.');
  console.log('');
  
  // STEP 1: Discovery
  console.log('🔎 STEP 1 — DATABASE DISCOVERY');
  const discovery = discoverAllDatabases();
  console.log(`   Discovered: ${discovery.length}`);
  
  const configured = discovery.filter(d => d.configured);
  console.log(`   Configured: ${configured.length}`);
  
  // STEP 2: Catalog audit
  console.log('');
  console.log('🔎 STEP 2 — ACTUAL POSTGRESQL CATALOG AUDIT');
  const audits = await auditAllDatabases(discovery);
  
  // STEP 3: Evidence
  const evidence = createEvidence(discovery, audits);
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2), 'utf8');
  
  console.log('');
  console.log(`💾 Evidence: ${EVIDENCE_FILE}`);
  
  // STEP 4: Validation
  console.log('');
  console.log('🔎 STEP 3 — FINAL VALIDATION');
  
  try {
    validateResults(discovery, audits);
    
    console.log('   ✅ 7/7 configured');
    console.log('   ✅ 7/7 reachable');
    console.log('   ✅ 7/7 catalog audited');
    console.log('   ✅ 7/7 database identities verified');
    
    console.log('');
    console.log('============================================================');
    console.log('✅ PHASE 0A.2.1 PASS');
    console.log('============================================================');
    console.log('');
    console.log('All seven production databases have actual PostgreSQL');
    console.log('catalog evidence.');
    console.log('');
    
    process.exitCode = 0;
    
  } catch (error) {
    console.error('');
    console.error('============================================================');
    console.error('❌ PHASE 0A.2.1 BLOCKED');
    console.error('============================================================');
    console.error('');
    console.error(error.message);
    console.error('');
    console.error('The architecture decision must remain blocked.');
    console.error('');
    
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('\n❌ Fatal audit failure:', error.message);
  process.exitCode = 1;
});
