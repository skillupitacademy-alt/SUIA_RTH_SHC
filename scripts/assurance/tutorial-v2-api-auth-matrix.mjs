#!/usr/bin/env node

/**
 * Tutorial V2 API Runtime Authorization Matrix
 *
 * Purpose:
 *   Independently certify API runtime cross-brand authorization boundary.
 *   Proves that valid JWT from brand A cannot access brand B's API endpoints.
 *
 * Security Contract:
 *
 * SAME BRAND:
 *   SkillUp JWT → SkillUp /api/profile = 200
 *   RTH JWT     → RTH /api/profile     = 200
 *
 * CROSS BRAND:
 *   SkillUp JWT → RTH /api/profile     = 403
 *   RTH JWT     → SkillUp /api/profile = 403
 *
 * MISSING BRAND:
 *   no-brand JWT → SkillUp /api/profile = 403
 *   no-brand JWT → RTH /api/profile     = 403
 *
 * UNKNOWN HOST:
 *   valid JWT → unknown.localhost/api/profile = 403
 *
 * UNAUTHENTICATED:
 *   no JWT → /api/profile = 401
 *
 * CRITICAL:
 *   307 is NEVER accepted for cross-brand tests.
 *   403 proves: JWT authenticated BUT authorization denied due to brand mismatch
 *   307 proves: JWT not recognized (authentication failure)
 */

import http from 'node:http';
import { SignJWT, decodeJwt } from 'jose';

const CONNECT_HOST = process.env.CONNECT_HOST ?? '127.0.0.1';

// Read JWT secret from environment (same as TokenService)
// SECURITY: Never use hardcoded fallback in security tests
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.trim().length === 0) {
  throw new Error(
    'JWT_SECRET must be provided by the test environment. ' +
    'This is required to create cryptographically valid test JWTs.'
  );
}

const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

const CONFIG = {
  rth: {
    name: 'RTH',
    brand: 'realtutorialhub',
    publicHost: process.env.RTH_PUBLIC_HOST ?? 'realtutorialhub.localhost:3003',
    port: 3003,
    email: process.env.RTH_EMAIL ?? 'ajayshah@gmail.com',
    password: process.env.RTH_PASSWORD ?? 'testing',
  },

  skillup: {
    name: 'SkillUp',
    brand: 'skillup',
    publicHost: process.env.SKILLUP_PUBLIC_HOST ?? 'skillup.localhost:3009',
    port: 3009,
    email: process.env.SKILLUP_EMAIL ?? 'student@skillupitacademy.com',
    password: process.env.SKILLUP_PASSWORD ?? 'testing',
  },
};

/**
 * API CONTRACT: Existing authenticated endpoint
 * 
 * /api/profile is a genuine BFF endpoint used by both brands
 * Flow: Browser → BFF → API Server
 * 
 * BFF performs JWT validation and brand checking via requireBffAuth()
 * before calling upstream API Server with internal headers
 */
const API_CONTRACT = {
  path: '/api/profile',
  method: 'GET',
  expectedContentType: 'application/json',
};

function createCookieJar() {
  const cookies = new Map();

  return {
    capture(headers) {
      const setCookieHeaders = headers['set-cookie'];
      if (!setCookieHeaders) return;

      const cookieArray = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];

      for (const header of cookieArray) {
        const firstPart = header.split(';', 1)[0];
        const separator = firstPart.indexOf('=');

        if (separator <= 0) continue;

        const name = firstPart.slice(0, separator);
        const value = firstPart.slice(separator + 1);

        cookies.set(name, value);
      }
    },

    header() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    },

    get(name) {
      return cookies.get(name);
    },

    count() {
      return cookies.size;
    },
  };
}

