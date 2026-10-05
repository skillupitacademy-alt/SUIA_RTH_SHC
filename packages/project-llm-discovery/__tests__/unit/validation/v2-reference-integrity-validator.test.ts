import { describe, it, expect } from 'vitest';
import { validateReferenceIntegrity } from '../../../src/validation/v2-reference-integrity-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V2 Reference Integrity Validator', () => {
  const createBaseSnapshot = (): RepositorySnapshot => ({
    schemaVersion: '1.0.0',
    repository: {
      owner: 'test-owner',
      name: 'test-repo',
      commitSha: 'abc123',
      scanTimestamp: '2024-01-01T00:00:00Z',
    },
    structure: { applications: [], packages: [], services: [] },
    runtime: {
      frameworks: [],
      workspace: { manager: 'pnpm', version: '9.0.0', packages: [] },
      buildSystem: { tool: 'turbo', version: '2.0.0', config: 'turbo.json' },
    },
    blocks: {
      documented: [],
      implemented: [],
      rendered: [],
      verified: [],
      discrepancies: [],
    },
    composer: {
      services: [],
      apis: [],
      schemas: [],
      ui: [],
    },
    dependencies: { nodes: [], edges: [] },
    tests: { unit: [], integration: [], e2e: [] },
    evidence: [],
    findings: [],
    canonicalHash: 'hash123',
  });

  it('should pass when verified blocks exist in both implemented and rendered', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'introduction', path: 'test/intro.ts', exported: true },
    ];
    snapshot.blocks.rendered = [
      { blockType: 'introduction', componentPath: 'test/IntroBlock.tsx', registeredInRenderer: true },
    ];
    snapshot.blocks.verified = [
      { blockType: 'introduction', documented: true, implemented: true, rendered: true, tested: true },
    ];

    const result = await validateReferenceIntegrity(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail when verified block is not implemented', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [];
    snapshot.blocks.rendered = [
      { blockType: 'introduction', componentPath: 'test/IntroBlock.tsx', registeredInRenderer: true },
    ];
    snapshot.blocks.verified = [
      { blockType: 'introduction', documented: true, implemented: false, rendered: true, tested: true },
    ];

    const result = await validateReferenceIntegrity(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'VERIFIED_NOT_IMPLEMENTED');
    expect(error).toBeDefined();
  });

  it('should fail when verified block is not rendered', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'code', path: 'test/code.ts', exported: true },
    ];
    snapshot.blocks.rendered = [];
    snapshot.blocks.verified = [
      { blockType: 'code', documented: true, implemented: true, rendered: false, tested: true },
    ];

    const result = await validateReferenceIntegrity(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'VERIFIED_NOT_RENDERED');
    expect(error).toBeDefined();
  });

  it('should warn when composer API does not reference known service', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [
      { name: 'TutorialComposerService', path: 'services/composer.ts', methods: [] },
    ];
    snapshot.composer.apis = [
      { endpoint: '/api/unknown', method: 'POST', handler: 'handlers/unknown.ts' },
    ];

    const result = await validateReferenceIntegrity(snapshot);

    expect(result.warnings.length).toBeGreaterThan(0);
    const warning = result.warnings.find((w) => w.code === 'API_NO_SERVICE_REFERENCE');
    expect(warning).toBeDefined();
  });

  it('should pass when composer API references known service', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [
      { name: 'TutorialComposerService', path: 'services/tutorial-composer.service.ts', methods: [] },
    ];
    snapshot.composer.apis = [
      { endpoint: '/api/compose', method: 'POST', handler: 'services/tutorial-composer.service.ts' },
    ];

    const result = await validateReferenceIntegrity(snapshot);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
