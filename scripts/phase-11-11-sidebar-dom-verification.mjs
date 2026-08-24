#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 11.11 — SIDEBAR DOM VERIFICATION
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify Tutorial Left Sidebar is actually rendered in HTML
 * when authenticated learner accesses tutorial page with 0 blocks.
 *
 * This completes the certification by proving:
 * - HTTP 200 (already proven)
 * - Sidebar DOM structure present
 * - Navigation nodes rendered
 * - Active page indicated
 * - Empty content state displayed
 * - No tutorial blocks rendered (0/18)
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

const BASE_URL = process.env.TEST_BFF_URL || "http://localhost:3009";
const LOGIN_PATH = "/api/auth/login";
const TUTORIAL_URL = "/tutorial-v2/full-stack-development/backend-development/java/whatisjava/what-is-java";
const EMAIL = "student@skillupitacademy.com";
const PASSWORD = "testing";
const RESULTS_DIR = path.resolve("test-results/phase11");
const RESULT_FILE = path.join(RESULTS_DIR, "phase-11-11-sidebar-dom-verification.json");

// ============================================================
// STATE
// ============================================================

const cookieJar = new Map();

const evidence = {
  phase: "11.11-SIDEBAR-DOM",
  startedAt: new Date().toISOString(),
  
  authentication: {
    loginSuccess: false,
    cookiesReceived: 0,
  },

  http: {
    status: null,
    bodyLength: 0,
  },

  dom: {
    sidebarExists: false,
    navigationTreeExists: false,
    targetNodeExists: false,
    targetNodeActive: false,
    emptyContentMessageExists: false,
    tutorialBlocksCount: 0,
  },

  tests: [],
  result: "UNKNOWN",
};

// ============================================================
// LOGGING
// ============================================================

function log(message, data = undefined) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function pass(name, details = undefined) {
  console.log(`✅ [PASS] ${name}`);
  evidence.tests.push({ name, status: "PASS", details });
}

function fail(name, details = undefined) {
  console.error(`❌ [FAIL] ${name}`);
  if (details !== undefined) {
    console.error(JSON.stringify(details, null, 2));
  }
  evidence.tests.push({ name, status: "FAIL", details });
}

function assert(condition, name, details) {
  if (!condition) {
    fail(name, details);
    throw new Error(`Assertion failed: ${name}`);
  }
  pass(name, details);
}

// ============================================================
// HTTP UTILITIES
// ============================================================

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    redirect: "manual",
  });
  return response;
}

// ============================================================
// COOKIE UTILITIES
// ============================================================

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  
  const raw = response.headers.get("set-cookie");
  if (!raw) return [];
  
  return splitSetCookieHeader(raw);
}

