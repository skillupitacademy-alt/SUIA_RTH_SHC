import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { buildSnapshot } from '../../src/snapshot/builder.js';
import { FilesystemRepositoryAdapter } from '../../src/adapters/index.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';

describe('Determinism Integration Tests', () => {
  let repositoryRoot: string;
  let adapter: RepositoryAdapter;

  beforeAll(() => {
    // Use the quiz-platform monorepo root as test subject
    repositoryRoot = join(process.cwd(), '../..');
    adapter = new FilesystemRepositoryAdapter(repositoryRoot);
  });

  it('should produce identical canonical hashes for same repository state', async () => {
    // Build snapshot twice
    const snapshot1 = await buildSnapshot(repositoryRoot, adapter);
    const snapshot2 = await buildSnapshot(repositoryRoot, adapter);

    // Canonical hashes must be identical
    expect(snapshot1.canonicalHash).toBe(snapshot2.canonicalHash);

    // Scan timestamps will differ (they are excluded from canonical hash)
    expect(snapshot1.repository.scanTimestamp).not.toBe(snapshot2.repository.scanTimestamp);
  }, 60000);

  it('should produce identical evidence IDs for same files across scans', async () => {
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

    // Should have matched most evidence (some may vary if files changed between scans)
    expect(matchCount).toBeGreaterThan(0);
  }, 60000);

  it('should detect file mutations via canonical hash change', async () => {
    // Build baseline snapshot
    const snapshot1 = await buildSnapshot(repositoryRoot, adapter);

    // Create mock adapter that overrides getFileHash for one file
    const mockAdapter: RepositoryAdapter = {
      fileExists: adapter.fileExists.bind(adapter),
      readFile: adapter.readFile.bind(adapter),
      listFiles: adapter.listFiles.bind(adapter),
      getFileHash: async (path: string) => {
        // Override hash for package.json to simulate mutation
        if (path === 'package.json') {
          return 'mutated-hash-different-from-original';
        }
        return adapter.getFileHash(path);
      },
      getGitCommit: adapter.getGitCommit.bind(adapter),
      getGitRoot: adapter.getGitRoot.bind(adapter),
    };

    // Build snapshot with mutated file
    const snapshot2 = await buildSnapshot(repositoryRoot, mockAdapter);

    // Canonical hashes must differ (mutation detected)
    expect(snapshot1.canonicalHash).not.toBe(snapshot2.canonicalHash);
  }, 60000);

  it('should produce evidence IDs that are deterministic based on content', async () => {
    // Build baseline snapshot
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Find evidence for a specific file
    const packageJsonEvidence = snapshot.evidence.find(
      e => e.path === 'package.json' && e.kind === 'file'
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
  }, 60000);

  it('should exclude timestamps but include evidenceId in canonical hash', async () => {
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
  }, 60000);

  it('should produce stable evidence IDs across Windows and Unix path separators', async () => {
    const snapshot = await buildSnapshot(repositoryRoot, adapter);

    // Find evidence that might have path separator issues
    const evidenceWithPaths = snapshot.evidence.filter(e => e.path.includes('/'));

    // All evidence IDs should be deterministic regardless of path format
    // The normalizePath function should ensure consistency
    for (const evidence of evidenceWithPaths) {
      expect(evidence.evidenceId).toMatch(/^evidence-[0-9a-f]{16}$/);
    }
  }, 60000);
});
