#!/usr/bin/env node

/**
 * Phase 0A.2.2-B
 *
 * Static HTTP route / request-handler detection.
 *
 * READ-ONLY.
 *
 * Does not execute application code.
 */

const ROUTE_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

const NEXT_APP_ROUTE_PATTERN = /(?:^|\/)route\.(ts|tsx|js|jsx|mjs|cjs)$/i;

const HANDLER_PATTERNS = [
  /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g,
  /\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*=/g,
  /\bexport\s+(?:async\s+)?function\s+handler\s*\(/gi,
  /\bexport\s+default\s+(?:async\s+)?function\s+/g,
];

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

function inferRoutePath(relativePath) {
  const normalized = normalizePath(relativePath);

  const marker = '/src/app/api/';

  const markerIndex = normalized.indexOf(marker);

  if (markerIndex >= 0) {
    const routePart = normalized
      .slice(markerIndex + marker.length)
      .replace(/\/route\.(ts|tsx|js|jsx|mjs|cjs)$/i, '');

    return `/api/${routePart}`;
  }

  return null;
}

function detectMethods(content) {
  const methods = [];

  for (const pattern of HANDLER_PATTERNS) {
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const method = match[1]?.toUpperCase();

      if (method && ROUTE_METHODS.includes(method)) {
        methods.push({
          method,
          line: getLineNumber(content, match.index),
        });
      }
    }
  }

  return methods;
}

export function detectRoutes(files) {
  const routes = [];

  for (const file of files) {
    const normalized = normalizePath(file.relativePath);

    const isRouteFile =
      NEXT_APP_ROUTE_PATTERN.test(normalized);

    const methods = detectMethods(file.content);

    if (!isRouteFile && methods.length === 0) {
      continue;
    }

    const uniqueMethods = [
      ...new Map(
        methods.map(method => [
          `${method.method}:${method.line}`,
          method,
        ]),
      ).values(),
    ];

    routes.push({
      file: file.relativePath,
      absolutePath: file.absolutePath,
      routePath: inferRoutePath(file.relativePath),
      isRouteFile,
      methods: uniqueMethods,
      lineCount: file.lineCount,
    });
  }

  return routes;
}

export function inferServiceFromPath(
  relativePath,
  services,
) {
  const normalized = normalizePath(relativePath);

  for (const service of services) {
    const servicePath =
      normalizePath(service.path);

    if (
      normalized === servicePath ||
      normalized.startsWith(`${servicePath}/`)
    ) {
      return service.name;
    }
  }

  return null;
}
