import { describe, it, expect } from 'vitest';
import { validateBlockConsistency } from '../../../src/validation/v4-block-consistency-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V4 Block Consistency Validator', () => {
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

  it('should pass when all 4 state arrays are present', async () => {
    const snapshot = createBaseSnapshot();
    const result = await validateBlockConsistency(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail when documented state is missing', async () => {
    const snapshot = createBaseSnapshot();
    delete (snapshot.blocks as any).documented;

    const result = await validateBlockConsistency(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'MISSING_DOCUMENTED_STATE');
    expect(error).toBeDefined();
  });

  it('should fail when implemented state is missing', async () => {
    const snapshot = createBaseSnapshot();
    delete (snapshot.blocks as any).implemented;

    const result = await validateBlockConsistency(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'MISSING_IMPLEMENTED_STATE');
    expect(error).toBeDefined();
  });

  it('should pass when verified is subset of implemented ∩ rendered', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'introduction', path: 'test/intro.ts', exported: true },
      { type: 'code', path: 'test/code.ts', exported: true },
    ];
    snapshot.blocks.rendered = [
      { blockType: 'introduction', componentPath: 'test/IntroBlock.tsx', registeredInRenderer: true },
      { blockType: 'code', componentPath: 'test/CodeBlock.tsx', registeredInRenderer: true },
    ];
    snapshot.blocks.verified = [
      { blockType: 'introduction', documented: true, implemented: true, rendered: true, tested: true },
    ];

    const result = await validateBlockConsistency(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail when verified block not in implemented', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [];
    snapshot.blocks.rendered = [
      { blockType: 'introduction', componentPath: 'test/IntroBlock.tsx', registeredInRenderer: true },
    ];
    snapshot.blocks.verified = [
      { blockType: 'introduction', documented: true, implemented: true, rendered: true, tested: true },
    ];

    const result = await validateBlockConsistency(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'VERIFIED_SUBSET_VIOLATION');
    expect(error).toBeDefined();
    expect(error?.details?.inImplemented).toBe(false);
  });

  it('should fail when verified block not in rendered', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.blocks.implemented = [
      { type: 'code', path: 'test/code.ts', exported: true },
    ];
    snapshot.blocks.rendered = [];
    snapshot.blocks.verified = [
      { blockType: 'code', documented: true, implemented: true, rendered: true, tested: true },
    ];

    const result = await validateBlockConsistency(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'VERIFIED_SUBSET_VIOLATION');
    expect(error).toBeDefined();
    expect(error?.details?.inRendered).toBe(false);
  });
});
