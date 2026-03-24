#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const LIVE = process.argv.includes('--live') || process.env.VALIDATE_GATEWAY_LIVE === '1';

const ROUTE_TABLE_PATH = path.join(ROOT, 'services/api-gateway/src/routes/routing-table.ts');
const WRANGLER_PATH = path.join(ROOT, 'services/api-gateway/wrangler.toml');
const DEPLOY_WORKFLOW_PATH = path.join(ROOT, '.github/workflows/deploy-gateway.yml');
const API_SERVER_ROOT = path.join(ROOT, 'apps/api-server/src/app/api');

const API_SERVER_KEYS = new Set(['EXAM_SERVICE_URL', 'NOTIFICATION_URL']);
const REQUIRED_SERVICES_FALLBACK = ['EXAM_SERVICE_URL', 'NOTIFICATION_URL', 'SKILLHUBCORE_URL'];
const OPTIONAL_SERVICES_FALLBACK = ['CRM_SERVICE_URL', 'PAYMENT_SERVICE_URL', 'PLACEMENT_URL'];
const IS_DEV = (process.env.NODE_ENV ?? 'production') === 'development';

const LIVE_PROBES = {
  SKILLHUBCORE_URL: { path: '/healthz/', ok: [200] },
  EXAM_SERVICE_URL: { path: '/api/health', ok: [200] },
  NOTIFICATION_URL: { path: '/api/health', ok: [200] },
  TUTORIAL_SERVICE_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  STUDENT_FACULTY_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  PAYMENT_SERVICE_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  CRM_SERVICE_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  PLACEMENT_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  SKILLUP_WEB_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  SKILLUP_ADMIN_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  FACULTY_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
  ADMIN_URL: { path: '/', ok: [200, 301, 302, 307, 308] },
};

