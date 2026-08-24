#!/usr/bin/env node

/**
 * TEST F: Full Document Integrity
 * 
 * Critical test: Verifies the ORIGINAL BUG is fixed.
 * 
 * Original bug: "full document first part is definition, second is code but in full 
 * updated JSON data is not visible of first block which is reflecting in active document"
 * 
 * This test verifies:
 * - BEFORE edit: capture D1 + all C1 blocks
 * - UPDATE D1
 * - AFTER edit: D1 updated, ALL C1 blocks unchanged, no duplicate D1 created
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';
const TEST_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const BRAND_ID = 'shared';

let adminToken = '';
let tutorialId = null;
let originalDocument = null;

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   TEST F: FULL DOCUMENT INTEGRITY (ORIGINAL BUG)         ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = response.headers.get('set-cookie');
  adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];
}

async function getDocument() {
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
    {
      headers: { 'Cookie': `accessToken=${adminToken}` },
    }
  );

  const result = await response.json();
  tutorialId = result.data[0].id;
  return result.data[0].content;
}

async function saveDocument(document) {
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections/${tutorialId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `accessToken=${adminToken}`,
      },
      body: JSON.stringify({ content: document }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save: ${response.status} - ${errorText}`);
  }
}

async function test() {
  console.log('[TEST] Verify Original Bug: Update D1, preserve complete D1+C1 document\n');
  
  await login();

  // BEFORE EDIT: Capture original state
  console.log('BEFORE EDIT:');
  originalDocument = await getDocument();

  const originalD1 = originalDocument.blocks.find(b => b.type === 'definition');
  const originalC1Blocks = originalDocument.blocks.filter(b => b.type === 'code');

  if (!originalD1) {
    throw new Error('No D1 block found');
  }

  if (originalC1Blocks.length === 0) {
    throw new Error('No C1 blocks found');
  }

  console.log(`  Total blocks: ${originalDocument.blocks.length}`);
  console.log(`  D1 ID: ${originalD1.id}`);
  console.log(`  D1 Title: ${originalD1.content.page.title}`);
  console.log(`  C1 blocks: ${originalC1Blocks.length}`);
  originalC1Blocks.forEach((c1, idx) => {
    console.log(`    C1[${idx}] ID: ${c1.id}`);
    console.log(`    C1[${idx}] Title: ${c1.content.title || c1.content.page?.title || 'N/A'}`);
  });

  // UPDATE D1
  console.log('\nUPDATE D1:');
  const updatedD1Content = {
    ...originalD1.content,
    page: {
      ...originalD1.content.page,
      title: `${originalD1.content.page.title} — INTEGRITY TEST ${Date.now()}`,
    },
  };

  const updatedDocument = {
    ...originalDocument,
    blocks: [
      {
        ...originalD1,
        content: updatedD1Content,
      },
      ...originalDocument.blocks.slice(1),
    ],
  };

  await saveDocument(updatedDocument);
  console.log(`  Updated D1 title: ${updatedD1Content.page.title}`);

  // AFTER EDIT: Verify complete document integrity
  console.log('\nAFTER EDIT:');
  const verifyDoc = await getDocument();

  // CRITICAL ASSERTIONS
  const assertions = [];

  // 1. Block count unchanged
  if (verifyDoc.blocks.length !== originalDocument.blocks.length) {
    throw new Error(
      `Block count changed! Expected ${originalDocument.blocks.length}, got ${verifyDoc.blocks.length}\n` +
      `FAILURE MODE: Duplicate D1 may have been appended instead of updating existing D1`
    );
  }
  assertions.push(`✓ Block count unchanged: ${verifyDoc.blocks.length}`);

  // 2. D1 exists and is updated
  const verifyD1 = verifyDoc.blocks.find(b => b.type === 'definition' && b.id === originalD1.id);
  if (!verifyD1) {
    throw new Error(`D1 block ID ${originalD1.id} not found after update!`);
  }
  assertions.push(`✓ D1 ID unchanged: ${verifyD1.id}`);

  if (verifyD1.content.page.title !== updatedD1Content.page.title) {
    throw new Error(
      `D1 content not updated!\nExpected: ${updatedD1Content.page.title}\nGot: ${verifyD1.content.page.title}`
    );
  }
  assertions.push(`✓ D1 content updated`);

  assertions.push(`✓ D1 type: ${verifyD1.type}`);
  assertions.push(`✓ D1 version: ${verifyD1.version}`);

  // 3. NO duplicate D1 created
  const d1Count = verifyDoc.blocks.filter(b => b.type === 'definition').length;
  const originalD1Count = originalDocument.blocks.filter(b => b.type === 'definition').length;
  if (d1Count !== originalD1Count) {
    throw new Error(
      `Duplicate D1 detected! Original: ${originalD1Count}, Current: ${d1Count}\n` +
      `FAILURE MODE: Update appended new D1 instead of replacing existing`
    );
  }
  assertions.push(`✓ No duplicate D1 (count: ${d1Count})`);

  // 4. ALL C1 blocks unchanged
  const verifyC1Blocks = verifyDoc.blocks.filter(b => b.type === 'code');
  if (verifyC1Blocks.length !== originalC1Blocks.length) {
    throw new Error(`C1 count changed! Expected ${originalC1Blocks.length}, got ${verifyC1Blocks.length}`);
  }

  for (let i = 0; i < originalC1Blocks.length; i++) {
    const originalC1 = originalC1Blocks[i];
    const verifyC1 = verifyC1Blocks.find(c => c.id === originalC1.id);
    
    if (!verifyC1) {
      throw new Error(`C1 block ID ${originalC1.id} missing after update!`);
    }

    const originalC1Json = JSON.stringify(originalC1);
    const verifyC1Json = JSON.stringify(verifyC1);
    
    if (originalC1Json !== verifyC1Json) {
      throw new Error(`C1[${i}] (${originalC1.id}) was modified unexpectedly!`);
    }
  }
  assertions.push(`✓ All ${originalC1Blocks.length} C1 blocks unchanged`);

  // 5. Document structure preserved
  console.log(`  Total blocks: ${verifyDoc.blocks.length}`);
  console.log(`  Block 0: ${verifyDoc.blocks[0].type} (${verifyDoc.blocks[0].version})`);
  console.log(`  Block 0 ID: ${verifyDoc.blocks[0].id}`);
  
  for (let i = 1; i < verifyDoc.blocks.length; i++) {
    console.log(`  Block ${i}: ${verifyDoc.blocks[i].type} (${verifyDoc.blocks[i].version})`);
    console.log(`  Block ${i} ID: ${verifyDoc.blocks[i].id}`);
  }

  console.log(`\n✅ [PASS] Full Document Integrity Verified`);
  assertions.forEach(a => console.log(`   ${a}`));
  console.log();

  // Restore original
  console.log('Restoring original document...');
  await saveDocument(originalDocument);
  const restored = await getDocument();
  if (JSON.stringify(restored) !== JSON.stringify(originalDocument)) {
    throw new Error('Failed to restore original document');
  }
  console.log('✅ Original document restored\n');
}

test().then(() => {
  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ FULL DOCUMENT INTEGRITY TEST PASSED');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\nVerified Original Bug Fix:');
  console.log('  ✓ Update D1 does NOT append duplicate D1');
  console.log('  ✓ Update D1 preserves block count');
  console.log('  ✓ Update D1 preserves D1 ID');
  console.log('  ✓ Update D1 changes D1 content');
  console.log('  ✓ Update D1 preserves ALL C1 blocks unchanged');
  console.log('  ✓ Document structure [D1, C1, ...] preserved\n');
  process.exit(0);
}).catch((error) => {
  console.error(`\n❌ [FAIL] ${error.message}\n`);
  
  // Try to restore original on failure
  if (originalDocument && tutorialId) {
    console.log('Attempting to restore original document...');
    saveDocument(originalDocument).then(() => {
      console.log('✅ Original document restored after failure\n');
      process.exit(1);
    }).catch(() => {
      console.error('⚠️  Failed to restore original document\n');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
