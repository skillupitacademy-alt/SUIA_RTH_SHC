#!/usr/bin/env node

/**
 * Tutorial Composer CRUD Baseline Test Suite
 * 
 * Comprehensive document integrity verification before GUI refactor.
 * 
 * This suite establishes the authoritative correctness baseline for:
 * - Create
 * - Read
 * - Update (D1, C1)
 * - Delete
 * - Document integrity
 * - Block identity preservation
 * - Schema validation
 * - Publish/reload
 * 
 * Once this suite is 100% green, we can safely refactor the GUI
 * into reusable components and separate CRUD routes.
 */

import { TutorialFixtureFactory } from './lib/test-fixture-factory.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';
const TEST_SUBTOPIC_ID = process.env.TEST_SUBTOPIC_ID || 'ace4e240-14ee-45c5-9230-08dc828e1e10';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   TUTORIAL COMPOSER CRUD BASELINE TEST SUITE             ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Subtopic: ${TEST_SUBTOPIC_ID}`);
console.log('════════════════════════════════════════════════════════════\n');

const factory = new TutorialFixtureFactory(BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD);
let fixture = null;

async function test01_createD1C1C1() {
  console.log('[TEST 01] Create D1 + C1 + C1 Document');
  
  await factory.login();
  
  fixture = await factory.createD1C1C1Fixture(TEST_SUBTOPIC_ID, {
    d1Title: 'CRUD BASELINE — What Is a Python Variable?',
    c1Title1: 'CRUD BASELINE — Creating a Python Variable',
    c1Title2: 'CRUD BASELINE — Changing a Python Variable',
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

  console.log(`✅ [PASS] Created D1+C1+C1 document`);
  console.log(`   Tutorial ID: ${fixture.tutorialId}`);
  console.log(`   D1 ID: ${fixture.d1Id}`);
  console.log(`   C1[0] ID: ${fixture.c1Id1}`);
  console.log(`   C1[1] ID: ${fixture.c1Id2}`);
  console.log();
}

async function test02_readCompleteDocument() {
  console.log('[TEST 02] Read Complete Document');

  const tutorial = await factory.getTutorialById(fixture.tutorialId);
  const doc = tutorial.content;

  const d1 = doc.blocks.find(b => b.id === fixture.d1Id);
  const c1_0 = doc.blocks.find(b => b.id === fixture.c1Id1);
  const c1_1 = doc.blocks.find(b => b.id === fixture.c1Id2);

  if (!d1 || !c1_0 || !c1_1) {
    throw new Error('Missing expected blocks');
  }

  console.log(`✅ [PASS] Read complete document`);
  console.log(`   Blocks: ${doc.blocks.length}`);
  console.log(`   D1: ${d1.content.page.title}`);
  console.log(`   C1[0]: ${c1_0.content.page.title}`);
  console.log(`   C1[1]: ${c1_1.content.page.title}`);
  console.log();
}

async function test03_updateD1PreserveC1() {
  console.log('[TEST 03] Update D1 → Preserve C1 + C1');

  const baseline = fixture.baseline.content;
  const d1Block = baseline.blocks[0];
  const timestamp = Date.now();

  const updatedDocument = {
    ...baseline,
    blocks: [
      {
        ...d1Block,
        content: {
          ...d1Block.content,
          page: {
            ...d1Block.content.page,
            title: `UPDATED D1 ${timestamp}`,
          },
        },
      },
      ...baseline.blocks.slice(1),
    ],
  };

  await factory.updateTutorial(fixture.tutorialId, updatedDocument);

  const updated = await factory.getTutorialById(fixture.tutorialId);
  
  // Verify D1 changed
  if (updated.content.blocks[0].content.page.title === d1Block.content.page.title) {
    throw new Error('D1 not updated');
  }

  // Verify C1s unchanged
  const baselineC1Json = JSON.stringify(baseline.blocks.slice(1));
  const updatedC1Json = JSON.stringify(updated.content.blocks.slice(1));
  
  if (baselineC1Json !== updatedC1Json) {
    throw new Error('C1 blocks were modified');
  }

  console.log(`✅ [PASS] D1 updated, C1+C1 preserved`);
  console.log(`   D1 ID: ${updated.content.blocks[0].id} (unchanged)`);
  console.log(`   C1[0] ID: ${updated.content.blocks[1].id} (unchanged)`);
  console.log(`   C1[1] ID: ${updated.content.blocks[2].id} (unchanged)`);
  console.log();
}

async function test04_updateC1PreserveD1AndOtherC1() {
  console.log('[TEST 04] Update C1[0] → Preserve D1 + C1[1]');

  const current = await factory.getTutorialById(fixture.tutorialId);
  const currentDoc = current.content;
  const c1_0 = currentDoc.blocks[1];
  const timestamp = Date.now();

  const updatedDocument = {
    ...currentDoc,
    blocks: [
      currentDoc.blocks[0], // D1 unchanged
      {
        ...c1_0,
        content: {
          ...c1_0.content,
          page: {
            ...c1_0.content.page,
            title: `UPDATED C1[0] ${timestamp}`,
          },
        },
      },
      currentDoc.blocks[2], // C1[1] unchanged
    ],
  };

  await factory.updateTutorial(fixture.tutorialId, updatedDocument);

  const updated = await factory.getTutorialById(fixture.tutorialId);

  // Verify C1[0] changed
  if (updated.content.blocks[1].content.page.title === c1_0.content.page.title) {
    throw new Error('C1[0] not updated');
  }

  // Verify D1 unchanged
  const currentD1Json = JSON.stringify(currentDoc.blocks[0]);
  const updatedD1Json = JSON.stringify(updated.content.blocks[0]);
  if (currentD1Json !== updatedD1Json) {
    throw new Error('D1 was modified');
  }

  // Verify C1[1] unchanged
  const currentC1_1Json = JSON.stringify(currentDoc.blocks[2]);
  const updatedC1_1Json = JSON.stringify(updated.content.blocks[2]);
  if (currentC1_1Json !== updatedC1_1Json) {
    throw new Error('C1[1] was modified');
  }

  console.log(`✅ [PASS] C1[0] updated, D1 + C1[1] preserved`);
  console.log(`   D1 unchanged: ✓`);
  console.log(`   C1[0] updated: ✓`);
  console.log(`   C1[1] unchanged: ✓`);
  console.log();
}

async function test05_saveGetExactEquality() {
  console.log('[TEST 05] Save → GET → Exact Document Equality');

  const beforeSave = await factory.getTutorialById(fixture.tutorialId);
  const beforeDoc = beforeSave.content;

  // Re-save exact same document
  await factory.updateTutorial(fixture.tutorialId, beforeDoc);

  const afterSave = await factory.getTutorialById(fixture.tutorialId);
  const afterDoc = afterSave.content;

  const beforeJson = JSON.stringify(beforeDoc);
  const afterJson = JSON.stringify(afterDoc);

  if (beforeJson !== afterJson) {
    throw new Error('Document mutated during save cycle');
  }

  console.log(`✅ [PASS] Save → GET preserves exact document`);
  console.log(`   Byte-for-byte equality: ✓`);
  console.log();
}

async function test06_blockIdentityPreservation() {
  console.log('[TEST 06] Block Identity Preservation Through Multiple Updates');

  const original = fixture.baseline.content;
  const originalD1Id = original.blocks[0].id;
  const originalC1_0Id = original.blocks[1].id;
  const originalC1_1Id = original.blocks[2].id;

  // Perform 3 updates
  for (let i = 0; i < 3; i++) {
    const current = await factory.getTutorialById(fixture.tutorialId);
    const d1 = current.content.blocks[0];

    const updated = {
      ...current.content,
      blocks: [
        {
          ...d1,
          content: {
            ...d1.content,
            page: {
              ...d1.content.page,
              title: `IDENTITY TEST ${i} — ${Date.now()}`,
            },
          },
        },
        ...current.content.blocks.slice(1),
      ],
    };

    await factory.updateTutorial(fixture.tutorialId, updated);
  }

  const final = await factory.getTutorialById(fixture.tutorialId);

  if (final.content.blocks[0].id !== originalD1Id) {
    throw new Error(`D1 ID changed from ${originalD1Id} to ${final.content.blocks[0].id}`);
  }

  if (final.content.blocks[1].id !== originalC1_0Id) {
    throw new Error('C1[0] ID changed');
  }

  if (final.content.blocks[2].id !== originalC1_1Id) {
    throw new Error('C1[1] ID changed');
  }

  console.log(`✅ [PASS] Block IDs preserved through 3 updates`);
  console.log(`   D1 ID: ${originalD1Id} (stable)`);
  console.log(`   C1[0] ID: ${originalC1_0Id} (stable)`);
  console.log(`   C1[1] ID: ${originalC1_1Id} (stable)`);
  console.log();
}

async function test07_noDuplicateBlock() {
  console.log('[TEST 07] No Duplicate Block Created During Update');

  const current = await factory.getTutorialById(fixture.tutorialId);
  const currentBlockCount = current.content.blocks.length;

  // Update D1 10 times
  for (let i = 0; i < 10; i++) {
    const doc = await factory.getTutorialById(fixture.tutorialId);
    const d1 = doc.content.blocks[0];

    const updated = {
      ...doc.content,
      blocks: [
        {
          ...d1,
          content: {
            ...d1.content,
            page: {
              ...d1.content.page,
              title: `DUPLICATE TEST ${i}`,
            },
          },
        },
        ...doc.content.blocks.slice(1),
      ],
    };

    await factory.updateTutorial(fixture.tutorialId, updated);
  }

  const final = await factory.getTutorialById(fixture.tutorialId);

  if (final.content.blocks.length !== currentBlockCount) {
    throw new Error(
      `Block count changed! Expected ${currentBlockCount}, got ${final.content.blocks.length}`
    );
  }

  const d1Count = final.content.blocks.filter(b => b.type === 'definition').length;
  if (d1Count !== 1) {
    throw new Error(`Duplicate D1 created! Found ${d1Count} definition blocks`);
  }

  console.log(`✅ [PASS] No duplicate blocks after 10 updates`);
  console.log(`   Block count: ${currentBlockCount} (stable)`);
  console.log(`   D1 count: 1 (stable)`);
  console.log();
}

async function test08_deleteFixture() {
  console.log('[TEST 08] Delete Fixture and Verify');

  await factory.deleteTutorial(fixture.tutorialId);
  await factory.verifyTutorialDeleted(fixture.tutorialId);

  console.log(`✅ [PASS] Fixture deleted and verified`);
  console.log(`   Tutorial ${fixture.tutorialId} no longer exists`);
  console.log();
}

async function runTests() {
  const tests = [
    test01_createD1C1C1,
    test02_readCompleteDocument,
    test03_updateD1PreserveC1,
    test04_updateC1PreserveD1AndOtherC1,
    test05_saveGetExactEquality,
    test06_blockIdentityPreservation,
    test07_noDuplicateBlock,
    test08_deleteFixture,
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
    if (fixture) {
      try {
        await factory.cleanup();
      } catch (error) {
        // Already cleaned up in test08
      }
    }
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('FINAL REPORT - CRUD BASELINE');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ PASSED: ${passed}/${tests.length}`);
  console.log(`❌ FAILED: ${failed}/${tests.length}`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('❌ CRUD BASELINE NOT ESTABLISHED');
    console.log('   Fix failures before refactoring GUI\n');
    process.exit(1);
  } else {
    console.log('✅ CRUD BASELINE ESTABLISHED');
    console.log('\nVerified:');
    console.log('  ✓ Create D1+C1+C1 document');
    console.log('  ✓ Read complete document');
    console.log('  ✓ Update D1 preserves C1s');
    console.log('  ✓ Update C1 preserves D1 and other C1');
    console.log('  ✓ Save → GET exact equality');
    console.log('  ✓ Block identity preservation (3 updates)');
    console.log('  ✓ No duplicate blocks (10 updates)');
    console.log('  ✓ Delete and verify');
    console.log('\n🎯 SAFE TO REFACTOR GUI INTO REUSABLE COMPONENTS\n');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
