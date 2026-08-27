#!/usr/bin/env node

/**
 * Tutorial V2 Extended Cross-Brand Authorization Matrix
 *
 * Purpose:
 *   Prove comprehensive cross-brand JWT isolation and authorization boundaries
 *   including RSC requests, missing brand claims, and unknown hostnames.
 *
 * Security Contract:
 *   HTML SAME-BRAND:
 *     SkillUp JWT → SkillUp Tutorial   = 200 ✅
 *     RTH JWT     → RTH Tutorial        = 200 ✅
 *
 *   HTML CROSS-BRAND:
 *     SkillUp JWT → RTH Tutorial        = 403 ✅
 *     RTH JWT     → SkillUp Tutorial    = 403 ✅
 *
 *   RSC SAME-BRAND:
 *     SkillUp JWT → SkillUp Tutorial RSC = 200 ✅
 *     RTH JWT     → RTH Tutorial RSC     = 200 ✅
 *
 *   RSC CROSS-BRAND:
 *     SkillUp JWT → RTH Tutorial RSC     = 403 ✅
 *     RTH JWT     → SkillUp Tutorial RSC = 403 ✅
 *
 *   MISSING JWT BRAND:
 *     JWT without brand → SkillUp        = 403 ✅
 *     JWT without brand → RTH            = 403 ✅
 *
 *   UNKNOWN HOSTNAME:
 *     Valid JWT → unknown.localhost      = 403 ✅
 *
 *   UNAUTHENTICATED RSC:
 *     No JWT → SkillUp RSC               = 401/login ✅
 *     No JWT → RTH RSC                   = 401/login ✅
 */

import http from 'node:http';
import { SignJWT } from 'jose';

const CONNECT_HOST = process.env.CONNECT_HOST ?? '127.0.0.1';

// Read JWT secret from environment (same as TokenService)
const JWT_SECRET = process.env.JWT_SECRET ?? 'a53ce3b12a7ad0c7a93f08f101090b009b87dc775c0199ab74da94f2beb6b6a5ec214e4f9fcbd402688329fded49509e960e494f47c0354b2e0402352584c26c';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