function splitSetCookieHeader(header) {
  const result = [];
  let current = "";
  let insideExpires = false;

  for (let i = 0; i < header.length; i++) {
    const char = header[i];
    current += char;

    if (header.slice(Math.max(0, i - 7), i + 1).toLowerCase() === "expires=") {
      insideExpires = true;
    }

    if (insideExpires && char === ";") {
      insideExpires = false;
    }

    if (char === "," && !insideExpires) {
      const remaining = header.slice(i + 1);
      if (/^\s*[A-Za-z0-9_.-]+=/.test(remaining)) {
        result.push(current.slice(0, -1).trim());
        current = "";
      }
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function parseSetCookie(setCookie) {
  const parts = setCookie.split(";");
  const firstPart = parts.shift()?.trim() || "";
  const separator = firstPart.indexOf("=");

  if (separator === -1) return null;

  const name = firstPart.slice(0, separator);
  const value = firstPart.slice(separator + 1);
  const attributes = {};

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const equals = trimmed.indexOf("=");
    if (equals === -1) {
      attributes[trimmed.toLowerCase()] = true;
      continue;
    }

    const key = trimmed.slice(0, equals).trim().toLowerCase();
    const attributeValue = trimmed.slice(equals + 1).trim();
    attributes[key] = attributeValue;
  }

  return { name, value, attributes };
}

function storeCookies(setCookieHeaders) {
  for (const header of setCookieHeaders) {
    const parsed = parseSetCookie(header);
    if (!parsed) continue;
    cookieJar.set(parsed.name, parsed);
  }
}

function buildCookieHeader() {
  const cookies = Array.from(cookieJar.values());
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
}

// ============================================================
// TEST 01 — LOGIN
// ============================================================

async function testLogin() {
  const name = "Authentication";
  log(`TEST: ${name}`);

  try {
    const response = await request(`${BASE_URL}${LOGIN_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        platform: "skillup",
      }),
    });

    const setCookieHeaders = getSetCookieHeaders(response);
    storeCookies(setCookieHeaders);

    evidence.authentication.cookiesReceived = cookieJar.size;
    evidence.authentication.loginSuccess = response.status === 200 && cookieJar.has("accessToken");

    assert(response.status === 200, "Login succeeded", { status: response.status });
    assert(cookieJar.has("accessToken"), "accessToken received");
    assert(cookieJar.has("refreshToken"), "refreshToken received");
    assert(cookieJar.has("csrfToken"), "csrfToken received");

    log("Authentication successful", { cookiesReceived: cookieJar.size });
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 02 — FETCH TUTORIAL PAGE
// ============================================================

async function testFetchTutorialPage() {
  const name = "Fetch tutorial page";
  log(`TEST: ${name}`);

  try {
    const cookieHeader = buildCookieHeader();

    const response = await request(`${BASE_URL}${TUTORIAL_URL}`, {
      method: "GET",
      headers: {
        Accept: "text/html",
        Cookie: cookieHeader,
      },
    });

    evidence.http.status = response.status;
    
    const body = await response.text();
    evidence.http.bodyLength = body.length;

    assert(response.status === 200, "Tutorial page returns 200", { status: response.status });
    assert(body.length > 0, "Response body not empty", { length: body.length });

    log("Tutorial page fetched", { 
      status: response.status, 
      bodyLength: body.length 
    });

    return body;
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 03 — VERIFY SIDEBAR STRUCTURE
// ============================================================

async function testSidebarStructure(html) {
  const name = "Sidebar structure exists";
  log(`TEST: ${name}`);

  try {
    // Look for TutorialLeftSidebar component evidence
    // The actual component may use various class names, data attributes, or structure
    
    // Check for common sidebar indicators
    const hasSidebarContainer = 
      html.includes('tutorial-sidebar') ||
      html.includes('TutorialLeftSidebar') ||
      html.includes('left-sidebar') ||
      html.includes('navigation-tree');

    evidence.dom.sidebarExists = hasSidebarContainer;

    assert(hasSidebarContainer, "Sidebar container found in HTML");

    log("Sidebar structure verified");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 04 — VERIFY NAVIGATION NODE
// ============================================================

async function testNavigationNode(html) {
  const name = "Navigation node 'what-is-java' exists";
  log(`TEST: ${name}`);

  try {
    // Check for the specific navigation node
    const hasWhatIsJava = 
      html.includes('what-is-java') ||
      html.includes('What is Java') ||
      html.includes('What Is Java');

    evidence.dom.targetNodeExists = hasWhatIsJava;

    assert(hasWhatIsJava, "Navigation node 'what-is-java' found in HTML");

    log("Navigation node verified");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 05 — VERIFY NAVIGATION TREE
// ============================================================

async function testNavigationTree(html) {
  const name = "Navigation tree structure exists";
  log(`TEST: ${name}`);

  try {
    // Look for tree/navigation structure indicators
    const hasTree = 
      html.includes('Java') && // Topic name
      (html.includes('Backend Development') || html.includes('backend-development')) && // Subject
      (html.includes('Full Stack Development') || html.includes('full-stack-development')); // Domain

    evidence.dom.navigationTreeExists = hasTree;

    assert(hasTree, "Navigation tree hierarchy found");

    log("Navigation tree verified");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 06 — VERIFY EMPTY CONTENT STATE
// ============================================================

async function testEmptyContentState(html) {
  const name = "Empty content message displayed";
  log(`TEST: ${name}`);

  try {
    // Check for the empty state message from TutorialPageShell
    const hasEmptyMessage = 
      html.includes('Content is not published') ||
      html.includes('not published yet') ||
      html.includes('Content not published');

    evidence.dom.emptyContentMessageExists = hasEmptyMessage;

    assert(hasEmptyMessage, "Empty content message found");

    log("Empty content state verified");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 07 — VERIFY NO TUTORIAL BLOCKS
// ============================================================

async function testNoTutorialBlocks(html) {
  const name = "No tutorial blocks rendered (0/18)";
  log(`TEST: ${name}`);

  try {
    // Count potential block indicators
    // TutorialBlockRenderer would add specific structure
    const blockIndicators = [
      'TutorialDefinitionContent',
      'TutorialCodeContent',
      'TutorialSummaryContent',
      'tutorial-block-',
      'block-definition',
      'block-code',
      'block-summary',
    ];

    let blockCount = 0;
    for (const indicator of blockIndicators) {
      const regex = new RegExp(indicator, 'g');
      const matches = html.match(regex);
      if (matches) {
        blockCount += matches.length;
      }
    }

    evidence.dom.tutorialBlocksCount = blockCount;

    assert(blockCount === 0, "No tutorial content blocks found", { 
      blockCount,
      expected: 0 
    });

    log("Verified 0/18 blocks rendered");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// TEST 08 — VERIFY ACTIVE STATE
// ============================================================

async function testActiveState(html) {
  const name = "Current page marked as active";
  log(`TEST: ${name}`);

  try {
    // Look for active state indicators near 'what-is-java'
    const whatIsJavaIndex = html.indexOf('what-is-java');
    
    if (whatIsJavaIndex === -1) {
      throw new Error("Could not find 'what-is-java' in HTML");
    }

    // Check nearby context for active indicators
    const contextStart = Math.max(0, whatIsJavaIndex - 500);
    const contextEnd = Math.min(html.length, whatIsJavaIndex + 500);
    const context = html.slice(contextStart, contextEnd);

    const hasActiveIndicator = 
      context.includes('active') ||
      context.includes('current') ||
      context.includes('selected');

    evidence.dom.targetNodeActive = hasActiveIndicator;

    assert(hasActiveIndicator, "Active state indicator found near target node");

    log("Active state verified");
  } catch (error) {
    fail(name, error.message);
    throw error;
  }
}

// ============================================================
// RESULT WRITER
// ============================================================

function writeEvidence() {
  evidence.finishedAt = new Date().toISOString();

  const failedTests = evidence.tests.filter(test => test.status === "FAIL");
  evidence.result = failedTests.length === 0 ? "PASS" : "FAIL";

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(RESULT_FILE, JSON.stringify(evidence, null, 2), "utf8");

  log(`Evidence written: ${RESULT_FILE}`);
}

// ============================================================
// SUMMARY
// ============================================================

function printSummary() {
  const passed = evidence.tests.filter(test => test.status === "PASS").length;
  const failed = evidence.tests.filter(test => test.status === "FAIL").length;

  console.log("");
  console.log("============================================================");
  console.log("PHASE 11.11 — SIDEBAR DOM VERIFICATION");
  console.log("============================================================");
  console.log(`Tutorial URL     : ${TUTORIAL_URL}`);
  console.log("");
  console.log(`HTTP Status      : ${evidence.http.status}`);
  console.log(`Body Length      : ${evidence.http.bodyLength.toLocaleString()} bytes`);
  console.log("");
  console.log(`Sidebar Exists   : ${evidence.dom.sidebarExists ? "✅ YES" : "❌ NO"}`);
  console.log(`Nav Tree Exists  : ${evidence.dom.navigationTreeExists ? "✅ YES" : "❌ NO"}`);
  console.log(`Target Node      : ${evidence.dom.targetNodeExists ? "✅ YES" : "❌ NO"}`);
  console.log(`Active State     : ${evidence.dom.targetNodeActive ? "✅ YES" : "❌ NO"}`);
  console.log(`Empty Message    : ${evidence.dom.emptyContentMessageExists ? "✅ YES" : "❌ NO"}`);
  console.log(`Tutorial Blocks  : ${evidence.dom.tutorialBlocksCount} (expected: 0)`);
  console.log("");
  console.log(`Tests Passed     : ${passed}`);
  console.log(`Tests Failed     : ${failed}`);
  console.log(`RESULT           : ${evidence.result}`);
  console.log("============================================================");
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("PHASE 11.11 — SIDEBAR DOM VERIFICATION");
  console.log("============================================================");

  try {
    await testLogin();
    
    const html = await testFetchTutorialPage();
    
    await testSidebarStructure(html);
    await testNavigationTree(html);
    await testNavigationNode(html);
    await testActiveState(html);
    await testEmptyContentState(html);
    await testNoTutorialBlocks(html);

  } catch (error) {
    log("Test execution stopped after failure", error.message);
  } finally {
    writeEvidence();
    printSummary();
  }

  if (evidence.result === "FAIL") {
    process.exitCode = 1;
  }
}

main();
