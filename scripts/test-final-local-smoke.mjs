#!/usr/bin/env node

/**
 * FINAL LOCAL SMOKE TEST — TUTORIAL COMPOSER BACKEND
 * 
 * Lightweight pre-deployment confidence check.
 * 
 * Verifies the final local Tutorial Composer API contract:
 * - Login
 * - Create isolated D1 + C1 + C1 fixture
 * - Read document
 * - PATCH D1
 * - Read document again
 * - Verify D1 changed
 * - Verify C1 + C1 unchanged
 * - Verify persisted document
 * - DELETE fixture
 * - Verify deletion
 * 
 * This is NOT a new backend audit - the backend is already verified.
 * This is simply a final deployment confidence check.
 */

import { TutorialFixtureFactory } from './lib/test-fixture-factory.mjs';

const BASE_URL = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillhubcore.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'testing';
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || 'ace4e240-14ee-45c5-9230-08dc828e1e10';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   FINAL LOCAL SMOKE TEST — TUTORIAL COMPOSER             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Subtopic: ${TEST_SUBTOPIC_ID}\n`);

const factory = new TutorialFixtureFactory(BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD);
let fixture = null;
let baselineDocument = null;

async function test01_login() {
  console.log('[TEST 01] Login');
  
  await factory.login();

  console.log('✅ [PASS] Authentication successful\n');
}

async function test02_createFixture() {
  console.log('[TEST 02] Create Isolated D1+C1+C1 Fixture');
  
  fixture = await factory.createD1C1C1Fixture(TEST_SUBTOPIC_ID, {
    d1Title: 'FINAL SMOKE — What Is a Python Variable?',
    c1Title1: 'FINAL SMOKE — Creating a Python Variable',
    c1Title2: 'FINAL SMOKE — Changing a Python Variable',
  });

  // Verify structure
  const doc = fixture.baseline.content;
  
  if (doc.blocks.length !== 3) {
    throw new Error(`Expected 3 blocks, got ${doc.blocks.length}`);
  }

  if (doc.blocks[0].type !== 'definition') {
    throw new Error(`Block 0 should be definition, got ${doc.blocks[0].type}`);
  }

  if (doc.blocks[1].type !== 'code' || doc.blocks[2].type !== 'code') {
    throw new Error('Blocks 1 and 2 should be code');
  }

  console.log('✅ [PASS] Fixture created');
  console.log(`   Tutorial ID: ${fixture.tutorialId}`);
  console.log(`   D1 ID: ${fixture.d1Id}`);
  console.log(`   C1[0] ID: ${fixture.c1Id1}`);
  console.log(`   C1[1] ID: ${fixture.c1Id2}\n`);
}

async function test03_readInitialDocument() {
  console.log('[TEST 03] Read Initial Document');

  const initial = await factory.getTutorialById(fixture.tutorialId);
  const doc = initial.content;

  if (!doc || !doc.blocks) {
    throw new Error('Document not found or invalid');
  }

  if (doc.blocks.length !== 3) {
    throw new Error(`Expected 3 blocks, got ${doc.blocks.length}`);
  }

  const d1 = doc.blocks.find(b => b.id === fixture.d1Id);
  const c1_0 = doc.blocks.find(b => b.id === fixture.c1Id1);
  const c1_1 = doc.blocks.find(b => b.id === fixture.c1Id2);

  if (!d1 || !c1_0 || !c1_1) {
    throw new Error('Missing expected blocks');
  }

  // Capture immutable baseline (deep clone)
  baselineDocument = JSON.parse(JSON.stringify(doc));

  console.log('✅ [PASS] Initial document verified');
  console.log(`   Blocks: 3\n`);
}

async function test04_updateD1() {
  console.log('[TEST 04] Update D1');

  const timestamp = Date.now();
  const newD1Title = `FINAL SMOKE — UPDATED ${timestamp}`;

  // Create updated document from baseline
  const d1Block = baselineDocument.blocks[0];
  const updatedDocument = {
    ...baselineDocument,
    blocks: [
      {
        ...d1Block,
        content: {
          ...d1Block.content,
          page: {
            ...d1Block.content.page,
            title: newD1Title,
          },
        },
      },
      ...baselineDocument.blocks.slice(1),
    ],
  };

  await factory.updateTutorial(fixture.tutorialId, updatedDocument);

  console.log('✅ [PASS] D1 update accepted\n');
}

async function test05_readAfterPatch() {
  console.log('[TEST 05] Read After PATCH');

  const updated = await factory.getTutorialById(fixture.tutorialId);
  const doc = updated.content;

  const assertions = [];

  // 1. Block count unchanged
  if (doc.blocks.length !== 3) {
    throw new Error(`Block count changed! Expected 3, got ${doc.blocks.length}`);
  }
  assertions.push('✓ Block count unchanged');

  // 2. D1 ID unchanged
  if (doc.blocks[0].id !== fixture.d1Id) {
    throw new Error(`D1 ID changed from ${fixture.d1Id} to ${doc.blocks[0].id}`);
  }
  assertions.push('✓ D1 ID unchanged');

  // 3. D1 title updated
  const baselineD1Title = baselineDocument.blocks[0].content.page.title;
  const updatedD1Title = doc.blocks[0].content.page.title;
  if (updatedD1Title === baselineD1Title) {
    throw new Error('D1 title not updated');
  }
  assertions.push('✓ D1 title updated');

  // 4. Exactly one D1
  const d1Count = doc.blocks.filter(b => b.type === 'definition').length;
  if (d1Count !== 1) {
    throw new Error(`Duplicate D1! Expected 1, got ${d1Count}`);
  }
  assertions.push('✓ No duplicate D1');

  // 5. Exactly two C1 blocks
  const c1Count = doc.blocks.filter(b => b.type === 'code').length;
  if (c1Count !== 2) {
    throw new Error(`C1 count changed! Expected 2, got ${c1Count}`);
  }

  // 6. C1[0] ID unchanged
  if (doc.blocks[1].id !== fixture.c1Id1) {
    throw new Error('C1[0] ID changed');
  }

  // 7. C1[1] ID unchanged
  if (doc.blocks[2].id !== fixture.c1Id2) {
    throw new Error('C1[1] ID changed');
  }

  // 8. C1[0] complete JSON unchanged
  const baselineC1_0Json = JSON.stringify(baselineDocument.blocks[1]);
  const updatedC1_0Json = JSON.stringify(doc.blocks[1]);
  if (baselineC1_0Json !== updatedC1_0Json) {
    throw new Error('C1[0] content changed unexpectedly');
  }
  assertions.push('✓ C1[0] unchanged');

  // 9. C1[1] complete JSON unchanged
  const baselineC1_1Json = JSON.stringify(baselineDocument.blocks[2]);
  const updatedC1_1Json = JSON.stringify(doc.blocks[2]);
  if (baselineC1_1Json !== updatedC1_1Json) {
    throw new Error('C1[1] content changed unexpectedly');
  }
  assertions.push('✓ C1[1] unchanged');

  console.log('✅ [PASS] Updated D1 persisted');
  assertions.forEach(a => console.log(`   ${a}`));
  console.log();
}

async function test06_persistenceVerification() {
  console.log('[TEST 06] Persistence Verification');

  // Read again to confirm persistence
  const verified = await factory.getTutorialById(fixture.tutorialId);
  const doc = verified.content;

  // Verify complete document structure
  if (doc.blocks.length !== 3) {
    throw new Error('Document structure not preserved');
  }

  if (doc.blocks[0].type !== 'definition') {
    throw new Error('D1 position changed');
  }

  if (doc.blocks[1].type !== 'code' || doc.blocks[2].type !== 'code') {
    throw new Error('C1 blocks position changed');
  }

  // Verify D1 updated
  const baselineD1Title = baselineDocument.blocks[0].content.page.title;
  const verifiedD1Title = doc.blocks[0].content.page.title;
  if (verifiedD1Title === baselineD1Title) {
    throw new Error('D1 reverted to baseline - persistence failed');
  }

  // Verify C1s still unchanged
  const baselineC1_0Json = JSON.stringify(baselineDocument.blocks[1]);
  const verifiedC1_0Json = JSON.stringify(doc.blocks[1]);
  if (baselineC1_0Json !== verifiedC1_0Json) {
    throw new Error('C1[0] changed after second read');
  }

  const baselineC1_1Json = JSON.stringify(baselineDocument.blocks[2]);
  const verifiedC1_1Json = JSON.stringify(doc.blocks[2]);
  if (baselineC1_1Json !== verifiedC1_1Json) {
    throw new Error('C1[1] changed after second read');
  }

  console.log('✅ [PASS] PATCH → GET persistence verified');
  console.log('   ✓ Complete document structure preserved\n');
}

async function test07_deleteFixture() {
  console.log('[TEST 07] Delete Fixture');

  await factory.deleteTutorial(fixture.tutorialId);
  await factory.verifyTutorialDeleted(fixture.tutorialId);

  console.log('✅ [PASS] Fixture deleted and verified\n');
}

async function runTests() {
  const tests = [
    test01_login,
    test02_createFixture,
    test03_readInitialDocument,
    test04_updateD1,
    test05_readAfterPatch,
    test06_persistenceVerification,
    test07_deleteFixture,
  ];

  let passed = 0;
  let failed = 0;

  try {
    for (const test of tests) {
      try {
        await test();
        passed++;
      } catch (error) {
        failed++;
        console.error(`❌ [FAIL] ${test.name}`);
        console.error(`   Error: ${error.message}\n`);
        if (fixture) {
          console.error(`   Tutorial ID: ${fixture.tutorialId}`);
        }
        break;
      }
    }
  } finally {
    if (fixture) {
      try {
        await factory.cleanup();
      } catch (error) {
        // Already cleaned up in test07
      }
    }
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('FINAL REPORT - LOCAL SMOKE TEST');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`✅ PASSED: ${passed}/${tests.length}`);
  console.log(`❌ FAILED: ${failed}/${tests.length}\n`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('❌ FINAL LOCAL SMOKE TEST FAILED\n');
    console.log('Deployment gate: 🔴 FAIL\n');
    process.exit(1);
  } else {
    console.log('✅ FINAL LOCAL SMOKE TEST PASSED\n');
    console.log('Deployment gate: 🟢 PASS\n');
    console.log('Verified:');
    console.log('  ✓ Authentication');
    console.log('  ✓ Isolated fixture creation');
    console.log('  ✓ Document read');
    console.log('  ✓ D1 update');
    console.log('  ✓ D1 persistence');
    console.log('  ✓ C1 preservation');
    console.log('  ✓ Block identity preservation');
    console.log('  ✓ Duplicate prevention');
    console.log('  ✓ Document integrity');
    console.log('  ✓ Fixture deletion\n');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
