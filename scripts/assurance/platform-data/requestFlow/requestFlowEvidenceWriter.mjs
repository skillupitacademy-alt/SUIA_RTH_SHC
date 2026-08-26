#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Evidence artifact writer.
 *
 * Sanitized output only.
 */

import {
  mkdirSync,
  writeFileSync,
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
    '..',
  );

const ARCHITECTURE_DIR =
  join(
    PROJECT_ROOT,
    'docs',
    'architecture',
  );

const EVIDENCE_DIR =
  join(
    ARCHITECTURE_DIR,
    'evidence',
  );

function ensureDirectories() {
  mkdirSync(
    EVIDENCE_DIR,
    {
      recursive: true,
    },
  );
}

export function writeJsonEvidence(
  filename,
  data,
) {
  ensureDirectories();

  const path =
    join(
      EVIDENCE_DIR,
      filename,
    );

  writeFileSync(
    path,
    JSON.stringify(
      data,
      null,
      2,
    ),
    'utf8',
  );

  return path;
}

export function writeMarkdown(
  filename,
  content,
) {
  ensureDirectories();

  const path =
    join(
      ARCHITECTURE_DIR,
      filename,
    );

  writeFileSync(
    path,
    content,
    'utf8',
  );

  return path;
}

export function buildRequestDatabaseMarkdown(
  findings,
) {
  const lines = [
    '# Request → Database Static Analysis',
    '',
    '**Phase 0A.2.2-B**',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Requests/routes analyzed: ${findings.length}`,
    `- Multi-database requests: ${
      findings.filter(
        finding =>
          finding.databaseCount > 1,
      ).length
    }`,
    '',
    '## Request Matrix',
    '',
    '| Service | Route | File | DB Count | Pattern | Confidence |',
    '|---|---|---|---:|---|---|',
  ];

  for (const finding of findings) {
    lines.push(
      `| ${finding.service} | ` +
      `${finding.routePath || 'UNKNOWN'} | ` +
      `${finding.file} | ` +
      `${finding.databaseCount} | ` +
      `${finding.executionPattern} | ` +
      `${finding.executionConfidence} |`,
    );
  }

  lines.push(
    '',
    '## Interpretation Rules',
    '',
    '- `SINGLE_DATABASE` means one database operation domain was statically identified.',
    '- `PARALLEL` means Promise.all-style parallel structure was detected.',
    '- `POSSIBLY_SEQUENTIAL` means multiple operations appear ordered by source awaits.',
    '- `DEPENDENT_SEQUENTIAL` means a static dependency signal was detected.',
    '- `UNKNOWN` means the source structure is insufficient to classify.',
    '',
    '⚠️ **Static execution classification does NOT prove runtime behavior.**',
    '',
    'It does NOT establish:',
    '',
    '- actual latency',
    '- connection count',
    '- connection-pool behavior',
    '- database response time',
    '- production request frequency',
    '- performance bottlenecks',
    '',
    '**Runtime tracing is required for those conclusions.**',
    '',
  );

  return lines.join('\n');
}

export function buildCrossDatabaseMarkdown(
  findings,
) {
  const multiDatabase =
    findings.filter(
      finding =>
        finding.databaseCount > 1,
    );

  const lines = [
    '# Cross-Database Request Analysis',
    '',
    '**Phase 0A.2.2-B — Static Evidence**',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Multi-database request candidates: ${multiDatabase.length}`,
    '',
  ];

  if (multiDatabase.length === 0) {
    lines.push(
      'No multi-database request candidates were detected.',
      '',
    );
  }

  for (const finding of multiDatabase) {
    lines.push(
      `## ${finding.service} — ${
        finding.routePath || 'UNKNOWN'
      }`,
      '',
      `**File**: \`${finding.file}\``,
      '',
      `**Pattern**: \`${finding.executionPattern}\``,
      '',
      `**Confidence**: \`${finding.executionConfidence}\``,
      '',
      '**Databases**:',
      '',
    );

    for (
      const database
      of finding.databases
    ) {
      lines.push(
        `- ${database}`,
      );
    }

    lines.push('');
  }

  lines.push(
    '---',
    '',
    '⚠️ **This is static source evidence only.**',
    '',
    'Detected patterns do NOT prove:',
    '',
    '- Runtime execution order',
    '- Actual performance impact',
    '- Network latency',
    '- Connection pooling behavior',
    '- Production database load',
    '',
    '**Phase 0A.2.2-C (Runtime Tracing) is required for definitive evidence.**',
    '',
  );

  return lines.join('\n');
}

export function buildServiceRequestMarkdown(
  findings,
) {
  const services =
    new Map();

  for (const finding of findings) {
    if (!services.has(finding.service)) {
      services.set(
        finding.service,
        [],
      );
    }

    services
      .get(finding.service)
      .push(finding);
  }

  const lines = [
    '# Service → Request → Database Flow',
    '',
    '**Phase 0A.2.2-B**',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
  ];

  for (
    const [service, serviceFindings]
    of services
  ) {
    lines.push(
      `## ${service}`,
      '',
      `Routes detected: ${serviceFindings.length}`,
      '',
    );

    for (
      const finding
      of serviceFindings
    ) {
      const route = finding.routePath || 'UNKNOWN';
      const methods = finding.methods?.join(', ') || 'UNKNOWN';
      
      lines.push(
        `### ${methods} ${route}`,
        '',
        `- **File**: \`${finding.file}\``,
        `- **Databases**: ${finding.databaseCount} (${finding.databases.join(', ')})`,
        `- **Pattern**: \`${finding.executionPattern}\``,
        `- **Confidence**: \`${finding.executionConfidence}\``,
        '',
      );
    }
  }

  lines.push(
    '---',
    '',
    '## Important Limitations',
    '',
    'This analysis provides **static source-code structure** evidence only.',
    '',
    'It cannot determine:',
    '',
    '- Whether a route is actually invoked in production',
    '- Actual database query latency',
    '- Connection pool utilization',
    '- Request frequency or load patterns',
    '- Runtime execution order',
    '',
    '**Database consolidation decision remains 🔒 BLOCKED until runtime evidence is collected.**',
    '',
  );

  return lines.join('\n');
}
