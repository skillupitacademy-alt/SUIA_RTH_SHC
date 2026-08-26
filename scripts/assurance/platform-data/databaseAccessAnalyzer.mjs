#!/usr/bin/env node

/**
 * Phase 0A.2.2-A Database Access Analyzer
 *
 * Static source-code analysis only.
 *
 * Does NOT execute application code.
 * Does NOT connect to databases.
 * Does NOT modify files or databases.
 */

import {
  DATABASES,
  SERVICES,
  DATABASE_PATTERNS,
} from './serviceDatabaseDefinitions.mjs';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(value) {
  return new RegExp(
    escapeRegex(value),
    'gi',
  );
}

function classifyAccess(content, index) {
  const start = Math.max(0, index - 500);
  const end = Math.min(content.length, index + 500);

  const context = content
    .slice(start, end)
    .toLowerCase();

  const reads = [
    'select',
    '.find',
    '.findmany',
    '.findfirst',
    '.query',
    '.get',
    'select(',
  ];

  const writes = [
    'insert',
    '.insert',
    'insert(',
    'update',
    '.update',
    'delete',
    '.delete',
    'delete(',
  ];

  const readDetected = reads.some(
    pattern => context.includes(pattern),
  );

  const writeDetected = writes.some(
    pattern => context.includes(pattern),
  );

  if (readDetected && writeDetected) {
    return 'read-write';
  }

  if (writeDetected) {
    return 'write';
  }

  if (readDetected) {
    return 'read';
  }

  return 'unknown';
}

function classifyConnection(pattern) {
  if (
    pattern.includes('get') &&
    pattern.toLowerCase().includes('db')
  ) {
    return 'database-factory';
  }

  if (pattern.includes('@platform/db')) {
    return 'package-import';
  }

  if (pattern.includes('packages/db')) {
    return 'package-import';
  }

  return 'direct-reference';
}

function analyzeFileForDatabase(
  file,
  database,
  patterns,
) {
  const findings = [];

  for (const patternValue of patterns) {
    const pattern = buildPattern(patternValue);

    let match;

    while ((match = pattern.exec(file.content)) !== null) {
      findings.push({
        database: database.logicalName,
        file: file.relativePath,
        line: file.content
          .slice(0, match.index)
          .split('\n')
          .length,
        matchedPattern: patternValue,
        connectionType: classifyConnection(patternValue),
        accessType: classifyAccess(
          file.content,
          match.index,
        ),
      });
    }
  }

  return findings;
}

export function analyzeDatabaseAccess(files) {
  const findings = [];

  for (const service of SERVICES) {
    const serviceFiles = files.filter(file =>
      file.relativePath
        .replace(/\\/g, '/')
        .startsWith(
          `${service.path.replace(/\\/g, '/')}/`,
        ),
    );

    for (const database of DATABASES) {
      const patterns =
        DATABASE_PATTERNS[database.logicalName] || [];

      for (const file of serviceFiles) {
        findings.push(
          ...analyzeFileForDatabase(
            file,
            database,
            patterns,
          ),
        );
      }
    }
  }

  return findings;
}

export function buildServiceDatabaseMatrix(findings) {
  const matrix = [];

  for (const service of SERVICES) {
    for (const database of DATABASES) {
      const serviceFindings = findings.filter(
        finding =>
          finding.database === database.logicalName &&
          finding.file.replace(/\\/g, '/').startsWith(
            service.path.replace(/\\/g, '/') + '/',
          ),
      );

      if (serviceFindings.length === 0) {
        continue;
      }

      const accessTypes = [
        ...new Set(
          serviceFindings.map(
            finding => finding.accessType,
          ),
        ),
      ];

      const connectionTypes = [
        ...new Set(
          serviceFindings.map(
            finding => finding.connectionType,
          ),
        ),
      ];

      const fileCount = new Set(
        serviceFindings.map(f => f.file),
      ).size;

      matrix.push({
        service: service.name,
        servicePath: service.path,
        database: database.logicalName,
        evidenceCount: serviceFindings.length,
        fileCount,
        accessTypes,
        connectionTypes,
        confidenceLevel: 'STATIC_IMPORT',
        evidence: serviceFindings.slice(0, 10), // Limit evidence for readability
      });
    }
  }

  return matrix;
}
