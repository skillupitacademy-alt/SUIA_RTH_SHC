#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 0A.2.2-B
 * REQUEST → DATABASE STATIC ANALYSIS
 * ============================================================
 *
 * READ-ONLY SOURCE ANALYSIS.
 *
 * This script:
 *
 * 1. Reuses the Phase A service/database definitions.
 * 2. Scans application source files.
 * 3. Detects HTTP route handlers.
 * 4. Resolves database imports.
 * 5. Tracks database symbols.
 * 6. Detects database operations.
 * 7. Classifies static execution structure.
 * 8. Generates sanitized evidence.
 *
 * It does NOT:
 *
 * - connect to PostgreSQL
 * - execute application code
 * - modify application source
 * - modify databases
 * - expose credentials
 * - claim runtime performance
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
  SERVICES,
} from './serviceDatabaseDefinitions.mjs';

import {
  detectRoutes,
  inferServiceFromPath,
} from './requestFlow/routeDetector.mjs';

import {
  buildDatabaseSymbolRegistry,
} from './requestFlow/importResolver.mjs';

import {
  buildRequestSymbolMap,
} from './requestFlow/databaseSymbolTracker.mjs';

import {
  detectDatabaseOperations,
} from './requestFlow/queryDetector.mjs';

import {
  classifyExecutionPattern,
} from './requestFlow/executionPatternAnalyzer.mjs';

import {
  writeJsonEvidence,
  writeMarkdown,
  buildRequestDatabaseMarkdown,
  buildCrossDatabaseMarkdown,
  buildServiceRequestMarkdown,
} from './requestFlow/requestFlowEvidenceWriter.mjs';

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

console.log(
  '============================================================',
);

console.log(
  'PHASE 0A.2.2-B — REQUEST → DATABASE STATIC ANALYSIS',
);

console.log(
  '============================================================',
);

console.log('');

console.log(
  'READ-ONLY SOURCE-CODE INSPECTION',
);

console.log(
  'No application or database data will be modified.',
);

console.log('');

const existingServices =
  SERVICES.filter(
    service =>
      existsSync(
        join(
          PROJECT_ROOT,
          service.path,
        ),
      ),
  );

console.log(
  `🔎 Service roots: ${
    existingServices.length
  }/${SERVICES.length}`,
);

console.log('');

for (const service of SERVICES) {
  const exists =
    existsSync(
      join(
        PROJECT_ROOT,
        service.path,
      ),
    );

  console.log(
    `   ${exists ? '✅' : '⚠️ '} ${
      service.name
    } (${service.path})`,
  );
}

console.log('');

const files = [];

for (
  const service
  of existingServices
) {
  const root =
    join(
      PROJECT_ROOT,
      service.path,
    );

  const discovered =
    scanSourceTree(root);

  files.push(...discovered);

  console.log(
    `🔎 ${service.name}: ${
      discovered.length
    } source files`,
  );
}

console.log('');

console.log(
  `🔎 Total source files scanned: ${
    files.length
  }`,
);

console.log('');

console.log(
  '🔎 STEP 1 — ROUTE DETECTION',
);

const routes =
  detectRoutes(files);

console.log(
  `   Routes/handlers detected: ${
    routes.length
  }`,
);

console.log('');

console.log(
  '🔎 STEP 2 — DATABASE IMPORT RESOLUTION',
);

const symbolRegistry =
  buildDatabaseSymbolRegistry(
    files,
  );

console.log(
  `   Database symbols resolved: ${
    symbolRegistry.length
  }`,
);

console.log('');

console.log(
  '🔎 STEP 3 — REQUEST → DATABASE ANALYSIS',
);

const findings = [];

