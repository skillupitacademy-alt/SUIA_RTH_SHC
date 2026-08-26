#!/usr/bin/env node

/**
 * Tutorial Composer Prompt Architecture Assurance
 *
 * Verifies that common AI prompt infrastructure is centralized
 * and that individual block prompts contain only block-specific
 * contracts.
 *
 * READ-ONLY.
 *
 * No database writes.
 * No source modifications.
 */

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

const BASE =
  'apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content';

const files = {
  context: path.join(
    PROJECT_ROOT,
    BASE,
    'prompts/tutorialPromptContext.ts'
  ),

  shared: path.join(
    PROJECT_ROOT,
    BASE,
    'prompts/tutorialPrompt.shared.ts'
  ),

  container: path.join(
    PROJECT_ROOT,
    BASE,
    'components/AiInstructionContainer.tsx'
  ),

  composer: path.join(
    PROJECT_ROOT,
    BASE,
    'components/TutorialPageContentBuilderClient.tsx'
  ),

  definition: path.join(
    PROJECT_ROOT,
    BASE,
    'blocks/definition/D1/definitionD1.prompt.ts'
  ),

  code: path.join(
    PROJECT_ROOT,
    BASE,
    'blocks/code/C1/codeC1.prompt.ts'
  ),

  summary: path.join(
    PROJECT_ROOT,
    BASE,
    'blocks/summary/S1/summaryS1.prompt.ts'
  ),
};

const failures = [];
const warnings = [];

function fileExists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function lineCount(file) {
  return read(file).split(/\r?\n/).length;
}

function pass(message) {
  console.log(`✅ [PASS] ${message}`);
}

function fail(message) {
  console.error(`❌ [FAIL] ${message}`);
  failures.push(message);
}

function warn(message) {
  console.warn(`⚠️  [WARN] ${message}`);
  warnings.push(message);
}

function check(condition, message) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

console.log('');
console.log('='.repeat(72));
console.log('TUTORIAL COMPOSER — SHARED PROMPT ARCHITECTURE ASSURANCE');
console.log('='.repeat(72));
console.log('');

/* ============================================================
 * 1. FILE EXISTENCE
 * ========================================================== */

console.log('1. Shared infrastructure files');

check(
  fileExists(files.context),
  'Shared TutorialPromptContext exists'
);

check(
  fileExists(files.shared),
  'Shared tutorial prompt builder exists'
);

check(
  fileExists(files.container),
  'AiInstructionContainer exists'
);

check(
  fileExists(files.composer),
  'TutorialPageContentBuilderClient exists'
);

/* ============================================================
 * 2. SHARED CONTEXT
 * ========================================================== */

console.log('');
console.log('2. Shared context contract');

if (fileExists(files.context)) {
  const context = read(files.context);

  check(
    context.includes('export interface TutorialPromptContext'),
    'TutorialPromptContext is exported'
  );

  for (const field of [
    'domainName',
    'subjectName',
    'topicName',
    'subtopicName',
    'navigationNodeName',
    'blockName',
    'versionName',
  ]) {
    check(
      context.includes(`${field}:`),
      `Shared context contains ${field}`
    );
  }
}

/* ============================================================
 * 3. SHARED HIERARCHY BUILDER
 * ========================================================== */

console.log('');
console.log('3. Shared hierarchy builder');

if (fileExists(files.shared)) {
  const shared = read(files.shared);

  check(
    shared.includes('buildTargetHierarchy'),
    'buildTargetHierarchy exists'
  );

  check(
    shared.includes('buildTutorialPromptHeader'),
    'buildTutorialPromptHeader exists'
  );

  check(
    shared.includes('Navigation Node:'),
    'Navigation Node is defined centrally'
  );

  check(
    shared.includes('buildProhibitedSystemMetadata'),
    'Prohibited metadata builder exists'
  );

  check(
    shared.includes('navigationNodeId'),
    'navigationNodeId is centrally protected'
  );

  check(
    shared.includes('sectionId'),
    'sectionId is centrally protected'
  );

  check(
    shared.includes('blockId'),
    'blockId is centrally protected'
  );

  check(
    shared.includes('buildTutorialPrompt'),
    'Complete shared prompt builder exists'
  );
}

/* ============================================================
 * 4. BLOCK PROMPTS MUST USE SHARED BUILDER
 * ========================================================== */

console.log('');
console.log('4. Block prompt integration');

const blockPrompts = [
  ['D1 Definition', files.definition],
  ['C1 Code', files.code],
  ['S1 Summary', files.summary],
];

for (const [name, file] of blockPrompts) {
  if (!fileExists(file)) {
    fail(`${name} prompt file does not exist`);
    continue;
  }

  const content = read(file);

  check(
    content.includes('tutorialPromptContext'),
    `${name} imports shared TutorialPromptContext`
  );

  check(
    content.includes('tutorialPrompt.shared'),
    `${name} imports shared prompt builder`
  );

  check(
    content.includes('buildTutorialPrompt'),
    `${name} uses buildTutorialPrompt`
  );

  check(
    !content.includes('interface PromptContext'),
    `${name} does not define duplicate PromptContext`
  );

  check(
    !content.includes('# TARGET HIERARCHY'),
    `${name} does not duplicate TARGET HIERARCHY`
  );

  check(
    !content.includes('Do NOT include id, blockId, navigationNodeId'),
    `${name} does not duplicate prohibited metadata block`
  );
}

