#!/usr/bin/env node

/**
 * TEST: Isolated Document Update (Phase 1)
 * 
 * Tests document update invariant with ISOLATED fixture.
 * 
 * Rule: This test mutates only data that this test created.
 * 
 * Lifecycle:
 * 1. Create dedicated D1+C1+C1 fixture
 * 2. Capture immutable baseline
 * 3. UPDATE D1 (replace in place)
 * 4. Verify D1 updated, C1s unchanged, no duplicate D1
 * 5. DELETE fixture
 * 6. Verify deletion
 */

import { TutorialFixtureFactory } from './lib/test-fixture-factory.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || 'ace4e240-14ee-45c5-9230-08dc828e1e10';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   ISOLATED DOCUMENT UPDATE TEST (PHASE 1)                ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Subtopic: ${TEST_SUBTOPIC_ID}\n`);

const factory = new TutorialFixtureFactory(BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD);
let fixture = null;

async function test01_createFixture() {
  console.log('[TEST 01] Create Isolated D1+C1+C1 Fixture');
  
  await factory.login();
  
  fixture = await factory.createD1C1C1Fixture(TEST_SUBTOPIC_ID, {
    d1Title: 'TEST ISOLATED — What Is a Python Variable?',
    c1Title1: 'TEST ISOLATED — Creating a Python Variable',
    c1Title2: 'TEST ISOLATED — Changing a Python Variable',
  });

  console.log(`✅ [PASS] Created fixture`);
  console.log(`   Tutorial ID: ${fixture.tutorialId}`);
  console.log(`   D1 ID: ${fixture.d1Id}`);
  console.log(`   C1[0] ID: ${fixture.c1Id1}`);
  console.log(`   C1[1] ID: ${fixture.c1Id2}`);
  console.log();
}

async function test02_updateD1() {
  console.log('[TEST 02] Update D1 (Document-Level Replace Invariant)');

  const baseline = fixture.baseline.content;
  const d1Block = baseline.blocks[0];
  const originalD1Title = d1Block.content.page.title;
  const timestamp = Date.now();
  const newD1Title = `${originalD1Title} — UPDATED ${timestamp}`;

  // Document transformation: replace D1 in place
  const updatedDocument = {
    ...baseline,
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
      ...baseline.blocks.slice(1),
    ],
  };

  await factory.updateTutorial(fixture.tutorialId, updatedDocument);

  // Verify
  const updated = await factory.getTutorialById(fixture.tutorialId);
  const updatedD1 = updated.content.blocks[0];

  // CRITICAL ASSERTIONS
  const assertions = [];

  // 1. Block count unchanged
  if (updated.content.blocks.length !== baseline.blocks.length) {
    throw new Error(
      `Block count changed! Expected ${baseline.blocks.length}, got ${updated.content.blocks.length}`
    );
  }
  assertions.push(`✓ Block count unchanged: ${updated.content.blocks.length}`);

  // 2. D1 ID unchanged
  if (updatedD1.id !== fixture.d1Id) {
    throw new Error(`D1 ID changed! Expected ${fixture.d1Id}, got ${updatedD1.id}`);
  }
  assertions.push(`✓ D1 ID unchanged: ${updatedD1.id}`);

  // 3. D1 content updated
  if (updatedD1.content.page.title !== newD1Title) {
    throw new Error(
      `D1 title not updated!\nExpected: ${newD1Title}\nGot: ${updatedD1.content.page.title}`
    );
  }
  assertions.push(`✓ D1 title updated`);

  // 4. No duplicate D1
  const d1Count = updated.content.blocks.filter(b => b.type === 'definition').length;
  if (d1Count !== 1) {
    throw new Error(`Duplicate D1! Expected 1, got ${d1Count}`);
  }
  assertions.push(`✓ No duplicate D1`);

  // 5. C1 blocks unchanged
  const baselineC1s = baseline.blocks.filter(b => b.type === 'code');
  const updatedC1s = updated.content.blocks.filter(b => b.type === 'code');

  if (updatedC1s.length !== baselineC1s.length) {
    throw new Error(`C1 count changed! Expected ${baselineC1s.length}, got ${updatedC1s.length}`);
  }

  for (let i = 0; i < baselineC1s.length; i++) {
    const baselineC1 = baselineC1s[i];
    const updatedC1 = updatedC1s.find(c => c.id === baselineC1.id);

    if (!updatedC1) {
      throw new Error(`C1[${i}] ID ${baselineC1.id} missing after update!`);
    }

    const baselineJson = JSON.stringify(baselineC1);
    const updatedJson = JSON.stringify(updatedC1);

    if (baselineJson !== updatedJson) {
      throw new Error(`C1[${i}] was modified unexpectedly!`);
    }
  }
  assertions.push(`✓ All ${baselineC1s.length} C1 blocks unchanged`);

  console.log('✅ [PASS] D1 updated, document integrity preserved');
  assertions.forEach(a => console.log(`   ${a}`));
  console.log();
}

async function test03_deleteFixture() {
  console.log('[TEST 03] Delete Isolated Fixture');

  await factory.deleteTutorial(fixture.tutorialId);
  await factory.verifyTutorialDeleted(fixture.tutorialId);

  console.log('✅ [PASS] Fixture deleted and verified');
  console.log(`   Tutorial ${fixture.tutorialId} no longer exists`);
  console.log();
}

async function runTests() {
  const tests = [
    test01_createFixture,
    test02_updateD1,
    test03_deleteFixture,
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
        break;
      }
    }
  } finally {
    // Cleanup in case of failure
    if (fixture) {
      try {
        await factory.cleanup();
      } catch (error) {
        console.warn('⚠️  Cleanup warning:', error.message);
      }
    }
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('FINAL REPORT - ISOLATED DOCUMENT UPDATE');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('❌ TEST FAILED');
    process.exit(1);
  } else {
    console.log('✅ TEST PASSED');
    console.log('\nVerified with ISOLATED fixture:');
    console.log('  ✓ Update D1 preserves block count');
    console.log('  ✓ Update D1 preserves D1 ID');
    console.log('  ✓ Update D1 changes content');
    console.log('  ✓ Update D1 preserves all C1 blocks');
    console.log('  ✓ No duplicate D1 created');
    console.log('  ✓ Fixture cleanup verified\n');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
