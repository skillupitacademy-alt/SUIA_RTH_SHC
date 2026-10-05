import { describe, it, expect } from 'vitest';
import { validateDependencyGraph } from '../../../src/validation/v6-dependency-graph-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';

describe('V6 Dependency Graph Validator', () => {
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

  it('should pass when all edges reference existing nodes', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.dependencies.nodes = [
      { id: 'pkg1', name: '@quiz/pkg1', version: '1.0.0', type: 'package' },
      { id: 'pkg2', name: '@quiz/pkg2', version: '1.0.0', type: 'package' },
    ];
    snapshot.dependencies.edges = [
      { from: 'pkg1', to: 'pkg2', kind: 'dependency' },
    ];

    const result = await validateDependencyGraph(snapshot);

    expect(result.errors).toHaveLength(0);
  });

  it('should fail when edge references non-existent from node', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.dependencies.nodes = [
      { id: 'pkg1', name: '@quiz/pkg1', version: '1.0.0', type: 'package' },
    ];
    snapshot.dependencies.edges = [
      { from: 'non-existent', to: 'pkg1', kind: 'dependency' },
    ];

    const result = await validateDependencyGraph(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'EDGE_INVALID_FROM');
    expect(error).toBeDefined();
    expect(error?.message).toContain('non-existent');
  });

  it('should fail when edge references non-existent to node', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.dependencies.nodes = [
      { id: 'pkg1', name: '@quiz/pkg1', version: '1.0.0', type: 'package' },
    ];
    snapshot.dependencies.edges = [
      { from: 'pkg1', to: 'non-existent', kind: 'dependency' },
    ];

    const result = await validateDependencyGraph(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'EDGE_INVALID_TO');
    expect(error).toBeDefined();
  });

  it('should detect circular dependencies', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.dependencies.nodes = [
      { id: 'pkg1', name: '@quiz/pkg1', version: '1.0.0', type: 'package' },
      { id: 'pkg2', name: '@quiz/pkg2', version: '1.0.0', type: 'package' },
      { id: 'pkg3', name: '@quiz/pkg3', version: '1.0.0', type: 'package' },
    ];
    snapshot.dependencies.edges = [
      { from: 'pkg1', to: 'pkg2', kind: 'dependency' },
      { from: 'pkg2', to: 'pkg3', kind: 'dependency' },
      { from: 'pkg3', to: 'pkg1', kind: 'dependency' }, // cycle
    ];

    const result = await validateDependencyGraph(snapshot);

    expect(result.errors.length).toBeGreaterThan(0);
    const error = result.errors.find((e) => e.code === 'CIRCULAR_DEPENDENCY');
    expect(error).toBeDefined();
    expect(error?.message).toContain('Circular dependency detected');
  });

  it('should pass for acyclic graph', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.dependencies.nodes = [
      { id: 'pkg1', name: '@quiz/pkg1', version: '1.0.0', type: 'package' },
      { id: 'pkg2', name: '@quiz/pkg2', version: '1.0.0', type: 'package' },
      { id: 'pkg3', name: '@quiz/pkg3', version: '1.0.0', type: 'package' },
    ];
    snapshot.dependencies.edges = [
      { from: 'pkg1', to: 'pkg2', kind: 'dependency' },
      { from: 'pkg1', to: 'pkg3', kind: 'dependency' },
      { from: 'pkg2', to: 'pkg3', kind: 'dependency' },
    ];

    const result = await validateDependencyGraph(snapshot);

    expect(result.errors).toHaveLength(0);
  });
});
