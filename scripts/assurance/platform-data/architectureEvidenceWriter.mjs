#!/usr/bin/env node

/**
 * Phase 0A.2.2-A Architecture Evidence Writer
 *
 * Generates sanitized evidence artifacts.
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

export function buildServiceDatabaseMarkdown(
  matrix,
) {
  const lines = [
    '# Service → Database Access Matrix',
    '',
    '**Phase 0A.2.2-A — Static Source Analysis**',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total service/database relationships: ${matrix.length}`,
    `- Services analyzed: ${new Set(matrix.map(m => m.service)).size}`,
    `- Databases referenced: ${new Set(matrix.map(m => m.database)).size}`,
    '',
    '## Service → Database Matrix',
    '',
    '| Service | Database | Files | Evidence | Access | Connection |',
    '|---------|----------|------:|:--------:|--------|------------|',
  ];

  for (const row of matrix) {
    lines.push(
      `| ${row.service} | ${row.database} | ` +
      `${row.fileCount} | ` +
      `${row.evidenceCount} | ` +
      `${row.accessTypes.join(', ')} | ` +
      `${row.connectionTypes.join(', ')} |`,
    );
  }

  lines.push(
    '',
    '## Important Limitations',
    '',
    '⚠️ **Static source evidence does NOT prove runtime behavior**',
    '',
    'This analysis detects:',
    '',
    '- ✅ Database package imports',
    '- ✅ Database factory function references',
    '- ✅ Pattern matches in source code',
    '',
    'This analysis does NOT prove:',
    '',
    '- ❌ That a specific HTTP request accesses a database',
    '- ❌ How many databases are accessed per request',
    '- ❌ Whether access is sequential or parallel',
    '- ❌ Actual performance characteristics',
    '',
    '**Confidence Level**: `STATIC_IMPORT`',
    '',
    '**Next Phase**: Runtime request tracing required for definitive evidence.',
    '',
    '---',
    '',
    `**Phase 0A.2.2-A** | Static Service → Database Mapping | ${new Date().toISOString()}`,
  );

  return lines.join('\n');
}

export function buildDomainDatabaseMarkdown(
  matrix,
) {
  const lines = [
    '# Domain → Database Mapping',
    '',
    '**Phase 0A.2.2-A — Static Source Analysis**',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Database Domains',
    '',
  ];

  const dbGroups = {
    'Quiz/Exam Domain': ['quiz_platform_prod'],
    'Tutorial Domain': ['tutorial_prod'],
    'People/Organization Domain': ['people_prod'],
    'Identity Domains': ['rth_prod', 'skillup_prod'],
    'Financial Domain': ['payment_prod'],
    'Placement Domain': ['placement_prod'],
  };

  for (const [domain, databases] of Object.entries(dbGroups)) {
    lines.push(`### ${domain}`);
    lines.push('');

    for (const database of databases) {
      const services = matrix
        .filter(m => m.database === database)
        .map(m => m.service);

      if (services.length > 0) {
        lines.push(`**${database}**`);
        lines.push('');
        lines.push('Services accessing this database:');
        lines.push('');
        for (const service of services) {
          lines.push(`- ${service}`);
        }
        lines.push('');
      }
    }
  }

  lines.push(
    '## Interpretation',
    '',
    'The catalog evidence from Phase 0A.2.1 combined with static source ',
    'analysis suggests **domain separation** rather than arbitrary fragmentation.',
    '',
    'However, this does not yet answer the performance question:',
    '',
    '- How many databases does a typical request touch?',
    '- Are multi-database requests sequential or parallel?',
    '- What is the actual latency impact?',
    '',
    '**Database consolidation decision remains 🔒 BLOCKED until request-flow ',
    'evidence is complete.**',
    '',
  );

  return lines.join('\n');
}
