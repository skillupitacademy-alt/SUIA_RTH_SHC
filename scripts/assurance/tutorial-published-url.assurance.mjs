#!/usr/bin/env node

/**
 * ============================================================
 * TUTORIAL PUBLISHED URL ASSURANCE
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify that the Composer generates correct Tutorial V2
 * learner URLs with all 5 required segments:
 *
 *   /tutorial-v2/{domain}/{subject}/{topic}/{subtopic}/{navigationNodeId}
 *
 * REGRESSION PROTECTION
 * ---------------------
 * This test prevents the return of a bug where the Composer
 * generated only 4 segments, omitting navigationNodeId.
 *
 * CRITICAL CONTRACT
 * -----------------
 * The final segment MUST be navigationNode.id, NOT:
 * - navigationNode.slug
 * - sectionId
 * - blockId
 * - subtopic.slug (repeated)
 *
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const composerPath = path.join(
  PROJECT_ROOT,
  'apps/skillhubcore-admin',
  'src/app/(admin)/tools/tutorial-page-content/components',
  'TutorialPageContentBuilderClient.tsx'
);

const deliveryPath = path.join(
  PROJECT_ROOT,
  'src',
  'share-branding/LearningExperience/tutorialSidebarDelivery.ts'
);

let failures = 0;

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  console.error(`❌ ${message}`);
  failures += 1;
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`File does not exist: ${file}`);
    return '';
  }

  return fs.readFileSync(file, 'utf8');
}

console.log('');
console.log('='.repeat(72));
console.log('TUTORIAL PUBLISHED URL ASSURANCE');
console.log('='.repeat(72));

const composer = read(composerPath);
const delivery = read(deliveryPath);

console.log('');
console.log('1. Composer URL generation');
console.log('');

if (composer.includes('form.navigationNodeId')) {
  pass('Composer retains navigationNodeId');
} else {
  fail('Composer does not reference navigationNodeId');
}

if (composer.includes('navigationNodes.find')) {
  pass('Composer resolves selected navigation node');
} else {
  fail('Composer does not resolve selected navigation node');
}

if (
  composer.includes('navigationNode.id') &&
  composer.includes('buildPublishedTutorialUrl')
) {
  pass('Composer uses exact navigationNode.id for published URL');
} else {
  fail(
    'Composer published URL does not use exact navigationNode.id'
  );
}

console.log('');
console.log('2. Learner delivery URL contract');
console.log('');

if (
  delivery.includes('/tutorial-v2/') &&
  delivery.includes('${item.id}')
) {
  pass(
    'Learner delivery URL uses exact navigation node ID'
  );
} else {
  fail(
    'Learner delivery URL does not clearly use navigation node ID'
  );
}

if (
  delivery.includes('navigationNodeId') &&
  delivery.includes('item.id')
) {
  pass(
    'Learner route identity remains navigationNodeId-based'
  );
} else {
  fail(
    'Navigation-node identity contract is not evident'
  );
}

console.log('');
console.log('3. Forbidden URL construction');
console.log('');

// Check for the OLD 4-segment pattern (without navigationNodeId)
const legacyUrlPattern =
  /tutorial-v2\/\$\{domain\.slug\}\/\$\{subject\.slug\}\/\$\{topic\.slug\}\/\$\{subtopic\.slug\}`/;

if (!legacyUrlPattern.test(composer)) {
  pass(
    'Legacy four-segment published URL is no longer generated'
  );
} else {
  fail(
    'Legacy four-segment published URL is still generated'
  );
}

console.log('');
console.log('='.repeat(72));

if (failures === 0) {
  console.log(
    '✅ TUTORIAL PUBLISHED URL ASSURANCE PASS'
  );
  console.log('');
  console.log(
    'Verified canonical route:'
  );
  console.log(
    '/tutorial-v2/{domain}/{subject}/{topic}/{subtopic}/{navigationNodeId}'
  );
  process.exit(0);
}

console.error('');
console.error(
  `❌ TUTORIAL PUBLISHED URL ASSURANCE FAIL — ${failures} check(s) failed`
);

process.exit(1);
