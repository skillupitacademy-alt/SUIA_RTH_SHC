#!/usr/bin/env node
/**
 * Generate corrected M1 snapshot after P0 fixes
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FilesystemRepositoryAdapter } from '../../packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../../packages/project-llm-discovery/src/snapshot/index.js';

const REPO_ROOT = resolve(process.cwd());
const OUTPUT_PATH = resolve(REPO_ROOT, '.agents/tasks/m1-snapshot-corrected.json');

async function main() {
  console.log('Generating corrected M1 snapshot...');
  console.log(`Repository root: ${REPO_ROOT}`);

  const adapter = new FilesystemRepositoryAdapter(REPO_ROOT);

  try {
    console.log('Running M1 pipeline (D1-D6 scanners + D7 snapshot builder)...');
    const snapshot = await buildSnapshot(REPO_ROOT, adapter);

    // Write to file
    console.log(`Writing snapshot to ${OUTPUT_PATH}...`);
    await writeFile(OUTPUT_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');

    console.log('✅ Corrected snapshot generated successfully!');
    console.log('\nKey metrics:');
    console.log(`  Unit test suites: ${snapshot.tests.unit.length}`);
    console.log(`  Integration test suites: ${snapshot.tests.integration.length}`);
    console.log(`  E2E test suites: ${snapshot.tests.e2e.length}`);
    console.log(`  Documented blocks: ${snapshot.blocks.documented.length} families`);
    console.log(`  Implemented blocks: ${snapshot.blocks.implemented.length}`);
    console.log(`  Rendered blocks: ${snapshot.blocks.rendered.length}`);
    console.log(`  Verified blocks: ${snapshot.blocks.verified.length}`);
    console.log(`  Canonical hash: ${snapshot.canonicalHash}`);

    // Check integration test count
    if (snapshot.tests.integration.length >= 1) {
      console.log('\n✅ P0-3 FIX VERIFIED: Integration test suites >= 1');
    } else {
      console.log('\n❌ P0-3 FIX FAILED: Integration test suites still 0');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating snapshot:', error);
    process.exit(1);
  }
}

main();
