import { describe, it, expect } from 'vitest';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../../src/snapshot/builder.js';
import { validateSnapshot } from '../../src/validation/index.js';
import { reconcileWithLegacyFixture } from '../../src/validation/fixture-reconciliation.js';

describe('Full Discovery Integration with Validation', () => {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';

  it(
    'should build snapshot and validate successfully',
    async () => {
      const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

      // Build snapshot
      const snapshot = await buildSnapshot(repositoryRoot, adapter);

      // Verify snapshot structure
      expect(snapshot.schemaVersion).toBe('1.1.0');
      expect(snapshot.canonicalHash).toBeDefined();
      expect(snapshot.canonicalHash.length).toBe(64); // SHA-256 hex length

      // Validate snapshot (skip V9 determinism check to save time)
      const validation = await validateSnapshot(snapshot, adapter);

      // Check validation results
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();

      // Log errors and warnings for inspection
      if (validation.errors.length > 0) {
        console.log('Validation errors:', validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.log('Validation warnings:', validation.warnings);
      }

      // Expect no errors (warnings are acceptable)
      expect(validation.errors).toHaveLength(0);

      // If there are warnings, document them
      // Common expected warnings:
      // - Evidence paths not found (files may have moved)
      // - Test files not found (tests may be in different locations)
      // - Evidence completeness warnings (some entities may not have direct evidence)
      if (validation.warnings.length > 0) {
        const warningCodes = new Set(validation.warnings.map((w) => w.code));
        console.log('Warning codes found:', Array.from(warningCodes));

        // These warnings are expected and acceptable
        const expectedWarningCodes = new Set([
          'EVIDENCE_PATH_NOT_FOUND',
          'TEST_FILE_NOT_FOUND',
          'MISSING_APPLICATION_EVIDENCE',
          'MISSING_PACKAGE_EVIDENCE',
          'MISSING_SERVICE_EVIDENCE',
          'MISSING_BLOCK_IMPLEMENTATION_EVIDENCE',
          'MISSING_COMPOSER_EVIDENCE',
          'APPLICATION_COUNT_MISMATCH',
          'EVIDENCE_COUNT_MISMATCH',
        ]);

        for (const warning of validation.warnings) {
          if (!expectedWarningCodes.has(warning.code)) {
            console.warn('Unexpected warning:', warning);
          }
        }
      }

      // Perform fixture reconciliation
      const reconciliation = await reconcileWithLegacyFixture(snapshot, adapter);

      expect(reconciliation).toBeDefined();
      expect(reconciliation.length).toBeGreaterThan(0);

      // Check for summary
      const summary = reconciliation.find((r) => r.claim === 'Reconciliation summary');
      expect(summary).toBeDefined();

      // Log reconciliation results
      console.log('Reconciliation results:', {
        totalResults: reconciliation.length,
        matches: reconciliation.filter((r) => r.status === 'MATCH').length,
        discrepancies: reconciliation.filter((r) => r.status === 'DISCREPANCY').length,
        unknown: reconciliation.filter((r) => r.status === 'UNKNOWN').length,
      });

      // Verify key structure counts
      expect(snapshot.structure.applications.length).toBeGreaterThan(0);
      expect(snapshot.structure.packages.length).toBeGreaterThan(0);
      expect(snapshot.evidence.length).toBeGreaterThan(0);
    },
    30000
  ); // 30 second timeout

  it('should validate that exactly 1 composer service exists', async () => {
    const adapter = new FilesystemRepositoryAdapter(repositoryRoot);
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Check composer services
    expect(snapshot.composer.services.length).toBe(1);
    expect(snapshot.composer.services[0]?.name).toContain('Composer');
  }, 30000); // 30 second timeout

  it('should validate dependency graph is acyclic', async () => {
    const adapter = new FilesystemRepositoryAdapter(repositoryRoot);
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    const validation = await validateSnapshot(snapshot, adapter);

    // No circular dependency errors should exist
    const circularErrors = validation.errors.filter((e) => e.code === 'CIRCULAR_DEPENDENCY');
    expect(circularErrors).toHaveLength(0);
  }, 30000); // 30 second timeout

  it('should validate block consistency (4 states present)', async () => {
    const adapter = new FilesystemRepositoryAdapter(repositoryRoot);
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Check that all 4 block states are present
    expect(Array.isArray(snapshot.blocks.documented)).toBe(true);
    expect(Array.isArray(snapshot.blocks.implemented)).toBe(true);
    expect(Array.isArray(snapshot.blocks.rendered)).toBe(true);
    expect(Array.isArray(snapshot.blocks.verified)).toBe(true);

    // Verify verified blocks are in both implemented and rendered
    for (const verified of snapshot.blocks.verified) {
      const implementedTypes = snapshot.blocks.implemented.map((i) => i.type);
      const renderedTypes = snapshot.blocks.rendered.map((r) => r.blockType);

      if (verified.implemented === true) {
        expect(implementedTypes).toContain(verified.blockType);
      }

      if (verified.rendered === true) {
        expect(renderedTypes).toContain(verified.blockType);
      }
    }
  }, 30000); // 30 second timeout
});
