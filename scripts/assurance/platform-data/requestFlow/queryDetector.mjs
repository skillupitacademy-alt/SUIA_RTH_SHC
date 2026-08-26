#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Static database operation detection.
 */

const READ_PATTERNS = [
  '.find',
  '.findMany',
  '.findFirst',
  '.findUnique',
  '.select',
  '.query',
  '.get',
  'SELECT ',
];

const WRITE_PATTERNS = [
  '.insert',
  '.create',
  '.update',
  '.delete',
  '.upsert',
  'INSERT ',
  'UPDATE ',
  'DELETE ',
];

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function classifyOperation(context) {
  const normalized =
    context.toLowerCase();

  const read =
    READ_PATTERNS.some(pattern =>
      normalized.includes(
        pattern.toLowerCase(),
      ),
    );

  const write =
    WRITE_PATTERNS.some(pattern =>
      normalized.includes(
        pattern.toLowerCase(),
      ),
    );

  if (read && write) {
    return 'read-write';
  }

  if (write) {
    return 'write';
  }

  if (read) {
    return 'read';
  }

  return 'unknown';
}

export function detectDatabaseOperations(
  file,
  symbols,
) {
  const operations = [];

  for (const symbol of symbols) {
    for (const usage of symbol.usages) {
      const start =
        Math.max(
          0,
          usage.index - 100,
        );

      const end =
        Math.min(
          file.content.length,
          usage.index + 500,
        );

      const context =
        file.content.slice(
          start,
          end,
        );

      const operation =
        classifyOperation(context);

      if (operation === 'unknown') {
        continue;
      }

      operations.push({
        database:
          symbol.database,

        symbol:
          symbol.localSymbol,

        operation,

        line:
          getLineNumber(
            file.content,
            usage.index,
          ),

        index:
          usage.index,

        confidence:
          'STATIC_QUERY_CONTEXT',
      });
    }
  }

  return operations;
}