function postLogin(config) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      email: config.email,
      password: config.password,
      platform: config.brand,
    });

    const req = http.request(
      {
        hostname: CONNECT_HOST,
        port: config.port,
        method: 'POST',
        path: '/api/auth/login',
        headers: {
          Host: config.publicHost,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function apiRequest({ config, cookieHeader, hostOverride, path = API_CONTRACT.path }) {
  const targetHost = hostOverride ?? config.publicHost;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: CONNECT_HOST,
        port: config.port,
        method: API_CONTRACT.method,
        path,
        headers: {
          Host: targetHost,
          Accept: API_CONTRACT.expectedContentType,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      },
      (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            location: res.headers.location ?? res.headers.Location ?? null,
          });
        });
      },
    );

    req.on('error', reject);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function login(config) {
  const jar = createCookieJar();
  const response = await postLogin(config);
  jar.capture(response.headers);

  const accessToken = jar.get('accessToken');

  console.log(
    JSON.stringify({
      stage: 'login-response',
      brand: config.name,
      status: response.status,
      cookieCount: jar.count(),
      hasAccessToken: Boolean(accessToken),
      accessTokenLength: accessToken?.length ?? 0,
    }),
  );

  assert(response.status === 200, `${config.name} login must return 200`);

  assert(accessToken, `${config.name} login must provide accessToken`);

  return {
    config,
    jar,
  };
}

/**
 * Session cache prevents rate-limit interference
 * Logs in once per brand, reuses session across tests
 */
const sessionCache = new Map();

async function getSession(config) {
  const cached = sessionCache.get(config.name);

  if (cached) {
    console.log(
      JSON.stringify({
        stage: 'session-cache-hit',
        brand: config.name,
        hasAccessToken: Boolean(cached.jar.get('accessToken')),
      }),
    );

    return cached;
  }

  const session = await login(config);

  sessionCache.set(config.name, session);

  return session;
}

async function sameBrandTest(config, session) {
  console.log(`\n=== API SAME-BRAND: ${config.name} ===`);

  const cookieHeader = session.jar.header();
  const accessToken = session.jar.get('accessToken');

  console.log(
    JSON.stringify({
      stage: 'pre-request-diagnostic',
      sourceBrand: config.name,
      targetBrand: config.name,
      hasAccessToken: Boolean(accessToken),
      tokenLength: accessToken?.length ?? 0,
      cookieHeaderLength: cookieHeader.length,
      endpoint: API_CONTRACT.path,
      method: API_CONTRACT.method,
    }),
  );

  assert(accessToken, 'Same-brand API request requires accessToken');

  const result = await apiRequest({ config, cookieHeader });

  console.log(
    JSON.stringify({
      test: `${config.name} API same-brand`,
      status: result.status,
      contentType: result.headers['content-type'] ?? null,
      bodyLength: result.body.length,
      bodyPreview: result.body.substring(0, 200),
    }),
  );

  // Same-brand requests MUST succeed with legitimate API response
  // Accept:
  //  - 200: Profile exists and returned successfully
  //  - 404: Profile not found (documented contract for non-onboarded users)
  // 
  // NEVER accept:
  //  - 500: Infrastructure/runtime failure (not authentication success)
  //  - 401/403/307: Authentication/authorization failure
  //
  // If API server is unavailable (connection refused, timeout, DNS failure),
  // the test MUST FAIL and report the infrastructure issue.
  assert(
    result.status === 200 || result.status === 404,
    `${config.name} same-brand API must return 200 (success) or 404 (not onboarded); got ${result.status}. ` +
    `HTTP 500 indicates infrastructure/runtime failure, not authentication success. ` +
    `Ensure INTERNAL_API_URL points to a running API server.`,
  );

  // Verify it's JSON with expected profile structure
  if (result.status === 200) {
    assert(
      result.headers['content-type']?.includes('application/json'),
      `${config.name} same-brand API must return JSON`,
    );

    const data = JSON.parse(result.body);
    console.log(
      JSON.stringify({
        stage: 'response-verification',
        hasData: Boolean(data),
        dataKeys: data ? Object.keys(data).sort() : [],
      }),
    );
  } else if (result.status === 404) {
    // 404 is acceptable if it's the documented "profile not onboarded" response
    console.log(
      JSON.stringify({
        stage: 'profile-not-found',
        message: 'Authenticated user but profile not yet created',
        securityBoundary: 'PASSED (authentication successful, profile missing)',
      }),
    );
  }

  return result;
}

