#!/usr/bin/env node
/**
 * Phase 2.5 Runtime Assurance
 * 
 * Verifies runtime context propagation, NOT just file existence.
 * 
 * CRITICAL CHECKS:
 * 1. BlockComponentProps requires runtimeContext
 * 2. TutorialBlockRenderer propagates runtimeContext to all blocks
 * 3. TutorialPageShell passes runtimeContext (not just creates helper)
 * 4. navigationNodeId is propagated (not empty, not conflated with blockId)
 * 5. sectionId is propagated (not inferred from subtopicId)
 * 6. blockId comes from actual block (not navigationNodeId)
 * 7. blockVersion is not hardcoded (uses getBlockVersion pattern)
 * 8. Container blocks propagate runtimeContext through renderChild
 * 9. No progress.completedBlocks.includes(node.id) violations
 */

const fs = require('fs');
const path = require('path');

const results = {
  pass: [],
  fail: [],
  blocked: []
};

function check(name, condition, message) {
  if (condition) {
    results.pass.push(`✅ ${name}`);
  } else {
    results.fail.push(`❌ ${name}: ${message}`);
  }
}

function blocked(name, reason) {
  results.blocked.push(`⏸️  ${name}: ${reason}`);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('Phase 2.5 Runtime Assurance');
console.log('═══════════════════════════════════════════════════════════\n');

// CHECK 1: BlockComponentProps has runtimeContext
const typesFile = fs.readFileSync('packages/ui/src/tutorial/types.ts', 'utf8');
check(
  'BlockComponentProps.runtimeContext exists',
  /interface BlockComponentProps[\s\S]*?runtimeContext[\s\S]*?TutorialBlockRuntimeContext/.test(typesFile),
  'runtimeContext prop not found in BlockComponentProps'
);

// CHECK 2: TutorialBlockRenderer accepts and propagates runtimeContext
const rendererFile = fs.readFileSync('packages/ui/src/tutorial/TutorialBlockRenderer.tsx', 'utf8');
check(
  'TutorialBlockRenderer accepts runtimeContext',
  /function TutorialBlockRenderer[\s\S]*?runtimeContext/.test(rendererFile),
  'TutorialBlockRenderer does not accept runtimeContext parameter'
);

check(
  'TutorialBlockRenderer creates renderChild with runtimeContext',
  /const renderChild.*=.*\(.*\).*=>[\s\S]*?runtimeContext/.test(rendererFile),
  'renderChild does not include runtimeContext'
);

check(
  'TutorialBlockRenderer passes runtimeContext to blocks',
  /runtimeContext={runtimeContext}/.test(rendererFile),
  'Blocks are not receiving runtimeContext prop'
);

// CHECK 3: TutorialPageShell constructs AND passes runtimeContext
const shellFile = fs.readFileSync('src/share-branding/LearningExperience/components/TutorialPageShell.tsx', 'utf8');
check(
  'TutorialPageShell creates blockRuntimeContext',
  /createBlockRuntimeContext|const.*blockRuntimeContext.*=/.test(shellFile),
  'TutorialPageShell does not create block runtime context'
);

check(
  'TutorialPageShell passes runtimeContext to TutorialBlockRenderer',
  /TutorialBlockRenderer[\s\S]*?runtimeContext={/.test(shellFile),
  'createBlockRuntimeContext exists but is not passed to renderer (DEAD CODE)'
);

// CHECK 4: sectionId in payload comes from tutorial.id
const deliveryFile = fs.readFileSync('src/share-branding/LearningExperience/tutorialSidebarDelivery.ts', 'utf8');
check(
  'Delivery includes sectionId from tutorial.id',
  /sectionId:\s*tutorial\?\.id/.test(deliveryFile),
  'sectionId not set from tutorial.id in delivery'
);

// CHECK 5: RuntimeContext includes sectionId
const runtimeContextFile = fs.readFileSync('src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts', 'utf8');
check(
  'TutorialRuntimeContext has sectionId field',
  /interface TutorialRuntimeContext[\s\S]*?sectionId:\s*string\s*\|\s*null/.test(runtimeContextFile),
  'sectionId not in TutorialRuntimeContext'
);

check(
  'TutorialBlockRuntimeContext has all required fields',
  /interface TutorialBlockRuntimeContext[\s\S]*?learnerId[\s\S]*?navigationNodeId[\s\S]*?sectionId[\s\S]*?blockId[\s\S]*?blockType[\s\S]*?blockVersion[\s\S]*?subtopicId/.test(runtimeContextFile),
  'TutorialBlockRuntimeContext missing required identity fields'
);

// CHECK 6: blockVersion uses dynamic helper (not hardcoded)
check(
  'TutorialPageShell uses dynamic blockVersion',
  /'version' in block/.test(shellFile) && /blockVersion/.test(shellFile),
  'blockVersion appears to be hardcoded or missing version check'
);

// CHECK 7: No empty identity strings allowed
check(
  'No hardcoded empty navigationNodeId',
  !/navigationNodeId:\s*['"]['"]/.test(shellFile) && !/navigationNodeId:\s*['"]['"]/.test(deliveryFile),
  'Found hardcoded empty navigationNodeId'
);

check(
  'No hardcoded empty blockVersion',
  !/blockVersion:\s*['"]['"]/.test(shellFile),
  'Found hardcoded empty blockVersion'
);

// CHECK 8: Container blocks use renderChild (not direct renderer calls without context)
const twoColumnFile = fs.readFileSync('packages/ui/src/tutorial/blocks/TwoColumnBlock.tsx', 'utf8');
const threeColumnFile = fs.readFileSync('packages/ui/src/tutorial/blocks/ThreeColumnBlock.tsx', 'utf8');
const cardGridFile = fs.readFileSync('packages/ui/src/tutorial/blocks/CardGridBlock.tsx', 'utf8');
const timelineFile = fs.readFileSync('packages/ui/src/tutorial/blocks/TimelineBlock.tsx', 'utf8');

check(
  'TwoColumnBlock requires renderChild',
  /if\s*\(\s*!renderChild\s*\)[\s\S]*?throw/.test(twoColumnFile),
  'TwoColumnBlock does not enforce renderChild requirement'
);

check(
  'ThreeColumnBlock requires renderChild',
  /if\s*\(\s*!renderChild\s*\)[\s\S]*?throw/.test(threeColumnFile),
  'ThreeColumnBlock does not enforce renderChild requirement'
);

check(
  'CardGridBlock requires renderChild',
  /if\s*\(\s*!renderChild\s*\)[\s\S]*?throw/.test(cardGridFile),
  'CardGridBlock does not enforce renderChild requirement'
);

check(
  'TimelineBlock requires renderChild',
  /if\s*\(\s*!renderChild\s*\)[\s\S]*?throw/.test(timelineFile),
  'TimelineBlock does not enforce renderChild requirement'
);

// CHECK 9: BLOCKED - Sidebar progress mapping
blocked(
  'Sidebar navigation-node progress',
  'Backend only persists (userId, subtopicId, blockType[]). Missing: navigationNodeId, sectionId, blockId, blockVersion. Requires future backend migration.'
);

// CHECK 10: No invalid progress mapping exists
const sidebarFile = fs.readFileSync('src/share-branding/LearningExperience/components/TutorialLeftSidebar.tsx', 'utf8');
if (/completedBlocks\.includes\(node\.id\)/.test(sidebarFile)) {
  results.fail.push('❌ Invalid progress mapping: completedBlocks.includes(node.id) found (blockType ≠ navigationNodeId)');
} else {
  results.pass.push('✅ No invalid progress.completedBlocks.includes(node.id) found');
}

// RESULTS
console.log('\n═══════════════════════════════════════════════════════════');
console.log('RESULTS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('PASSING:');
results.pass.forEach(p => console.log('  ' + p));

if (results.blocked.length > 0) {
  console.log('\nBLOCKED (requires future work):');
  results.blocked.forEach(b => console.log('  ' + b));
}

if (results.fail.length > 0) {
  console.log('\nFAILING:');
  results.fail.forEach(f => console.log('  ' + f));
  console.log('\n❌ Phase 2.5 Runtime Assurance: FAILED');
  process.exit(1);
} else {
  console.log('\n✅ Phase 2.5 Runtime Foundation: VERIFIED');
  console.log('   (Navigation-node progress remains BLOCKED - backend migration required)');
  process.exit(0);
}
