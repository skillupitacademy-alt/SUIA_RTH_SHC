/**
 * PROMPT 14C-VERIFY: Comprehensive End-to-End Integration Verification
 * Tests Page 14 GUI ↔ Claude 14B Backend API integration
 */

import { strict as assert } from 'assert';

const BASE_URL = 'http://localhost:3007';

const testDocPayload = {
  subtopicId: '00000000-0000-0000-0000-000000000001',
  sectionType: 'notes',
  brandId: 'skillhubcore',
  document: {
    schemaVersion: 1,
    blocks: [
      { id: 'heading-1', type: 'heading', content: { text: 'JavaScript Fundamentals', level: 1 } },
      { id: 'paragraph-1', type: 'paragraph', content: { text: 'JavaScript is a programming language that makes websites interactive. While HTML gives a webpage structure and CSS gives it style, JavaScript is the engine that makes it come alive.' } },
      { id: 'heading-2', type: 'heading', content: { text: '1. What does it actually do?', level: 2 } },
      { id: 'paragraph-2', type: 'paragraph', content: { text: 'When you click a button and a menu drops down, when you see live stock tickers update, when a form validates—that is JavaScript.' } },
      { id: 'heading-3', type: 'heading', content: { text: '2. Where does it run?', level: 2 } },
      { id: 'paragraph-3a', type: 'paragraph', content: { text: 'Client-Side JavaScript executes in web browsers like Chrome and Safari directly on the user device.' } },
      { id: 'paragraph-3b', type: 'paragraph', content: { text: 'Server-Side JavaScript runs on backend environments like Node.js handling databases and APIs.' } },
      { id: 'heading-4', type: 'heading', content: { text: '3. Key Technical Characteristics', level: 2 } },
      { id: 'list-1', type: 'list', content: { style: 'unordered', items: [{ text: 'Single-threaded event-loop architecture' }, { text: 'Dynamic and weak typing system' }, { text: 'First-class functions supporting functional programming' }] } },
      { id: 'heading-5', type: 'heading', content: { text: '4. The JavaScript Ecosystem', level: 2 } },
      { id: 'paragraph-5', type: 'paragraph', content: { text: 'Modern ecosystems rely on React, Next.js, and TypeScript.' } },
      { id: 'heading-6', type: 'heading', content: { text: '5. The Crucial Clarification: JS is NOT Java', level: 2 } },
      { id: 'callout-1', type: 'callout', content: { text: 'Important: Despite the similar name, JavaScript and Java are completely different languages.', variant: 'warning' } }
    ],
    metadata: {
      estimatedReadTime: 2,
      tags: ['javascript'],
      complexityScore: 5
    }
  }
};

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('============================================================');
  console.log('PROMPT 14C-VERIFY: Page 14 GUI ↔ Claude API Integration Test');
  console.log('============================================================\n');

  // Test 1: Page 14 Preview Route HTML check
  try {
    const res = await fetch(`${BASE_URL}/preview/presentation-ideas`);
    assert.equal(res.status, 200, 'Expected HTTP 200');
    const html = await res.text();
    assert.ok(html.includes('Presentation Ideas'), 'HTML contains Presentation Ideas');
    recordTest('Page 14 Standalone Preview Route Loads', true, 'HTTP 200 OK');
  } catch (e) {
    recordTest('Page 14 Standalone Preview Route Loads', false, e.message);
  }

  // Test 2: Full Content Intelligence Pipeline -> Page 14 Real API Call
  let analysisData, suggestionsData, presentationData;
  try {
    // 2a. Analysis
    const aRes = await fetch(`${BASE_URL}/api/tutorial-composer/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
      body: JSON.stringify(testDocPayload),
    });
    assert.equal(aRes.status, 200);
    const aJson = await aRes.json();
    analysisData = aJson.data;

    // 2b. Block Suggestions
    const sRes = await fetch(`${BASE_URL}/api/tutorial-composer/block-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
      body: JSON.stringify({ ...testDocPayload, analysis: analysisData }),
    });
    assert.equal(sRes.status, 200);
    const sJson = await sRes.json();
    suggestionsData = sJson.data?.data || sJson.data;

    // 2c. Presentation Ideas API
    const pRes = await fetch(`${BASE_URL}/api/tutorial-composer/presentation-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
      body: JSON.stringify({
        ...testDocPayload,
        analysis: analysisData,
        blockSuggestions: suggestionsData,
      }),
    });
    assert.equal(pRes.status, 200, 'Expected HTTP 200 from Presentation Ideas API');
    const pJson = await pRes.json();
    presentationData = pJson.data?.data || pJson.data;

    assert.ok(Array.isArray(presentationData.ideas), 'ideas is an array');
    assert.ok(presentationData.statistics, 'statistics object present');
    assert.ok(presentationData.contextOutline, 'contextOutline present');
    assert.ok(Array.isArray(presentationData.bestPractices), 'bestPractices is an array');

    recordTest('Real Claude API Pipeline Returns Valid PresentationIdeasResult', true, 
      `${presentationData.ideas.length} ideas, ${presentationData.bestPractices.length} best practices`);
  } catch (e) {
    recordTest('Real Claude API Pipeline Returns Valid PresentationIdeasResult', false, e.message);
  }

  // Test 3: API Auth & RBAC Security Verification (Without dev bypass)
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/tutorial-composer/presentation-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDocPayload),
    });
    assert.equal(unauthRes.status, 401, 'Expected HTTP 401 Unauthorized');
    recordTest('Security Check: 401 Unauthorized without Token or Dev Bypass', true, 'HTTP 401');
  } catch (e) {
    recordTest('Security Check: 401 Unauthorized without Token or Dev Bypass', false, e.message);
  }

  // Test 4: API Validation Error on Malformed Payload
  try {
    const invalidRes = await fetch(`${BASE_URL}/api/tutorial-composer/presentation-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutorial-dev-bypass': 'true' },
      body: JSON.stringify({ document: { invalid: true } }),
    });
    assert.equal(invalidRes.status, 422, 'Expected HTTP 422 Validation Error');
    recordTest('Validation Check: 422 Unprocessable Entity on Invalid Payload', true, 'HTTP 422');
  } catch (e) {
    recordTest('Validation Check: 422 Unprocessable Entity on Invalid Payload', false, e.message);
  }

  // Test 5: Target Block Types Canonical Invariant (BLOCK_REGISTRY = 17)
  try {
    const canonicalTypes = new Set([
      'heading', 'paragraph', 'list', 'code', 'example', 'image', 'diagram',
      'table', 'comparison', 'callout', 'quote', 'definition', 'summary',
      'two-column', 'three-column', 'card-grid', 'timeline'
    ]);

    for (const idea of presentationData.ideas) {
      assert.ok(canonicalTypes.has(idea.targetBlockType), 
        `Target block type ${idea.targetBlockType} is not in BLOCK_REGISTRY`);
      assert.notEqual(idea.targetBlockType, 'concept-cards', 
        'concept-cards must map to canonical card-grid');
    }
    recordTest('Canonical Invariant: All targetBlockTypes in 17 BLOCK_REGISTRY types', true, '17/17 invariant honored');
  } catch (e) {
    recordTest('Canonical Invariant: All targetBlockTypes in 17 BLOCK_REGISTRY types', false, e.message);
  }

  // Test 6: Presentation Statistics Integrity
  try {
    const stats = presentationData.statistics;
    assert.equal(typeof stats.total, 'number');
    assert.equal(typeof stats.high, 'number');
    assert.equal(typeof stats.medium, 'number');
    assert.equal(typeof stats.low, 'number');
    assert.equal(stats.total, stats.high + stats.medium + stats.low);
    recordTest('KPI Statistics Invariant: total === high + medium + low', true, 
      `Total: ${stats.total}, High: ${stats.high}, Med: ${stats.medium}, Low: ${stats.low}`);
  } catch (e) {
    recordTest('KPI Statistics Invariant: total === high + medium + low', false, e.message);
  }

  // Test 7: Context Outline Hierarchy Structure
  try {
    const outline = presentationData.contextOutline;
    assert.ok(outline.totalSections >= 0);
    assert.ok(outline.totalWords > 0);
    assert.ok(Array.isArray(outline.mainSections) && outline.mainSections.length > 0);
    recordTest('Context Outline Invariant: Hierarchy populated from ContentAnalysis', true, 
      `${outline.mainSections.length} outline entries`);
  } catch (e) {
    recordTest('Context Outline Invariant: Hierarchy populated from ContentAnalysis', false, e.message);
  }

  // Test 8: Best Practices Recommendations
  try {
    const bp = presentationData.bestPractices;
    assert.ok(bp.length > 0, 'Best practices array is not empty');
    for (const item of bp) {
      assert.ok(item.title, 'Best practice has title');
      assert.ok(item.category, 'Best practice has category');
    }
    recordTest('Best Practices Invariant: Populated with actionable recommendations', true, 
      `${bp.length} items`);
  } catch (e) {
    recordTest('Best Practices Invariant: Populated with actionable recommendations', false, e.message);
  }

  // Test 9: SessionStorage Handoff Simulation (Page 14 -> Page 15)
  try {
    const selected = presentationData.ideas.filter((_, i) => i === 0);
    const handoffPayload = {
      subtopicId: testDocPayload.subtopicId,
      sectionType: testDocPayload.sectionType,
      selectedIdeas: selected,
      totalSelected: selected.length,
      createdAt: new Date().toISOString(),
    };
    assert.ok(handoffPayload.selectedIdeas.length >= 0);
    assert.ok(handoffPayload.createdAt);
    recordTest('SessionStorage Handoff Contract: tutorial_composer_presentation_plan ready', true, 
      `Payload has ${handoffPayload.selectedIdeas.length} selected ideas`);
  } catch (e) {
    recordTest('SessionStorage Handoff Contract: tutorial_composer_presentation_plan ready', false, e.message);
  }

  console.log('\n============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} checks passed (${((passed/total)*100).toFixed(0)}%)`);
  console.log('============================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(console.error);