async function crossBrandTest({ sourceConfig, sourceSession, targetConfig }) {
  console.log(
    `\n=== API CROSS-BRAND: ${sourceConfig.name} TOKEN → ${targetConfig.name} ===`,
  );

  const cookieHeader = sourceSession.jar.header();
  const accessToken = sourceSession.jar.get('accessToken');

  console.log(
    JSON.stringify({
      stage: 'pre-request-diagnostic',
      sourceBrand: sourceConfig.name,
      targetBrand: targetConfig.name,
      hasAccessToken: Boolean(accessToken),
      tokenLength: accessToken?.length ?? 0,
      cookieHeaderLength: cookieHeader.length,
      cookieHeaderPrefix: cookieHeader.substring(0, 100),
    }),
  );

  /**
   * 🔒 CRITICAL SECURITY ASSERTION:
   *
   * We must prove that a real authenticated JWT was transmitted.
   * This prevents false positives where JWT wasn't sent at all.
   */
  assert(accessToken, `${sourceConfig.name} session has no accessToken`);

  assert(
    cookieHeader.includes('accessToken='),
    'Cross-brand API request must transmit accessToken',
  );

  const result = await apiRequest({
    config: targetConfig,
    cookieHeader,
  });

  console.log(
    JSON.stringify({
      test: `${sourceConfig.name} API token → ${targetConfig.name}`,
      status: result.status,
      location: result.location,
      hasCookie: Boolean(cookieHeader),
      cookieLength: cookieHeader.length,
    }),
  );

  /**
   * 🔒 SECURITY CONTRACT:
   *
   * NEVER weaken this to:
   *   403 || 307 || 401
   *
   * 307 means authentication failed (JWT not recognized)
   * 401 means authentication missing/invalid
   * 403 means authentication succeeded BUT authorization denied
   *
   * We MUST prove the brand validation boundary rejects valid JWTs.
   */
  assert(
    result.status === 403,
    `${sourceConfig.name} JWT → ${targetConfig.name} API MUST return 403 (brand mismatch); got ${result.status}${result.status === 307 ? ' (JWT not reaching brand validation)' : ''}${result.status === 401 ? ' (JWT not authenticated)' : ''}`,
  );

  return result;
}

