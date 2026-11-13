const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const root = path.resolve(__dirname, '../..');
const results = [];
const blockedFetch = async () => { throw new Error('Real HTTP prohibited in this investigation'); };

// Compile current TypeScript bytes in memory. Every dependency is explicitly
// supplied, and an unexpected import aborts instead of opening a real provider.
function load(file, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(javascript, {
    module, exports: module.exports,
    require(name) {
      if (!Object.hasOwn(dependencies, name)) throw new Error('Uncontrolled import ' + name);
      return dependencies[name];
    },
    Request, Response, Headers, URL, AbortSignal, Error, TypeError, Date,
    crypto: require('node:crypto').webcrypto,
    process: { env: { NODE_ENV: 'test', QUEUE_ENABLED: 'false' } },
    console: { log() {}, warn() {}, error() {} },
    fetch: blockedFetch,
    ...globals,
  }, { filename: file });
  return module.exports;
}

async function check(name, run) {
  try {
    const observed = await run();
    results.push({ name, result: 'PASS', observed });
  } catch (error) {
    results.push({ name, result: 'FAIL', error: error.message });
  }
  console.log(JSON.stringify(results.at(-1)));
}

const apiErrors = load('apps/api-server/src/lib/api-error.ts', { '@quiz/auth': { isAuthError: () => false } });
const apiResponses = load('apps/api-server/src/lib/api-response.ts', {
  'next/server': { NextResponse }, './api-error': apiErrors,
});

function backend({ exam = { userId: 'owner-a', status: 'started' }, databaseError, counterError = false } = {}) {
  const calls = { queries: 0, scoring: 0, report: 0 };
  const route = load('apps/api-server/src/app/api/quiz/result/route.ts', {
    '@quiz/db': {
      db: { query: { exams: { async findFirst() {
        calls.queries++;
        if (databaseError) throw databaseError;
        return exam;
      } } } }, exams: { id: 'exam-id' },
    },
    '@quiz/observability': { METRICS: { QUIZ: { SCORE: 'quiz-score' } } },
    'drizzle-orm': { eq: () => 'controlled-query' },
    '@/lib/api-error': apiErrors,
    '@/lib/api-response': apiResponses,
    '@/lib/metrics': {
      recordCounter() { if (counterError) throw new Error('Synthetic metrics dependency failure'); },
      recordTimer() {},
    },
    '@/lib/withLogging': { withLogging: handler => handler },
    '@/modules/auth/token.service': { TokenService: class {} },
    '@/modules/core/container': { container: { get: () => ({
      getAccessToken: () => 'synthetic-user-token',
      verifyUserAccessToken: async () => ({ userId: 'owner-a', brand: 'skillup' }),
    }) } },
    '@/modules/report-engine/report.engine': { ReportEngine: { getExamReport: async () => { calls.report++; throw new Error('Unexpected report path'); } } },
    '@/modules/scoring-engine/scoring.engine': { ScoringEngine: { calculateExamResults: async () => { calls.scoring++; throw new Error('Unexpected scoring path'); } } },
  });
  return { route, calls };
}

function bff(upstream) {
  const shared = load('src/share-branding/auth/authBffRoute.ts', {
    'next/server': { NextResponse }, './config': { AUTH_CONFIG: {} },
    '../lib/unifiedFetch': { unifiedFetch: upstream },
    '@quiz/types': {
      extractHostnameFromHostHeader: host => host.split(':')[0],
      resolveBrandFromHostname: host => host === 'skillup.localhost' ? 'skillup' : undefined,
    },
  }, { process: { env: { NODE_ENV: 'test', GATEWAY_URL: 'http://127.0.0.1:8787', INTERNAL_GATEWAY_SECRET: 'synthetic-gateway-key' } } });
  return load('apps/skillup-web/src/app/api/quiz/result/route.ts', {
    '@/share-branding/auth': { ...shared, FALLBACK_API_BASE_SKILLUP: 'http://unused.invalid' },
  });
}

