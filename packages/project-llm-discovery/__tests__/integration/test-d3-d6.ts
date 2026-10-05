/**
 * Integration test for D3-D6 scanners
 * 
 * Runs all 4 scanners on actual repository and validates:
 * - D3: 18 block families documented, 3 verified (I1, C1, D1)
 * - D4: 1 TutorialComposerService
 * - D5: 18+ package nodes, workspace dependency edges
 * - D6: Unit/integration/e2e test suites
 */

import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { scanRepositoryStructure } from '../../src/scanners/d1-structure-scanner.js';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';
import { scanComposer } from '../../src/scanners/d4-composer-scanner.js';
import { scanDependencies } from '../../src/scanners/d5-dependencies-scanner.js';
import { scanTests } from '../../src/scanners/d6-tests-scanner.js';

async function main(): Promise<void> {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log('🔍 Running D3-D6 scanners integration test...\n');

  // Step 1: Run D1 scanner to get structure data for D5
  console.log('📂 Running D1 scanner (structure)...');
  const structureResult = await scanRepositoryStructure(adapter);
  console.log(`   ✓ Found ${structureResult.data.applications.length} apps`);
  console.log(`   ✓ Found ${structureResult.data.packages.length} packages`);
  console.log(`   ✓ Found ${structureResult.data.services.length} services\n`);

  // Step 2: Run D3 scanner (blocks)
  console.log('📚 Running D3 scanner (blocks)...');
  const blocksResult = await scanBlocks(adapter);
  console.log(`   ✓ Documented: ${blocksResult.data.documented.length} families`);
  console.log(`   ✓ Implemented: ${blocksResult.data.implemented.length} blocks`);
  console.log(`   ✓ Rendered: ${blocksResult.data.rendered.length} components`);
  console.log(`   ✓ Verified: ${blocksResult.data.verified.length} blocks`);
  console.log(`   ✓ Discrepancies: ${blocksResult.data.discrepancies.length}\n`);

  // Step 3: Run D4 scanner (composer)
  console.log('🎼 Running D4 scanner (composer)...');
  const composerResult = await scanComposer(adapter);
  console.log(`   ✓ Services: ${composerResult.data.services.length}`);
  console.log(`   ✓ APIs: ${composerResult.data.apis.length}`);
  console.log(`   ✓ Schemas: ${composerResult.data.schemas.length}`);
  console.log(`   ✓ UI components: ${composerResult.data.ui.length}\n`);

  // Step 4: Run D5 scanner (dependencies)
  console.log('🔗 Running D5 scanner (dependencies)...');
  const dependenciesResult = await scanDependencies(adapter, structureResult.data);
  console.log(`   ✓ Nodes: ${dependenciesResult.data.nodes.length} packages`);
  console.log(`   ✓ Edges: ${dependenciesResult.data.edges.length} workspace dependencies\n`);

  // Step 5: Run D6 scanner (tests)
  console.log('🧪 Running D6 scanner (tests)...');
  const testsResult = await scanTests(adapter);
  console.log(`   ✓ Unit suites: ${testsResult.data.unit.length}`);
  console.log(`   ✓ Integration suites: ${testsResult.data.integration.length}`);
  console.log(`   ✓ E2E suites: ${testsResult.data.e2e.length}\n`);

  // Validation assertions
  console.log('✅ Validating results...\n');

  // Debug: print verified blocks
  console.log('📝 Verified blocks found:');
  for (const block of blocksResult.data.verified) {
    console.log(`   - ${block.blockType} ${block.version}`);
  }
  console.log();

  const assertions = [
    {
      name: 'D3: 18 documented block families',
      condition: blocksResult.data.documented.length === 18,
      actual: blocksResult.data.documented.length,
      expected: 18,
    },
    {
      name: 'D3: 3 verified blocks (I1, C1, D1)',
      condition: blocksResult.data.verified.length === 3,
      actual: blocksResult.data.verified.length,
      expected: 3,
    },
    {
      name: 'D4: 1 TutorialComposerService',
      condition: composerResult.data.services.length === 1,
      actual: composerResult.data.services.length,
      expected: 1,
    },
    {
      name: 'D5: 18+ package nodes',
      condition: dependenciesResult.data.nodes.length >= 18,
      actual: dependenciesResult.data.nodes.length,
      expected: '18+',
    },
    {
      name: 'D6: Unit test suites discovered',
      condition: testsResult.data.unit.length > 0,
      actual: testsResult.data.unit.length,
      expected: '>0',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const assertion of assertions) {
    if (assertion.condition) {
      console.log(`   ✅ ${assertion.name}`);
      passed++;
    } else {
      console.log(`   ❌ ${assertion.name}`);
      console.log(`      Expected: ${assertion.expected}, Got: ${assertion.actual}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.error('❌ Integration test failed\n');
    process.exit(1);
  }

  console.log('✅ Integration test passed\n');

  // Print detailed findings
  console.log('📋 Findings:\n');
  
  console.log('D3 Blocks:');
  for (const finding of blocksResult.findings) {
    console.log(`   [${finding.severity}] ${finding.message}`);
  }

  console.log('\nD4 Composer:');
  for (const finding of composerResult.findings) {
    console.log(`   [${finding.severity}] ${finding.message}`);
  }

  console.log('\nD5 Dependencies:');
  for (const finding of dependenciesResult.findings) {
    console.log(`   [${finding.severity}] ${finding.message}`);
  }

  console.log('\nD6 Tests:');
  for (const finding of testsResult.findings) {
    console.log(`   [${finding.severity}] ${finding.message}`);
  }
}

main().catch((error: unknown) => {
  console.error('❌ Integration test error:', error);
  process.exit(1);
});
