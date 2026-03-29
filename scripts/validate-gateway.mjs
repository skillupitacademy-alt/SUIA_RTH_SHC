#!/usr/bin/env node

import crypto from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const LIVE = process.argv.includes('--live') || process.env.VALIDATE_GATEWAY_LIVE === '1';
const GATEWAY_BASE_URL = normalizeBaseUrl(process.env.VALIDATE_GATEWAY_BASE_URL ?? process.env.GATEWAY_BASE_URL);

const ROUTE_TABLE_PATH = path.join(ROOT, 'services/api-gateway/src/routes/routing-table.ts');
const WRANGLER_PATH = path.join(ROOT, 'services/api-gateway/wrangler.toml');
const DEPLOY_WORKFLOW_PATH = path.join(ROOT, '.github/workflows/deploy-gateway.yml');
const GATEWAY_TEST_PATH = path.join(ROOT, 'services/api-gateway/src/__tests__/gateway.test.ts');
const API_SERVER_ROOT = path.join(ROOT, 'apps/api-server/src/app/api');
const REPORT_PATH = path.join(ROOT, 'validation-report.json');

const WEB_UPSTREAM_KEYS = new Set(['SKILLUP_WEB_URL', 'SKILLUP_ADMIN_URL', 'FACULTY_URL']);
const LOCAL_API_KEYS = new Set(['EXAM_SERVICE_URL', 'NOTIFICATION_URL']);
const OPTIONAL_SERVICE_KEYS = new Set(['CRM_SERVICE_URL', 'PAYMENT_SERVICE_URL', 'PLACEMENT_URL']);
const PLACEHOLDER_ENDPOINT_HOSTS = new Set(['api.example.com', 'localhost', '127.0.0.1', '0.0.0.0']);

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

function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

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
    if (entry.isFile() && predicate(fullPath)) files.push(fullPath);
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
  for (const ch of source) {
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
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
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
  if (hashIndex !== -1) value = value.slice(0, hashIndex);
  value = value.replace(/\/{2,}/g, '/').replace(/^__DYNAMIC__\/?/, '');
  const queryIndex = value.indexOf('?');
  const pathname = queryIndex === -1 ? value : value.slice(0, queryIndex);
  if (!pathname.startsWith('/')) return null;
  return pathname.replace(/\/+$/, '') || '/';
}

function normalizeRoutePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

function parseRouteTable(source) {
  const routes = [];
  const match = source.match(/ROUTING_TABLE:\s*GatewayRoute\[\]\s*=\s*\[([\s\S]*?)\n\];/m);
  if (!match) return routes;
  for (const objectMatch of match[1].matchAll(/\{([\s\S]*?)\}/g)) {
    const obj = {};
    for (const part of splitTopLevelComma(objectMatch[1])) {
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const raw = part.slice(idx + 1).trim();
      if (raw === 'true' || raw === 'false') {
        obj[key] = raw === 'true';
        continue;
      }
      const str = raw.match(/^'([^']*)'$|^"([^"]*)"$/);
      if (str) obj[key] = str[1] ?? str[2] ?? '';
    }
    if (typeof obj.prefix === 'string' && typeof obj.upstreamKey === 'string') {
      routes.push({
        host: obj.host,
        prefix: obj.prefix,
        upstreamKey: obj.upstreamKey,
        upstreamPathPrefix: obj.upstreamPathPrefix,
        public: obj.public,
        auth: obj.auth,
        requireRole: obj.requireRole,
      });
    }
  }
  return routes;
}

function parseTomlVars(source) {
  const result = {};
  const match = source.match(/vars\s*=\s*\{([\s\S]*?)\}/m);
  if (!match) return result;
  for (const part of splitTopLevelComma(match[1])) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim().replace(/^"|"$/g, '');
    if (key) result[key] = raw;
  }
  return result;
}

function parseWorkflowEnvKeys(source) {
  const keys = new Set();
  const pattern = /^\s{4,}([A-Z0-9_]+):\s*(.+)$/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const value = match[2].trim();
    if (value && !value.startsWith('#')) keys.add(match[1]);
  }
  return keys;
}

function pathToBackendRoute(filePath) {
  const rel = path.relative(API_SERVER_ROOT, filePath).replaceAll(path.sep, '/');
  if (!rel.endsWith('/route.ts')) return null;
  return `/api/${rel.slice(0, -'/route.ts'.length)}`;
}

function extractBackendMethods(source) {
  const methods = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) methods.add(match[1]);
  for (const match of source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)\b/g)) methods.add(match[1]);
  return methods;
}