async function createJWTWithoutBrand(session) {
  const accessToken = session.jar.get('accessToken');

  assert(accessToken, 'Cannot create no-brand JWT without source accessToken');

  // Decode existing token to get user claims
  const payload = decodeJwt(accessToken);

  // Create new JWT with all required claims EXCEPT brand
  return new SignJWT({
    userId: payload.userId,
    originalUserId: payload.originalUserId,
    shadowUserId: payload.shadowUserId,
    email: payload.email,
    roles: payload.roles || ['student'],
    tokenType: 'user',
    // INTENTIONALLY OMIT: brand
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience('user')
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET_BYTES);
}

async function missingBrandTest(targetConfig, sourceSession) {
  console.log(`\n=== API MISSING BRAND → ${targetConfig.name} ===`);

  const token = await createJWTWithoutBrand(sourceSession);

  const result = await apiRequest({
    config: targetConfig,
    cookieHeader: `accessToken=${token}`,
  });

  console.log(
    JSON.stringify({
      test: `no-brand JWT → ${targetConfig.name} API`,
      status: result.status,
    }),
  );

  assert(
    result.status === 403,
    `No-brand JWT → ${targetConfig.name} API must return 403; got ${result.status}`,
  );

  return result;
}

async function unknownHostTest(sourceConfig, sourceSession) {
  console.log(`\n=== API UNKNOWN HOST: ${sourceConfig.name} JWT ===`);

  const result = await apiRequest({
    config: sourceConfig,
    cookieHeader: sourceSession.jar.header(),
    hostOverride: `unknown.localhost:${sourceConfig.port}`,
  });

  console.log(
    JSON.stringify({
      test: `${sourceConfig.name} JWT → unknown.localhost API`,
      status: result.status,
    }),
  );

  assert(
    result.status === 403,
    `${sourceConfig.name} JWT → unknown host must return 403; got ${result.status}`,
  );

  return result;
}

async function unauthenticatedTest(config) {
  console.log(`\n=== API UNAUTHENTICATED: ${config.name} ===`);

  const result = await apiRequest({
    config,
    cookieHeader: null,
  });

  console.log(
    JSON.stringify({
      test: `No JWT → ${config.name} API`,
      status: result.status,
      location: result.location,
    }),
  );

  // API endpoints may return 401 (Unauthorized) or 307 (redirect to login)
  // depending on the endpoint's authentication contract
  const isAuthFailure =
    result.status === 401 ||
    (result.status === 307 && result.location?.includes('/login'));

  assert(
    isAuthFailure,
    `No JWT → ${config.name} API must fail authentication; got ${result.status}`,
  );

  return result;
}

async function main() {
  console.log('============================================================');
  console.log('TUTORIAL V2 API AUTHORIZATION MATRIX');
  console.log('============================================================');
  console.log('');
  console.log('Endpoint: GET /api/profile');
  console.log('Architecture: Browser → BFF → API Server');
  console.log('Authentication: requireBffAuth() at BFF layer');
  console.log('');

  const tests = [];
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // LOGIN ONCE PER BRAND (session caching prevents rate limiting)
  const rthSession = await getSession(CONFIG.rth);
  await delay(2000);

  const skillupSession = await getSession(CONFIG.skillup);
  await delay(2000);

  // SAME BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       API SAME-BRAND TESTS              │');
  console.log('└─────────────────────────────────────────┘');
  tests.push(await sameBrandTest(CONFIG.rth, rthSession));
  await delay(2000);
  tests.push(await sameBrandTest(CONFIG.skillup, skillupSession));
  await delay(2000);

  // CROSS BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       API CROSS-BRAND TESTS             │');
  console.log('└─────────────────────────────────────────┘');
  tests.push(
    await crossBrandTest({
      sourceConfig: CONFIG.rth,
      sourceSession: rthSession,
      targetConfig: CONFIG.skillup,
    }),
  );
  await delay(2000);
  tests.push(
    await crossBrandTest({
      sourceConfig: CONFIG.skillup,
      sourceSession: skillupSession,
      targetConfig: CONFIG.rth,
    }),
  );
  await delay(2000);

  // MISSING BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       API MISSING BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  tests.push(await missingBrandTest(CONFIG.skillup, skillupSession));
  await delay(2000);
  tests.push(await missingBrandTest(CONFIG.rth, rthSession));
  await delay(2000);

  // UNKNOWN HOST
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       API UNKNOWN HOST TESTS            │');
  console.log('└─────────────────────────────────────────┘');
  tests.push(await unknownHostTest(CONFIG.skillup, skillupSession));
  await delay(2000);
  tests.push(await unknownHostTest(CONFIG.rth, rthSession));
  await delay(2000);

  // UNAUTHENTICATED
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       API UNAUTHENTICATED TESTS         │');
  console.log('└─────────────────────────────────────────┘');
  tests.push(await unauthenticatedTest(CONFIG.skillup));
  await delay(2000);
  tests.push(await unauthenticatedTest(CONFIG.rth));

  console.log('\n============================================================');
  console.log('API AUTHORIZATION RESULT');
  console.log('============================================================');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        tests: tests.length,
        testsPassed: tests.length,
        matrix: {
          'API RTH → RTH': 'authenticated ✅',
          'API SkillUp → SkillUp': 'authenticated ✅',
          'API RTH → SkillUp': '403 ✅',
          'API SkillUp → RTH': '403 ✅',
          'Missing brand → SkillUp API': '403 ✅',
          'Missing brand → RTH API': '403 ✅',
          'Unknown host + SkillUp JWT': '403 ✅',
          'Unknown host + RTH JWT': '403 ✅',
          'No JWT → SkillUp API': 'auth failure ✅',
          'No JWT → RTH API': 'auth failure ✅',
        },
      },
      null,
      2,
    ),
  );

  console.log('');
  console.log('✅ API RUNTIME AUTHORIZATION CERTIFIED');
  console.log('');
  console.log('Security Boundaries:');
  console.log('  ✅ API same-brand access authenticated');
  console.log('  ✅ API cross-brand access returns 403');
  console.log('  ✅ Missing JWT brand returns 403');
  console.log('  ✅ Unknown hostname returns 403');
  console.log('  ✅ Unauthenticated API returns auth failure');
  console.log('');
  console.log('Authentication Boundary:');
  console.log('  ✅ BFF requireBffAuth() validates JWT');
  console.log('  ✅ JWT signature verified');
  console.log('  ✅ JWT brand claim required');
  console.log('  ✅ Request brand resolved');
  console.log('  ✅ JWT brand === request brand enforced');
  console.log('');
}

main().catch((error) => {
  console.error('\n============================================================');
  console.error('API AUTHORIZATION MATRIX FAILED');
  console.error('============================================================');
  console.error('');
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      null,
      2,
    ),
  );
  console.error('');

  process.exitCode = 1;
});
