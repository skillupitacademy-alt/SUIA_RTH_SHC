import { describe, it, expect, vi } from 'vitest';
import { validateEvidencePaths } from '../../src/validation/v3-evidence-paths-validator.js';
import type { RepositorySnapshot } from '../../src/contracts/snapshot.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import type { Evidence } from '../../src/contracts/evidence.js';

describe('V3 Evidence Paths Validator', () => {
  function createMockSnapshot(evidence: Evidence[]): RepositorySnapshot {
    return {
      repository: {
        rootPath: '/test/repo',
        scanTimestamp: '2024-01-01T00:00:00.000Z',
      },
      applications: [],
      packages: [],
      services: [],
      frameworks: [],
      workspace: { manager: 'pnpm', version: '8.0.0', packages: [] },
      buildSystem: { tool: 'turbo', version: '1.0.0', config: '' },
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
      evidence,
      findings: [],
      canonicalHash: 'test-hash',
    };
  }

  function createMockAdapter(
    fileExistsMap: Map<string, boolean>,
    fileHashMap: Map<string, string>
  ): RepositoryAdapter {
    return {
      fileExists: vi.fn(async (path: string) => fileExistsMap.get(path) ?? false),
      readFile: vi.fn(async () => ''),
      getFileHash: vi.fn(async (path: string) => fileHashMap.get(path) ?? 'default-hash'),
      listFiles: vi.fn(async () => []),
    } as unknown as RepositoryAdapter;
  }

  it('should error on missing critical evidence (type-definition)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-abc123',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/types/missing.ts',
        kind: 'type-definition',
        claim: 'Type definition discovered',
        locator: 'file:src/types/missing.ts',
        contentHash: 'hash123',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(new Map([['src/types/missing.ts', false]]), new Map());

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CRITICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.errors[0]?.path).toBe('src/types/missing.ts');
    expect(result.warnings).toHaveLength(0);
  });

  it('should error on missing critical evidence (component)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-def456',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/components/MissingComponent.tsx',
        kind: 'component',
        claim: 'Component discovered',
        locator: 'file:src/components/MissingComponent.tsx',
        contentHash: 'hash456',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/components/MissingComponent.tsx', false]]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CRITICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings).toHaveLength(0);
  });

  it('should error on missing critical evidence (service)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-ghi789',
        scannerName: 'D4-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/services/missing.service.ts',
        kind: 'service',
        claim: 'Service discovered',
        locator: 'file:src/services/missing.service.ts',
        contentHash: 'hash789',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/services/missing.service.ts', false]]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CRITICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn on missing non-critical evidence (directory)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-jkl012',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/missing',
        kind: 'directory',
        claim: 'Directory discovered',
        locator: 'directory:apps/missing',
        contentHash: '',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(new Map([['apps/missing', false]]), new Map());

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings[0]?.path).toBe('apps/missing');
  });

  it('should warn on missing non-critical evidence (package)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-mno345',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'packages/old/package.json',
        kind: 'package',
        claim: 'Package discovered',
        locator: 'file:packages/old/package.json',
        contentHash: 'hash345',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(new Map([['packages/old/package.json', false]]), new Map());

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
  });

  it('should warn on content hash mismatch when file exists', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-pqr678',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/modified.ts',
        kind: 'file',
        claim: 'File discovered',
        locator: 'file:src/modified.ts',
        contentHash: 'original-hash',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/modified.ts', true]]),
      new Map([['src/modified.ts', 'new-hash']])
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('EVIDENCE_CONTENT_HASH_MISMATCH');
    expect(result.warnings[0]?.path).toBe('src/modified.ts');
    expect(result.warnings[0]?.details?.expectedHash).toBe('original-hash');
    expect(result.warnings[0]?.details?.actualHash).toBe('new-hash');
  });

  it('should pass when file exists with matching content hash', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-stu901',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/unchanged.ts',
        kind: 'file',
        claim: 'File discovered',
        locator: 'file:src/unchanged.ts',
        contentHash: 'matching-hash',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/unchanged.ts', true]]),
      new Map([['src/unchanged.ts', 'matching-hash']])
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should not check hash for directories (empty contentHash)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-vwx234',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/admin',
        kind: 'directory',
        claim: 'Directory discovered',
        locator: 'directory:apps/admin',
        contentHash: '',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(new Map([['apps/admin', true]]), new Map());

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should handle mixed critical and non-critical evidence', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-001',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/types/missing-critical.ts',
        kind: 'type-definition',
        claim: 'Critical type definition',
        locator: 'file:src/types/missing-critical.ts',
        contentHash: 'hash001',
      },
      {
        evidenceId: 'evidence-002',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'docs/missing-historical.md',
        kind: 'documentation',
        claim: 'Historical documentation',
        locator: 'file:docs/missing-historical.md',
        contentHash: 'hash002',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([
        ['src/types/missing-critical.ts', false],
        ['docs/missing-historical.md', false],
      ]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CRITICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
  });
});
