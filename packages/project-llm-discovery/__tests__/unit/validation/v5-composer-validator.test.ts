import { describe, it, expect } from 'vitest';
import { validateComposer } from '../../../src/validation/v5-composer-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V5 Composer Validator', () => {
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
    composer: { services: [], apis: [], schemas: [], ui: [] },
    dependencies: { nodes: [], edges: [] },
    tests: { unit: [], integration: [], e2e: [] },
    evidence: [],
    findings: [],
    canonicalHash: 'hash123',
  });

  it('should pass when exactly 1 composer service exists', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [
      { name: 'TutorialComposerService', path: 'services/composer.ts', methods: ['compose'] },
    ];

    const result = await validateComposer(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail when no composer service exists', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [];

    const result = await validateComposer(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'NO_COMPOSER_SERVICE');
    expect(error).toBeDefined();
    expect(error?.message).toContain('Expected exactly 1');
  });

  it('should fail when multiple composer services exist', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.composer.services = [
      { name: 'ComposerService1', path: 'services/composer1.ts', methods: [] },
      { name: 'ComposerService2', path: 'services/composer2.ts', methods: [] },
    ];

    const result = await validateComposer(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'MULTIPLE_COMPOSER_SERVICES');
    expect(error).toBeDefined();
    expect(error?.message).toContain('found 2');
    expect(error?.details?.serviceCount).toBe(2);
  });
});
