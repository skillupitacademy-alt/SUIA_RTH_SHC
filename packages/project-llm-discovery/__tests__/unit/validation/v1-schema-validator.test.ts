import { describe, it, expect } from 'vitest';
import { validateSchema } from '../../../src/validation/v1-schema-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V1 Schema Validator', () => {
  const createValidSnapshot = (): RepositorySnapshot => ({
    schemaVersion: '1.1.0',
    repository: {
      owner: 'test-owner',
      name: 'test-repo',
      commitSha: 'abc123',
      scanTimestamp: '2024-01-01T00:00:00Z',
    },
    structure: {
      applications: [],
      packages: [],
      services: [],
    },
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
    dependencies: {
      nodes: [],
      edges: [],
    },
    tests: {
      unit: [],
      integration: [],
      e2e: [],
    },
    evidence: [],
    findings: [],
    canonicalHash: 'hash123',
  });

  it('should pass validation for a valid snapshot', async () => {
    const snapshot = createValidSnapshot();
    const result = await validateSchema(snapshot);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should fail validation for invalid schema version', async () => {
    const snapshot = createValidSnapshot();
    snapshot.schemaVersion = '2.0.0' as any;

    const result = await validateSchema(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const versionError = result.errors.find((e) => e.code === 'INVALID_SCHEMA_VERSION');
    expect(versionError).toBeDefined();
    expect(versionError?.message).toContain('1.1.0');
  });

  it('should fail validation for missing required fields', async () => {
    const snapshot = createValidSnapshot();
    delete (snapshot as any).repository;

    const result = await validateSchema(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe('SCHEMA_VALIDATION_FAILED');
  });

  it('should validate evidence array structure', async () => {
    const snapshot = createValidSnapshot();
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'test/path',
        kind: 'file',
        claim: 'test claim',
        locator: 'test:1:1',
        contentHash: 'hash123',
        lifecycle: 'current',
      },
    ];

    const result = await validateSchema(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation for invalid evidence kind', async () => {
    const snapshot = createValidSnapshot();
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'test/path',
        kind: 'invalid-kind' as any,
        claim: 'test claim',
        locator: 'test:1:1',
        contentHash: 'hash123',
        lifecycle: 'current',
      },
    ];

    const result = await validateSchema(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Phase F: Schema enforcement tests for evidenceId

  it('should pass validation for entity with evidenceId', async () => {
    const snapshot = createValidSnapshot();
    snapshot.structure.applications = [
      {
        name: 'test-app',
        path: 'apps/test',
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-001',
      },
    ];
    snapshot.evidence = [
      {
        evidenceId: 'evidence-001',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'apps/test/package.json',
        kind: 'package',
        claim: 'Application discovered',
        locator: 'file:apps/test/package.json',
        contentHash: 'hash123',
        lifecycle: 'current',
      },
    ];

    const result = await validateSchema(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation for entity without evidenceId', async () => {
    const snapshot = createValidSnapshot();
    snapshot.structure.packages = [
      {
        name: '@quiz/types',
        path: 'packages/types',
        version: '1.0.0',
        dependencies: [],
        exports: [],
        // Missing evidenceId field
      } as any,
    ];

    const result = await validateSchema(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => 
      e.message.includes('evidenceId') || 
      e.code === 'SCHEMA_VALIDATION_FAILED'
    );
    expect(error).toBeDefined();
  });
});