const request = () => new NextRequest('http://skillup.localhost:3009/api/quiz/result?examId=synthetic-exam', {
  headers: { host: 'skillup.localhost:3009' },
});

(async () => {
  await check('Current backend own started exam exits before scoring or report generation', async () => {
    const { route, calls } = backend();
    const response = await route.GET(request());
    assert.equal(response.status, 202);
    assert.equal(response.headers.get('retry-after'), '5');
    assert.deepEqual(calls, { queries: 1, scoring: 0, report: 0 });
    return { status: response.status, calls };
  });
  await check('Current backend foreign owner is denied before report/scoring', async () => {
    const { route, calls } = backend({ exam: { userId: 'owner-b', status: 'started' } });
    const response = await route.GET(request());
    assert.equal(response.status, 403);
    assert.deepEqual(calls, { queries: 1, scoring: 0, report: 0 });
    return { status: response.status, calls };
  });
  await check('Generic database exception in result handler currently becomes HTTP400', async () => {
    const { route } = backend({ databaseError: new Error('Synthetic database unavailable') });
    const response = await route.GET(request());
    assert.equal(response.status, 400);
    return { status: response.status, publicCode: (await response.json()).code };
  });
  await check('BFF preserves a successfully received backend202 response', async () => {
    const { route } = backend();
    const response = await bff(async () => route.GET(request())).GET(request());
    assert.equal(response.status, 202);
    return { status: response.status };
  });
  await check('BFF preserves a received gateway500 rather than identifying its cause', async () => {
    const response = await bff(async () => Response.json({ error: 'Synthetic gateway error' }, { status: 500 })).GET(request());
    assert.equal(response.status, 500);
    return { status: response.status };
  });
  await check('BFF fetch failure propagates uncaught to its framework boundary', async () => {
    await assert.rejects(bff(async () => { throw new TypeError('Synthetic transport failure'); }).GET(request()), TypeError);
    return { propagatedException: 'TypeError', frameworkStatus: 'Not executed by this isolated test' };
  });
  await check('BFF upstream response-body failure also propagates uncaught', async () => {
    await assert.rejects(bff(async () => ({ arrayBuffer: async () => { throw new TypeError('Synthetic body interruption'); } })).GET(request()), TypeError);
    return { propagatedException: 'TypeError', frameworkStatus: 'Not executed by this isolated test' };
  });
  await check('Gateway proxy helper propagates an upstream transport failure', async () => {
    const proxy = load('services/api-gateway/src/lib/proxy.ts', {}, { fetch: async () => { throw new TypeError('Synthetic upstream unavailable'); } });
    await assert.rejects(proxy.proxyRequest(new Request('http://127.0.0.1:8787/api/quiz/result'), 'http://localhost:3000', {
      requestId: 'synthetic-request', gatewaySecret: 'synthetic-gateway-key', brand: 'skillup', roles: ['student'],
    }), TypeError);
    return { propagatedException: 'TypeError', gatewayCatch500: 'Source-inspected in index.ts, not run here' };
  });
  await check('Shared fetch passes through transport failure without retry or taxonomy conversion', async () => {
    const shared = load('src/share-branding/lib/unifiedFetch.ts', {
      'next/headers': { headers: async () => new Headers() },
    }, { fetch: async () => { throw new TypeError('Synthetic connection refusal'); } });
    await assert.rejects(shared.unifiedFetch('http://127.0.0.1:8787/api/quiz/result'), TypeError);
    return { propagatedException: 'TypeError' };
  });

  fs.writeFileSync(path.join(__dirname, 'ISOLATED_PATH_RESULTS.json'), JSON.stringify({
    timestamp: new Date().toISOString(), results,
    boundary: 'Current source compiled in memory. No production/test source edits, HTTP request, database access, external provider, credentials or server restart. Dependency doubles control transport, verified identity, database and logging. Next.js runtime, gateway application catch, persisted sessions and actual cold start are not exercised.',
  }, null, 2));
  if (results.some(result => result.result !== 'PASS')) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