const FETCH_ENDPOINT_PATTERNS = [
  {
    method: 'GET',
    regex: /(?:this\.)?client\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*([`'"])([\s\S]*?)\2/gs,
    endpointGroup: 3,
    methodGroup: 1,
  },
  {
    method: 'GET',
    regex: /\bfetch\(\s*([`'"])([\s\S]*?)\1/gs,
    endpointGroup: 2,
    methodGroup: null,
  },
];

function isIgnorableFile(filePath) {
  return (
    filePath.includes(`${path.sep}node_modules${path.sep}`) ||
    filePath.includes(`${path.sep}.next${path.sep}`) ||
    filePath.includes(`${path.sep}.turbo${path.sep}`) ||
    filePath.includes(`${path.sep}.wrangler${path.sep}`) ||
    filePath.includes(`${path.sep}dist${path.sep}`) ||
    filePath.includes(`${path.sep}coverage${path.sep}`) ||
    /(^|[\\/])__tests__([\\/]|$)/.test(filePath) ||
    /\.test\.[jt]sx?$/.test(filePath) ||
    /\.spec\.[jt]sx?$/.test(filePath)
  );
}

async function walkFiles(dir, predicate = () => true) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isIgnorableFile(fullPath)) continue;
      files.push(...await walkFiles(fullPath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

function splitTopLevelComma(source) {
  const result = [];
  let current = '';
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }

    if (quote !== null) {
      current += ch;
      if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
      current += ch;
      continue;
    }

    if (ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

function normalizeEndpoint(raw) {
  if (typeof raw !== 'string') return null;
  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/\$\{[^}]+\}/g, '__DYNAMIC__');
  value = value.replace(/\\`/g, '`').replace(/\\'/g, '\'').replace(/\\"/g, '"');

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      value = `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  const hashIndex = value.indexOf('#');
  if (hashIndex !== -1) {
    value = value.slice(0, hashIndex);
  }

  value = value.replace(/\/{2,}/g, '/');
  value = value.replace(/^__DYNAMIC__\/?/, '');

  const queryIndex = value.indexOf('?');
  const pathname = queryIndex === -1 ? value : value.slice(0, queryIndex);
  if (!pathname.startsWith('/')) return null;
  if (pathname.startsWith('/api/')) return null;
  return pathname.replace(/\/+$/, '') || '/';
}

function parseRouteTable(source) {
  const routes = [];
  const routeLinePattern = /\{\s*(?:host:\s*'([^']+)'\s*,\s*)?prefix:\s*'([^']+)'\s*,\s*upstreamKey:\s*'([^']+)'(?:\s*,\s*upstreamPathPrefix:\s*'([^']+)')?(?:\s*,\s*(?:public|auth):\s*true)?(?:\s*,\s*requireRole:\s*'([^']+)')?\s*\}/g;
  let match;
  while ((match = routeLinePattern.exec(source)) !== null) {
    routes.push({
      host: match[1] || undefined,
      prefix: match[2],
      upstreamKey: match[3],
      upstreamPathPrefix: match[4] || undefined,
      requireRole: match[5] || undefined,
    });
  }
  return routes;
}

function parseTomlVars(source) {
  const result = {};
  const varsMatch = source.match(/vars\s*=\s*\{([\s\S]*?)\}/m);
  if (!varsMatch) return result;

  const body = varsMatch[1];
  for (const part of splitTopLevelComma(body)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const valueRaw = part.slice(eq + 1).trim();
    const value = valueRaw.replace(/^"|"$/g, '');
    if (key) result[key] = value;
  }

  return result;
}

function parseWorkflowEnvKeys(source) {
  const keys = new Set();
  const pattern = /^\s{4,}([A-Z0-9_]+):\s*(.+)$/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const value = match[2].trim();
    if (value.length === 0) continue;
    if (value.startsWith('#')) continue;
    keys.add(match[1]);
  }
  return keys;
}

function pathToBackendRoute(filePath) {
  const rel = path.relative(API_SERVER_ROOT, filePath).replaceAll(path.sep, '/');
  if (!rel.endsWith('/route.ts')) return null;
  const endpoint = rel.slice(0, -'/route.ts'.length);
  return `/api/${endpoint}`;
}

function endpointToFileCandidate(endpoint) {
  const normalized = endpoint.replace(/\/+$/, '') || '/';
  if (!normalized.startsWith('/api/')) return null;
  return path.join(API_SERVER_ROOT, `${normalized.slice('/api/'.length)}`, 'route.ts');
}

function pathMatchesBackendPattern(endpointPath, backendPath) {
  const endpointSegments = endpointPath.split('/').filter(Boolean);
  const backendSegments = backendPath.split('/').filter(Boolean);
  if (endpointSegments.length !== backendSegments.length) return false;
  for (let i = 0; i < endpointSegments.length; i += 1) {
    const backendSegment = backendSegments[i];
    const endpointSegment = endpointSegments[i];
    if (backendSegment.startsWith('[') && backendSegment.endsWith(']')) continue;
    if (endpointSegment === '__DYNAMIC__') continue;
    if (backendSegment !== endpointSegment) return false;
  }
  return true;
}

function extractBackendMethods(source) {
  const methods = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) {
    methods.add(match[1]);
  }
  for (const match of source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)\b/g)) {
    methods.add(match[1]);
  }
  return methods;
}

function findMatchingGatewayRoute(routes, pathname) {
  const matches = routes
    .filter((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  return matches[0];
}

function normalizeRoutePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

function getServiceProbeCandidates(serviceKey, routeFindings) {
  const serviceRoutes = routeFindings
    .filter((item) => item.status === 'routed' && item.upstreamKey === serviceKey)
    .map((item) => ({
      method: item.method,
      path: normalizeRoutePath(item.upstreamPath),
    }));

  if (serviceRoutes.length > 0) {
    const preferred = serviceRoutes.find((route) => route.method === 'GET')
      ?? serviceRoutes[0];
    const fallback = serviceRoutes[0];
    return {
      health: LIVE_PROBES[serviceKey],
      functional: preferred,
      fallback,
    };
  }

  if (serviceKey === 'SKILLHUBCORE_URL') {
    return {
      health: LIVE_PROBES[serviceKey],
      functional: { method: 'POST', path: '/auth/login' },
      fallback: { method: 'GET', path: '/healthz/' },
    };
  }

  if (serviceKey === 'ADMIN_URL') {
    return {
      health: LIVE_PROBES[serviceKey],
      functional: { method: 'GET', path: '/' },
      fallback: { method: 'GET', path: '/' },
    };
  }

  return {
    health: LIVE_PROBES[serviceKey] ?? { path: '/', ok: [200, 301, 302, 307, 308] },
    functional: { method: 'GET', path: '/' },
    fallback: { method: 'GET', path: '/' },
  };
}

function collectEndpointUsagesFromText(source, filePath) {
  const results = [];

  for (const pattern of FETCH_ENDPOINT_PATTERNS) {
    let match;
    while ((match = pattern.regex.exec(source)) !== null) {
      const raw = match[pattern.endpointGroup];
      const normalized = normalizeEndpoint(raw);
      if (!normalized) continue;

      let method = pattern.method;
      if (pattern.methodGroup !== null) {
        method = String(match[pattern.methodGroup]).toUpperCase();
      } else if (match[0].includes('fetch(')) {
        const window = source.slice(match.index, Math.min(source.length, match.index + 500));
        const methodMatch = window.match(/method\s*:\s*['"]([A-Z]+)['"]/i);
        if (methodMatch) {
          method = methodMatch[1].toUpperCase();
        }
      }

      results.push({
        filePath,
        method,
        endpoint: normalized,
        raw,
      });
    }
  }

  return results;
}

async function collectFrontendEndpoints() {
  const roots = [
    path.join(ROOT, 'packages/api-client/src/modules'),
    path.join(ROOT, 'packages/ui/src'),
    path.join(ROOT, 'apps/realtutorialhub-quiz/src'),
    path.join(ROOT, 'apps/realtutorialhub-admin/src'),
    path.join(ROOT, 'apps/skillup-web/src'),
    path.join(ROOT, 'apps/skillup-admin/src'),
    path.join(ROOT, 'apps/faculty-app/src'),
  ];

  const files = [];
  for (const dir of roots) {
    try {
      files.push(...await walkFiles(dir, (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx')));
    } catch {
      // Directory missing in some environments.
    }
  }

  const endpoints = [];
  for (const filePath of files) {
    if (isIgnorableFile(filePath)) continue;
    if (filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}`)) continue;
    const source = await readText(filePath);
    endpoints.push(...collectEndpointUsagesFromText(source, filePath));
  }

  const seen = new Set();
  return endpoints.filter((item) => {
    const key = `${item.method}:${item.endpoint}:${item.filePath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectApiServerRoutes() {
  const files = await walkFiles(API_SERVER_ROOT, (filePath) => filePath.endsWith('/route.ts') || filePath.endsWith('\\route.ts'));
  const routes = [];
  for (const filePath of files) {
    const backendPath = pathToBackendRoute(filePath);
    if (!backendPath) continue;
    const source = await readText(filePath);
    routes.push({
      filePath,
      path: backendPath,
      methods: extractBackendMethods(source),
    });
  }
  return routes;
}

function isHealthyStatus(status, allowed) {
  return Array.isArray(allowed) && allowed.includes(status);
}

async function probeUpstream(url, probe) {
  const target = new URL(probe.path, url).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const init = {
      method: probe.method ?? 'GET',
      redirect: 'follow',
      signal: controller.signal,
    };

    if (probe.headers !== undefined) {
      init.headers = probe.headers;
    }
    if (probe.body !== undefined) {
      init.body = probe.body;
      if ((probe.method ?? 'GET').toUpperCase() !== 'GET' && (probe.method ?? 'GET').toUpperCase() !== 'HEAD') {
        init.duplex = 'half';
      }
    }

    const response = await fetch(target, init);
    return {
      url: target,
      status: response.status,
      ok: isHealthyStatus(response.status, probe.ok),
      contentType: response.headers.get('content-type') ?? '',
    };
  } catch (error) {
    return {
      url: target,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const [routeTableSource, wranglerSource, workflowSource] = await Promise.all([
    readText(ROUTE_TABLE_PATH),
    readText(WRANGLER_PATH),
    readText(DEPLOY_WORKFLOW_PATH),
  ]);

  const routes = parseRouteTable(routeTableSource);
  const wranglerVars = parseTomlVars(wranglerSource);
  const workflowEnvKeys = parseWorkflowEnvKeys(workflowSource);
  const frontendEndpoints = await collectFrontendEndpoints();
  const apiServerRoutes = await collectApiServerRoutes();
  const routeUsageByService = new Map();

  const endpointFindings = [];
  for (const item of frontendEndpoints) {
    const gatewayRoute = findMatchingGatewayRoute(routes, item.endpoint);
    if (!gatewayRoute) {
      endpointFindings.push({
        ...item,
        status: 'missing-gateway-route',
      });
      continue;
    }

    const suffix = item.endpoint.slice(gatewayRoute.prefix.length);
    const upstreamPath = gatewayRoute.upstreamPathPrefix ? `${gatewayRoute.upstreamPathPrefix}${suffix}` : item.endpoint;
    const classified = {
      ...item,
      routePrefix: gatewayRoute.prefix,
      upstreamKey: gatewayRoute.upstreamKey,
      upstreamPath,
      status: 'routed',
    };

    if (API_SERVER_KEYS.has(gatewayRoute.upstreamKey)) {
      const backendRoute = apiServerRoutes.find((candidate) => pathMatchesBackendPattern(upstreamPath, candidate.path));
      if (!backendRoute) {
        endpointFindings.push({
          ...classified,
          status: 'missing-backend-endpoint',
        });
        continue;
      }

      if (!backendRoute.methods.has(item.method)) {
        endpointFindings.push({
          ...classified,
          backendFile: path.relative(ROOT, backendRoute.filePath),
          status: 'method-mismatch',
          backendMethods: [...backendRoute.methods].sort(),
        });
        continue;
      }
    }

    endpointFindings.push(classified);

    if (!routeUsageByService.has(gatewayRoute.upstreamKey)) {
      routeUsageByService.set(gatewayRoute.upstreamKey, []);
    }
    routeUsageByService.get(gatewayRoute.upstreamKey).push(classified);
  }

  const discoveredUsedServices = [...routeUsageByService.keys()].sort();
  const usedServices = discoveredUsedServices.length > 0 ? discoveredUsedServices : REQUIRED_SERVICES_FALLBACK;
  const optionalServices = OPTIONAL_SERVICES_FALLBACK.filter((key) => !usedServices.includes(key));
  const allRouteServices = [...new Set(routes.map((route) => route.upstreamKey))].sort();
  const missingWranglerVars = usedServices.filter((key) => !wranglerVars[key]);
  const missingWorkflowVars = usedServices.filter((key) => !workflowEnvKeys.has(key));
  const unusedBindings = allRouteServices.filter((key) => !usedServices.includes(key));

  const requiredMissing = usedServices.filter((key) => !wranglerVars[key]);
  const warningMissing = optionalServices.filter((key) => !wranglerVars[key]);

  const liveFindings = [];
  if (LIVE) {
    for (const key of usedServices) {
      const url = wranglerVars[key];
      const candidate = getServiceProbeCandidates(key, endpointFindings);
      const probes = [];

      if (candidate.health) {
        probes.push({ ...candidate.health, label: 'health' });
      }
      if (candidate.functional) {
        probes.push({ ...candidate.functional, label: 'functional' });
      }

      if (!url) {
        liveFindings.push({
          key,
          status: 'missing-binding',
          ok: false,
          probes: [],
        });
        continue;
      }

      try {
        new URL(url);
      } catch {
        liveFindings.push({
          key,
          status: 'invalid-url',
          url,
          ok: false,
          probes: [],
        });
        continue;
      }

      const results = [];
      let serviceHealthy = true;
      for (const probe of probes) {
        const result = await probeUpstream(url, probe);
        const ok = probe.label === 'health'
          ? isHealthyStatus(result.status, probe.ok)
          : (result.status > 0 && result.status < 500 && result.status !== 404);
        results.push({
          label: probe.label,
          ...result,
          ok,
        });
        if (!ok) {
          serviceHealthy = false;
        }
      }

      liveFindings.push({
        key,
        url,
        ok: serviceHealthy,
        status: serviceHealthy ? 'healthy' : 'unhealthy',
        probes: results,
      });
    }
  }

  const brokenRoutes = endpointFindings.filter((item) => item.status !== 'routed');
  const unreachableServices = liveFindings.filter((item) => item.ok === false);
  const missingBackendEndpoints = endpointFindings.filter((item) => item.status === 'missing-backend-endpoint' || item.status === 'method-mismatch');
  const missingRequiredBindings = requiredMissing.filter((key) => !wranglerVars[key]);

  const report = {
    usedServices,
    unusedBindings,
    missingEnvVars: missingRequiredBindings,
    optionalMissingEnvVars: warningMissing,
    missingWorkflowVars,
    brokenRoutes: endpointFindings.filter((item) => item.status === 'missing-gateway-route' || item.status === 'missing-backend-endpoint' || item.status === 'method-mismatch'),
    unreachableServices,
    missingBackendEndpoints,
    frontendEndpoints: endpointFindings,
    liveFindings,
  };

  console.log('Gateway Validation Report');
  console.log('========================');
  console.log('');

  console.log('Used services:');
  if (usedServices.length === 0) {
    console.log('  - none');
  } else {
    for (const key of usedServices) {
      console.log(`  - ${key}`);
    }
  }
  console.log('');

  console.log('Missing required env vars in services/api-gateway/wrangler.toml:');
  if (missingRequiredBindings.length === 0) {
    console.log('  - none');
  } else {
    for (const key of missingRequiredBindings) {
      console.log(`  - ${key}`);
    }
  }
  console.log('');

  console.log('Missing optional env vars in services/api-gateway/wrangler.toml:');
  if (warningMissing.length === 0) {
    console.log('  - none');
  } else {
    for (const key of warningMissing) {
      console.log(`  - ${key}`);
    }
  }
  console.log('');

  console.log('Missing env vars in .github/workflows/deploy-gateway.yml:');
  if (missingWorkflowVars.length === 0) {
    console.log('  - none');
  } else {
    for (const key of missingWorkflowVars) {
      console.log(`  - ${key}`);
    }
  }
  console.log('');

  console.log(`Frontend endpoint coverage (${endpointFindings.length} discovered):`);
  if (endpointFindings.length === 0) {
    console.log('  - none found');
  } else {
    for (const item of endpointFindings) {
      const base = `${item.method} ${item.endpoint}`;
      if (item.status === 'routed') {
        console.log(`  - ✅ ${base} -> ${item.upstreamKey}${item.upstreamPath ? ` (${item.upstreamPath})` : ''}`);
      } else if (item.status === 'missing-gateway-route') {
        console.log(`  - ❌ ${base} -> missing gateway route`);
      } else if (item.status === 'missing-backend-endpoint') {
        console.log(`  - ❌ ${base} -> missing backend endpoint (${item.upstreamPath})`);
      } else if (item.status === 'method-mismatch') {
        console.log(`  - ❌ ${base} -> method mismatch (${item.upstreamPath}); backend allows: ${(item.backendMethods || []).join(', ')}`);
      }
    }
  }
  console.log('');

  console.log('Live upstream checks:');
  if (!LIVE) {
    console.log('  - skipped (run with --live or VALIDATE_GATEWAY_LIVE=1)');
  } else if (liveFindings.length === 0) {
    console.log('  - none run');
  } else {
    for (const item of liveFindings) {
      const details = Array.isArray(item.probes)
        ? item.probes.map((probe) => `${probe.label}:${probe.status}${probe.error ? `(${probe.error})` : ''}`).join(', ')
        : item.status;
      if (item.ok) {
        console.log(`  - ✅ ${item.key} -> ${item.url} [${details}]`);
      } else {
        console.log(`  - ❌ ${item.key} -> ${item.url} [${details}${item.error ? `: ${item.error}` : ''}]`);
      }
    }
  }
  console.log('');

  console.log('Fix suggestions:');
  if (missingRequiredBindings.length > 0) {
    console.log(`  - Add the missing required prod bindings to services/api-gateway/wrangler.toml: ${missingRequiredBindings.join(', ')}`);
  } else {
    console.log('  - Required wrangler prod bindings are complete.');
  }
  if (warningMissing.length > 0) {
    console.log(`  - Optional unused bindings are not present and were ignored: ${warningMissing.join(', ')}`);
  }
  if (brokenRoutes.length > 0) {
    console.log('  - Add or correct gateway routing entries for any missing/mismatched frontend endpoints listed above.');
  } else {
    console.log('  - Gateway/frontend/backend route mapping is complete for discovered endpoints.');
  }
  if (LIVE && unreachableServices.length > 0) {
    console.log('  - Investigate the unreachable services before deploy.');
  }

  const hasFailures = (IS_DEV ? false : missingRequiredBindings.length > 0) || brokenRoutes.length > 0 || (LIVE && unreachableServices.length > 0);

  if (hasFailures) {
    process.exitCode = 1;
  }

  if (process.env.VALIDATE_GATEWAY_JSON === '1') {
    console.log('');
    console.log(JSON.stringify(report, null, 2));
  }
}

main().catch((error) => {
  console.error('Gateway validation failed fatally:');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