for (const route of routes) {
  const file =
    files.find(
      item =>
        item.relativePath ===
        route.file,
    );

  if (!file) {
    continue;
  }

  const service =
    inferServiceFromPath(
      route.file,
      SERVICES,
    );

  if (!service) {
    continue;
  }

  const symbols =
    buildRequestSymbolMap(
      file,
      symbolRegistry,
    );

  if (symbols.length === 0) {
    continue;
  }

  const operations =
    detectDatabaseOperations(
      file,
      symbols,
    );

  if (operations.length === 0) {
    continue;
  }

  const execution =
    classifyExecutionPattern(
      file,
      operations,
    );

  const databases = [
    ...new Set(
      operations.map(
        operation =>
          operation.database,
      ),
    ),
  ];

  findings.push({
    service,
    routePath:
      route.routePath,
    file:
      route.file,
    methods:
      route.methods.map(
        method =>
          method.method,
      ),
    databaseCount:
      databases.length,
    databases,
    operations:
      operations.map(
        operation => ({
          database:
            operation.database,
          symbol:
            operation.symbol,
          operation:
            operation.operation,
          line:
            operation.line,
          confidence:
            operation.confidence,
        }),
      ),
    executionPattern:
      execution.pattern,
    executionConfidence:
      execution.confidence,
    confidence:
      'STATIC_REQUEST_FLOW',
  });
}

console.log(
  `   Request/database findings: ${
    findings.length
  }`,
);

const multiDatabase =
  findings.filter(
    finding =>
      finding.databaseCount > 1,
  );

console.log(
  `   Multi-database requests: ${
    multiDatabase.length
  }`,
);

console.log('');

console.log(
  '🔎 STEP 4 — GENERATING EVIDENCE',
);

const generatedAt =
  new Date().toISOString();

const evidence = {
  auditVersion:
    '0A.2.2-B',

  phase:
    'Request → Database Static Analysis',

  generatedAt,

  mode:
    'STATIC_SOURCE_ANALYSIS',

  security: {
    credentialsIncluded:
      false,

    environmentValuesIncluded:
      false,

    databaseConnectionsUsed:
      false,

    readOnly:
      true,
  },

  summary: {
    sourceFilesScanned:
      files.length,

    routesDetected:
      routes.length,

    databaseSymbolsResolved:
      symbolRegistry.length,

    requestDatabaseFindings:
      findings.length,

    multiDatabaseRequests:
      multiDatabase.length,

    uniqueServices:
      new Set(
        findings.map(
          finding =>
            finding.service,
        ),
      ).size,

    uniqueDatabases:
      new Set(
        findings.flatMap(
          finding =>
            finding.databases,
        ),
      ).size,
  },

  requests:
    findings,

  confidenceLevel:
    'STATIC_REQUEST_FLOW',

  limitations: [
    'Static source analysis does not prove runtime execution.',
    'Detected routes may not be invoked in production.',
    'Detected imports may not be used on every request.',
    'Execution classification is source-structure evidence only.',
    'Promise.all detection does not prove simultaneous database execution.',
    'Await ordering does not prove actual database latency.',
    'No connection-pool behavior is measured.',
    'No network latency is measured.',
    'No production traffic is measured.',
    'Runtime tracing is required for definitive performance evidence.',
  ],
};

const evidencePath =
  writeJsonEvidence(
    'phase-0a-2-2-b-request-database.json',
    evidence,
  );

const requestPath =
  writeMarkdown(
    'REQUEST-DATABASE-MAP.md',
    buildRequestDatabaseMarkdown(
      findings,
    ),
  );

const crossDatabasePath =
  writeMarkdown(
    'CROSS-DATABASE-REQUESTS.md',
    buildCrossDatabaseMarkdown(
      findings,
    ),
  );

const serviceFlowPath =
  writeMarkdown(
    'SERVICE-REQUEST-FLOWS.md',
    buildServiceRequestMarkdown(
      findings,
    ),
  );

console.log(
  `   💾 Evidence: ${evidencePath}`,
);

console.log(
  `   💾 Request map: ${requestPath}`,
);

console.log(
  `   💾 Cross-DB map: ${crossDatabasePath}`,
);

console.log(
  `   💾 Service flows: ${serviceFlowPath}`,
);

console.log('');

console.log(
  '============================================================',
);

console.log(
  'PHASE 0A.2.2-B COMPLETE',
);

console.log(
  '============================================================',
);

console.log('');

console.log(
  `✅ ${findings.length} request/database findings`,
);

console.log(
  `✅ ${multiDatabase.length} multi-database request candidates`,
);

console.log('');

console.log(
  '⚠️  STATIC EVIDENCE ONLY',
);

console.log(
  '⚠️  Runtime behavior has NOT been proven.',
);

console.log(
  '⚠️  Performance impact has NOT been measured.',
);

console.log('');

console.log(
  'Database consolidation decision: 🔒 BLOCKED',
);

console.log(
  'Reason: Runtime evidence has not yet been collected.',
);

console.log('');
