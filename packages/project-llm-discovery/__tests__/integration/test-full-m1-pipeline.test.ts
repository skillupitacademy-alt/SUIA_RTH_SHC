import { describe, it, expect } from 'vitest';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { FilesystemRepositoryAdapter } from '../../src/adapters/filesystem-repository-adapter.js';
import { buildSnapshot } from '../../src/snapshot/builder.js';
import { validateSnapshot } from '../../src/validation/index.js';
import { reconcileWithLegacyFixture } from '../../src/validation/fixture-reconciliation.js';

describe('FEAT-006: Full M1 Pipeline Integration Test', () => {
  const repositoryRoot = 'e:\\onlinewebsites\\quiz-platform';

  it(
    'should run full M1 pipeline: build → validate → reconcile',
    async () => {
      // Step 1: Instantiate adapter
      const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

      // Step 2: Build snapshot
      console.log('Building repository snapshot...');
      const snapshot = await buildSnapshot(repositoryRoot, adapter);

      // Step 3: Validate snapshot
      console.log('Validating snapshot...');
      const validation = await validateSnapshot(snapshot, adapter);

      // Step 4: Reconcile with legacy fixture
      console.log('Reconciling with legacy fixture...');
      const reconciliation = await reconcileWithLegacyFixture(snapshot, adapter);

      // Step 5: Assert M1 requirements
      console.log('Verifying M1 requirements...');

      // M1-REQ-1: Structure discovery
      expect(snapshot.structure.applications.length).toBeGreaterThanOrEqual(10);
      expect(snapshot.structure.packages.length).toBeGreaterThanOrEqual(15);
      expect(snapshot.structure.services.length).toBeGreaterThanOrEqual(2);

      console.log('Structure counts:', {
        applications: snapshot.structure.applications.length,
        packages: snapshot.structure.packages.length,
        services: snapshot.structure.services.length,
      });

      // M1-REQ-2: Block verification
      expect(snapshot.blocks.verified.length).toBeGreaterThanOrEqual(1);

      console.log('Block verification:', {
        documented: snapshot.blocks.documented.length,
        implemented: snapshot.blocks.implemented.length,
        rendered: snapshot.blocks.rendered.length,
        verified: snapshot.blocks.verified.length,
      });

      // M1-REQ-3: Single Composer
      expect(snapshot.composer.services.length).toBe(1);
      expect(snapshot.composer.services[0]?.name).toContain('Composer');

      console.log('Composer:', {
        services: snapshot.composer.services.length,
        name: snapshot.composer.services[0]?.name,
      });

      // M1-REQ-4: Validation passes (or only documented warnings)
      if (!validation.valid) {
        console.log('Validation errors:', validation.errors);
      }

      // Log warnings for inspection (warnings are acceptable)
      if (validation.warnings.length > 0) {
        console.log(`Validation warnings (${validation.warnings.length}):`, validation.warnings.slice(0, 5));
      }

      // Expect no critical errors
      expect(validation.errors.length).toBe(0);
      expect(validation.valid).toBe(true);

      // M1-REQ-5: Reconciliation shows MATCH for verified blocks
      const matches = reconciliation.filter((r) => r.status === 'MATCH');
      expect(matches.length).toBeGreaterThan(0);

      const verifiedBlockMatches = matches.filter((r) => r.claim.includes('verified'));
      console.log('Reconciliation:', {
        total: reconciliation.length,
        matches: matches.length,
        discrepancies: reconciliation.filter((r) => r.status === 'DISCREPANCY').length,
        verifiedBlockMatches: verifiedBlockMatches.length,
      });

      // M1-REQ-6: Snapshot has deterministic hash
      expect(snapshot.canonicalHash).toBeDefined();
      expect(snapshot.canonicalHash.length).toBe(64); // SHA-256 hex

      console.log('Snapshot hash:', snapshot.canonicalHash);

      // Step 6: Write snapshot JSON to .agents/tasks/m1-snapshot-test.json
      const outputPath = join(repositoryRoot, '.agents/tasks/m1-snapshot-test.json');
      await writeFile(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');

      console.log(`Snapshot written to: ${outputPath}`);

      // Final summary
      console.log('\n=== M1 PIPELINE COMPLETE ===');
      console.log(`✓ Applications: ${snapshot.structure.applications.length}`);
      console.log(`✓ Packages: ${snapshot.structure.packages.length}`);
      console.log(`✓ Services: ${snapshot.structure.services.length}`);
      console.log(`✓ Blocks verified: ${snapshot.blocks.verified.length}`);
      console.log(`✓ Composer: ${snapshot.composer.services.length} (single)`);
      console.log(`✓ Validation: ${validation.valid ? 'PASS' : 'FAIL'}`);
      console.log(`✓ Evidence: ${snapshot.evidence.length} records`);
      console.log(`✓ Hash: ${snapshot.canonicalHash}`);
    },
    60000
  ); // 60 second timeout for full pipeline

  it(
    'should populate evidenceId on all entities (Phase F requirement)',
    async () => {
      // Step 1: Instantiate adapter
      const adapter = new FilesystemRepositoryAdapter(repositoryRoot);

      // Step 2: Build snapshot
      console.log('Building repository snapshot for evidenceId validation...');
      const snapshot = await buildSnapshot(repositoryRoot, adapter);

      // Step 3: Verify all entities have evidenceId populated
      console.log('Verifying evidenceId population...');

      // Check structure entities
      for (const app of snapshot.structure.applications) {
        expect(app.evidenceId).toBeDefined();
        expect(app.evidenceId).not.toBe('');
        expect(typeof app.evidenceId).toBe('string');
      }

      for (const pkg of snapshot.structure.packages) {
        expect(pkg.evidenceId).toBeDefined();
        expect(pkg.evidenceId).not.toBe('');
        expect(typeof pkg.evidenceId).toBe('string');
      }

      for (const service of snapshot.structure.services) {
        expect(service.evidenceId).toBeDefined();
        expect(service.evidenceId).not.toBe('');
        expect(typeof service.evidenceId).toBe('string');
      }

      // Check block implementations
      for (const block of snapshot.blocks.implemented) {
        expect(block.evidenceId).toBeDefined();
        expect(block.evidenceId).not.toBe('');
        expect(typeof block.evidenceId).toBe('string');
      }

      // Check block renderers
      for (const renderer of snapshot.blocks.rendered) {
        expect(renderer.evidenceId).toBeDefined();
        expect(renderer.evidenceId).not.toBe('');
        expect(typeof renderer.evidenceId).toBe('string');
      }

      // Check composer entities
      for (const composerService of snapshot.composer.services) {
        expect(composerService.evidenceId).toBeDefined();
        expect(composerService.evidenceId).not.toBe('');
        expect(typeof composerService.evidenceId).toBe('string');
      }

      for (const api of snapshot.composer.apis) {
        expect(api.evidenceId).toBeDefined();
        expect(api.evidenceId).not.toBe('');
        expect(typeof api.evidenceId).toBe('string');
      }

      for (const schema of snapshot.composer.schemas) {
        expect(schema.evidenceId).toBeDefined();
        expect(schema.evidenceId).not.toBe('');
        expect(typeof schema.evidenceId).toBe('string');
      }

      for (const ui of snapshot.composer.ui) {
        expect(ui.evidenceId).toBeDefined();
        expect(ui.evidenceId).not.toBe('');
        expect(typeof ui.evidenceId).toBe('string');
      }

      // Check dependency nodes and edges
      for (const node of snapshot.dependencies.nodes) {
        expect(node.evidenceId).toBeDefined();
        expect(node.evidenceId).not.toBe('');
        expect(typeof node.evidenceId).toBe('string');
      }

      for (const edge of snapshot.dependencies.edges) {
        expect(edge.evidenceId).toBeDefined();
        expect(edge.evidenceId).not.toBe('');
        expect(typeof edge.evidenceId).toBe('string');
      }

      // Step 4: Run validators to ensure V1 and V8 pass
      console.log('Running V1 and V8 validators...');
      const validation = await validateSnapshot(snapshot, adapter);

      // Should pass V1 schema validation (all entities have evidenceId)
      const v1Errors = validation.errors.filter((e) => e.validator === 'V1-schema');
      expect(v1Errors).toHaveLength(0);

      // Should pass V8 evidence completeness validation
      const v8Errors = validation.errors.filter((e) => e.validator === 'V8-evidence-completeness');
      expect(v8Errors).toHaveLength(0);

      console.log('✓ All entities have valid evidenceId');
      console.log('✓ V1 schema validation: PASS');
      console.log('✓ V8 evidence completeness validation: PASS');
      console.log(`✓ Total evidence records: ${snapshot.evidence.length}`);
    },
    60000
  ); // 60 second timeout
});
