#!/usr/bin/env node

/**
 * Phase 2 — Navigation Nodes API E2E
 *
 * Requires:
 *   skillhubcore-admin running on localhost:3007
 *
 * Uses HTTP fetch only.
 * No Playwright.
 * No browser automation.
 */

const BASE_URL = 'http://localhost:3007';

const SUBTOPIC_ID =
  '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

const BRAND_ID = 'shared';

const URL =
  `${BASE_URL}/api/tutorial-left-sidebar/navigation-nodes` +
  `?subtopicId=${encodeURIComponent(SUBTOPIC_ID)}` +
  `&brandId=${encodeURIComponent(BRAND_ID)}`;

function pass(message) {
  console.log(`✅ [PASS] ${message}`);
}

function fail(message) {
  console.error(`❌ [FAIL] ${message}`);
  process.exitCode = 1;
}

async function main() {
  console.log('');
  console.log('='.repeat(72));
  console.log('PHASE 2 — NAVIGATION NODES API E2E');
  console.log('='.repeat(72));
  console.log('');

  console.log(`GET ${URL}`);
  console.log('');

  let response;

  try {
    response = await fetch(URL);
  } catch (error) {
    fail(`HTTP request failed: ${error.message}`);
    return;
  }

  console.log(`HTTP status: ${response.status}`);

  if (!response.ok) {
    fail(`Expected HTTP 200, received ${response.status}`);
    console.log(await response.text());
    return;
  }

  pass('API returned HTTP 200');

  let body;

  try {
    body = await response.json();
  } catch {
    fail('API returned invalid JSON');
    return;
  }

  if (!body || !Array.isArray(body.nodes)) {
    fail('Response does not contain nodes[]');
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  pass('Response contains nodes[]');

  console.log(`Node count: ${body.nodes.length}`);

  if (body.nodes.length === 0) {
    fail('Navigation nodes array is empty');
    return;
  }

  pass('Navigation nodes are populated');

  const invalidNodes = body.nodes.filter(
    (node) =>
      typeof node.id !== 'string' ||
      node.id.length === 0 ||
      typeof node.name !== 'string' ||
      node.name.length === 0 ||
      node.type !== 'page'
  );

  if (invalidNodes.length > 0) {
    fail(
      `${invalidNodes.length} navigation nodes have invalid identity/shape`
    );

    console.log(
      JSON.stringify(invalidNodes.slice(0, 5), null, 2)
    );

    return;
  }

  pass('Every node has valid navigation identity');

  const ids = body.nodes.map((node) => node.id);
  const duplicateIds =
    ids.length !== new Set(ids).size;

  if (duplicateIds) {
    fail('Duplicate navigation node IDs detected');
    return;
  }

  pass('Navigation node IDs are unique');

  const expectedNode = body.nodes.find(
    (node) => node.id === 'whatisjava'
  );

  if (!expectedNode) {
    fail('Expected Java navigation node "whatisjava" was not returned');
    return;
  }

  pass('Expected "What Is Java?" navigation node returned');

  console.log('');
  console.log('Sample nodes:');

  body.nodes.slice(0, 10).forEach((node, index) => {
    console.log(
      `  ${index + 1}. ${node.name} ` +
      `(navigationNodeId=${node.id})`
    );
  });

  console.log('');
  console.log('='.repeat(72));
  console.log('');

  if (process.exitCode !== 1) {
    console.log('✅ NAVIGATION NODES API E2E PASS');
    console.log('');
  }
}

main();
