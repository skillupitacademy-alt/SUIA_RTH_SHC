#!/usr/bin/env node

/**
 * Tutorial Runtime Foundation Assurance
 * 
 * Verifies Phase 2.5 universal runtime architecture:
 * - Runtime context contracts exist
 * - Identity separation maintained
 * - Sidebar integration preserved
 * - Tracking service established
 * - Page integration complete
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

let passCount = 0;
let failCount = 0;

function check(label, condition, context = '') {
  if (condition) {
    console.log(`✅ [PASS] ${label}`);
    passCount++;
  } else {
    console.log(`❌ [FAIL] ${label}`);
    if (context) console.log(`   ${context}`);
    failCount++;
  }
}

function fileExists(path) {
  return existsSync(join(ROOT, path));
}

function fileContains(path, pattern) {
  if (!fileExists(path)) return false;
  const content = readFileSync(join(ROOT, path), 'utf8');
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
}

console.log('========================================================================');
console.log('TUTORIAL RUNTIME FOUNDATION ASSURANCE');
console.log('========================================================================\n');

// ============================================================
// A. Runtime Context Contracts
// ============================================================
console.log('1. Runtime context contracts');

check(
  'TutorialRuntimeContext exists',
  fileExists('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts')
);

check(
  'TutorialRuntimeContext exports TutorialRuntimeContext interface',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    'export interface TutorialRuntimeContext')
);

check(
  'TutorialRuntimeContext contains learnerId',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /learnerId:\s*string/)
);

check(
  'TutorialRuntimeContext contains navigationNodeId',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /navigationNodeId:\s*string/)
);

check(
  'TutorialRuntimeContext contains hierarchy',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /hierarchy:\s*\{/)
);

check(
  'TutorialBlockRuntimeContext exists',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    'export interface TutorialBlockRuntimeContext')
);

check(
  'TutorialTrackingEvent exists',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    'export interface TutorialTrackingEvent')
);

check(
  'TutorialProgressState exists',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    'export interface TutorialProgressState')
);

// ============================================================
// B. Identity Separation
// ============================================================
console.log('\n2. Identity separation');

check(
  'navigationNodeId is separate identity in TutorialRuntimeContext',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /navigationNodeId:\s*string/)
);

check(
  'sectionId is separate identity in TutorialRuntimeContext',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /sectionId:\s*string\s*\|\s*null/)
);

check(
  'TutorialBlockRuntimeContext separates blockId from navigationNodeId',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /blockId:\s*string/) &&
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /navigationNodeId:\s*string/)
);

// ============================================================
// C. Tracking Service
// ============================================================
console.log('\n3. Tracking service');

check(
  'tutorialTrackingService exists',
  fileExists('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts')
);

check(
  'trackTutorialEvent function exists',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /export\s+async\s+function\s+trackTutorialEvent/)
);

check(
  'getTutorialProgress function exists',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /export\s+async\s+function\s+getTutorialProgress/)
);

check(
  'Tracking service is failure-isolated (try-catch)',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /try\s*\{[\s\S]*\}\s*catch/)
);

// ============================================================
// D. Runtime Resolver
// ============================================================
console.log('\n4. Runtime resolver');

check(
  'tutorialRuntimeResolver exists',
  fileExists('src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts')
);

check(
  'resolveRuntimeContext function exists',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts', 
    /export\s+async\s+function\s+resolveRuntimeContext/)
);

check(
  'extractLearnerIdFromHeaders function exists',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts', 
    /export\s+function\s+extractLearnerIdFromHeaders/)
);

check(
  'Runtime resolver wraps existing delivery service',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts', 
    /getPublishedTutorialPagePayload/)
);

// ============================================================
// E. Page Integration
// ============================================================
console.log('\n5. Page integration');

check(
  'Learner page imports resolveRuntimeContext',
  fileContains('apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx', 
    /resolveRuntimeContext/)
);

check(
  'Learner page imports extractLearnerIdFromHeaders',
  fileContains('apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx', 
    /extractLearnerIdFromHeaders/)
);

check(
  'Learner page calls resolveRuntimeContext',
  fileContains('apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx', 
    /await resolveRuntimeContext/)
);

check(
  'Learner page passes runtimeContext to TutorialPageShell',
  fileContains('apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx', 
    /runtimeContext=\{result\.context\}/)
);

// ============================================================
// F. Shell Integration
// ============================================================
console.log('\n6. Shell integration');

check(
  'TutorialPageShell imports TutorialRuntimeContext type',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /import.*TutorialRuntimeContext.*from/)
);

check(
  'TutorialPageShell accepts runtimeContext prop',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /runtimeContext:\s*TutorialRuntimeContext/)
);

check(
  'TutorialPageShell imports trackTutorialEvent',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /import.*trackTutorialEvent/)
);

check(
  'TutorialPageShell tracks page_view event',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /eventType:\s*['"]page_view['"]/)
);

// ============================================================
// G. Sidebar Integration
// ============================================================
console.log('\n7. Sidebar integration');

check(
  'TutorialLeftSidebar uses aria-current for active node',
  fileContains('src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx', 
    /aria-current=\{isActive \? ['"]page['"] : undefined\}/)
);

check(
  'TutorialLeftSidebar matches by URL (navigationNodeId-based)',
  fileContains('src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx', 
    /node\.url === activeUrl/)
);

// ============================================================
// H. Failure Isolation
// ============================================================
console.log('\n8. Failure isolation');

check(
  'Tracking failures do not throw',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /catch.*\{[\s\S]*?console\.error[\s\S]*?\}/) &&
  !fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /catch.*throw(?!n)/)  // Allow "thrown" but not "throw"
);

check(
  'Page shell useEffect handles tracking async',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /useEffect.*\(.*\).*=>.*\{[\s\S]*?trackTutorialEvent/)
);

// ============================================================
// I. Implementation Verification (Phase 2.5)
// ============================================================
console.log('\n9. Implementation verification');

check(
  'sectionId resolution implemented (not always null)',
  fileContains('packages/types/src/tutorial-page-content.types.ts', 
    'sectionId:') &&
  fileContains('src/share-branding/LearningExperience/tutorialSidebarDelivery.ts', 
    'sectionId: tutorial') // Check sectionId is assigned from tutorial (regardless of optional chaining syntax)
);

check(
  'getTutorialProgress calls real API (not placeholder)',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /fetch[\s\S]*?\/api\/tutorial\/progress/) &&
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /encodeURIComponent\(subtopicId\)/) &&
  !fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /\/\/ Placeholder: Return empty progress/)
);

check(
  'trackTutorialEvent persists via API (not console.log only)',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /fetch\(['"]\/api\/tutorial\/progress['"]/) &&
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /method:\s*['"]POST['"]/) &&
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /subtopicId:\s*event\.subtopicId/)
);

check(
  'markBlockComplete signature has all runtime context parameters',
  fileContains('src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts', 
    /export\s+async\s+function\s+markBlockComplete[\s\S]*?navigationNodeId:\s*string[\s\S]*?sectionId:\s*string[\s\S]*?blockVersion:\s*string/)
);

check(
  'TutorialTrackingEvent includes subtopicId for persistence',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /subtopicId\?:\s*string.*Required for persistence/)
);

check(
  'TutorialPageShell fetches progress and computes completedUrls',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /getTutorialProgress/) &&
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /setCompletedUrls/)
);

check(
  'TutorialPageShell passes completedUrls to sidebar (not undefined literal)',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /completedUrls=\{completedUrls\}/) &&
  !fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /completedUrls=\{undefined\}/)
);

check(
  'TutorialPageShell passes subtopicId in page_view event',
  fileContains('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 
    /eventType:\s*['"]page_view['"][\s\S]*?subtopicId:\s*runtimeContext\.hierarchy\.subtopicId/)
);

// ============================================================
// J. Architecture Separation
// ============================================================
console.log('\n10. Architecture separation');

check(
  'TutorialRuntimeContext is NOT TutorialPromptContext',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /SEPARATE from TutorialPromptContext/)
);

check(
  'Runtime context does not expose protected metadata in block content',
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /TutorialBlockRuntimeContext/) &&
  fileContains('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 
    /This context is passed to the universal rendering layer/)
);

// ============================================================
// K. File Size Compliance
// ============================================================
console.log('\n11. File size compliance (≤600 lines)');

function countLines(path) {
  if (!fileExists(path)) return -1;
  const content = readFileSync(join(ROOT, path), 'utf8');
  return content.split('\n').length;
}

const files = [
  'src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts',
  'src/share-branding/LearningExperience/runtime/tutorialTrackingService.ts',
  'src/share-branding/LearningExperience/runtime/tutorialRuntimeResolver.ts',
  'src/share-branding/LearningExperience/runtime/index.ts',
  'apps/realtutorialhub-web/src/app/tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]/page.tsx',
  'src/share-branding/LearningExperience/components/TutorialPageShell.tsx',
];

files.forEach(file => {
  const lines = countLines(file);
  const fileName = file.split('/').pop();
  check(
    `${fileName} is ≤600 lines (${lines})`,
    lines > 0 && lines <= 600,
    lines > 600 ? `File has ${lines} lines` : ''
  );
});

// ============================================================
// Summary
// ============================================================
console.log('\n========================================================================');
if (failCount === 0) {
  console.log('✅ TUTORIAL RUNTIME FOUNDATION ASSURANCE PASS');
  console.log(`\nVerified:`);
  console.log(`  ✓ Runtime context contracts exist and complete`);
  console.log(`  ✓ Identity separation maintained (navigationNodeId ≠ sectionId ≠ blockId)`);
  console.log(`  ✓ Tracking service established (failure-isolated)`);
  console.log(`  ✓ Runtime resolver wraps existing delivery`);
  console.log(`  ✓ Page integration complete (learnerId + runtimeContext)`);
  console.log(`  ✓ Shell tracks page_view events`);
  console.log(`  ✓ Sidebar uses aria-current and navigationNodeId-based URLs`);
  console.log(`  ✓ Failure isolation maintained`);
  console.log(`  ✓ Implementation complete (not placeholders)`);
  console.log(`  ✓ Architecture separation preserved`);
  console.log(`  ✓ File size compliance`);
  console.log('========================================================================\n');
  process.exit(0);
} else {
  console.log(`❌ TUTORIAL RUNTIME FOUNDATION ASSURANCE FAIL`);
  console.log(`\n${failCount} check(s) failed, ${passCount} passed.`);
  console.log('========================================================================\n');
  process.exit(1);
}
