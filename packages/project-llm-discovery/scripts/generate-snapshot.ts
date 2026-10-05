#!/usr/bin/env ts-node
/**
 * Generate a complete repository snapshot and output as JSON
 * Usage: npx ts-node scripts/generate-snapshot.ts
 */
import { FilesystemRepositoryAdapter } from '../src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../src/snapshot/builder.js';

async function main() {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  // Build snapshot with current HEAD
  const snapshot = await buildSnapshot(repositoryRoot, adapter);

  // Output as formatted JSON
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error('Snapshot generation failed:', error);
  process.exit(1);
});
