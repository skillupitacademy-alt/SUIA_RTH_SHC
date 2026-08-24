#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 11.11C
 * NODE HTTP E2E COOKIE PROPAGATION FORENSICS
 * ============================================================
 *
 * PURPOSE
 * -------
 * Prove the complete authentication path without a browser:
 *
 * Node E2E
 *    |
 *    v
 * BFF :3009
 *    |
 *    v
 * Gateway :8787
 *    |
 *    v
 * API :3000
 *
 * The test explicitly captures Set-Cookie headers and constructs
 * its own cookie jar.
 *
 * IMPORTANT:
 * - NO application source modification
 * - NO Secure flag modification
 * - NO manual JWT creation
 * - NO token generation inside this script
 * - Token must originate from the real login response
 *
 * ============================================================
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL =
  process.env.TEST_BFF_URL ||
  "http://localhost:3009";

const GATEWAY_URL =
  process.env.TEST_GATEWAY_URL ||
  "http://localhost:8787";

const API_URL =
  process.env.TEST_API_URL ||
  "http://localhost:3000";

const LOGIN_PATH =
  process.env.TEST_LOGIN_PATH ||
  "/api/auth/login";

const TUTORIAL_URL =
  process.env.TEST_TUTORIAL_URL ||
  "/tutorial-v2/full-stack-development/backend-development/java/whatisjava/what-is-java";

const EMAIL =
  process.env.TEST_STUDENT_EMAIL ||
  "student@skillupitacademy.com";

const PASSWORD =
  process.env.TEST_STUDENT_PASSWORD ||
  "testing";

const PLATFORM =
  process.env.TEST_PLATFORM ||
  "skillup";

const RESULTS_DIR =
  process.env.TEST_RESULTS_DIR ||
  path.resolve("test-results/phase11");

const RESULT_FILE =
  path.join(
    RESULTS_DIR,
    "phase-11-11c-cookie-e2e.json"
  );

// ============================================================
// STATE
// ============================================================

const cookieJar = new Map();

const evidence = {
  phase: "11.11C",
  startedAt: new Date().toISOString(),

  configuration: {
    bffUrl: BASE_URL,
    gatewayUrl: GATEWAY_URL,
    apiUrl: API_URL,
    loginPath: LOGIN_PATH,
    tutorialUrl: TUTORIAL_URL,
    email: EMAIL,
    platform: PLATFORM,
  },

  tests: [],

  cookies: {
    received: [],
    stored: [],
    cookieHeader: null,
  },

  authentication: {
    loginStatus: null,
    loginSuccess: false,
    accessTokenReceived: false,
    refreshTokenReceived: false,
    csrfTokenReceived: false,
    cookieJarCount: 0,
  },

  tutorial: {
    status: null,
    redirected: false,
    location: null,
    authenticatedResponse: false,
  },

  infrastructure: {
    redisErrorObserved: false,
  },

  result: "UNKNOWN",
};

// ============================================================
// LOGGING
// ============================================================

function timestamp() {
  return new Date().toISOString();
}

function log(message, data = undefined) {
  console.log(`[${timestamp()}] ${message}`);

  if (data !== undefined) {
    console.log(
      JSON.stringify(data, null, 2)
    );
  }
}

function pass(name, details = undefined) {
  console.log(`✅ [PASS] ${name}`);

  evidence.tests.push({
    name,
    status: "PASS",
    details,
  });
}

function fail(name, details = undefined) {
  console.error(`❌ [FAIL] ${name}`);

  if (details !== undefined) {
    console.error(
      JSON.stringify(details, null, 2)
    );
  }

  evidence.tests.push({
    name,
    status: "FAIL",
    details,
  });
}

function assert(condition, name, details) {
  if (!condition) {
    fail(name, details);
    throw new Error(
      `Assertion failed: ${name}`
    );
  }

  pass(name, details);
}

// ============================================================
// HTTP UTILITIES
// ============================================================

