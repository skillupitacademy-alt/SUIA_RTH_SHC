#!/usr/bin/env node
import { buildSnapshot, computeSnapshotHash } from '../../packages/project-llm-discovery/src/index.ts';
import { FilesystemRepositoryAdapter } from '../../packages/project-llm-discovery/src/index.ts';
import { writeFile } from 'fs/promises';

const repositoryRoot = process.cwd();
const outputPath = process.argv[2] || '.agents/tasks/m1-snapshot-final.json';

console.log('Regenerating M1 snapshot from HEAD...');
console.log('Repository root:', repositoryRoot);
console.log('Output path:', outputPath);

try {
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);
  
  // Build snapshot (includes canonical hash)
  const snapshot = await buildSnapshot(repositoryRoot, adapter);
  
  // Write to file
  await writeFile(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  
  console.log('✅ Snapshot generated successfully');
  console.log('Commit SHA:', snapshot.repository.commitSha);
  console.log('Canonical Hash:', snapshot.canonicalHash);
} catch (error) {
  console.error('❌ Snapshot generation failed:', error);
  process.exit(1);
}