function pathMatchesBackendPattern(endpointPath, backendPath) {
  const left = endpointPath.split('/').filter(Boolean);
  const right = backendPath.split('/').filter(Boolean);
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (right[i].startsWith('[') && right[i].endsWith(']')) continue;
    if (left[i] === '__DYNAMIC__') continue;
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function combinePaths(base, tail) {
  const left = base.replace(/\/+$/, '');
  const right = tail.startsWith('/') ? tail : `/${tail}`;
  return `${left}${right}`;
}

function matchesPrefix(pathname, prefix) {
  return prefix === '/' || pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hostMatches(route, endpointHost) {
  if (route.host !== undefined) return endpointHost === route.host;
  if (endpointHost === undefined) return true;
  if (PLACEHOLDER_ENDPOINT_HOSTS.has(endpointHost)) return true;
  return endpointHost.endsWith('.example.com');
}

function routeKey(route) {
  return `${route.host ?? '*'}::${route.prefix}::${route.upstreamKey}::${route.upstreamPathPrefix ?? ''}`;
}

function findMatchingGatewayRoute(routes, endpoint) {
  return routes
    .filter((route) => hostMatches(route, endpoint.host) && matchesPrefix(endpoint.endpoint, route.prefix))
    .sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0) || b.prefix.length - a.prefix.length)[0];
}

function collectEndpointUsagesFromText(source, filePath) {
  const results = [];
  for (const pattern of FETCH_ENDPOINT_PATTERNS) {
    let match;
    while ((match = pattern.regex.exec(source)) !== null) {
      const raw = match[pattern.endpointGroup];
      const endpoint = normalizeEndpoint(raw);
      if (!endpoint) continue;
      let method = pattern.method;
      if (pattern.methodGroup !== null) {
        method = String(match[pattern.methodGroup]).toUpperCase();
      }
      results.push({ filePath, method, endpoint, raw });
    }
  }
  return results;
}

