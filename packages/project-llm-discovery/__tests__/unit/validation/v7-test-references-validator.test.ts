import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateTestReferences } from '../../../src/validation/v7-test-references-validator.js';
import type { RepositorySnapshot } from '../../../src/contracts/snapshot.js';
import type { RepositoryAdapter } from '../../../src/contracts/repository-adapter.js';

describe('V7 Test References Validator', () => {
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

  it('should pass when all test files exist', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.tests.unit = [
      { name: 'unit-test-1', path: '__tests__/unit/test1.test.ts', testCount: 5 },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);

    const result = await validateTestReferences(snapshot, mockAdapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when test file does not exist', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.tests.unit = [
      { name: 'missing-test', path: '__tests__/unit/missing.test.ts', testCount: 3 },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(false);

    const result = await validateTestReferences(snapshot, mockAdapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]?.code).toBe('TEST_FILE_NOT_FOUND');
    expect(result.warnings[0]?.path).toBe('__tests__/unit/missing.test.ts');
  });

  it('should check all test types (unit, integration, e2e)', async () => {
    const snapshot = createBaseSnapshot();
    snapshot.tests.unit = [
      { name: 'unit-test', path: '__tests__/unit/test.test.ts', testCount: 5 },
    ];
    snapshot.tests.integration = [
      { name: 'integration-test', path: '__tests__/integration/test.test.ts', testCount: 3 },
    ];
    snapshot.tests.e2e = [
      { name: 'e2e-test', path: 'tests/e2e/test.spec.ts', testCount: 2 },
    ];

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);

    const result = await validateTestReferences(snapshot, mockAdapter);

    expect(mockAdapter.fileExists).toHaveBeenCalledTimes(3);
    expect(result.warnings).toHaveLength(0);
  });
});
