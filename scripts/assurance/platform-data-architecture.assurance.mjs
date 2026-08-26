#!/usr/bin/env node

/**
 * Phase 0A: Platform Data Architecture Assurance
 * Validates that ACTUAL database catalog audit was completed correctly
 * 
 * CRITICAL: Configuration discovery is NOT sufficient
 * This assurance requires ACTUAL PostgreSQL connection + catalog inspection
 * 
 * GATE CRITERIA:
 * - Actual PostgreSQL connections attempted
 * - Actual catalog metadata retrieved
 * - Evidence artifact exists with real database results
 * - tutorial_sections identity verified from actual database
 * - navigation_node_id column verified
 * - All audit modules <= 600 lines
 * - No credentials exposed
 * - Read-only compliance
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

let failures = [];
let warnings = [];

function check(description, assertion) {
  if (!assertion) {
    failures.push(description);
    console.error(`❌ ${description}`);
  } else {
    console.log(`✅ ${description}`);
  }
}

function warn(description) {
  warnings.push(description);
  console.warn(`⚠️  ${description}`);
}

function fileExists(relativePath) {
  return existsSync(join(PROJECT_ROOT, relativePath));
}

function getLineCount(relativePath) {
  const fullPath = join(PROJECT_ROOT, relativePath);
  if (!existsSync(fullPath)) return 0;
  const content = readFileSync(fullPath, 'utf-8');
  return content.split('\n').length;
}

console.log('\n🔍 PHASE 0A.1 ASSURANCE: PostgreSQL Catalog Discovery\n');
console.log('Scope: Configured databases only (Phase 0A.2 will audit platform-wide)\n');

// ============================================================
// CRITICAL: ACTUAL DATABASE EVIDENCE
// ============================================================

console.log('📊 Checking ACTUAL database catalog evidence...');

const evidencePath = join(PROJECT_ROOT, 'docs', 'architecture', 'evidence', 'platform-database-catalog.json');

if (!existsSync(evidencePath)) {
  failures.push('CRITICAL: Actual database catalog evidence not found');
  failures.push('  Expected: docs/architecture/evidence/platform-database-catalog.json');
  failures.push('  Run: node scripts/assurance/platform-data/runAudit.mjs');
  console.error('❌ CRITICAL: Actual database evidence MISSING');
  console.error('   Configuration discovery alone is INSUFFICIENT for Phase 0A');
} else {
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf-8'));
  
  check('Evidence artifact exists', true);
  check('Evidence has audit version', !!evidence.auditVersion);
  check('Evidence has generated timestamp', !!evidence.generatedAt);
  check('Evidence has databases array', Array.isArray(evidence.databases));
  
  if (evidence.databases && evidence.databases.length > 0) {
    const reachable = evidence.databases.filter(db => db.reachable);
    const unreachable = evidence.databases.filter(db => !db.reachable);
    
    console.log(`\n📈 Database Audit Results:`);
    console.log(`   Total databases: ${evidence.databases.length}`);
    console.log(`   Successfully audited: ${reachable.length}`);
    console.log(`   Unreachable: ${unreachable.length}`);
    
    check(
      `All expected configured databases audited (${reachable.length}/${evidence.databases.length})`,
      reachable.length === evidence.databases.length
    );
    
    if (reachable.length < evidence.databases.length) {
      failures.push('Some configured databases are unreachable - cannot verify complete schema');
    }
    
    // Verify each reachable database has actual catalog data
    for (const db of reachable) {
      console.log(`\n   ${db.logicalName}:`);
      console.log(`      Tables: ${db.tables?.length || 0}`);
      console.log(`      PKs: ${db.primaryKeys?.length || 0}`);
      console.log(`      FKs: ${db.foreignKeys?.length || 0}`);
      console.log(`      Unique constraints: ${db.uniqueConstraints?.length || 0}`);
      console.log(`      Indexes: ${db.indexes?.length || 0}`);
      console.log(`      Size: ${db.metadata?.databaseSizeMB || 0} MB`);
      
      check(
        `${db.logicalName} has table inventory`,
        db.tables && db.tables.length > 0
      );
      check(
        `${db.logicalName} has constraint inventory`,
        db.primaryKeys !== undefined
      );
      check(
        `${db.logicalName} has index inventory`,
        db.indexes !== undefined
      );
    }
    
    // CRITICAL: Verify tutorial_prod was audited
    const tutorialDb = reachable.find(db => db.logicalName === 'tutorial_prod');
    
    if (!tutorialDb) {
      failures.push('tutorial_prod database not successfully audited');
      failures.push('  tutorial_prod is REQUIRED for Phase 1 Navigation Identity');
      console.error('\n❌ CRITICAL: tutorial_prod NOT audited');
    } else {
      console.log('\n✅ tutorial_prod successfully audited');
      
      // Verify tutorial_sections table
      const tutorialSections = tutorialDb.tables?.find(t => t.table === 'tutorial_sections');
      
      check(
        'tutorial_sections table inventoried',
        !!tutorialSections
      );
      
      if (tutorialSections) {
        const navNodeCol = tutorialSections.columns?.find(c => c.name === 'navigation_node_id');
        
        check(
          'navigation_node_id column exists in tutorial_sections',
          !!navNodeCol
        );
        
        if (navNodeCol) {
          console.log(`   Column details: ${navNodeCol.dataType}, nullable=${navNodeCol.nullable}`);
        }
        
        // Verify unique constraint from actual database
        const uniqueIndex = tutorialDb.indexes?.find(idx => 
          idx.table === 'tutorial_sections' && 
          idx.indexName === 'uq_tutorial_v2_identity_active'
        );
        
        if (uniqueIndex) {
          console.log('   ✅ Unique constraint verified: uq_tutorial_v2_identity_active');
          console.log('      Definition:', uniqueIndex.definition.substring(0, 100) + '...');
        } else {
          warn('Expected unique index uq_tutorial_v2_identity_active not found');
        }
      }
    }
    
    if (unreachable.length > 0) {
      warn(`${unreachable.length} databases unreachable: ${unreachable.map(db => db.logicalName).join(', ')}`);
    }
  } else {
    failures.push('Evidence artifact contains no database results');
    console.error('❌ Evidence exists but is EMPTY');
  }
}

// ============================================================
// 2. AUDIT MODULES EXIST
// ============================================================

console.log('\n📁 Checking audit modules...');

check(
  'Configuration discovery module exists',
  fileExists('scripts/assurance/platform-data/configuredDatabaseDiscovery.mjs')
);

check(
  'PostgreSQL catalog audit module exists',
  fileExists('scripts/assurance/platform-data/postgresCatalogAudit.mjs')
);

check(
  'Audit runner exists',
  fileExists('scripts/assurance/platform-data/runAudit.mjs')
);

check(
  'Critical questions investigator exists',
  fileExists('scripts/assurance/platform-data/criticalQuestions.mjs')
);

// ============================================================
// 3. DOCUMENTATION EXISTS
// ============================================================

console.log('\n📄 Checking documentation...');

check(
  'DATABASE-ARCHITECTURE.md exists',
  fileExists('docs/architecture/DATABASE-ARCHITECTURE.md')
);

check(
  'DATABASE-INVENTORY.md exists',
  fileExists('docs/architecture/DATABASE-INVENTORY.md')
);

// ============================================================
// 4. 600-LINE RULE COMPLIANCE
// ============================================================

console.log('\n📏 Checking 600-line rule compliance...');

const auditFiles = [
  'scripts/assurance/platform-data/configuredDatabaseDiscovery.mjs',
  'scripts/assurance/platform-data/postgresCatalogAudit.mjs',
  'scripts/assurance/platform-data/runAudit.mjs',
  'scripts/assurance/platform-data/criticalQuestions.mjs',
  'scripts/assurance/platform-data-architecture.assurance.mjs',
];

for (const file of auditFiles) {
  if (fileExists(file)) {
    const lines = getLineCount(file);
    const fileName = file.split('/').pop();
    check(
      `${fileName} is ≤ 600 lines (${lines} lines)`,
      lines <= 600
    );
  }
}

// ============================================================
// 5. READ-ONLY COMPLIANCE
// ============================================================

console.log('\n🔒 Checking read-only compliance...');

const dangerousPatterns = [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bTRUNCATE\b/i,
  /\bDROP\s+(TABLE|DATABASE)\b/i,
  /\bALTER\s+(TABLE|DATABASE)\b/i,
  /\bCREATE\s+(TABLE|INDEX)\b/i,
];

for (const file of auditFiles.filter(f => f.includes('Audit') || f.includes('probe') || f.includes('Questions'))) {
  if (fileExists(file)) {
    const content = readFileSync(join(PROJECT_ROOT, file), 'utf-8');
    const fileName = file.split('/').pop();
    
    let hasDangerousOperation = false;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        failures.push(`${fileName} contains dangerous operation: ${pattern}`);
        hasDangerousOperation = true;
      }
    }
    
    if (!hasDangerousOperation) {
      check(`${fileName} is read-only (no dangerous operations)`, true);
    }
  }
}

// ============================================================
// 6. CREDENTIAL SAFETY
// ============================================================

console.log('\n🔐 Checking credential safety...');

if (existsSync(evidencePath)) {
  const evidenceContent = readFileSync(evidencePath, 'utf-8');
  
  const dangerousPatterns = [
    /postgresql:\/\/[^:]+:[^@]+@/,  // Full connection string with password
    /DATABASE_URL.*=.*postgresql/i,
    /password\s*[:=]\s*['"][^'"]+['"]/i,
  ];
  
  let hasCredentials = false;
  for (const pattern of dangerousPatterns) {
    if (pattern.test(evidenceContent)) {
      failures.push('Evidence file contains credentials or connection strings');
      hasCredentials = true;
      break;
    }
  }
  
  if (!hasCredentials) {
    check('Evidence file does not expose credentials', true);
  }
}

// ============================================================
// FINAL RESULT
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('ASSURANCE RESULT');
console.log('='.repeat(60));

if (failures.length === 0 && warnings.length === 0) {
  console.log('\n✅ PHASE 0A.1: PASS');
  console.log('\nActual PostgreSQL catalog discovery completed successfully.');
  console.log('All configured databases audited.');
  console.log('\nPhase 0A.2 (platform-wide mapping) required before architectural decisions.');
  process.exit(0);
} else if (failures.length === 0) {
  console.log('\n✅ PHASE 0A.1: PASS (with warnings)');
  console.log(`\nWarnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  console.log('\nPhase 0A.2 (platform-wide mapping) required before architectural decisions.');
  process.exit(0);
} else {
  console.log('\n❌ PHASE 0A.1: FAIL');
  console.log(`\nFailures: ${failures.length}`);
  failures.forEach(f => console.log(`  ❌ ${f}`));
  
  if (warnings.length > 0) {
    console.log(`\nWarnings: ${warnings.length}`);
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }
  
  console.log('\nPhase 0A.1 is INCOMPLETE until all configured databases are successfully audited.');
  process.exit(1);
}
