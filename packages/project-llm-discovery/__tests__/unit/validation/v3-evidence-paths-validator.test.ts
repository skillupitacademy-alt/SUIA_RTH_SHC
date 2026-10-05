import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEvidencePaths } from '../../../src/validation/v3-evidence-paths-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';
import type { RepositoryAdapter } from '../../../src/contracts/repository-adapter.js';

describe('V3 Evidence Paths Validator', () => {
  let mockAdapter: RepositoryAdapter;

  beforeEach(() => {
    mockAdapter = {
      readFile: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
      getFileHash: vi.fn(),
      getGitCommit: vi.fn(),
      getGitRoot: vi.fn(),
    };
  });

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

  it('should pass when all evidence paths exist', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'src/index.ts',
        kind: 'file',
        claim: 'test claim',
        locator: 'test:1:1',
        contentHash: 'hash123',
      },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);

    const result = await validateEvidencePaths(snapshot, mockAdapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when evidence path does not exist', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'missing/file.ts',
        kind: 'file',
        claim: 'test claim',
        locator: 'test:1:1',
        contentHash: 'hash123',
      },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(false);

    const result = await validateEvidencePaths(snapshot, mockAdapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]?.code).toBe('EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings[0]?.path).toBe('missing/file.ts');
  });

  it('should check all evidence paths', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.evidence = [
      {
        evidenceId: 'e1',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'src/file1.ts',
        kind: 'file',
        claim: 'test claim 1',
        locator: 'test:1:1',
        contentHash: 'hash1',
      },
      {
        evidenceId: 'e2',
        scannerName: 'test-scanner',
        timestamp: '2024-01-01T00:00:00Z',
        path: 'src/file2.ts',
        kind: 'file',
        claim: 'test claim 2',
        locator: 'test:2:1',
        contentHash: 'hash2',
      },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);

    const result = await validateEvidencePaths(snapshot, mockAdapter);

    expect(mockAdapter.fileExists).toHaveBeenCalledTimes(2);
    expect(mockAdapter.fileExists).toHaveBeenCalledWith('src/file1.ts');
    expect(mockAdapter.fileExists).toHaveBeenCalledWith('src/file2.ts');
    expect(result.warnings).toHaveLength(0);
  });
});
