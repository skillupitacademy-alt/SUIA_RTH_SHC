#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 0A.2.2-A — SERVICE / DATABASE STATIC MAPPING
 * ============================================================
 *
 * READ-ONLY source-code inspection.
 *
 * This script:
 *
 * 1. Scans application source trees.
 * 2. Detects database package imports and references.
 * 3. Builds Service → Database access matrix.
 * 4. Writes sanitized evidence artifacts.
 *
 * It does NOT:
 *
 * - Connect to PostgreSQL
 * - Modify databases
 * - Modify application source
 * - Execute application requests
 * - Expose credentials
 * - Prove runtime behavior
 */

import {
  existsSync,
} from 'fs';

import {
  join,
  dirname,
} from 'path';

import {
  fileURLToPath,
} from 'url';

import {
  scanSourceTree,
} from './sourceScanner.mjs';

import {
  analyzeDatabaseAccess,
  buildServiceDatabaseMatrix,
} from './databaseAccessAnalyzer.mjs';

import {
  DATABASES,
  SERVICES,
} from './serviceDatabaseDefinitions.mjs';

import {
  writeJsonEvidence,
  writeMarkdown,
  buildServiceDatabaseMarkdown,
  buildDomainDatabaseMarkdown,
} from './architectureEvidenceWriter.mjs';

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  dirname(__filename);

const PROJECT_ROOT =
  join(
    __dirname,
    '..',
    '..',
    '..',
  );

console.log('');
console.log('============================================================');
console.log('PHASE 0A.2.2-A — SERVICE / DATABASE STATIC MAPPING');
console.log('============================================================');
console.log('');
console.log('READ-ONLY SOURCE-CODE INSPECTION');
console.log('No application or database data will be modified.');
console.log('');

const sourceRoots = SERVICES
  .map(service =>
    join(
      PROJECT_ROOT,
      service.path,
    ),
  )
  .filter(existsSync);

console.log(
  `🔎 Service roots discovered: ${sourceRoots.length}/${SERVICES.length}`,
);
console.log('');

if (sourceRoots.length === 0) {
  console.error('❌ No service directories found.');
  console.error('');
  console.error('Expected service directories:');
  for (const service of SERVICES) {
    console.error(`   - ${service.path}`);
  }
  console.error('');
  process.exit(1);
}

for (const service of SERVICES) {
  const path = join(PROJECT_ROOT, service.path);
  const exists = existsSync(path);
  console.log(`   ${exists ? '✅' : '⚠️ '} ${service.name} (${service.path})`);
}

console.log('');

const files = [];

for (const root of sourceRoots) {
  const discovered =
    scanSourceTree(root);

  files.push(...discovered);

  console.log(
    `🔎 ${root.split(/[\\/]/).pop()}: ${discovered.length} source files`,
  );
}

console.log('');

console.log(
  `🔎 Total source files scanned: ${files.length}`,
);

console.log('');

console.log(
  '🔎 ANALYZING DATABASE ACCESS PATTERNS...',
);

const accessFindings =
  analyzeDatabaseAccess(files);

console.log(
  `   Database reference findings: ${accessFindings.length}`,
);

const serviceDatabaseMatrix =
  buildServiceDatabaseMatrix(
    accessFindings,
  );

console.log(
  `   Service/database relationships: ` +
  `${serviceDatabaseMatrix.length}`,
);

console.log('');

console.log(
  '🔎 GENERATING EVIDENCE ARTIFACTS...',
);

const generatedAt =
  new Date().toISOString();

const evidence = {
  auditVersion: '0A.2.2-A',
  phase: 'Service → Database Static Mapping',
  generatedAt,
  mode: 'STATIC_SOURCE_ANALYSIS',
  
  security: {
    credentialsIncluded: false,
    environmentValuesIncluded: false,
    databaseConnectionsUsed: false,
    readOnly: true,
  },

  summary: {
    sourceFilesScanned: files.length,
    servicesAnalyzed: sourceRoots.length,
    databaseAccessFindings: accessFindings.length,
    serviceDatabaseRelationships: serviceDatabaseMatrix.length,
    uniqueServices: new Set(serviceDatabaseMatrix.map(m => m.service)).size,
    uniqueDatabases: new Set(serviceDatabaseMatrix.map(m => m.database)).size,
  },

  databases: DATABASES.map(database => ({
    logicalName: database.logicalName,
    packagePaths: database.packagePaths,
    // envVars intentionally excluded from evidence
  })),

  services: SERVICES.map(service => ({
    name: service.name,
    path: service.path,
    exists: existsSync(join(PROJECT_ROOT, service.path)),
  })),

  serviceDatabaseMatrix,

  confidenceLevel: 'STATIC_IMPORT',
  
  limitations: [
    'Static import detection does not prove runtime access',
    'Pattern matches may include unused imports',
    'Cannot determine request-level database usage',
    'Cannot distinguish sequential vs parallel access',
    'Runtime tracing required for performance analysis',
  ],
};

const evidencePath =
  writeJsonEvidence(
    'phase-0a-2-2-a-service-database.json',
    evidence,
  );

const serviceMarkdown =
  writeMarkdown(
    'SERVICE-DATABASE-ACCESS.md',
    buildServiceDatabaseMarkdown(
      serviceDatabaseMatrix,
    ),
  );

const domainMarkdown =
  writeMarkdown(
    'DOMAIN-DATABASE-MAP.md',
    buildDomainDatabaseMarkdown(
      serviceDatabaseMatrix,
    ),
  );

console.log(
  `   💾 Evidence: ${evidencePath}`,
);

console.log(
  `   💾 Service matrix: ${serviceMarkdown}`,
);

console.log(
  `   💾 Domain map: ${domainMarkdown}`,
);

console.log('');

console.log('============================================================');
console.log('PHASE 0A.2.2-A COMPLETE');
console.log('============================================================');
console.log('');

console.log(`✅ ${serviceDatabaseMatrix.length} service/database relationships detected`);
console.log(`✅ ${evidence.summary.uniqueServices} services analyzed`);
console.log(`✅ ${evidence.summary.uniqueDatabases} databases referenced`);

console.log('');

console.log(
  '⚠️  IMPORTANT: Static evidence is NOT runtime performance evidence.',
);

console.log('');

console.log(
  'Next steps:',
);
console.log('  - Phase 0A.2.2-B: Request → Database static analysis');
console.log('  - Phase 0A.2.2-C: Runtime request tracing');
console.log('');

console.log('Database consolidation decision: 🔒 BLOCKED');
console.log('Reason: Request-flow evidence incomplete');

console.log('');
