/**
 * M2 Phase 7: Full Test/Validation Gate
 * 
 * Validates the complete M2 pipeline end-to-end:
 * - All scanners execute successfully
 * - All validators (V1-V9) pass
 * - Evidence integrity (no broken bindings, no conflicts)
 * - Determinism verification
 */

import { describe, it, expect } from 'vitest';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../../src/snapshot/builder.js';
import { validateSnapshot } from '../../src/validation/index.js';
import type { ValidationResult } from '../../src/contracts/validation.js';

describe('M2 Phase 7: Full Test/Validation Gate', () => {
  it('should validate complete M2 pipeline', { timeout: 120000 }, async () => {
    // Determine workspace root
    const packagePath = process.cwd().replace(/\\/g, '/');
    const workspaceRoot = packagePath.includes('/packages/project-llm-discovery')
      ? packagePath.replace('/packages/project-llm-discovery', '')
      : packagePath;
    
    const adapter = new FilesystemRepositoryAdapter(workspaceRoot);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  M2 PHASE 7: FULL TEST/VALIDATION GATE        ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`Workspace: ${workspaceRoot}\n`);

    // ═══════════════════════════════════════════════════
    // STEP 1: Run Full Discovery Scan
    // ═══════════════════════════════════════════════════
    console.log('═══ STEP 1: Full Discovery Scan ═══\n');
    
    const startTime = Date.now();
    const snapshot = await buildSnapshot(workspaceRoot, adapter);
    const scanDuration = Date.now() - startTime;

    console.log(`✓ Discovery scan completed in ${scanDuration}ms`);
    console.log(`  Applications: ${snapshot.structure?.applications?.length || 0}`);
    console.log(`  Packages: ${snapshot.structure?.packages?.length || 0}`);
    console.log(`  Blocks: ${snapshot.blocks?.implemented?.length || 0} implementations, ${snapshot.blocks?.rendered?.length || 0} renderers`);
    console.log(`  Composer: ${snapshot.composer?.services?.length || 0} services, ${snapshot.composer?.apis?.length || 0} APIs, ${snapshot.composer?.schemas?.length || 0} schemas`);
    console.log(`  Dependencies: ${snapshot.dependencies?.nodes?.length || 0} nodes, ${snapshot.dependencies?.edges?.length || 0} edges`);
    console.log(`  Evidence: ${snapshot.evidence?.length || 0} records`);
    console.log(`  Findings: ${snapshot.findings?.length || 0} total\n`);

    // ═══════════════════════════════════════════════════
    // STEP 2: Run All Validators (V1-V9)
    // ═══════════════════════════════════════════════════
    console.log('═══ STEP 2: Validator Execution ═══\n');

    const validationResult = await validateSnapshot(snapshot, adapter);

    // Count by severity
    const errorCount = validationResult.errors?.length || 0;
    const warningCount = validationResult.warnings?.length || 0;
    const infoCount = 0; // No separate info array in ValidationResult

    console.log(`Validation Status: ${validationResult.valid ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Warnings: ${warningCount}\n`);

    // Display validator-specific results
    const validatorResults = new Map<string, { errors: number; warnings: number }>();
    for (const error of (validationResult.errors || [])) {
      const validatorId = error.validator || 'unknown';
      const existing = validatorResults.get(validatorId) || { errors: 0, warnings: 0 };
      existing.errors++;
      validatorResults.set(validatorId, existing);
    }
    for (const warning of (validationResult.warnings || [])) {
      const validatorId = warning.validator || 'unknown';
      const existing = validatorResults.get(validatorId) || { errors: 0, warnings: 0 };
      existing.warnings++;
      validatorResults.set(validatorId, existing);
    }

    console.log('Validator Breakdown:');
    const expectedValidators = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'];
    for (const vid of expectedValidators) {
      const result = validatorResults.get(vid) || { errors: 0, warnings: 0 };
      const status = result.errors === 0 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${vid}: ${status} (${result.errors} errors, ${result.warnings} warnings)`);
    }
    console.log();

    // ═══════════════════════════════════════════════════
    // STEP 3: Evidence Integrity
    // ═══════════════════════════════════════════════════
    console.log('═══ STEP 3: Evidence Integrity ═══\n');

    // Check for duplicate evidence IDs
    const evidenceIds = new Map<string, number>();
    for (const ev of snapshot.evidence) {
      evidenceIds.set(ev.evidenceId, (evidenceIds.get(ev.evidenceId) || 0) + 1);
    }
    const duplicateIds = Array.from(evidenceIds.entries()).filter(([_, count]) => count > 1);

    console.log(`Total evidence: ${snapshot.evidence.length}`);
    console.log(`Unique IDs: ${evidenceIds.size}`);
    console.log(`Duplicate IDs: ${duplicateIds.length}`);

    // Check for broken bindings (evidenceId references that don't resolve)
    const validEvidenceIds = new Set(snapshot.evidence.map(e => e.evidenceId));
    const brokenBindings: string[] = [];

    const checkEntity = (entity: any, entityType: string) => {
      if (entity.evidenceId && !validEvidenceIds.has(entity.evidenceId)) {
        brokenBindings.push(`${entityType}: evidenceId=${entity.evidenceId}`);
      }
    };

    (snapshot.structure?.applications || []).forEach(app => checkEntity(app, 'Application'));
    (snapshot.structure?.packages || []).forEach(pkg => checkEntity(pkg, 'Package'));
    (snapshot.blocks?.implemented || []).forEach(impl => checkEntity(impl, 'BlockImplementation'));
    (snapshot.blocks?.rendered || []).forEach(rend => checkEntity(rend, 'BlockRenderer'));
    (snapshot.composer?.services || []).forEach(svc => checkEntity(svc, 'ComposerService'));
    (snapshot.composer?.apis || []).forEach(api => checkEntity(api, 'ComposerAPI'));
    (snapshot.composer?.schemas || []).forEach(schema => checkEntity(schema, 'ComposerSchema'));
    (snapshot.composer?.ui || []).forEach(ui => checkEntity(ui, 'ComposerUI'));
    (snapshot.dependencies?.nodes || []).forEach(node => checkEntity(node, 'DependencyNode'));
    (snapshot.dependencies?.edges || []).forEach(edge => checkEntity(edge, 'DependencyEdge'));

    console.log(`Broken bindings: ${brokenBindings.length}`);

    // Count orphaned evidence (evidence not referenced by any entity)
    const referencedIds = new Set<string>();
    const collectId = (entity: any) => {
      if (entity.evidenceId) referencedIds.add(entity.evidenceId);
    };

    (snapshot.structure?.applications || []).forEach(collectId);
    (snapshot.structure?.packages || []).forEach(collectId);
    (snapshot.blocks?.implemented || []).forEach(collectId);
    (snapshot.blocks?.rendered || []).forEach(collectId);
    (snapshot.composer?.services || []).forEach(collectId);
    (snapshot.composer?.apis || []).forEach(collectId);
    (snapshot.composer?.schemas || []).forEach(collectId);
    (snapshot.composer?.ui || []).forEach(collectId);
    (snapshot.dependencies?.nodes || []).forEach(collectId);
    (snapshot.dependencies?.edges || []).forEach(collectId);

    const orphanedEvidence = snapshot.evidence.filter(e => !referencedIds.has(e.evidenceId));
    console.log(`Orphaned evidence: ${orphanedEvidence.length} (expected: directories, toolchain, documentation)`);
    console.log();

    // ═══════════════════════════════════════════════════
    // STEP 4: Determinism Verification
    // ═══════════════════════════════════════════════════
    console.log('═══ STEP 4: Determinism Verification ═══\n');

    console.log('Building second snapshot for determinism check...');
    const snapshot2 = await buildSnapshot(workspaceRoot, adapter);

    const hash1 = snapshot.canonicalHash;
    const hash2 = snapshot2.canonicalHash;
    const deterministic = hash1 === hash2;

    console.log(`Snapshot 1 hash: ${hash1}`);
    console.log(`Snapshot 2 hash: ${hash2}`);
    console.log(`Determinism: ${deterministic ? '✓ PASS' : '✗ FAIL'}`);
    console.log();

    // ═══════════════════════════════════════════════════
    // STEP 5: Test Assertions
    // ═══════════════════════════════════════════════════
    console.log('═══ STEP 5: Test Assertions ═══\n');

    // Assert: No validation errors
    expect(errorCount, `Validation should have 0 errors, found ${errorCount}`).toBe(0);

    // Assert: No broken bindings
    expect(brokenBindings, `Should have no broken evidence bindings, found ${brokenBindings.length}`).toEqual([]);

    // Assert: No duplicate evidence IDs
    expect(duplicateIds, `Should have no duplicate evidence IDs, found ${duplicateIds.length}`).toEqual([]);

    // Assert: Deterministic
    expect(deterministic, 'Snapshot should be deterministic (same hash on repeated scans)').toBe(true);

    // Assert: Evidence count is reasonable
    expect(snapshot.evidence?.length || 0).toBeGreaterThan(100); // M2 should have 150+ evidence records

    // Assert: Applications discovered
    expect(snapshot.structure?.applications?.length || 0).toBeGreaterThan(5); // Should have 10+ apps

    // Assert: Blocks discovered
    expect(snapshot.blocks?.implemented?.length || 0).toBeGreaterThan(10); // Should have 13+ block implementations

    // Assert: Composer APIs discovered
    expect(snapshot.composer?.apis?.length || 0).toBeGreaterThan(5); // Should have 9+ API routes

    // Assert: Dependencies discovered
    expect(snapshot.dependencies?.nodes?.length || 0).toBeGreaterThan(50); // Should have 100+ dependency nodes

    console.log('✓ All assertions passed\n');

    // ═══════════════════════════════════════════════════
    // STEP 6: Test Summary
    // ═══════════════════════════════════════════════════
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  M2 PHASE 7 TEST GATE: ✓ PASS                 ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`Discovery: ${scanDuration}ms`);
    console.log(`Validation: ${validationResult.valid ? 'PASS' : 'FAIL'} (${errorCount} errors, ${warningCount} warnings)`);
    console.log(`Evidence Integrity: PASS (${brokenBindings.length} broken, ${duplicateIds.length} conflicts)`);
    console.log(`Determinism: ${deterministic ? 'PASS' : 'FAIL'}`);
    console.log();
  });
});