/* ============================================================
 * 5. AI CONTAINER
 * ========================================================== */

console.log('');
console.log('5. AiInstructionContainer integration');

if (fileExists(files.container)) {
  const container = read(files.container);

  check(
    container.includes('TutorialPromptContext'),
    'AiInstructionContainer uses shared TutorialPromptContext'
  );

  check(
    container.includes('navigationNodeName'),
    'AiInstructionContainer receives navigationNodeName'
  );

  check(
    container.includes('buildTutorialPrompt'),
    'AiInstructionContainer uses shared fallback builder'
  );

  check(
    container.includes('getDefinitionD1Prompt'),
    'AiInstructionContainer dispatches D1'
  );

  check(
    container.includes('getCodeC1Prompt'),
    'AiInstructionContainer dispatches C1'
  );

  check(
    container.includes('getSummaryS1Prompt'),
    'AiInstructionContainer dispatches S1'
  );
}

/* ============================================================
 * 6. COMPOSER SOURCE OF NAVIGATION NAME
 * ========================================================== */

console.log('');
console.log('6. Composer navigation context');

if (fileExists(files.composer)) {
  const composer = read(files.composer);

  check(
    composer.includes('useTutorialNavigationNodes'),
    'Composer obtains navigation nodes through navigation hook'
  );

  check(
    composer.includes('navigationNodes.find'),
    'Composer resolves selected navigation node'
  );

  check(
    composer.includes('navigationNodeName'),
    'Composer passes navigationNodeName to AI container'
  );

  check(
    composer.includes('form.navigationNodeId'),
    'Composer retains navigationNodeId as system identity'
  );
}

/* ============================================================
 * 7. SECURITY / IDENTITY SEPARATION
 * ========================================================== */

console.log('');
console.log('7. Identity separation');

if (fileExists(files.shared)) {
  const shared = read(files.shared);

  check(
    shared.includes('navigationNodeId'),
    'navigationNodeId is treated as protected metadata'
  );

  check(
    shared.includes('sectionId'),
    'sectionId is treated as protected metadata'
  );

  check(
    shared.includes('blockId'),
    'blockId is treated as protected metadata'
  );

  check(
    shared.includes('subtopicId'),
    'subtopicId is treated as protected metadata'
  );
}

/* ============================================================
 * 8. NO DATABASE IDs IN GENERATED PROMPT CONTEXT
 * ========================================================== */

console.log('');
console.log('8. Prompt context safety');

if (fileExists(files.context)) {
  const context = read(files.context);

  check(
    !context.includes('navigationNodeId: string'),
    'TutorialPromptContext does not expose navigationNodeId'
  );

  check(
    !context.includes('sectionId: string'),
    'TutorialPromptContext does not expose sectionId'
  );

  check(
    !context.includes('blockId: string'),
    'TutorialPromptContext does not expose blockId'
  );
}

/* ============================================================
 * 9. FILE SIZE
 * ========================================================== */

console.log('');
console.log('9. File size compliance');

for (const [name, file] of Object.entries(files)) {
  if (!fileExists(file)) {
    continue;
  }

  const lines = lineCount(file);

  check(
    lines <= 600,
    `${name} is <= 600 lines (${lines})`
  );
}

/* ============================================================
 * SUMMARY
 * ========================================================== */

console.log('');
console.log('='.repeat(72));

if (failures.length === 0) {
  console.log('✅ SHARED PROMPT ARCHITECTURE ASSURANCE PASS');
  console.log('');
  console.log('Verified:');
  console.log('  ✓ One authoritative TutorialPromptContext');
  console.log('  ✓ One authoritative hierarchy builder');
  console.log('  ✓ One authoritative prohibited-metadata rule');
  console.log('  ✓ D1 uses shared prompt infrastructure');
  console.log('  ✓ C1 uses shared prompt infrastructure');
  console.log('  ✓ S1 uses shared prompt infrastructure');
  console.log('  ✓ Navigation Node remains human-readable AI context');
  console.log('  ✓ navigationNodeId remains protected system metadata');
  console.log('  ✓ sectionId remains protected system metadata');
  console.log('  ✓ blockId remains protected system metadata');
  console.log('  ✓ No duplicate PromptContext definitions');
  console.log('  ✓ No duplicated TARGET HIERARCHY blocks');
  console.log('  ✓ File-size rule satisfied');
  console.log('');

  if (warnings.length > 0) {
    console.log(`Warnings: ${warnings.length}`);
  }

  process.exitCode = 0;
} else {
  console.error('❌ SHARED PROMPT ARCHITECTURE ASSURANCE FAILED');
  console.error('');

  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exitCode = 1;
}
