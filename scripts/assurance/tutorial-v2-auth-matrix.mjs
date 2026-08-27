#!/usr/bin/env node

/**
 * Tutorial V2 Cross-Brand Authorization Matrix
 *
 * Purpose:
 *   Prove cross-brand JWT isolation and authorization boundaries.
 *
 * Security Contract:
 *   SkillUp token → SkillUp Tutorial   = 200 ✅
 *   RTH token     → RTH Tutorial        = 200 ✅
 *   SkillUp token → RTH Tutorial        = 403 ✅ (MUST be 403, not /login)
 *   RTH token     → SkillUp Tutorial    = 403 ✅ (MUST be 403, not /login)
 *
 * IMPORTANT:
 *   This test uses Node.js HTTP with Host header (same as direct-URL test).
 *   fetch() does not work correctly for localhost brand resolution.
 */

import http from 'node:http';

const CONNECT_HOST = process.env.CONNECT_HOST ?? '127.0.0.1';

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

function getTutorial(targetConfig, cookieHeader, targetHostOverride = null) {
  const targetHost = targetHostOverride ?? targetConfig.publicHost;
  const targetPort = targetConfig.port;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: CONNECT_HOST,
        port: targetPort,
        method: 'GET',
        path: targetConfig.tutorialPath,
        headers: {
          Host: targetHost,
          Accept: 'text/html',
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

  return {
    response,
    jar,
  };
}

async function runPositiveTest(config) {
  console.log(`\n=== ${config.name}: AUTHENTICATED TUTORIAL ===`);

  const loginResult = await login(config);

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

  assert(
    loginResult.jar.count() > 0,
    `${config.name} login must establish at least one cookie`,
  );

  // Request Tutorial with authenticated cookie
  let tutorialResult = await getTutorial(config, loginResult.jar.header());

  console.log(
    JSON.stringify({
      test: `${config.name} authenticated Tutorial`,
      status: tutorialResult.status,
      location: tutorialResult.location,
      contentLength: tutorialResult.body.length,
    }),
  );

  // Handle canonical redirect (308)
  if (tutorialResult.status === 308) {
    assert(
      tutorialResult.location && !tutorialResult.location.includes('/login'),
      `${config.name} canonical redirect must not point to /login`,
    );

    console.log(
      JSON.stringify({
        info: 'Following canonical redirect',
        location: tutorialResult.location,
      }),
    );

    // Follow the redirect - use the path from Location header
    const redirectPath = tutorialResult.location.startsWith('/')
      ? tutorialResult.location
      : new URL(tutorialResult.location).pathname;

    // Make a new request to the canonical path
    tutorialResult = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: CONNECT_HOST,
          port: config.port,
          method: 'GET',
          path: redirectPath,
          headers: {
            Host: config.publicHost,
            Accept: 'text/html',
            Cookie: loginResult.jar.header(),
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

    console.log(
      JSON.stringify({
        test: `${config.name} canonical Tutorial`,
        status: tutorialResult.status,
        contentLength: tutorialResult.body.length,
      }),
    );
  }

  assert(
    tutorialResult.status === 200,
    `${config.name} authenticated Tutorial must return HTTP 200`,
  );

  assert(
    !containsLoginPage(tutorialResult.body),
    `${config.name} authenticated Tutorial must NOT render the login page`,
  );

  assert(
    containsTutorialEvidence(tutorialResult.body),
    `${config.name} response must contain Tutorial evidence`,
  );

  return {
    config,
    loginResult,
    tutorialResult,
  };
}

async function runCrossBrandTest({ tokenBrand, tokenConfig, targetConfig }) {
  console.log(`\n=== CROSS BRAND: ${tokenBrand.name} TOKEN → ${targetConfig.name} ===`);

  const loginResult = await login(tokenConfig);

  console.log(
    JSON.stringify({
      stage: 'source-login',
      sourceBrand: tokenBrand.name,
      status: loginResult.response.status,
      cookiesReceived: loginResult.jar.count(),
    }),
  );

  assert(
    loginResult.response.status === 200,
    `${tokenBrand.name} source login must succeed before cross-brand test`,
  );

  // Use source brand's token against target brand's Tutorial
  let tutorialResult = await getTutorial(targetConfig, loginResult.jar.header());

  console.log(
    JSON.stringify({
      test: `${tokenBrand.name} token → ${targetConfig.name} Tutorial`,
      status: tutorialResult.status,
      location: tutorialResult.location,
      contentLength: tutorialResult.body.length,
    }),
  );

  // Follow canonical redirect if present (308)
  // Brand validation happens AFTER routing, so we need to follow the redirect
  if (tutorialResult.status === 308 && tutorialResult.location) {
    console.log(
      JSON.stringify({
        info: 'Following canonical redirect before brand check',
        location: tutorialResult.location,
      }),
    );

    const redirectPath = tutorialResult.location.startsWith('/')
      ? tutorialResult.location
      : new URL(tutorialResult.location).pathname;

    tutorialResult = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: CONNECT_HOST,
          port: targetConfig.port,
          method: 'GET',
          path: redirectPath,
          headers: {
            Host: targetConfig.publicHost,
            Accept: 'text/html',
            Cookie: loginResult.jar.header(),
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

    console.log(
      JSON.stringify({
        test: `${tokenBrand.name} token → ${targetConfig.name} Tutorial (after redirect)`,
        status: tutorialResult.status,
        contentLength: tutorialResult.body.length,
      }),
    );
  }

  // CRITICAL SECURITY ASSERTION: Cross-brand MUST return 403
  // NOT /login redirect, NOT 200, MUST be 403 Forbidden
  assert(
    tutorialResult.status === 403,
    `${tokenBrand.name} token → ${targetConfig.name} must return HTTP 403 (got ${tutorialResult.status})`,
  );

  return {
    source: tokenBrand.name,
    target: targetConfig.name,
    result: tutorialResult,
  };
}

async function main() {
  console.log('============================================================');
  console.log('TUTORIAL V2 CROSS-BRAND AUTHORIZATION MATRIX');
  console.log('============================================================');
  console.log('');
  console.log('Security Contract:');
  console.log('  SkillUp token → SkillUp Tutorial = 200');
  console.log('  RTH token     → RTH Tutorial     = 200');
  console.log('  SkillUp token → RTH Tutorial     = 403 (brand isolation)');
  console.log('  RTH token     → SkillUp Tutorial = 403 (brand isolation)');
  console.log('');

  const results = [];

  // Helper to delay between tests (avoid rate limiting)
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Positive tests: same-brand authenticated access
  results.push(await runPositiveTest(CONFIG.rth));
  await delay(2000);
  
  results.push(await runPositiveTest(CONFIG.skillup));
  await delay(2000);

  // Negative tests: cross-brand token rejection
  results.push(
    await runCrossBrandTest({
      tokenBrand: CONFIG.rth,
      tokenConfig: CONFIG.rth,
      targetConfig: CONFIG.skillup,
    }),
  );
  await delay(2000);

  results.push(
    await runCrossBrandTest({
      tokenBrand: CONFIG.skillup,
      tokenConfig: CONFIG.skillup,
      targetConfig: CONFIG.rth,
    }),
  );

  console.log('\n============================================================');
  console.log('CROSS-BRAND AUTHORIZATION MATRIX RESULT');
  console.log('============================================================');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        tests: results.length,
        testsPassed: results.length,
        matrix: {
          'SkillUp → SkillUp': '200 ✅',
          'RTH → RTH': '200 ✅',
          'SkillUp → RTH': '403 ✅',
          'RTH → SkillUp': '403 ✅',
        },
      },
      null,
      2,
    ),
  );

  console.log('');
  console.log('✅ CERTIFIED — Tutorial V2 Cross-Brand Authorization');
  console.log('');
  console.log('Brand Isolation:');
  console.log('  ✅ JWT brand validation enforced');
  console.log('  ✅ Cross-brand access returns 403 Forbidden');
  console.log('  ✅ Same-brand access returns 200 OK');
  console.log('');
}

main().catch((error) => {
  console.error('\n============================================================');
  console.error('CROSS-BRAND AUTHORIZATION MATRIX FAILED');
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