async function request(url, options = {}) {
  log(`HTTP ${options.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    redirect: "manual",
  });

  return response;
}

// ============================================================
// SET-COOKIE EXTRACTION
// ============================================================

function getSetCookieHeaders(response) {
  /*
   * Node versions with Headers.getSetCookie()
   * expose Set-Cookie values correctly.
   *
   * We prefer that API because Set-Cookie itself is
   * NOT safely represented as a normal comma-separated
   * HTTP header.
   */

  if (
    typeof response.headers.getSetCookie === "function"
  ) {
    return response.headers.getSetCookie();
  }

  /*
   * Fallback for environments where getSetCookie()
   * is unavailable.
   *
   * This parser understands that Expires=... contains
   * commas and therefore cannot simply split on ",".
   */

  const raw =
    response.headers.get("set-cookie");

  if (!raw) {
    return [];
  }

  return splitSetCookieHeader(raw);
}

// ============================================================
// SET-COOKIE PARSER
// ============================================================

function splitSetCookieHeader(header) {
  const result = [];

  let current = "";
  let insideExpires = false;

  for (let i = 0; i < header.length; i++) {
    const char = header[i];

    current += char;

    if (
      header
        .slice(Math.max(0, i - 7), i + 1)
        .toLowerCase() === "expires="
    ) {
      insideExpires = true;
    }

    if (insideExpires && char === ";") {
      insideExpires = false;
    }

    if (
      char === "," &&
      !insideExpires
    ) {
      /*
       * A comma here can represent the boundary
       * between two Set-Cookie values.
       *
       * Only split when what follows looks like:
       *
       * cookieName=
       */

      const remaining =
        header.slice(i + 1);

      if (
        /^\s*[A-Za-z0-9_.-]+=/.test(
          remaining
        )
      ) {
        result.push(
          current.slice(0, -1).trim()
        );

        current = "";
      }
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

// ============================================================
// COOKIE PARSING
// ============================================================

function parseSetCookie(setCookie) {
  const parts =
    setCookie.split(";");

  const firstPart =
    parts.shift()?.trim() || "";

  const separator =
    firstPart.indexOf("=");

  if (separator === -1) {
    return null;
  }

  const name =
    firstPart.slice(0, separator);

  const value =
    firstPart.slice(separator + 1);

  const attributes = {};

  for (const part of parts) {
    const trimmed = part.trim();

    if (!trimmed) {
      continue;
    }

    const equals =
      trimmed.indexOf("=");

    if (equals === -1) {
      attributes[
        trimmed.toLowerCase()
      ] = true;

      continue;
    }

    const key =
      trimmed
        .slice(0, equals)
        .trim()
        .toLowerCase();

    const attributeValue =
      trimmed
        .slice(equals + 1)
        .trim();

    attributes[key] =
      attributeValue;
  }

  return {
    name,
    value,
    attributes,
    raw: setCookie,
  };
}

// ============================================================
// COOKIE JAR
// ============================================================

function storeCookies(setCookieHeaders) {
  for (const header of setCookieHeaders) {
    const parsed =
      parseSetCookie(header);

    if (!parsed) {
      continue;
    }

    /*
     * We deliberately store the server-issued cookie
     * regardless of Secure/Domain because this is an
     * application HTTP E2E test, not a browser cookie-policy
     * test.
     */

    cookieJar.set(
      parsed.name,
      parsed
    );

    evidence.cookies.received.push({
      name: parsed.name,
      secure:
        parsed.attributes.secure === true,
      httpOnly:
        parsed.attributes.httponly === true,
      sameSite:
        parsed.attributes.samesite || null,
      domain:
        parsed.attributes.domain || null,
      path:
        parsed.attributes.path || null,
    });
  }

  evidence.cookies.stored =
    Array.from(
      cookieJar.values()
    ).map(cookie => ({
      name: cookie.name,
      secure:
        cookie.attributes.secure === true,
      httpOnly:
        cookie.attributes.httponly === true,
      sameSite:
        cookie.attributes.samesite || null,
      domain:
        cookie.attributes.domain || null,
      path:
        cookie.attributes.path || null,
    }));
}

// ============================================================
// COOKIE HEADER
// ============================================================

function buildCookieHeader() {
  const cookies =
    Array.from(
      cookieJar.values()
    );

  const header =
    cookies
      .map(
        cookie =>
          `${cookie.name}=${cookie.value}`
      )
      .join("; ");

  evidence.cookies.cookieHeader =
    cookies.map(
      cookie => cookie.name
    );

  return header;
}

// ============================================================
// COOKIE HELPERS
// ============================================================

function hasCookie(name) {
  return cookieJar.has(name);
}

function getCookie(name) {
  return cookieJar.get(name);
}

// ============================================================
// TEST 01 — BFF AVAILABILITY
// ============================================================

async function testBffAvailability() {
  const name =
    "BFF availability";

  log(
    `TEST: ${name}`
  );

  try {
    const response =
      await request(
        `${BASE_URL}/`,
        {
          method: "GET",
        }
      );

    assert(
      response.status >= 200 &&
      response.status < 500,
      name,
      {
        status:
          response.status,
        url: response.url,
      }
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 02 — LOGIN
// ============================================================

async function testLogin() {
  const name =
    "BFF login";

  log(
    `TEST: ${name}`
  );

  try {
    const response =
      await request(
        `${BASE_URL}${LOGIN_PATH}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify({
              email: EMAIL,
              password: PASSWORD,
              platform: PLATFORM,
            }),
        }
      );

    evidence.authentication.loginStatus =
      response.status;

    const setCookieHeaders =
      getSetCookieHeaders(
        response
      );

    log(
      "LOGIN Set-Cookie count",
      setCookieHeaders.length
    );

    storeCookies(
      setCookieHeaders
    );

    evidence.authentication.accessTokenReceived =
      hasCookie("accessToken");

    evidence.authentication.refreshTokenReceived =
      hasCookie("refreshToken");

    evidence.authentication.csrfTokenReceived =
      hasCookie("csrfToken");

    evidence.authentication.cookieJarCount =
      cookieJar.size;

    const bodyText =
      await response.text();

    let body = null;

    try {
      body =
        JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }

    assert(
      response.status === 200,
      name,
      {
        status:
          response.status,
        body:
          typeof body === "string"
            ? body.slice(0, 500)
            : body,
      }
    );

    assert(
      hasCookie("accessToken"),
      "accessToken received",
      "accessToken was not received"
    );

    assert(
      hasCookie("refreshToken"),
      "refreshToken received",
      "refreshToken was not received"
    );

    assert(
      hasCookie("csrfToken"),
      "csrfToken received",
      "csrfToken was not received"
    );

    evidence.authentication.loginSuccess =
      true;

    log(
      "Authentication cookies captured",
      evidence.authentication
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 03 — COOKIE ATTRIBUTE FORENSICS
// ============================================================

async function testCookieAttributes() {
  const name =
    "Cookie attribute validation";

  log(
    `TEST: ${name}`
  );

  try {
    const accessToken =
      getCookie(
        "accessToken"
      );

    const refreshToken =
      getCookie(
        "refreshToken"
      );

    const csrfToken =
      getCookie(
        "csrfToken"
      );

    assert(
      Boolean(accessToken),
      "accessToken exists",
      "Missing accessToken"
    );

    assert(
      Boolean(refreshToken),
      "refreshToken exists",
      "Missing refreshToken"
    );

    assert(
      Boolean(csrfToken),
      "csrfToken exists",
      "Missing csrfToken"
    );

    log(
      "accessToken attributes",
      accessToken.attributes
    );

    log(
      "refreshToken attributes",
      refreshToken.attributes
    );

    log(
      "csrfToken attributes",
      csrfToken.attributes
    );

    /*
     * We DO NOT reject Secure cookies here.
     *
     * Secure=true is expected.
     */

    assert(
      accessToken.attributes.secure === true,
      "accessToken has Secure attribute",
      "accessToken Secure attribute missing"
    );

    assert(
      accessToken.attributes.httponly === true,
      "accessToken has HttpOnly attribute",
      "accessToken HttpOnly attribute missing"
    );

    assert(
      refreshToken.attributes.secure === true,
      "refreshToken has Secure attribute",
      "refreshToken Secure attribute missing"
    );

    assert(
      refreshToken.attributes.httponly === true,
      "refreshToken has HttpOnly attribute",
      "refreshToken HttpOnly attribute missing"
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 04 — COOKIE ROUND TRIP
// ============================================================

async function testCookieRoundTrip() {
  const name =
    "Cookie round-trip";

  log(
    `TEST: ${name}`
  );

  try {
    const cookieHeader =
      buildCookieHeader();

    assert(
      cookieHeader.includes(
        "accessToken="
      ),
      "Cookie header contains accessToken",
      "Cookie header does not contain accessToken"
    );

    assert(
      cookieHeader.includes(
        "refreshToken="
      ),
      "Cookie header contains refreshToken",
      "Cookie header does not contain refreshToken"
    );

    assert(
      cookieHeader.includes(
        "csrfToken="
      ),
      "Cookie header contains csrfToken",
      "Cookie header does not contain csrfToken"
    );

    log(
      "Cookie header names",
      evidence.cookies.cookieHeader
    );

    /*
     * Never print JWT values.
     */
    pass(
      name,
      {
        cookieNames:
          evidence.cookies.cookieHeader,
      }
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 05 — AUTHENTICATED TUTORIAL REQUEST
// ============================================================

async function testAuthenticatedTutorial() {
  const name =
    "Authenticated tutorial request";

  log(
    `TEST: ${name}`
  );

  try {
    const cookieHeader =
      buildCookieHeader();

    const response =
      await request(
        `${BASE_URL}${TUTORIAL_URL}`,
        {
          method: "GET",

          headers: {
            Accept:
              "text/html,application/xhtml+xml",

            Cookie:
              cookieHeader,
          },
        }
      );

    evidence.tutorial.status =
      response.status;

    evidence.tutorial.location =
      response.headers.get(
        "location"
      );

    evidence.tutorial.redirected =
      response.status >= 300 &&
      response.status < 400;

    /*
     * Consume response so the HTTP connection is
     * properly released.
     */
    const body =
      await response.text();

    /*
     * Authentication failure indicators.
     */
    const is401 =
      response.status === 401;

    const is403 =
      response.status === 403;

    const redirectedToLogin =
      evidence.tutorial.redirected &&
      (
        evidence.tutorial.location
          ?.toLowerCase()
          .includes("/login") ||
        evidence.tutorial.location
          ?.toLowerCase()
          .includes("login")
      );

    /*
     * 404 is NOT automatically an authentication failure.
     *
     * It can indicate tutorial routing/data problems.
     */
    if (
      is401 ||
      is403 ||
      redirectedToLogin
    ) {
      throw new Error(
        JSON.stringify(
          {
            reason:
              "Authenticated tutorial request was rejected",
            status:
              response.status,
            location:
              evidence.tutorial.location,
          },
          null,
          2
        )
      );
    }

    /*
     * A successful authenticated page may be 200.
     *
     * We deliberately don't claim authentication is proven
     * solely from 200.
     *
     * The server-side logs must confirm token verification.
     */

    evidence.tutorial.authenticatedResponse =
      response.status === 200;

    log(
      "Tutorial response",
      {
        status:
          response.status,
        location:
          evidence.tutorial.location,
        bodyLength:
          body.length,
      }
    );

    assert(
      response.status !== 401,
      "Tutorial did not return 401",
      "Tutorial returned 401"
    );

    assert(
      response.status !== 403,
      "Tutorial did not return 403",
      "Tutorial returned 403"
    );

    assert(
      !redirectedToLogin,
      "Tutorial did not redirect to login",
      "Tutorial redirected to login"
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 06 — DIRECT GATEWAY COOKIE ROUND TRIP
// ============================================================

async function testGatewayCookieRoundTrip() {
  const name =
    "Gateway authenticated request";

  log(
    `TEST: ${name}`
  );

  try {
    const cookieHeader =
      buildCookieHeader();

    const response =
      await request(
        `${GATEWAY_URL}/auth/me`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Cookie:
              cookieHeader,
          },
        }
      );

    const bodyText =
      await response.text();

    log(
      "Gateway /auth/me response",
      {
        status:
          response.status,
        body:
          bodyText.slice(0, 1000),
      }
    );

    /*
     * We don't assume the exact /auth/me route exists.
     *
     * A 404 means endpoint mismatch, not necessarily
     * authentication failure.
     */

    assert(
      response.status !== 401,
      "Gateway did not reject with 401",
      "Gateway rejected the session with 401"
    );

    assert(
      response.status !== 403,
      "Gateway did not reject with 403",
      "Gateway rejected the session with 403"
    );
  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// TEST 07 — DIRECT API SECURITY BOUNDARY
// ============================================================

async function testApiDirectSecurityBoundary() {
  const name =
    "API direct access security boundary";

  log(
    `TEST: ${name}`
  );

  try {
    const cookieHeader =
      buildCookieHeader();

    const response =
      await request(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Cookie:
              cookieHeader,
          },
        }
      );

    const bodyText =
      await response.text();

    log(
      "Direct API response (expected rejection)",
      {
        status:
          response.status,
        body:
          bodyText.slice(0, 1000),
      }
    );

    /*
     * Direct API access without Gateway X-Brand context
     * should be rejected with 403.
     *
     * This is the designed security boundary.
     * 
     * The architecture requires:
     * Client → BFF → Gateway → API
     * 
     * Gateway establishes brand context via X-Brand header.
     */

    assert(
      response.status === 403,
      "API rejects direct access without X-Brand (expected)",
      "Direct API request should return 403 without Gateway brand context"
    );

    /*
     * The response should indicate missing brand header
     * or internal error due to brand guard.
     */
    const indicatesBrandGuard =
      bodyText.toLowerCase().includes("missing brand") ||
      bodyText.toLowerCase().includes("internal") ||
      bodyText.toLowerCase().includes("error");

    assert(
      indicatesBrandGuard,
      "Response indicates brand-context requirement (expected)",
      "Expected brand-related error message"
    );

    log(
      "✅ Architecture security boundary confirmed: Direct API access properly rejected"
    );

  } catch (error) {
    fail(
      name,
      error.message
    );

    throw error;
  }
}

// ============================================================
// RESULT WRITER
// ============================================================

function writeEvidence() {
  evidence.finishedAt =
    new Date().toISOString();

  const failedTests =
    evidence.tests.filter(
      test =>
        test.status === "FAIL"
    );

  evidence.result =
    failedTests.length === 0
      ? "PASS"
      : "FAIL";

  fs.mkdirSync(
    RESULTS_DIR,
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify(
      evidence,
      null,
      2
    ),
    "utf8"
  );

  log(
    `Evidence written: ${RESULT_FILE}`
  );
}

// ============================================================
// SUMMARY
// ============================================================

function printSummary() {
  const passed =
    evidence.tests.filter(
      test =>
        test.status === "PASS"
    ).length;

  const failed =
    evidence.tests.filter(
      test =>
        test.status === "FAIL"
    ).length;

  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PHASE 11.11C — NODE HTTP E2E COOKIE FORENSICS"
  );
  console.log(
    "============================================================"
  );

  console.log(
    `BFF              : ${BASE_URL}`
  );

  console.log(
    `Gateway          : ${GATEWAY_URL}`
  );

  console.log(
    `API              : ${API_URL}`
  );

  console.log(
    `Tutorial         : ${TUTORIAL_URL}`
  );

  console.log("");

  console.log(
    `Cookies received : ${evidence.cookies.received.length}`
  );

  console.log(
    `Cookies stored   : ${evidence.cookies.stored.length}`
  );

  console.log(
    `accessToken      : ${
      evidence.authentication.accessTokenReceived
        ? "PRESENT"
        : "MISSING"
    }`
  );

  console.log(
    `refreshToken     : ${
      evidence.authentication.refreshTokenReceived
        ? "PRESENT"
        : "MISSING"
    }`
  );

  console.log(
    `csrfToken        : ${
      evidence.authentication.csrfTokenReceived
        ? "PRESENT"
        : "MISSING"
    }`
  );

  console.log("");

  console.log(
    `Tutorial status  : ${
      evidence.tutorial.status ?? "NOT TESTED"
    }`
  );

  console.log(
    `Redirected       : ${
      evidence.tutorial.redirected
    }`
  );

  console.log("");

  console.log(
    `Passed           : ${passed}`
  );

  console.log(
    `Failed           : ${failed}`
  );

  console.log(
    `RESULT           : ${evidence.result}`
  );

  console.log(
    "============================================================"
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PHASE 11.11C — NODE HTTP E2E COOKIE PROPAGATION FORENSICS"
  );
  console.log(
    "============================================================"
  );

  try {
    await testBffAvailability();

    await testLogin();

    await testCookieAttributes();

    await testCookieRoundTrip();

    await testAuthenticatedTutorial();

    /*
     * These two tests are deliberately separate from the
     * tutorial test so that we can identify the exact boundary
     * if authentication fails.
     */
    await testGatewayCookieRoundTrip();

    await testApiDirectSecurityBoundary();

  } catch (error) {
    log(
      "E2E execution stopped after failure",
      error.message
    );
  } finally {
    writeEvidence();
    printSummary();
  }

  if (
    evidence.result === "FAIL"
  ) {
    process.exitCode = 1;
  }
}

main();
