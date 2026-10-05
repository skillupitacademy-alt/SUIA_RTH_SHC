#!/usr/bin/env node
import { resolve } from 'node:path';
import { FilesystemRepositoryAdapter } from '../../packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.js';
import { scanTests } from '../../packages/project-llm-discovery/src/scanners/d6-tests-scanner.js';

const REPO_ROOT = resolve(process.cwd());

async function main() {
  console.log('Testing D6 scanner...');
  const adapter = new FilesystemRepositoryAdapter(REPO_ROOT);

  const result = await scanTests(adapter);

  console.log('\nResults:');
  console.log(`Unit suites: ${result.data.unit.length}`);
  console.log(`Integration suites: ${result.data.integration.length}`);
  console.log(`E2E suites: ${result.data.e2e.length}`);

  console.log('\nIntegration suites:');
  for (const suite of result.data.integration) {
    console.log(`  - ${suite.name} (${suite.testCount} tests) at ${suite.path}`);
  }

  console.log('\nFindings:');
  for (const finding of result.findings) {
    console.log(`  [${finding.severity}] ${finding.message}`);
  }
}

main().catch(console.error);
