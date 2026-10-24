#!/usr/bin/env ts-node
/**
 * Generate a complete repository snapshot and write to output/snapshot.json
 *
 * This file is consumed by the FastAPI backend (services/project-ai) at startup
 * and by the Engineering Contract generation pipeline.
 *
 * Usage: pnpm --filter @quiz/project-llm-discovery scan
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FilesystemRepositoryAdapter } from '../src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../src/snapshot/builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const repositoryRoot = resolve(join(__dirname, '..', '..', '..'));
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log(`[generate-snapshot] Repository root: ${repositoryRoot}`);
  console.log(`[generate-snapshot] Starting discovery scan...`);

  // Build snapshot with current HEAD
  const snapshot = await buildSnapshot(repositoryRoot, adapter);

  // Ensure output directory exists
  const outputDir = join(__dirname, '..', 'output');
  mkdirSync(outputDir, { recursive: true });

  // Write snapshot to file (consumed by FastAPI backend)
  const outputPath = join(outputDir, 'snapshot.json');
  const jsonContent = JSON.stringify(snapshot, null, 2);
  writeFileSync(outputPath, jsonContent, 'utf-8');

  console.log(`[generate-snapshot] ✓ Snapshot written to ${outputPath}`);
  console.log(`[generate-snapshot] ✓ Size: ${(jsonContent.length / 1024).toFixed(1)} KB`);
  console.log(`[generate-snapshot] ✓ Hash: ${snapshot.canonicalHash}`);
}

main().catch((error) => {
  console.error('[generate-snapshot] Snapshot generation failed:', error);
  process.exit(1);
});