function collectAbsoluteUrlEndpoints(source, filePath) {
  const results = [];
  const pattern = /(['"`])https?:\/\/[^'"`\s)]+?\1/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const raw = match[0].slice(1, -1);
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    const endpoint = normalizeRoutePath(`${parsed.pathname}${parsed.search}`);
    const tail = source.slice(match.index, Math.min(source.length, match.index + 600));
    const methodMatch = tail.match(/method\s*:\s*['"]([A-Z]+)['"]/i);
    results.push({
      filePath,
      method: methodMatch ? methodMatch[1].toUpperCase() : 'GET',
      endpoint,
      host: parsed.hostname,
      raw,
    });
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
    } catch {}
  }
  const endpoints = [];
  for (const filePath of files) {
    if (isIgnorableFile(filePath)) continue;
    if (filePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}`)) continue;
    endpoints.push(...collectEndpointUsagesFromText(await readText(filePath), filePath));
  }
  const seen = new Set();
  return endpoints.filter((item) => {
    const key = `${item.method}:${item.endpoint}:${item.filePath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectGatewayEndpoints() {
  try {
    const endpoints = collectAbsoluteUrlEndpoints(await readText(GATEWAY_TEST_PATH), GATEWAY_TEST_PATH);
    const seen = new Set();
    return endpoints.filter((item) => {
      const key = `${item.host}:${item.method}:${item.endpoint}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
}

async function collectApiServerRoutes() {
  const files = await walkFiles(API_SERVER_ROOT, (filePath) => filePath.endsWith('/route.ts') || filePath.endsWith('\\route.ts'));
  const routes = [];
  for (const filePath of files) {
    const backendPath = pathToBackendRoute(filePath);
    if (!backendPath) continue;
    routes.push({
      filePath,
      path: backendPath,
      methods: extractBackendMethods(await readText(filePath)),
    });
  }
  return routes;
}

function createSignedJwt(secret, payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function authHeaders(secret, role = 'student', gatewaySecret = process.env.INTERNAL_GATEWAY_SECRET) {
  if (typeof secret !== 'string' || secret.trim().length === 0) return null;
  const now = Math.floor(Date.now() / 1000);
  const isAdmin = role === 'admin';
  const token = createSignedJwt(secret, {
    sub: 'validation-user',
    roles: isAdmin ? ['admin'] : ['student'],
    subscriptions: ['combo'],
    aud: isAdmin ? 'admin' : 'user',
    tokenType: isAdmin ? 'admin' : 'user',
    brand: 'realtutorialhub',
    iss: 'skillhubcore.in',
    iat: now,
    exp: now + 3600,
  });
  return {
    authorization: `Bearer ${token}`,
    cookie: `skillhubcore_accessToken=${token}; accessToken=${token}`,
    ...(typeof gatewaySecret === 'string' && gatewaySecret.trim().length > 0
      ? { 'x-gateway-secret': gatewaySecret }
      : {}),
  };
}

function getValidationSecret(role = 'student') {
  if (role === 'admin') {
    return process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET;
  }
  return process.env.JWT_SECRET;
}

function buildRouteCases(routes, observedEndpoints) {
  const cases = [];
  const seen = new Set();
  for (const endpoint of observedEndpoints) {
    const route = findMatchingGatewayRoute(routes, endpoint);
    if (!route) continue;
    const suffix = route.prefix === '/' ? endpoint.endpoint : endpoint.endpoint.slice(route.prefix.length);
    const gatewayPath = endpoint.endpoint;
    const upstreamPath = route.upstreamPathPrefix ? combinePaths(route.upstreamPathPrefix, suffix) : gatewayPath;
    const key = `${routeKey(route)}::${endpoint.method}::${gatewayPath}::${upstreamPath}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cases.push({
      route,
      method: endpoint.method,
      gatewayPath,
      path: upstreamPath,
      source: endpoint.host ? `${endpoint.host}${endpoint.endpoint}` : endpoint.endpoint,
      expectedJson: !WEB_UPSTREAM_KEYS.has(route.upstreamKey),
      authRequired: route.auth === true,
      adminRequired: route.requireRole === 'admin',
    });
  }
  for (const route of routes) {
    if (cases.some((entry) => routeKey(entry.route) === routeKey(route))) continue;
    const gatewayPath = route.prefix;
    const upstreamPath = route.upstreamPathPrefix ?? route.prefix;
    cases.push({
      route,
      method: 'GET',
      gatewayPath,
      path: upstreamPath,
      source: 'route-table',
      expectedJson: !WEB_UPSTREAM_KEYS.has(route.upstreamKey),
      authRequired: route.auth === true,
      adminRequired: route.requireRole === 'admin',
    });
  }
  return cases;
}

async function probeOnce(url, probe, timeoutMs = 3000) {
  const target = new URL(probe.path, url).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: probe.method,
      headers: probe.headers,
      body: probe.body,
      redirect: 'follow',
      signal: controller.signal,
      duplex: probe.body !== undefined && probe.method !== 'GET' && probe.method !== 'HEAD' ? 'half' : undefined,
    });
    return {
      url: target,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      bodyText: await response.text(),
    };
  } catch (error) {
    return {
      url: target,
      finalUrl: target,
      status: 0,
      contentType: '',
      bodyText: '',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function probeWithRetries(url, probe, retries = 2, timeoutMs = 3000) {
  const attempts = [];
  let last;
  for (let i = 0; i <= retries; i += 1) {
    last = await probeOnce(url, probe, timeoutMs);
    attempts.push(last);
    const retryable = last.error || last.status === 0 || last.status >= 500;
    if (!retryable) break;
    if (i < retries) await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
  }
  return { ...last, attempts };
}

function classifyProbe(probe, result, authRequired) {
  if (result.error) {
    return { ok: false, errorType: /abort/i.test(result.error) ? 'TIMEOUT' : 'NETWORK', message: result.error };
  }
  if (result.status === 404) return { ok: false, errorType: 'MISSING_ROUTE_OR_REWRITE', message: `404 from ${result.finalUrl}` };
  if (result.status === 502) return { ok: false, errorType: 'UPSTREAM_502', message: `502 from ${result.finalUrl}` };
  if (result.status >= 500) return { ok: false, errorType: 'UPSTREAM_FAILURE', message: `${result.status} from ${result.finalUrl}` };
  if (authRequired && (result.status === 401 || result.status === 403)) {
    return { ok: true, errorType: null, message: null };
  }

  const allowed = probe.expectedJson ? [200, 201, 204, 400, 401] : [200, 201, 204, 301, 302, 307, 308, 400, 401];
  if (!allowed.includes(result.status)) {
    return { ok: false, errorType: 'UNEXPECTED_STATUS', message: `${result.status} from ${result.finalUrl}` };
  }

  if (probe.expectedJson && result.status >= 200 && result.status < 300) {
    const looksJson = result.contentType.includes('json') || result.bodyText.trim().startsWith('{') || result.bodyText.trim().startsWith('[');
    if (!looksJson) return { ok: false, errorType: 'INVALID_JSON', message: `Expected JSON from ${result.finalUrl}` };
    try {
      const json = JSON.parse(result.bodyText);
      if (json === null || (typeof json !== 'object' && !Array.isArray(json))) {
        return { ok: false, errorType: 'INVALID_JSON_SHAPE', message: `Unexpected JSON shape from ${result.finalUrl}` };
      }
      if (typeof json === 'object' && !Array.isArray(json) && 'error' in json) {
        return { ok: false, errorType: 'API_ERROR_RESPONSE', message: `Error payload from ${result.finalUrl}` };
      }
    } catch {
      return { ok: false, errorType: 'INVALID_JSON', message: `Unable to parse JSON from ${result.finalUrl}` };
    }
  }

  return { ok: true, errorType: null, message: null };
}

function getBackendCandidate(endpointPath) {
  const normalized = normalizeRoutePath(endpointPath);
  if (!normalized.startsWith('/api/')) return null;
  return path.join(API_SERVER_ROOT, `${normalized.slice('/api/'.length)}`, 'route.ts');
}

function probeCandidatesForService(serviceKey, routeCases) {
  const matches = routeCases.filter((item) => item.route.upstreamKey === serviceKey);
  const firstGet = matches.find((item) => item.method === 'GET');
  const pick = firstGet ?? matches[0];
  if (pick) {
    return {
      health: LIVE_PROBES[serviceKey],
      functional: { method: pick.method, path: pick.path, adminRequired: pick.adminRequired },
      fallback: { method: pick.method, path: pick.path, adminRequired: pick.adminRequired },
    };
  }
  return { health: LIVE_PROBES[serviceKey] ?? { path: '/', ok: [200, 301, 302, 307, 308] }, functional: { method: 'GET', path: '/' }, fallback: { method: 'GET', path: '/' } };
}

function isHealthyStatus(status, allowed) {
  return Array.isArray(allowed) && allowed.includes(status);
}

async function main() {
  const [routeSource, wranglerSource, workflowSource] = await Promise.all([
    readText(ROUTE_TABLE_PATH),
    readText(WRANGLER_PATH),
    readText(DEPLOY_WORKFLOW_PATH),
  ]);

  const routes = parseRouteTable(routeSource);
  const wranglerVars = parseTomlVars(wranglerSource);
  const workflowEnvKeys = parseWorkflowEnvKeys(workflowSource);
  const frontendEndpoints = await collectFrontendEndpoints();
  const gatewayEndpoints = await collectGatewayEndpoints();
  const apiServerRoutes = await collectApiServerRoutes();
  const routeCases = buildRouteCases(routes, [...frontendEndpoints.map((item) => ({ ...item, host: undefined })), ...gatewayEndpoints]);

  const routeChecks = [];
  for (const probe of routeCases) {
    const backendCandidate = getBackendCandidate(probe.path);
    const backendRoute = backendCandidate ? apiServerRoutes.find((candidate) => pathMatchesBackendPattern(backendCandidate, candidate.path)) : null;
    const bindingUrl = wranglerVars[probe.route.upstreamKey];
    const isLocalApiRoute = LOCAL_API_KEYS.has(probe.route.upstreamKey);
    const isOptionalService = OPTIONAL_SERVICE_KEYS.has(probe.route.upstreamKey);
    const auth = probe.authRequired
      ? authHeaders(getValidationSecret(probe.adminRequired ? 'admin' : 'student'), probe.adminRequired ? 'admin' : 'student')
      : null;

    let liveResult = null;
    let classification = { ok: true, errorType: null, message: null };
    if (LIVE) {
      if (typeof bindingUrl !== 'string' || bindingUrl.trim().length === 0) {
        classification = {
          ok: isOptionalService,
          errorType: isOptionalService ? 'OPTIONAL_MISSING_BINDING' : 'MISSING_BINDING',
          message: `Missing binding for ${probe.route.upstreamKey}`,
        };
      } else {
        liveResult = await probeWithRetries(bindingUrl, { method: probe.method, path: probe.path, headers: auth ?? undefined }, 2, 3000);
        classification = classifyProbe(probe, liveResult, probe.authRequired);
        if (classification.ok && isLocalApiRoute && probe.path.startsWith('/api/') && backendRoute && !backendRoute.methods.has(probe.method)) {
          classification = { ok: false, errorType: 'METHOD_MISMATCH', message: `Backend does not implement ${probe.method} ${probe.path}` };
        }
        if (classification.ok && isLocalApiRoute && probe.path.startsWith('/api/') && backendCandidate && backendRoute === null) {
          classification = { ok: false, errorType: 'MISSING_BACKEND_ENDPOINT', message: `Missing backend endpoint for ${probe.path}` };
        }
      }
    }

    routeChecks.push({
      ...probe,
      backendFile: backendRoute ? path.relative(ROOT, backendRoute.filePath) : undefined,
      backendMethods: backendRoute ? [...backendRoute.methods].sort() : undefined,
      backendRoute: backendRoute ? backendRoute.path : undefined,
      live: liveResult,
      status: LIVE ? (classification.ok ? 'PASS' : 'FAIL') : 'SKIPPED',
      errorType: classification.errorType,
      error: classification.message,
    });
  }

  const gatewayAuthChecks = [];
  if (LIVE && GATEWAY_BASE_URL !== null && typeof process.env.JWT_SECRET === 'string' && process.env.JWT_SECRET.trim().length > 0) {
    for (const probe of routeCases.filter((item) => item.authRequired)) {
      const auth = authHeaders(process.env.JWT_SECRET, probe.adminRequired ? 'admin' : 'student');
      const result = await probeWithRetries(GATEWAY_BASE_URL, {
        method: probe.method,
        path: probe.gatewayPath,
        headers: auth ?? undefined,
      }, 2, 3000);
      const classification = classifyProbe(probe, result, true);
      gatewayAuthChecks.push({
        ...probe,
        live: result,
        status: classification.ok ? 'PASS' : 'FAIL',
        errorType: classification.errorType,
        error: classification.message,
      });
    }
  }

  const routeSummary = routes.map((route) => {
    const cases = routeChecks.filter((item) => routeKey(item.route) === routeKey(route));
    const failures = cases.filter((item) => item.status === 'FAIL');
    return {
      route,
      status: failures.length > 0 ? 'FAIL' : 'PASS',
      cases,
      errors: failures.map((item) => ({ method: item.method, path: item.path, errorType: item.errorType, message: item.error })),
    };
  });

  const usedServices = [...new Set(routes.map((route) => route.upstreamKey))].sort();
  const missingBindings = usedServices.filter((key) => !wranglerVars[key] && !OPTIONAL_SERVICE_KEYS.has(key));
  const optionalMissingBindings = usedServices.filter((key) => !wranglerVars[key] && OPTIONAL_SERVICE_KEYS.has(key));
  const missingWorkflowVars = usedServices.filter((key) => !workflowEnvKeys.has(key) && !OPTIONAL_SERVICE_KEYS.has(key));
  const optionalWorkflowVars = usedServices.filter((key) => !workflowEnvKeys.has(key) && OPTIONAL_SERVICE_KEYS.has(key));

  const serviceFindings = [];
  if (LIVE) {
    for (const key of usedServices) {
      const url = wranglerVars[key];
      const candidates = probeCandidatesForService(key, routeChecks);
      const probes = [];
      if (candidates.health) probes.push({ ...candidates.health, label: 'health' });
      if (candidates.functional) probes.push({ ...candidates.functional, label: 'functional' });
      if (!url) {
        serviceFindings.push({
          key,
          status: OPTIONAL_SERVICE_KEYS.has(key) ? 'optional-missing-binding' : 'missing-binding',
          ok: OPTIONAL_SERVICE_KEYS.has(key),
          probes: [],
        });
        continue;
      }
      let healthy = true;
      const results = [];
      for (const probe of probes) {
        const auth = probe.label === 'functional' && !WEB_UPSTREAM_KEYS.has(key)
          ? authHeaders(
              getValidationSecret(probe.adminRequired === true ? 'admin' : 'student'),
              probe.adminRequired === true ? 'admin' : 'student',
            )
          : null;
        const result = await probeWithRetries(url, { method: probe.method, path: probe.path, headers: auth ?? undefined }, 2, 3000);
        const ok = probe.label === 'health'
          ? isHealthyStatus(result.status, probe.ok)
          : result.status > 0 && result.status < 500 && result.status !== 404 && result.status !== 502;
        results.push({ label: probe.label, ...result, ok });
        if (!ok) healthy = false;
      }
      serviceFindings.push({ key, url, ok: healthy, status: healthy ? 'healthy' : 'unhealthy', probes: results });
    }
  }

  const errors = [
    ...routeSummary.flatMap((entry) => entry.errors.map((error) => ({
      type: error.errorType,
      route: entry.route.prefix,
      upstreamKey: entry.route.upstreamKey,
      path: error.path,
      method: error.method,
      message: error.message,
    }))),
    ...gatewayAuthChecks.filter((item) => item.status === 'FAIL').map((item) => ({
      type: item.errorType,
      route: item.route.prefix,
      upstreamKey: item.route.upstreamKey,
      path: item.gatewayPath,
      method: item.method,
      message: item.error,
    })),
    ...serviceFindings.flatMap((service) => (service.probes ?? []).filter((probe) => probe.ok === false).map((probe) => ({
      type: probe.label === 'health' ? 'SERVICE_HEALTH' : 'SERVICE_FUNCTIONAL',
      service: service.key,
      path: probe.path,
      message: probe.error ?? `status ${probe.status}`,
    }))),
    ...missingBindings.map((service) => ({ type: 'MISSING_BINDING', service, message: `Missing binding for ${service}` })),
    ...missingWorkflowVars.map((service) => ({ type: 'MISSING_WORKFLOW_BINDING', service, message: `Missing workflow env for ${service}` })),
  ];

  const report = {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    generatedAt: new Date().toISOString(),
    services: {
      used: usedServices,
      missingBindings,
      optionalMissingBindings,
      workflowMissingBindings: missingWorkflowVars,
      optionalWorkflowMissingBindings: optionalWorkflowVars,
      live: serviceFindings,
    },
    gateway: {
      baseUrl: GATEWAY_BASE_URL,
      authChecks: gatewayAuthChecks,
    },
    routes: {
      total: routes.length,
      planned: routeCases,
      results: routeChecks,
      summary: routeSummary,
    },
    errors,
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('Gateway Validation Report');
  console.log('========================');
  console.log('');
  console.log(`Report saved to: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Status: ${report.status}`);
  console.log('');

  console.log('Route coverage:');
  for (const entry of routeSummary) {
    console.log(`  - ${entry.status} ${entry.route.prefix} -> ${entry.route.upstreamKey}${entry.route.upstreamPathPrefix ? ` (${entry.route.upstreamPathPrefix})` : ''}`);
    for (const failure of entry.errors) {
      console.log(`    - ${failure.method} ${failure.path}: ${failure.errorType} ${failure.message}`);
    }
  }
  console.log('');

  console.log('Missing required env vars in services/api-gateway/wrangler.toml:');
  console.log(missingBindings.length === 0 ? '  - none' : missingBindings.map((key) => `  - ${key}`).join('\n'));
  console.log('Missing optional env vars in services/api-gateway/wrangler.toml:');
  console.log(optionalMissingBindings.length === 0 ? '  - none' : optionalMissingBindings.map((key) => `  - ${key}`).join('\n'));
  console.log('');

  console.log('Missing env vars in .github/workflows/deploy-gateway.yml:');
  console.log(missingWorkflowVars.length === 0 ? '  - none' : missingWorkflowVars.map((key) => `  - ${key}`).join('\n'));
  console.log('Missing optional env vars in .github/workflows/deploy-gateway.yml:');
  console.log(optionalWorkflowVars.length === 0 ? '  - none' : optionalWorkflowVars.map((key) => `  - ${key}`).join('\n'));
  console.log('');

  console.log('Live upstream checks:');
  if (!LIVE) {
    console.log('  - skipped (run with --live or VALIDATE_GATEWAY_LIVE=1)');
  } else {
    for (const item of serviceFindings) {
      const details = (item.probes ?? []).map((probe) => `${probe.label}:${probe.status}${probe.error ? `(${probe.error})` : ''}`).join(', ');
      console.log(`  - ${item.ok ? 'PASS' : 'FAIL'} ${item.key} -> ${item.url} [${details}]`);
    }
  }
  console.log('');

  console.log('Gateway auth propagation:');
  if (!LIVE || GATEWAY_BASE_URL === null) {
    console.log('  - skipped (set VALIDATE_GATEWAY_BASE_URL to validate through the Worker)');
  } else if (gatewayAuthChecks.length === 0) {
    console.log('  - no protected routes discovered');
  } else {
    for (const item of gatewayAuthChecks) {
      console.log(`  - ${item.status} ${item.gatewayPath} -> ${item.route.upstreamKey}${item.error ? ` (${item.error})` : ''}`);
    }
  }
  console.log('');

  if (process.env.VALIDATE_GATEWAY_JSON === '1') {
    console.log(JSON.stringify(report, null, 2));
  }

  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Gateway validation failed fatally:');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
