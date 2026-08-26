#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Static execution-pattern classification.
 *
 * IMPORTANT:
 * This classifies source-code structure only.
 * It does not measure runtime performance.
 */

function getLineRange(operation) {
  return {
    start: operation.line,
    end: operation.line,
  };
}

function detectPromiseAll(content) {
  return /\bPromise\.all\s*\(/.test(
    content,
  );
}

function detectAwait(content) {
  return /\bawait\b/.test(
    content,
  );
}

function detectDependency(
  firstOperation,
  secondOperation,
  content,
) {
  if (
    firstOperation.database ===
    secondOperation.database
  ) {
    return false;
  }

  const start =
    Math.min(
      firstOperation.index,
      secondOperation.index,
    );

  const end =
    Math.max(
      firstOperation.index,
      secondOperation.index,
    );

  const between =
    content.slice(start, end);

  /*
   * Conservative heuristic:
   * if the second operation's surrounding
   * context references a result variable
   * from the first operation, classify as
   * potentially dependent.
   */

  return /\b(result|record|row|data|item|id)\b/i
    .test(between);
}

export function classifyExecutionPattern(
  file,
  operations,
) {
  const databases = [
    ...new Set(
      operations.map(
        operation =>
          operation.database,
      ),
    ),
  ];

  if (databases.length === 0) {
    return {
      pattern: 'NO_DATABASE_OPERATION',
      confidence:
        'STATIC_EXECUTION_ANALYSIS',
    };
  }

  if (databases.length === 1) {
    return {
      pattern: 'SINGLE_DATABASE',
      databaseCount: 1,
      confidence:
        'STATIC_EXECUTION_ANALYSIS',
    };
  }

  const hasPromiseAll =
    detectPromiseAll(
      file.content,
    );

  if (hasPromiseAll) {
    return {
      pattern: 'PARALLEL',
      databaseCount:
        databases.length,
      confidence:
        'STATIC_PROMISE_ALL',
    };
  }

  const sorted =
    [...operations].sort(
      (a, b) =>
        a.index - b.index,
    );

  const hasAwait =
    detectAwait(
      file.content,
    );

  if (!hasAwait) {
    return {
      pattern: 'UNKNOWN',
      databaseCount:
        databases.length,
      confidence:
        'STATIC_EXECUTION_ANALYSIS',
    };
  }

  for (
    let index = 0;
    index < sorted.length - 1;
    index++
  ) {
    const first =
      sorted[index];

    const second =
      sorted[index + 1];

    if (
      detectDependency(
        first,
        second,
        file.content,
      )
    ) {
      return {
        pattern:
          'DEPENDENT_SEQUENTIAL',
        databaseCount:
          databases.length,
        confidence:
          'STATIC_DEPENDENCY_HEURISTIC',
        evidence: [
          getLineRange(first),
          getLineRange(second),
        ],
      };
    }
  }

  return {
    pattern:
      'POSSIBLY_SEQUENTIAL',
    databaseCount:
      databases.length,
    confidence:
      'STATIC_AWAIT_ORDER',
  };
}
