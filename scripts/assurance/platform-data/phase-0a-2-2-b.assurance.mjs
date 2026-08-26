#!/usr/bin/env node

/**
 * Phase 0A.2.2-B Assurance
 *
 * Validates:
 *
 * - evidence exists
 * - schema is correct
 * - security guarantees
 * - request findings exist
 * - static confidence is declared
 * - runtime claims are absent
 * - all implementation files <= 600 lines
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
    'phase-0a-2-2-b-request-database.json',
  );

const requestMapPath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'REQUEST-DATABASE-MAP.md',
  );

const crossDbPath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'CROSS-DATABASE-REQUESTS.md',
  );

const serviceFlowPath =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
    'SERVICE-REQUEST-FLOWS.md',
  );

const implementationFiles = [
  'requestFlow/routeDetector.mjs',
  'requestFlow/importResolver.mjs',
  'requestFlow/databaseSymbolTracker.mjs',
  'requestFlow/queryDetector.mjs',
  'requestFlow/executionPatternAnalyzer.mjs',
  'requestFlow/requestFlowEvidenceWriter.mjs',
  'runRequestDatabaseAudit.mjs',
  'phase-0a-2-2-b.assurance.mjs',
];

const failures = [];

function check(
  label,
  condition,
) {
  if (condition) {
    console.log(
      `✅ ${label}`,
    );
  } else {
    console.error(
      `❌ ${label}`,
    );

    failures.push(label);
  }
}

console.log('');

console.log(
  '============================================================',
);

console.log(
  'PHASE 0A.2.2-B ASSURANCE',
);

console.log(
  '============================================================',
);

console.log('');

check(
  'JSON evidence exists',
  existsSync(evidencePath),
);

check(
  'REQUEST-DATABASE-MAP.md exists',
  existsSync(requestMapPath),
);

check(
  'CROSS-DATABASE-REQUESTS.md exists',
  existsSync(crossDbPath),
);

check(
  'SERVICE-REQUEST-FLOWS.md exists',
  existsSync(serviceFlowPath),
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
      evidence.auditVersion ===
        '0A.2.2-B',
    );

    check(
      'Correct phase',
      evidence.phase ===
        'Request → Database Static Analysis',
    );

    check(
      'Static analysis mode',
      evidence.mode ===
        'STATIC_SOURCE_ANALYSIS',
    );

    check(
      'Read-only',
      evidence.security
        ?.readOnly === true,
    );

    check(
      'Credentials excluded',
      evidence.security
        ?.credentialsIncluded ===
        false,
    );

    check(
      'Environment values excluded',
      evidence.security
        ?.environmentValuesIncluded ===
        false,
    );

    check(
      'No database connections',
      evidence.security
        ?.databaseConnectionsUsed ===
        false,
    );

    check(
      'Request findings array exists',
      Array.isArray(
        evidence.requests,
      ),
    );

    check(
      'Confidence level declared',
      evidence.confidenceLevel ===
        'STATIC_REQUEST_FLOW',
    );

    check(
      'Limitations documented',
      Array.isArray(
        evidence.limitations,
      ) &&
        evidence.limitations.length >
          0,
    );

    const serialized =
      JSON.stringify(
        evidence,
      );

    check(
      'No PostgreSQL URLs',
      !/postgres(?:ql)?:\/\/[^"' ]+/i.test(
        serialized,
      ),
    );

    check(
      'No DATABASE_URL values',
      !/DATABASE_URL.*postgres/i.test(
        serialized,
      ),
    );

    check(
      'No password literals',
      !/password[^"' ]*[:=]\s*[^"' ]{8,}/i.test(
        serialized,
      ),
    );

    check(
      'No runtime performance claims',
      !/performance\s*(?:is|was)\s*(?:good|bad|fast|slow)/i.test(
        serialized,
      ),
    );

    check(
      'No "bottleneck" claims',
      !/bottleneck/i.test(
        serialized,
      ),
    );

    check(
      'No "should consolidate" claims',
      !/should\s+consolidate/i.test(
        serialized,
      ),
    );

    console.log('');

    console.log(
      '📊 Summary statistics:',
    );

    console.log(
      `   Source files: ${
        evidence.summary
          ?.sourceFilesScanned || 0
      }`,
    );

    console.log(
      `   Routes: ${
        evidence.summary
          ?.routesDetected || 0
      }`,
    );

    console.log(
      `   DB symbols: ${
        evidence.summary
          ?.databaseSymbolsResolved || 0
      }`,
    );

    console.log(
      `   Request findings: ${
        evidence.summary
          ?.requestDatabaseFindings || 0
      }`,
    );

    console.log(
      `   Multi-DB requests: ${
        evidence.summary
          ?.multiDatabaseRequests || 0
      }`,
    );
  } catch (error) {
    failures.push(
      `Invalid evidence JSON: ${error.message}`,
    );
  }
}

console.log('');

console.log(
  '🔒 Checking 600-line rule...',
);

console.log('');

let totalLines = 0;

for (
  const filename
  of implementationFiles
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

console.log(
  `   Total implementation: ${totalLines} lines`,
);

console.log('');

console.log(
  '============================================================',
);

if (failures.length === 0) {
  console.log(
    '✅ PHASE 0A.2.2-B ASSURANCE PASS',
  );

  console.log('');

  console.log(
    'Request → Database static analysis complete.',
  );

  console.log('');

  console.log(
    '⚠️  Runtime behavior remains unproven.',
  );

  console.log(
    '⚠️  Performance remains unmeasured.',
  );

  console.log(
    '⚠️  Database consolidation remains BLOCKED.',
  );

  console.log('');

  console.log(
    'Next: Phase 0A.2.2-C (Runtime Tracing)',
  );
} else {
  console.error(
    '❌ PHASE 0A.2.2-B ASSURANCE BLOCKED',
  );

  console.error('');

  for (
    const failure
    of failures
  ) {
    console.error(
      `   - ${failure}`,
    );
  }

  process.exitCode = 1;
}

console.log(
  '============================================================',
);

console.log('');
