import { FilesystemRepositoryAdapter } from '../../src/adapters/index.js';
import { buildSnapshot } from '../../src/snapshot/index.js';

async function main() {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log('Running Determinism Test...');
  console.log('Building first snapshot...');
  const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
  
  console.log('Waiting 100ms to ensure different timestamps...');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Building second snapshot...');
  const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

  console.log('\n=== Determinism Verification ===');
  console.log(`Snapshot 1 Canonical Hash: ${snapshot1.canonicalHash}`);
  console.log(`Snapshot 2 Canonical Hash: ${snapshot2.canonicalHash}`);
  console.log(`Snapshot 1 Timestamp: ${snapshot1.repository.scanTimestamp}`);
  console.log(`Snapshot 2 Timestamp: ${snapshot2.repository.scanTimestamp}`);

  const timestampsDifferent = snapshot1.repository.scanTimestamp !== snapshot2.repository.scanTimestamp;
  const hashesIdentical = snapshot1.canonicalHash === snapshot2.canonicalHash;

  console.log('\n--- Results ---');
  console.log(`Timestamps different: ${timestampsDifferent ? '✓' : '✗'} (expected: true)`);
  console.log(`Canonical hashes identical: ${hashesIdentical ? '✓' : '✗'} (expected: true)`);

  if (timestampsDifferent && hashesIdentical) {
    console.log('\n✓ DETERMINISM TEST PASSED');
    console.log('Canonical hash is deterministic despite timestamp variance');
    process.exit(0);
  } else {
    console.log('\n✗ DETERMINISM TEST FAILED');
    if (!timestampsDifferent) {
      console.log('ERROR: Timestamps should be different between runs');
    }
    if (!hashesIdentical) {
      console.log('ERROR: Canonical hashes should be identical for same repository state');
      console.log('This indicates non-deterministic serialization or timestamp inclusion in hash');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Determinism test failed:', error);
  process.exit(1);
});
