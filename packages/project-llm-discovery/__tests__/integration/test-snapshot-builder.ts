import { FilesystemRepositoryAdapter } from '../../src/adapters/index.js';
import { buildSnapshot } from '../../src/snapshot/index.js';

async function main() {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log('Running Snapshot Builder (D7)...');
  const snapshot = await buildSnapshot(repositoryRoot, adapter);

  console.log('\n=== Snapshot Builder Results ===');
  console.log(`Schema Version: ${snapshot.schemaVersion}`);
  console.log(`Repository: ${snapshot.repository.owner}/${snapshot.repository.name}`);
  console.log(`Commit SHA: ${snapshot.repository.commitSha}`);
  console.log(`Scan Timestamp: ${snapshot.repository.scanTimestamp}`);
  console.log(`Canonical Hash: ${snapshot.canonicalHash}`);

  console.log('\n--- Structure ---');
  console.log(`Applications: ${snapshot.structure.applications.length}`);
  console.log(`Packages: ${snapshot.structure.packages.length}`);
  console.log(`Services: ${snapshot.structure.services.length}`);

  console.log('\n--- Runtime ---');
  console.log(`Workspace Manager: ${snapshot.runtime.workspace.manager} v${snapshot.runtime.workspace.version}`);
  console.log(`Build System: ${snapshot.runtime.buildSystem.tool} v${snapshot.runtime.buildSystem.version}`);
  console.log(`Frameworks: ${snapshot.runtime.frameworks.length}`);

  console.log('\n--- Blocks ---');
  console.log(`Documented Families: ${snapshot.blocks.documented.length}`);
  console.log(`Implemented Blocks: ${snapshot.blocks.implemented.length}`);
  console.log(`Rendered Components: ${snapshot.blocks.rendered.length}`);
  console.log(`Verified Blocks: ${snapshot.blocks.verified.length}`);
  console.log(`Discrepancies: ${snapshot.blocks.discrepancies.length}`);

  console.log('\n--- Composer ---');
  console.log(`Services: ${snapshot.composer.services.length}`);
  console.log(`APIs: ${snapshot.composer.apis.length}`);
  console.log(`Schemas: ${snapshot.composer.schemas.length}`);
  console.log(`UI Components: ${snapshot.composer.ui.length}`);

  console.log('\n--- Dependencies ---');
  console.log(`Nodes: ${snapshot.dependencies.nodes.length}`);
  console.log(`Edges: ${snapshot.dependencies.edges.length}`);

  console.log('\n--- Tests ---');
  console.log(`Unit Test Suites: ${snapshot.tests.unit.length}`);
  console.log(`Integration Test Suites: ${snapshot.tests.integration.length}`);
  console.log(`E2E Test Suites: ${snapshot.tests.e2e.length}`);

  console.log('\n--- Evidence & Findings ---');
  console.log(`Evidence Records: ${snapshot.evidence.length}`);
  console.log(`Findings: ${snapshot.findings.length}`);

  console.log('\n\n=== Verification ===');
  
  const checks = [
    { name: 'Schema version is 1.0.0', pass: snapshot.schemaVersion === '1.0.0' },
    { name: 'Canonical hash is 64-char hex', pass: /^[a-f0-9]{64}$/.test(snapshot.canonicalHash) },
    { name: 'Evidence collected', pass: snapshot.evidence.length > 0 },
    { name: 'Commit SHA present', pass: snapshot.repository.commitSha.length > 0 },
    { name: 'Applications discovered', pass: snapshot.structure.applications.length > 0 },
    { name: 'Packages discovered', pass: snapshot.structure.packages.length > 0 },
    { name: 'Blocks documented', pass: snapshot.blocks.documented.length > 0 },
    { name: 'Composer services found', pass: snapshot.composer.services.length > 0 },
    { name: 'Dependencies graph built', pass: snapshot.dependencies.nodes.length > 0 },
    { name: 'Test suites discovered', pass: snapshot.tests.unit.length > 0 },
  ];

  let allPassed = true;
  for (const check of checks) {
    const status = check.pass ? '✓' : '✗';
    console.log(`${status} ${check.name}`);
    if (!check.pass) {
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n✓ ALL VERIFICATION CHECKS PASSED');
    process.exit(0);
  } else {
    console.log('\n✗ SOME VERIFICATION CHECKS FAILED');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
