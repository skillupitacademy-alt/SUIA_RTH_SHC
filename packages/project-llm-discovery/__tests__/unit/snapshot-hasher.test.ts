import { describe, it, expect } from 'vitest';
import { computeSnapshotHash } from '../../src/snapshot/hasher.js';
import type { RepositorySnapshot } from '../../src/contracts/snapshot.js';

describe('computeSnapshotHash', () => {
  const createBaseSnapshot = (): Omit<RepositorySnapshot, 'canonicalHash'> => ({
    schemaVersion: '1.0.0',
    repository: {
      owner: 'test-owner',
      name: 'test-repo',
      commitSha: 'abc123',
      scanTimestamp: '2024-01-01T00:00:00.000Z',
    },
    structure: {
      applications: [],
      packages: [],
      services: [],
    },
    runtime: {
      frameworks: [],
      workspace: {
        manager: 'pnpm',
        version: '9.15.4',
        packages: [],
      },
      buildSystem: {
        tool: 'turbo',
        version: '2.3.3',
        config: 'turbo.json',
      },
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
  });

  it('should produce a 64-character hex string (SHA-256)', () => {
    const snapshot = createBaseSnapshot();
    const hash = computeSnapshotHash(snapshot);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce identical hashes for identical snapshots', () => {
    const snapshot1 = createBaseSnapshot();
    const snapshot2 = createBaseSnapshot();

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash1).toBe(hash2);
  });

  it('should exclude timestamp from hash computation (determinism)', () => {
    const snapshot1 = createBaseSnapshot();
    const snapshot2 = {
      ...createBaseSnapshot(),
      repository: {
        ...createBaseSnapshot().repository,
        scanTimestamp: '2024-01-01T12:00:00.000Z', // Different timestamp
      },
    };

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash1).toBe(hash2); // Timestamp difference ignored
  });

  it('should produce different hashes when content differs', () => {
    const snapshot1 = createBaseSnapshot();
    const snapshot2 = {
      ...createBaseSnapshot(),
      repository: {
        ...createBaseSnapshot().repository,
        commitSha: 'def456', // Different commit
      },
    };

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle object key ordering (stable serialization)', () => {
    // Create snapshot with keys in different order
    const snapshot1 = createBaseSnapshot();
    const snapshot2: Omit<RepositorySnapshot, 'canonicalHash'> = {
      findings: [],
      evidence: [],
      tests: snapshot1.tests,
      dependencies: snapshot1.dependencies,
      composer: snapshot1.composer,
      blocks: snapshot1.blocks,
      runtime: snapshot1.runtime,
      structure: snapshot1.structure,
      repository: snapshot1.repository,
      schemaVersion: snapshot1.schemaVersion,
    };

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash1).toBe(hash2); // Key order doesn't affect hash
  });

  it('should handle nested objects with data', () => {
    const snapshot: Omit<RepositorySnapshot, 'canonicalHash'> = {
      ...createBaseSnapshot(),
      structure: {
        applications: [
          {
            name: 'test-app',
            path: 'apps/test-app',
            type: 'application',
            framework: 'next',
            entrypoint: 'src/index.ts',
          },
        ],
        packages: [
          {
            name: '@quiz/test',
            path: 'packages/test',
            version: '1.0.0',
            dependencies: ['react', 'react-dom'],
            exports: ['./index'],
          },
        ],
        services: [],
      },
    };

    const hash = computeSnapshotHash(snapshot);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Create identical snapshot
    const snapshot2 = JSON.parse(JSON.stringify(snapshot));
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash).toBe(hash2);
  });

  it('should handle arrays deterministically (order-independent)', () => {
    const snapshot1: Omit<RepositorySnapshot, 'canonicalHash'> = {
      ...createBaseSnapshot(),
      evidence: [
        {
          evidenceId: 'id-1',
          scannerName: 'D1',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: 'path1',
          kind: 'file',
          claim: 'claim1',
          locator: 'loc1',
          contentHash: 'hash1',
        },
        {
          evidenceId: 'id-2',
          scannerName: 'D2',
          timestamp: '2024-01-01T00:00:01.000Z',
          path: 'path2',
          kind: 'file',
          claim: 'claim2',
          locator: 'loc2',
          contentHash: 'hash2',
        },
      ],
    };

    const snapshot2: Omit<RepositorySnapshot, 'canonicalHash'> = {
      ...createBaseSnapshot(),
      evidence: [
        {
          evidenceId: 'id-2',
          scannerName: 'D2',
          timestamp: '2024-01-01T00:00:01.000Z',
          path: 'path2',
          kind: 'file',
          claim: 'claim2',
          locator: 'loc2',
          contentHash: 'hash2',
        },
        {
          evidenceId: 'id-1',
          scannerName: 'D1',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: 'path1',
          kind: 'file',
          claim: 'claim1',
          locator: 'loc1',
          contentHash: 'hash1',
        },
      ],
    };

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    // Arrays are sorted before hashing to eliminate filesystem traversal order variance
    // Same evidence in different order should produce the same hash
    expect(hash1).toBe(hash2);
  });

  it('should detect changes in nested data', () => {
    const snapshot1: Omit<RepositorySnapshot, 'canonicalHash'> = {
      ...createBaseSnapshot(),
      blocks: {
        documented: [
          {
            family: 'I',
            versions: ['I1'],
            documentationPath: 'docs/I.md',
          },
        ],
        implemented: [],
        rendered: [],
        verified: [],
        discrepancies: [],
      },
    };

    const snapshot2: Omit<RepositorySnapshot, 'canonicalHash'> = {
      ...createBaseSnapshot(),
      blocks: {
        documented: [
          {
            family: 'I',
            versions: ['I1', 'I2'], // Added version
            documentationPath: 'docs/I.md',
          },
        ],
        implemented: [],
        rendered: [],
        verified: [],
        discrepancies: [],
      },
    };

    const hash1 = computeSnapshotHash(snapshot1);
    const hash2 = computeSnapshotHash(snapshot2);

    expect(hash1).not.toBe(hash2);
  });
});
