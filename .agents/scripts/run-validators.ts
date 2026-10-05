#!/usr/bin/env tsx
/**
 * Run V1-V9 validators against a snapshot
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { RepositorySnapshot } from '../../packages/project-llm-discovery/src/contracts/snapshot.js';
import { FilesystemRepositoryAdapter } from '../../packages/project-llm-discovery/src/adapters/filesystem-repository-adapter.js';
import {
  validateSchema,
  validateReferenceIntegrity,
  validateEvidencePaths,
  validateBlockConsistency,
  validateComposer,
  validateDependencyGraph,
  validateTestReferences,
  validateEvidenceCompleteness,
  validateDeterminism,
  type ValidationResult,
} from '../../packages/project-llm-discovery/src/validation/index.js';
import { reconcileWithLegacyFixture } from '../../packages/project-llm-discovery/src/validation/fixture-reconciliation.js';

async function main() {
  const snapshotPath = process.argv[2];
  if (!snapshotPath) {
    console.error('Usage: tsx run-validators.ts <snapshot-path>');
    process.exit(1);
  }

  const absoluteSnapshotPath = resolve(snapshotPath);
  console.log(`Loading snapshot from: ${absoluteSnapshotPath}`);

  // Load snapshot
  const snapshotContent = readFileSync(absoluteSnapshotPath, 'utf-8')
    .replace(/^\uFEFF/, ''); // Remove BOM if present
  const snapshot: RepositorySnapshot = JSON.parse(snapshotContent);

  // Get repository root from snapshot
  const repositoryRoot = snapshot.repositoryRoot || process.cwd();
  const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

  console.log(`Repository root: ${repositoryRoot}\n`);

  // Run validators
  const validators = [
    { name: 'V1', label: 'Schema', fn: () => validateSchema(snapshot) },
    { name: 'V2', label: 'Reference Integrity', fn: () => validateReferenceIntegrity(snapshot) },
    { name: 'V3', label: 'Evidence Paths', fn: () => validateEvidencePaths(snapshot, adapter) },
    { name: 'V4', label: 'Block Consistency', fn: () => validateBlockConsistency(snapshot) },
    { name: 'V5', label: 'Composer', fn: () => validateComposer(snapshot) },
    { name: 'V6', label: 'Dependency Graph', fn: () => validateDependencyGraph(snapshot) },
    { name: 'V7', label: 'Test References', fn: () => validateTestReferences(snapshot, adapter) },
    { name: 'V8', label: 'Evidence Completeness', fn: () => validateEvidenceCompleteness(snapshot) },
    { name: 'V9', label: 'Determinism', fn: () => validateDeterminism(snapshot, repositoryRoot, adapter) },
  ];

  const results: Array<{ name: string; label: string; result: ValidationResult }> = [];

  for (const validator of validators) {
    console.log(`\n=== Running ${validator.name}: ${validator.label} ===`);
    try {
      const rawResult = await validator.fn();
      // Some validators return { errors, warnings } without valid flag
      const result: ValidationResult = {
        valid: rawResult.errors.length === 0,
        errors: rawResult.errors,
        warnings: rawResult.warnings,
      };
      results.push({ name: validator.name, label: validator.label, result });

      const status = result.valid ? '✓ PASS' : '✗ FAIL';
      console.log(`Status: ${status}`);
      console.log(`Errors: ${result.errors.length}`);
      console.log(`Warnings: ${result.warnings.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach((err, idx) => {
          console.log(`  ${idx + 1}. [${err.code}] ${err.message}`);
          if (err.path) console.log(`     Path: ${err.path}`);
          if (err.details) console.log(`     Details: ${JSON.stringify(err.details)}`);
        });
      }

      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        result.warnings.forEach((warn, idx) => {
          console.log(`  ${idx + 1}. [${warn.code}] ${warn.message}`);
          if (warn.path) console.log(`     Path: ${warn.path}`);
        });
      }
    } catch (error) {
      console.error(`ERROR running ${validator.name}:`, error);
      results.push({
        name: validator.name,
        label: validator.label,
        result: {
          valid: false,
          errors: [
            {
              validator: validator.name,
              code: 'VALIDATOR_ERROR',
              message: error instanceof Error ? error.message : String(error),
            },
          ],
          warnings: [],
        },
      });
    }
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log('| Validator | Status | Errors | Warnings |');
  console.log('|-----------|--------|--------|----------|');
  results.forEach(({ name, result }) => {
    const status = result.valid ? 'PASS' : 'FAIL';
    console.log(`| ${name.padEnd(9)} | ${status.padEnd(6)} | ${String(result.errors.length).padEnd(6)} | ${String(result.warnings.length).padEnd(8)} |`);
  });

  const totalErrors = results.reduce((sum, r) => sum + r.result.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.result.warnings.length, 0);
  console.log(`\nTotal: ${totalErrors} errors, ${totalWarnings} warnings`);

  // Fixture reconciliation
  console.log('\n\n=== FIXTURE RECONCILIATION ===');
  try {
    const reconciliation = await reconcileWithLegacyFixture(snapshot, adapter);
    const matches = reconciliation.filter((r) => r.status === 'MATCH').length;
    const discrepancies = reconciliation.filter((r) => r.status === 'DISCREPANCY').length;
    const unknown = reconciliation.filter((r) => r.status === 'UNKNOWN').length;

    console.log(`Matches: ${matches}`);
    console.log(`Discrepancies: ${discrepancies}`);
    console.log(`Unknown: ${unknown}`);

    if (discrepancies > 0) {
      console.log('\nDiscrepancies:');
      reconciliation
        .filter((r) => r.status === 'DISCREPANCY')
        .forEach((r, idx) => {
          console.log(`  ${idx + 1}. ${r.claim}`);
          if (r.notes) console.log(`     ${r.notes}`);
        });
    }

    const overallStatus = discrepancies === 0 && unknown === 0 ? 'MATCH' : 'MISMATCH';
    console.log(`\nOverall fixture reconciliation: ${overallStatus}`);
  } catch (error) {
    console.error('Error during fixture reconciliation:', error);
  }

  // Exit with error if any validator failed
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
