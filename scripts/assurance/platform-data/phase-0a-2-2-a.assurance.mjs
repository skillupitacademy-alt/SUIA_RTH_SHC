#!/usr/bin/env node

/**
 * Phase 0A.2.2-A Assurance
 *
 * Validates that the source-analysis evidence is:
 *
 * - present
 * - complete
 * - sanitized
 * - read-only
 * - within 600-line implementation limits
 */

import {
  existsSync,
  readFileSync,
} from 'fs';

import {
  join,
  dirname,
} from 'path';

import {
  fileURLToPath,
} from 'url';

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

const evidencePath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'evidence',
    'phase-0a-2-2-a-service-database.json',
  );

const serviceAccessPath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'SERVICE-DATABASE-ACCESS.md',
  );

const domainMapPath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'DOMAIN-DATABASE-MAP.md',
  );

const implementationFiles = [
  'serviceDatabaseDefinitions.mjs',
  'sourceScanner.mjs',
  'databaseAccessAnalyzer.mjs',
  'architectureEvidenceWriter.mjs',
  'runRequestFlowAudit.mjs',
  'phase-0a-2-2-a.assurance.mjs',
];

const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`✅ ${label}`);
  } else {
    console.error(`❌ ${label}`);
    failures.push(label);
  }
}

console.log('');
console.log('============================================================');
console.log('PHASE 0A.2.2-A ASSURANCE');
console.log('============================================================');
console.log('');

// Evidence artifact checks
check(
  'JSON evidence artifact exists',
  existsSync(evidencePath),
);

check(
  'SERVICE-DATABASE-ACCESS.md exists',
  existsSync(serviceAccessPath),
);

check(
  'DOMAIN-DATABASE-MAP.md exists',
  existsSync(domainMapPath),
);

console.log('');

if (existsSync(evidencePath)) {
  let evidence;

  try {
    evidence =
      JSON.parse(
        readFileSync(
          evidencePath,
          'utf8',
        ),
      );

    check(
      'Correct audit version',
      evidence.auditVersion === '0A.2.2-A',
    );

    check(
      'Correct phase identifier',
      evidence.phase === 'Service → Database Static Mapping',
    );

    check(
      'Read-only evidence',
      evidence.security?.readOnly === true,
    );

    check(
      'Credentials excluded',
      evidence.security?.credentialsIncluded === false,
    );

    check(
      'Environment values excluded',
      evidence.security?.environmentValuesIncluded === false,
    );

    check(
      'No database connections used',
      evidence.security?.databaseConnectionsUsed === false,
    );

    check(
      'Service/database matrix present',
      Array.isArray(
        evidence.serviceDatabaseMatrix,
      ),
    );

    check(
      'Confidence level declared',
      evidence.confidenceLevel === 'STATIC_IMPORT',
    );

    check(
      'Limitations documented',
      Array.isArray(evidence.limitations) &&
      evidence.limitations.length > 0,
    );

    const serialized =
      JSON.stringify(evidence);

    check(
      'No PostgreSQL connection strings',
      !/postgres(?:ql)?:\/\/[^"' ]+/i.test(serialized),
    );

    check(
      'No DATABASE_URL values',
      !/DATABASE_URL[^"' ]*=\s*postgres/i.test(serialized),
    );

    check(
      'No password literals',
      !/password[^"' ]*[:=]\s*[^"' ]{8,}/i.test(serialized),
    );

    console.log('');
    console.log(`📊 Summary statistics:`);
    console.log(`   Source files scanned: ${evidence.summary?.sourceFilesScanned || 0}`);
    console.log(`   Services analyzed: ${evidence.summary?.servicesAnalyzed || 0}`);
    console.log(`   Service/DB relationships: ${evidence.summary?.serviceDatabaseRelationships || 0}`);
    console.log(`   Unique services: ${evidence.summary?.uniqueServices || 0}`);
    console.log(`   Unique databases: ${evidence.summary?.uniqueDatabases || 0}`);

  } catch (error) {
    failures.push(
      `Invalid evidence JSON: ${error.message}`,
    );
  }
}

console.log('');
console.log(
  '🔒 Checking 600-line implementation rule...',
);
console.log('');

let totalLines = 0;

for (
  const filename of implementationFiles
) {
  const filePath =
    join(
      PROJECT_ROOT,
      'scripts',
      'assurance',
      'platform-data',
      filename,
    );

  if (!existsSync(filePath)) {
    failures.push(
      `${filename} does not exist`,
    );

    continue;
  }

  const lines =
    readFileSync(
      filePath,
      'utf8',
    ).split('\n').length;

  totalLines += lines;

  check(
    `${filename}: ${lines} lines ${lines <= 600 ? '✓' : '✗'}`,
    lines <= 600,
  );
}

console.log('');
console.log(`   Total implementation: ${totalLines} lines`);

console.log('');
console.log('============================================================');

if (failures.length === 0) {
  console.log(
    '✅ PHASE 0A.2.2-A ASSURANCE PASS',
  );
  console.log('');
  console.log('Static Service → Database mapping complete.');
  console.log('');
  console.log('⚠️  This does NOT prove runtime behavior.');
  console.log('⚠️  Database consolidation decision remains BLOCKED.');
  console.log('');
  console.log('Next: Phase 0A.2.2-B (Request → Database analysis)');
} else {
  console.error(
    '❌ PHASE 0A.2.2-A ASSURANCE BLOCKED',
  );
  console.error('');

  for (const failure of failures) {
    console.error(`   - ${failure}`);
  }

  process.exitCode = 1;
}

console.log('============================================================');
console.log('');
