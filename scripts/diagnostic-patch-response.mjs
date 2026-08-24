#!/usr/bin/env node

/**
 * DIAGNOSTIC: PATCH Response Boundary Test
 * 
 * This test identifies EXACTLY where the D1 update is lost:
 * 1. Original D1 title
 * 2. PATCH request payload D1 title
 * 3. PATCH response D1 title
 * 4. GET by tutorial ID D1 title
 * 5. GET by subtopic query D1 title
 * 
 * This will reveal whether the problem is:
 * - PATCH service/repository write path
 * - PATCH response serialization
 * - GET by ID read path
 * - GET by subtopic query path
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3007';
const ADMIN_EMAIL = 'admin@skillhubcore.in';
const ADMIN_PASSWORD = 'testing';
const TEST_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const BRAND_ID = 'shared';

let adminToken = '';
let tutorialId = null;

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   DIAGNOSTIC: PATCH RESPONSE BOUNDARY TEST               ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = response.headers.get('set-cookie');
  adminToken = setCookie?.match(/accessToken=([^;]+)/)?.[1];
  if (!adminToken) throw new Error('Login failed');
}

async function getDocumentBySubtopic() {
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=1`,
    {
      headers: { 'Cookie': `accessToken=${adminToken}` },
    }
  );
  const result = await response.json();
  if (!result.data?.[0]) throw new Error('No tutorial found');
  tutorialId = result.data[0].id;
  return result.data[0];
}

async function getDocumentById(id) {
  // Try direct ID endpoint if it exists
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections/${id}`,
    {
      headers: { 'Cookie': `accessToken=${adminToken}` },
    }
  );
  
  if (response.ok) {
    return await response.json();
  }
  
  // Fallback: query by subtopic and find matching ID
  const queryResponse = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections?subtopicId=${TEST_SUBTOPIC_ID}&brandId=${BRAND_ID}&limit=10`,
    {
      headers: { 'Cookie': `accessToken=${adminToken}` },
    }
  );
  const result = await queryResponse.json();
  const tutorial = result.data?.find(t => t.id === id);
  if (!tutorial) throw new Error(`Tutorial ${id} not found`);
  return { data: tutorial };
}

async function patchDocument(id, document) {
  const response = await fetch(
    `${BASE_URL}/api/tutorial-composer/sections/${id}`,
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
    throw new Error(`PATCH failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

function extractD1Title(tutorial) {
  const content = tutorial.content || tutorial.data?.content;
  const d1Block = content?.blocks?.find(b => b.type === 'definition');
  return d1Block?.content?.page?.title || 'NOT FOUND';
}

async function runDiagnostic() {
  console.log('[STEP 1] Login');
  await login();
  console.log('✅ Authenticated\n');

  console.log('[STEP 2] Get Original Document (by subtopic query)');
  const original = await getDocumentBySubtopic();
  const originalD1Title = extractD1Title(original);
  console.log(`Tutorial ID: ${tutorialId}`);
  console.log(`Original D1 Title: "${originalD1Title}"\n`);

  console.log('[STEP 3] Create PATCH Payload with New D1 Title');
  const timestamp = Date.now();
  const newD1Title = `DIAGNOSTIC TEST ${timestamp}`;
  
  const d1Block = original.content.blocks.find(b => b.type === 'definition');
  const updatedD1Content = {
    ...d1Block.content,
    page: {
      ...d1Block.content.page,
      title: newD1Title,
    },
  };

  const patchPayload = {
    ...original.content,
    blocks: [
      {
        ...d1Block,
        content: updatedD1Content,
      },
      ...original.content.blocks.slice(1),
    ],
  };

  console.log(`PATCH Payload D1 Title: "${newD1Title}"\n`);

  console.log('[STEP 4] Send PATCH Request');
  const patchResponse = await patchDocument(tutorialId, patchPayload);
  const patchResponseD1Title = extractD1Title(patchResponse);
  console.log(`HTTP Status: 200`);
  console.log(`PATCH Response D1 Title: "${patchResponseD1Title}"\n`);

  console.log('[STEP 5] GET by Tutorial ID');
  const getByIdResponse = await getDocumentById(tutorialId);
  const getByIdD1Title = extractD1Title(getByIdResponse);
  console.log(`GET by ID D1 Title: "${getByIdD1Title}"\n`);

  console.log('[STEP 6] GET by Subtopic Query');
  const getBySubtopicResponse = await getDocumentBySubtopic();
  const getBySubtopicD1Title = extractD1Title(getBySubtopicResponse);
  console.log(`GET by Subtopic D1 Title: "${getBySubtopicD1Title}"\n`);

  // Generate diagnostic table
  console.log('════════════════════════════════════════════════════════════');
  console.log('DIAGNOSTIC RESULTS');
  console.log('════════════════════════════════════════════════════════════\n');

  const results = [
    { stage: 'Original (before PATCH)', title: originalD1Title, expected: 'OLD' },
    { stage: 'PATCH Payload', title: newD1Title, expected: 'NEW' },
    { stage: 'PATCH Response', title: patchResponseD1Title, expected: 'NEW' },
    { stage: 'GET by Tutorial ID', title: getByIdD1Title, expected: 'NEW' },
    { stage: 'GET by Subtopic Query', title: getBySubtopicD1Title, expected: 'NEW' },
  ];

  let firstFailureStage = null;

  results.forEach((result, idx) => {
    const isCorrect = 
      (idx === 0 && result.title === originalD1Title) ||
      (idx > 0 && result.title === newD1Title);
    
    const status = isCorrect ? '✅' : '❌';
    console.log(`${status} ${result.stage}`);
    console.log(`   Title: "${result.title}"`);
    console.log(`   Expected: ${result.expected}`);
    
    if (!isCorrect && !firstFailureStage) {
      firstFailureStage = result.stage;
    }
  });

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS');
  console.log('════════════════════════════════════════════════════════════\n');

  if (!firstFailureStage) {
    console.log('✅ ALL STAGES PASS');
    console.log('   Update propagates correctly through all layers.\n');
  } else {
    console.log(`❌ FAILURE AT: ${firstFailureStage}\n`);
    
    if (firstFailureStage === 'PATCH Response') {
      console.log('ROOT CAUSE: PATCH service/repository write path');
      console.log('  - PATCH handler receives correct payload');
      console.log('  - PATCH handler returns old content');
      console.log('  - Problem: service.updateTutorialContent() or repository.updateTutorialContent()');
      console.log('\nINVESTIGATE:');
      console.log('  1. TutorialComposerService.updateTutorialContent()');
      console.log('  2. TutorialComposerRepository.updateTutorialContent()');
      console.log('  3. Database write operation');
      console.log('  4. Prisma/Drizzle transaction handling\n');
    } else if (firstFailureStage === 'GET by Tutorial ID') {
      console.log('ROOT CAUSE: GET by ID read path');
      console.log('  - PATCH correctly updates database');
      console.log('  - GET by ID returns stale data');
      console.log('  - Problem: repository.getTutorialById() or cache layer');
      console.log('\nINVESTIGATE:');
      console.log('  1. TutorialComposerRepository.getTutorialById()');
      console.log('  2. Query cache or connection pooling');
      console.log('  3. Transaction isolation level\n');
    } else if (firstFailureStage === 'GET by Subtopic Query') {
      console.log('ROOT CAUSE: GET by subtopic query path');
      console.log('  - PATCH correctly updates database');
      console.log('  - GET by ID returns correct data');
      console.log('  - GET by subtopic query returns stale data');
      console.log('  - Problem: query cache or index staleness');
      console.log('\nINVESTIGATE:');
      console.log('  1. TutorialComposerRepository query by (subtopicId, brandId)');
      console.log('  2. Database index on (subtopic_id, brand_id)');
      console.log('  3. Query result caching\n');
    }
  }

  // Restore original
  console.log('════════════════════════════════════════════════════════════');
  console.log('Restoring original document...');
  await patchDocument(tutorialId, original.content);
  const restored = await getDocumentBySubtopic();
  const restoredD1Title = extractD1Title(restored);
  
  if (restoredD1Title === originalD1Title) {
    console.log('✅ Original document restored\n');
  } else {
    console.log(`⚠️  Restoration mismatch: "${restoredD1Title}" vs "${originalD1Title}"\n`);
  }
}

runDiagnostic().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(`\n❌ Diagnostic failed: ${error.message}\n`);
  console.error(error.stack);
  process.exit(1);
});