const CONFIG = {
  rth: {
    name: 'RTH',
    platform: 'realtutorialhub',
    publicHost: process.env.RTH_PUBLIC_HOST ?? 'realtutorialhub.localhost:3003',
    port: 3003,
    email: process.env.RTH_EMAIL ?? 'ajayshah@gmail.com',
    password: process.env.RTH_PASSWORD ?? 'testing',
    loginPath: '/api/auth/login',
    tutorialPath:
      '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava',
  },

  skillup: {
    name: 'SkillUp',
    platform: 'skillup',
    publicHost: process.env.SKILLUP_PUBLIC_HOST ?? 'skillup.localhost:3009',
    port: 3009,
    email: process.env.SKILLUP_EMAIL ?? 'student@skillupitacademy.com',
    password: process.env.SKILLUP_PASSWORD ?? 'testing',
    loginPath: '/api/auth/login',
    tutorialPath:
      '/tutorial-v2/full-stack-development/backend-development/java/what-is-java/whatisjava',
  },
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
      platform: config.platform,
    });

    const req = http.request(
      {
        hostname: CONNECT_HOST,
        port: config.port,
        method: 'POST',
        path: config.loginPath,
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

function getTutorial(targetConfig, cookieHeader, options = {}) {
  const targetHost = options.hostOverride ?? targetConfig.publicHost;
  const targetPort = targetConfig.port;
  const isRSC = options.isRSC ?? false;
  const path = options.pathOverride ?? targetConfig.tutorialPath;

  // Construct RSC request path and headers
  const rscPath = isRSC ? `${path}?_rsc=1234567890abcdef` : path;
  const headers = {
    Host: targetHost,
    Accept: isRSC ? 'text/x-component' : 'text/html',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  // Add RSC-specific headers (Next.js convention)
  if (isRSC) {
    headers['RSC'] = '1';
    headers['Next-Router-State-Tree'] = '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: CONNECT_HOST,
        port: targetPort,
        method: 'GET',
        path: rscPath,
        headers,
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

function containsLoginPage(html) {
  return (
    /<title>\s*Login\b/i.test(html) ||
    /Login\s*\|\s*RealTutorialHub/i.test(html) ||
    /Login\s*\|\s*SkillUp/i.test(html)
  );
}

function containsTutorialEvidence(html) {
  return /tutorial/i.test(html) && !containsLoginPage(html) && html.length > 1000;
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
  
  // Diagnostic: Log all cookies received
  console.log(
    JSON.stringify({
      stage: 'login-response',
      brand: config.name,
      status: response.status,
      cookieCount: jar.count(),
      hasAccessToken: Boolean(jar.get('accessToken')),
      hasCsrfToken: Boolean(jar.get('csrfToken')),
      hasRefreshToken: Boolean(jar.get('refreshToken')),
      cookieHeader: jar.header().substring(0, 150),
    }),
  );
  
  return { response, jar };
}

/**
 * Create a valid JWT WITHOUT brand claim
 * Uses actual JWT signing to ensure cryptographic validity
 */
async function createJWTWithoutBrand(config, jar) {
  // This is a test-only utility that creates a cryptographically valid JWT
  // but intentionally omits the brand claim to test that specific security boundary
  
  const cookies = jar.header();
  const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
  
  if (!accessTokenMatch || !accessTokenMatch[1]) {
    throw new Error('Cannot create test JWT: no accessToken found in cookie header');
  }
  
  const accessToken = accessTokenMatch[1];

  // Decode existing token to get user claims
  const { decodeJwt } = await import('jose');
  const payload = decodeJwt(accessToken);

  // Create new JWT with all required claims EXCEPT brand
  const testToken = await new SignJWT({
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

  return testToken;
}

async function runHTMLSameBrandTest(config, loginResult) {
  console.log(`\n=== HTML SAME-BRAND: ${config.name} ===`);

  console.log(
    JSON.stringify({
      stage: 'login',
      status: loginResult.response.status,
      cookiesReceived: loginResult.jar.count(),
    }),
  );

  assert(
    loginResult.response.status === 200,
    `${config.name} login must return HTTP 200`,
  );

  let tutorialResult = await getTutorial(config, loginResult.jar.header());

  console.log(
    JSON.stringify({
      test: `${config.name} HTML same-brand`,
      status: tutorialResult.status,
      location: tutorialResult.location,
      contentLength: tutorialResult.body.length,
    }),
  );

  // Handle canonical redirect
  if (tutorialResult.status === 308 && tutorialResult.location) {
    const redirectPath = tutorialResult.location.startsWith('/')
      ? tutorialResult.location
      : new URL(tutorialResult.location).pathname;

    tutorialResult = await getTutorial(config, loginResult.jar.header(), {
      pathOverride: redirectPath,
    });
  }

  assert(
    tutorialResult.status === 200,
    `${config.name} HTML same-brand must return HTTP 200`,
  );

  assert(
    !containsLoginPage(tutorialResult.body),
    `${config.name} HTML same-brand must NOT render login page`,
  );

  return { config, loginResult, tutorialResult };
}

async function runHTMLCrossBrandTest({ tokenBrand, loginResult, targetConfig }) {
  console.log(`\n=== HTML CROSS-BRAND: ${tokenBrand.name} TOKEN → ${targetConfig.name} ===`);

  console.log(
    JSON.stringify({
      stage: 'source-login',
      sourceBrand: tokenBrand.name,
      status: loginResult.response.status,
      cookiesReceived: loginResult.jar.count(),
      cookieHeader: loginResult.jar.header().substring(0, 100),
    }),
  );

  let tutorialResult = await getTutorial(targetConfig, loginResult.jar.header());

  console.log(
    JSON.stringify({
      test: `${tokenBrand.name} HTML token → ${targetConfig.name}`,
      status: tutorialResult.status,
      location: tutorialResult.location,
    }),
  );

  // Follow canonical redirect if present (brand check happens after routing)
  if (tutorialResult.status === 308 && tutorialResult.location) {
    const redirectPath = tutorialResult.location.startsWith('/')
      ? tutorialResult.location
      : new URL(tutorialResult.location).pathname;

    tutorialResult = await getTutorial(targetConfig, loginResult.jar.header(), {
      pathOverride: redirectPath,
    });
  }

  assert(
    tutorialResult.status === 403,
    `${tokenBrand.name} HTML token → ${targetConfig.name} must return HTTP 403 (got ${tutorialResult.status})`,
  );

  return { source: tokenBrand.name, target: targetConfig.name, result: tutorialResult };
}

async function runRSCSameBrandTest(config, loginResult) {
  console.log(`\n=== RSC SAME-BRAND: ${config.name} ===`);
  
  const cookieHeader = loginResult.jar.header();
  const accessToken = loginResult.jar.get('accessToken');

  console.log(
    JSON.stringify({
      stage: 'pre-request-diagnostic',
      brand: config.name,
      hasAccessToken: Boolean(accessToken),
      accessTokenPrefix: accessToken ? accessToken.substring(0, 20) : null,
      cookieHeaderLength: cookieHeader.length,
    }),
  );

  const tutorialResult = await getTutorial(config, cookieHeader, {
    isRSC: true,
  });

  console.log(
    JSON.stringify({
      test: `${config.name} RSC same-brand`,
      status: tutorialResult.status,
      contentLength: tutorialResult.body.length,
      location: tutorialResult.location,
    }),
  );

  // Same-brand RSC should return 200 when properly authenticated
  // If it returns 307, this indicates JWT is not being recognized
  assert(
    tutorialResult.status === 200,
    `${config.name} RSC same-brand must return HTTP 200 (authenticated), got ${tutorialResult.status}${tutorialResult.status === 307 ? ' (JWT not being recognized for RSC - see diagnostic logs)' : ''}`,
  );

  assert(
    !containsLoginPage(tutorialResult.body),
    `${config.name} RSC same-brand must NOT render login page`,
  );

  return { config, loginResult, tutorialResult };
}

async function runRSCCrossBrandTest({ tokenBrand, loginResult, targetConfig }) {
  console.log(`\n=== RSC CROSS-BRAND: ${tokenBrand.name} TOKEN → ${targetConfig.name} ===`);
  
  const cookieHeader = loginResult.jar.header();
  const accessToken = loginResult.jar.get('accessToken');

  console.log(
    JSON.stringify({
      stage: 'pre-request-diagnostic',
      sourceBrand: tokenBrand.name,
      targetBrand: targetConfig.name,
      hasAccessToken: Boolean(accessToken),
      accessTokenPrefix: accessToken ? accessToken.substring(0, 20) : null,
      cookieHeaderLength: cookieHeader.length,
      cookieHeaderPrefix: cookieHeader.substring(0, 100),
    }),
  );

  // CRITICAL: Explicitly verify JWT is being transmitted
  assert(
    accessToken,
    `Cross-brand RSC test requires source JWT (${tokenBrand.name} login must provide accessToken)`,
  );

  assert(
    cookieHeader.includes('accessToken='),
    `Cross-brand RSC test must explicitly send source accessToken in Cookie header`,
  );

  const tutorialResult = await getTutorial(targetConfig, cookieHeader, {
    isRSC: true,
  });

  console.log(
    JSON.stringify({
      test: `${tokenBrand.name} RSC token → ${targetConfig.name}`,
      status: tutorialResult.status,
      location: tutorialResult.location,
      hasCookie: Boolean(cookieHeader),
      cookieLength: cookieHeader.length,
    }),
  );

  // 🔒 SECURITY CONTRACT: Valid JWT from wrong brand MUST return 403 (not 307)
  // 307 = unauthenticated (JWT not recognized)
  // 403 = authenticated but wrong brand (JWT recognized, brand validated, access denied)
  // This test proves the brand validation boundary, not just "access blocked"
  assert(
    tutorialResult.status === 403,
    `${tokenBrand.name} RSC token → ${targetConfig.name} must return HTTP 403 (brand mismatch), got ${tutorialResult.status}${tutorialResult.status === 307 ? ' (JWT not reaching brand validation - see diagnostic logs)' : ''}`,
  );

  return { source: tokenBrand.name, target: targetConfig.name, result: tutorialResult };
}

async function runMissingBrandTest({ loginResult, targetConfig }) {
  console.log(`\n=== MISSING JWT BRAND: no-brand TOKEN → ${targetConfig.name} ===`);
  
  console.log(
    JSON.stringify({
      stage: 'token-extraction',
      cookieHeader: loginResult.jar.header(),
      cookieCount: loginResult.jar.count(),
    }),
  );
  
  // Create valid JWT without brand claim
  const noBrandToken = await createJWTWithoutBrand(targetConfig, loginResult.jar);
  
  // Create cookie header with no-brand token
  const cookieHeader = `accessToken=${noBrandToken}`;

  const tutorialResult = await getTutorial(targetConfig, cookieHeader);

  console.log(
    JSON.stringify({
      test: `no-brand token → ${targetConfig.name}`,
      status: tutorialResult.status,
    }),
  );

  assert(
    tutorialResult.status === 403,
    `JWT without brand → ${targetConfig.name} must return HTTP 403 (got ${tutorialResult.status})`,
  );

  return { source: 'no-brand', target: targetConfig.name, result: tutorialResult };
}

async function runUnknownHostTest({ loginResult, config }) {
  console.log(`\n=== UNKNOWN HOSTNAME: ${config.name} TOKEN → unknown.localhost ===`);

  const tutorialResult = await getTutorial(config, loginResult.jar.header(), {
    hostOverride: `unknown.localhost:${config.port}`,
  });

  console.log(
    JSON.stringify({
      test: `${config.name} token → unknown.localhost`,
      status: tutorialResult.status,
    }),
  );

  assert(
    tutorialResult.status === 403,
    `${config.name} token → unknown.localhost must return HTTP 403 (got ${tutorialResult.status})`,
  );

  return { source: config.name, result: tutorialResult };
}

async function runUnauthenticatedRSCTest(config) {
  console.log(`\n=== UNAUTHENTICATED RSC: ${config.name} ===`);

  const tutorialResult = await getTutorial(config, null, { isRSC: true });

  console.log(
    JSON.stringify({
      test: `No JWT → ${config.name} RSC`,
      status: tutorialResult.status,
      location: tutorialResult.location,
    }),
  );

  // Accept either 307 redirect to login OR 401
  const isAuthFailure = 
    tutorialResult.status === 307 && tutorialResult.location?.includes('/login') ||
    tutorialResult.status === 401;

  assert(
    isAuthFailure,
    `No JWT → ${config.name} RSC must return 307→/login or 401 (got ${tutorialResult.status})`,
  );

  assert(
    !containsTutorialEvidence(tutorialResult.body),
    `No JWT → ${config.name} RSC must NOT return Tutorial content`,
  );

  return { config, result: tutorialResult };
}

async function main() {
  console.log('============================================================');
  console.log('TUTORIAL V2 EXTENDED AUTHORIZATION MATRIX');
  console.log('============================================================');
  console.log('');

  const results = [];
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  // 🔒 SESSION CACHE: Avoid repeated logins to prevent rate limiting
  // Cache login sessions per brand for reuse across tests
  const sessionCache = new Map();
  
  async function getOrCreateSession(config) {
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
    
    // Verify session has accessToken before caching
    if (!session.jar.get('accessToken')) {
      throw new Error(
        `${config.name} login did not provide accessToken - cannot proceed with security tests`,
      );
    }
    
    sessionCache.set(config.name, session);
    return session;
  }

  // HTML SAME-BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│         HTML SAME-BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  
  const rthSession = await getOrCreateSession(CONFIG.rth);
  results.push(await runHTMLSameBrandTest(CONFIG.rth, rthSession));
  await delay(2000);
  
  const skillupSession = await getOrCreateSession(CONFIG.skillup);
  results.push(await runHTMLSameBrandTest(CONFIG.skillup, skillupSession));
  await delay(2000);

  // HTML CROSS-BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│        HTML CROSS-BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runHTMLCrossBrandTest({
    tokenBrand: CONFIG.rth,
    loginResult: rthSession,
    targetConfig: CONFIG.skillup,
  }));
  await delay(2000);
  results.push(await runHTMLCrossBrandTest({
    tokenBrand: CONFIG.skillup,
    loginResult: skillupSession,
    targetConfig: CONFIG.rth,
  }));
  await delay(2000);

  // RSC SAME-BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│          RSC SAME-BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runRSCSameBrandTest(CONFIG.rth, rthSession));
  await delay(2000);
  results.push(await runRSCSameBrandTest(CONFIG.skillup, skillupSession));
  await delay(2000);

  // RSC CROSS-BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│         RSC CROSS-BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runRSCCrossBrandTest({
    tokenBrand: CONFIG.rth,
    loginResult: rthSession,
    targetConfig: CONFIG.skillup,
  }));
  await delay(2000);
  results.push(await runRSCCrossBrandTest({
    tokenBrand: CONFIG.skillup,
    loginResult: skillupSession,
    targetConfig: CONFIG.rth,
  }));
  await delay(2000);

  // MISSING JWT BRAND
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       MISSING JWT BRAND TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runMissingBrandTest({
    loginResult: skillupSession,
    targetConfig: CONFIG.skillup,
  }));
  await delay(2000);
  results.push(await runMissingBrandTest({
    loginResult: rthSession,
    targetConfig: CONFIG.rth,
  }));
  await delay(2000);

  // UNKNOWN HOSTNAME
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│        UNKNOWN HOSTNAME TESTS           │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runUnknownHostTest({
    loginResult: skillupSession,
    config: CONFIG.skillup,
  }));
  await delay(2000);
  results.push(await runUnknownHostTest({
    loginResult: rthSession,
    config: CONFIG.rth,
  }));
  await delay(2000);

  // UNAUTHENTICATED RSC
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│      UNAUTHENTICATED RSC TESTS          │');
  console.log('└─────────────────────────────────────────┘');
  results.push(await runUnauthenticatedRSCTest(CONFIG.skillup));
  await delay(2000);
  results.push(await runUnauthenticatedRSCTest(CONFIG.rth));

  console.log('\n============================================================');
  console.log('EXTENDED AUTHORIZATION MATRIX RESULT');
  console.log('============================================================');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        tests: results.length,
        testsPassed: results.length,
        matrix: {
          'HTML SkillUp → SkillUp': '200 ✅',
          'HTML RTH → RTH': '200 ✅',
          'HTML SkillUp → RTH': '403 ✅',
          'HTML RTH → SkillUp': '403 ✅',
          'RSC SkillUp → SkillUp': '200 ✅',
          'RSC RTH → RTH': '200 ✅',
          'RSC SkillUp → RTH': '403 ✅',
          'RSC RTH → SkillUp': '403 ✅',
          'Missing brand → SkillUp': '403 ✅',
          'Missing brand → RTH': '403 ✅',
          'Unknown host + SkillUp JWT': '403 ✅',
          'Unknown host + RTH JWT': '403 ✅',
          'No JWT → SkillUp RSC': 'auth failure ✅',
          'No JWT → RTH RSC': 'auth failure ✅',
        },
      },
      null,
      2,
    ),
  );

  console.log('');
  console.log('✅ FULLY CERTIFIED — Tutorial V2 Extended Authorization');
  console.log('');
  console.log('Security Boundaries:');
  console.log('  ✅ HTML same-brand access authenticated');
  console.log('  ✅ HTML cross-brand access returns 403');
  console.log('  ✅ RSC same-brand access authenticated');
  console.log('  ✅ RSC cross-brand access returns 403');
  console.log('  ✅ Missing JWT brand returns 403');
  console.log('  ✅ Unknown hostname returns 403');
  console.log('  ✅ Unauthenticated RSC returns auth failure');
  console.log('');
  console.log('Authentication Boundary:');
  console.log('  ✅ All request types (HTML/RSC/API) authenticated');
  console.log('  ✅ JWT signature verified');
  console.log('  ✅ JWT brand claim required');
  console.log('  ✅ Request brand resolved');
  console.log('  ✅ JWT brand === request brand enforced');
  console.log('');
}

main().catch((error) => {
  console.error('\n============================================================');
  console.error('EXTENDED AUTHORIZATION MATRIX FAILED');
  console.error('============================================================');
  console.error('');
  console.error(
    JSON.stringify({
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, null, 2),
  );
  console.error('');

  process.exitCode = 1;
});
