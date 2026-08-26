#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Static import and database-symbol resolution.
 *
 * No runtime execution.
 */

import {
  DATABASES,
  DATABASE_PATTERNS,
} from '../serviceDatabaseDefinitions.mjs';

function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function databaseForImport(importPath) {
  const normalized = importPath
    .replace(/\\/g, '/');

  for (const database of DATABASES) {
    const patterns =
      DATABASE_PATTERNS[database.logicalName] || [];

    for (const pattern of patterns) {
      if (
        normalized.includes(pattern) ||
        pattern.includes(normalized)
      ) {
        return database.logicalName;
      }
    }
  }

  return null;
}

function extractImports(content) {
  const imports = [];

  const patterns = [
    /import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /const\s+(.+?)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(content)) !== null) {
      if (match.length === 3) {
        imports.push({
          clause: match[1],
          source: match[2],
          index: match.index,
        });
      } else if (match.length === 2) {
        imports.push({
          clause: null,
          source: match[1],
          index: match.index,
        });
      }
    }
  }

  return imports;
}

function extractSymbols(clause) {
  if (!clause) {
    return [];
  }

  const symbols = [];

  const namedMatch =
    clause.match(/\{([\s\S]*?)\}/);

  if (namedMatch) {
    for (
      const rawSymbol
      of namedMatch[1].split(',')
    ) {
      const trimmed = rawSymbol.trim();

      if (!trimmed) {
        continue;
      }

      const parts = trimmed
        .split(/\s+as\s+/i)
        .map(value => value.trim());

      symbols.push({
        imported: parts[0],
        local: parts[1] || parts[0],
      });
    }
  }

  const defaultMatch =
    clause
      .replace(/\{[\s\S]*?\}/, '')
      .replace(/,/g, '')
      .trim();

  if (
    defaultMatch &&
    /^[A-Za-z_$][\w$]*$/.test(defaultMatch)
  ) {
    symbols.push({
      imported: 'default',
      local: defaultMatch,
    });
  }

  return symbols;
}

export function resolveDatabaseImports(file) {
  const imports = extractImports(
    file.content,
  );

  const databaseImports = [];

  for (const item of imports) {
    const database =
      databaseForImport(item.source);

    if (!database) {
      continue;
    }

    const symbols =
      extractSymbols(item.clause);

    for (const symbol of symbols) {
      databaseImports.push({
        database,
        source: item.source,
        importedSymbol: symbol.imported,
        localSymbol: symbol.local,
        line: file.content
          .slice(0, item.index)
          .split('\n').length,
        confidence: 'STATIC_IMPORT_RESOLUTION',
      });
    }
  }

  return databaseImports;
}

export function buildDatabaseSymbolRegistry(
  files,
) {
  const registry = [];

  for (const file of files) {
    const imports =
      resolveDatabaseImports(file);

    for (const item of imports) {
      registry.push({
        file: normalizePath(file.relativePath),
        ...item,
      });
    }
  }

  return registry;
}
