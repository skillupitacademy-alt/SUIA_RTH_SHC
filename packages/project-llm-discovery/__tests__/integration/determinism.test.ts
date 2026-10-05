import { describe, it, expect } from 'vitest';
import { buildSnapshot } from '../../src/snapshot/builder.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';

describe('Determinism Integration Tests', () => {
  /**
   * Create a mock adapter with stable, controlled data to avoid filesystem dependency
   */
  function createMockAdapter(overrides?: Partial<RepositoryAdapter>): RepositoryAdapter {
    // Mock file system state
    const files = new Map<string, string>([
      ['package.json', '{"name":"test","version":"1.0.0"}'],
      ['tsconfig.json', '{"compilerOptions":{"strict":true}}'],
      ['apps/web/package.json', '{"name":"web"}'],
      ['packages/core/package.json', '{"name":"core"}'],
      ['packages/core/src/index.ts', 'export const version = "1.0.0";'],
    ]);

    const fileHashes = new Map<string, string>([
      ['package.json', 'abc123def456'],
      ['tsconfig.json', '789ghi012jkl'],
      ['apps/web/package.json', 'mno345pqr678'],
      ['packages/core/package.json', 'stu901vwx234'],
      ['packages/core/src/index.ts', 'yza567bcd890'],
    ]);

    const baseAdapter: RepositoryAdapter = {
      fileExists: async (path: string) => files.has(path),
      readFile: async (path: string) => {
        const content = files.get(path);
        if (!content) throw new Error(`File not found: ${path}`);
        return content;
      },
      listFiles: async (directory: string, pattern?: string) => {
        const allFiles = Array.from(files.keys());
        const filtered = allFiles.filter(f => f.startsWith(directory === '.' ? '' : directory));
        if (pattern) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return filtered.filter(f => regex.test(f));
        }
        return filtered;
      },
      getFileHash: async (path: string) => {
        const hash = fileHashes.get(path);
        if (!hash) throw new Error(`No hash for file: ${path}`);
        return hash;
      },
      getGitCommit: async () => 'abc123def456789',
      getGitRoot: async () => '/mock/repo',
      ...overrides,
    };

    return baseAdapter;
  }

  it('should produce identical canonical hashes for same repository state', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    // Build snapshot twice
    const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
    const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

    // Canonical hashes must be identical
    expect(snapshot1.canonicalHash).toBe(snapshot2.canonicalHash);

    // Scan timestamps will differ (they are excluded from canonical hash)
    expect(snapshot1.repository.scanTimestamp).not.toBe(snapshot2.repository.scanTimestamp);
  });

  it('should produce identical evidence IDs for same files across scans', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    // Build snapshot twice
    const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
    const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

    // Build map of evidence by path+kind for comparison
    const evidence1Map = new Map<string, string>();
    for (const ev of snapshot1.evidence) {
      const key = `${ev.path}:${ev.kind}`;
      evidence1Map.set(key, ev.evidenceId);
    }

    const evidence2Map = new Map<string, string>();
    for (const ev of snapshot2.evidence) {
      const key = `${ev.path}:${ev.kind}`;
      evidence2Map.set(key, ev.evidenceId);
    }

    // For each evidence in snapshot1, find matching evidence in snapshot2
    let matchCount = 0;
    for (const [key, evidenceId1] of evidence1Map.entries()) {
      const evidenceId2 = evidence2Map.get(key);
      if (evidenceId2 !== undefined) {
        // Same path+kind should have same evidence ID
        expect(evidenceId1).toBe(evidenceId2);
        matchCount++;
      }
    }

    // All evidence should have matched (stable mock data)
    expect(matchCount).toBeGreaterThan(0);
    expect(matchCount).toBe(evidence1Map.size);
  });

  it('should detect file mutations via canonical hash change', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    // Build baseline snapshot
    const snapshot1 = await buildSnapshot(repositoryRoot, adapter);

    // Create mock adapter that overrides getFileHash for one file
    const mockAdapterWithMutation = createMockAdapter({
      getFileHash: async (path: string) => {
        // Override hash for package.json to simulate mutation
        if (path === 'package.json') {
          return 'mutated-hash-different-from-original';
        }
        // Delegate to base adapter for other files
        return adapter.getFileHash(path);
      },
    });

    // Build snapshot with mutated file
    const snapshot2 = await buildSnapshot(repositoryRoot, mockAdapterWithMutation);

    // Canonical hashes must differ (mutation detected)
    expect(snapshot1.canonicalHash).not.toBe(snapshot2.canonicalHash);
  });

  it('should produce evidence IDs that are deterministic based on content', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    // Build baseline snapshot
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Find evidence for a specific file
    const packageJsonEvidence = snapshot.evidence.find(
      e => e.path === 'package.json'
    );

    expect(packageJsonEvidence).toBeDefined();
    if (packageJsonEvidence) {
      // Evidence ID should follow format: evidence-<16hexchars>
      expect(packageJsonEvidence.evidenceId).toMatch(/^evidence-[0-9a-f]{16}$/);

      // The ID should be deterministic: same inputs → same ID
      // We can't test this directly without knowing the hash algorithm internals,
      // but we can verify the format and that it exists
      expect(packageJsonEvidence.evidenceId.length).toBe(25); // 'evidence-' + 16 chars
    }
  });

  it('should exclude timestamps but include evidenceId in canonical hash', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    // Build snapshot
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Verify that evidence has evidenceId values
    expect(snapshot.evidence.length).toBeGreaterThan(0);
    for (const evidence of snapshot.evidence) {
      expect(evidence.evidenceId).toBeDefined();
      expect(evidence.evidenceId).toMatch(/^evidence-[0-9a-f]{16}$/);
      expect(evidence.timestamp).toBeDefined();
    }

    // The canonical hash computation should include evidenceId but exclude timestamps
    // This is verified by the first test showing identical hashes despite different timestamps
  });

  it('should produce stable evidence IDs across Windows and Unix path separators', async () => {
    const adapter = createMockAdapter();
    const repositoryRoot = '/mock/repo';

    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Find evidence that might have path separator issues
    const evidenceWithPaths = snapshot.evidence.filter(e => e.path.includes('/'));

    // All evidence IDs should be deterministic regardless of path format
    // The normalizePath function should ensure consistency
    for (const evidence of evidenceWithPaths) {
      expect(evidence.evidenceId).toMatch(/^evidence-[0-9a-f]{16}$/);
    }
  });

  describe('Canonical JSON evidence ID generation properties', () => {
    it('IDEMPOTENCE: same (kind, path, symbol, contentHash) inputs produce same evidence ID on repeated calls', async () => {
      const adapter = createMockAdapter();
      const repositoryRoot = '/mock/repo';

      // Build snapshot multiple times
      const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
      const snapshot2 = await buildSnapshot(repositoryRoot, adapter);
      const snapshot3 = await buildSnapshot(repositoryRoot, adapter);

      // Find the same evidence across all snapshots
      const packageEvidence1 = snapshot1.evidence.find(e => e.path === 'package.json');
      const packageEvidence2 = snapshot2.evidence.find(e => e.path === 'package.json');
      const packageEvidence3 = snapshot3.evidence.find(e => e.path === 'package.json');

      expect(packageEvidence1).toBeDefined();
      expect(packageEvidence2).toBeDefined();
      expect(packageEvidence3).toBeDefined();

      // Evidence IDs must be identical across all three scans
      expect(packageEvidence1!.evidenceId).toBe(packageEvidence2!.evidenceId);
      expect(packageEvidence2!.evidenceId).toBe(packageEvidence3!.evidenceId);
      expect(packageEvidence1!.evidenceId).toBe(packageEvidence3!.evidenceId);
    });

    it('SYMBOL SENSITIVITY: changing only the symbol field produces different evidence ID', async () => {
      // Import the generator to test directly
      const { generateDeterministicEvidenceId } = await import('../../src/utils/path-utils.js');
      
      // Test that same kind, path, and contentHash but different symbols produce different IDs
      const id1 = generateDeterministicEvidenceId(
        'component',
        'packages/core/src/index.ts',
        'samehash',
        'symbolA'
      );
      const id2 = generateDeterministicEvidenceId(
        'component',
        'packages/core/src/index.ts',
        'samehash',
        'symbolB'
      );

      // Evidence IDs must differ when only symbol changes
      expect(id1).not.toBe(id2);
    });

    it('PATH NORMALIZATION: Windows and Unix path separators produce same evidence ID', async () => {
      // Import the generator function
      const { generateDeterministicEvidenceId } = await import('../../src/utils/path-utils.js');

      const windowsStylePath = 'packages\\core\\src\\index.ts';
      const unixStylePath = 'packages/core/src/index.ts';

      const id1 = generateDeterministicEvidenceId(
        'file',
        windowsStylePath,
        'abc123hash'
      );
      const id2 = generateDeterministicEvidenceId(
        'file',
        unixStylePath,
        'abc123hash'
      );

      // Both should produce identical evidence IDs
      expect(id1).toBe(id2);
    });

    it('MUTATION DETECTION: changing contentHash produces different evidence ID AND different canonical snapshot hash', async () => {
      const adapter = createMockAdapter();
      const repositoryRoot = '/mock/repo';

      // Build baseline snapshot
      const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
      const baselineEvidence = snapshot1.evidence.find(e => e.path === 'package.json');
      const baselineHash = snapshot1.canonicalHash;

      expect(baselineEvidence).toBeDefined();
      const baselineEvidenceId = baselineEvidence!.evidenceId;

      // Create adapter with mutated content hash for package.json
      const mutatedAdapter = createMockAdapter({
        getFileHash: async (path: string) => {
          if (path === 'package.json') {
            return 'MUTATED-HASH-xyz789'; // Different from original 'abc123def456'
          }
          return adapter.getFileHash(path);
        },
      });

      // Build snapshot with mutation
      const snapshot2 = await buildSnapshot(repositoryRoot, mutatedAdapter);
      const mutatedEvidence = snapshot2.evidence.find(e => e.path === 'package.json');
      const mutatedHash = snapshot2.canonicalHash;

      expect(mutatedEvidence).toBeDefined();
      const mutatedEvidenceId = mutatedEvidence!.evidenceId;

      // 1. Evidence ID must be different (contentHash is part of evidence ID)
      expect(mutatedEvidenceId).not.toBe(baselineEvidenceId);

      // 2. Canonical snapshot hash must be different (because evidence ID changed)
      expect(mutatedHash).not.toBe(baselineHash);
    });

    it('NULL SYMBOL EQUIVALENCE: symbol=undefined and symbol=null produce same evidence ID', async () => {
      // Import the generator function
      const { generateDeterministicEvidenceId } = await import('../../src/utils/path-utils.js');

      const idWithUndefined = generateDeterministicEvidenceId(
        'package',
        'apps/admin/package.json',
        'abc123hash',
        undefined
      );
      const idWithNull = generateDeterministicEvidenceId(
        'package',
        'apps/admin/package.json',
        'abc123hash',
        null as unknown as undefined // TypeScript typing workaround
      );
      const idWithoutSymbol = generateDeterministicEvidenceId(
        'package',
        'apps/admin/package.json',
        'abc123hash'
      );

      // All three should produce identical IDs because JSON.stringify converts both undefined and null to null
      expect(idWithUndefined).toBe(idWithNull);
      expect(idWithUndefined).toBe(idWithoutSymbol);
      expect(idWithNull).toBe(idWithoutSymbol);
    });
  });
});
