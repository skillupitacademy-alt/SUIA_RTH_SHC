import { describe, it, expect, vi } from 'vitest';
import { validateEvidencePaths } from '../../src/validation/v3-evidence-paths-validator.js';
import type { RepositorySnapshot } from '../../src/contracts/snapshot.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import type { Evidence } from '../../src/contracts/evidence.js';

// Shared test helper functions
function createMockSnapshot(evidence: Evidence[]): RepositorySnapshot {
  return {
    schemaVersion: '1.1.0',
    repository: {
      owner: 'test',
      name: 'test-repo',
      commitSha: 'test-sha',
      scanTimestamp: '2024-01-01T00:00:00.000Z',
    },
    structure: {
      applications: [],
      packages: [],
      services: [],
    },
    runtime: {
      frameworks: [],
      workspace: { manager: 'pnpm', version: '8.0.0', packages: [] },
      buildSystem: { tool: 'turbo', version: '1.0.0', config: '' },
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

describe('V3 Evidence Paths Validator', () => {
  it('should error on missing critical evidence (type-definition)', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-abc123',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/types/missing.ts',
        kind: 'type-definition',
        lifecycle: 'current',
        claim: 'Type definition discovered',
        locator: 'file:src/types/missing.ts',
        contentHash: 'hash123',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(new Map([['src/types/missing.ts', false]]), new Map());

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
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
        lifecycle: 'current',
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
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
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
        lifecycle: 'current',
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
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
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
        lifecycle: 'historical',
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
        lifecycle: 'historical',
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
        lifecycle: 'historical',
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
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_CONTENT_HASH_MISMATCH');
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
        lifecycle: 'current',
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
        lifecycle: 'current',
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
        lifecycle: 'current',
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
        lifecycle: 'historical',
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
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
  });
});

describe('V3 Evidence Lifecycle Validation', () => {
  it('should error on missing current evidence', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-current-001',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/components/CurrentComponent.tsx',
        kind: 'component',
        lifecycle: 'current',
        claim: 'Current component implementation',
        locator: 'file:src/components/CurrentComponent.tsx',
        contentHash: 'hash-current-001',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/components/CurrentComponent.tsx', false]]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
    expect(result.errors[0]?.path).toBe('src/components/CurrentComponent.tsx');
    expect(result.errors[0]?.details?.lifecycle).toBe('current');
    expect(result.warnings).toHaveLength(0);
  });

  it('should error on current evidence content hash mismatch', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-current-002',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/services/CurrentService.ts',
        kind: 'service',
        lifecycle: 'current',
        claim: 'Current service implementation',
        locator: 'file:src/services/CurrentService.ts',
        contentHash: 'original-hash-current',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/services/CurrentService.ts', true]]),
      new Map([['src/services/CurrentService.ts', 'modified-hash-current']])
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_CONTENT_HASH_MISMATCH');
    expect(result.errors[0]?.path).toBe('src/services/CurrentService.ts');
    expect(result.errors[0]?.details?.lifecycle).toBe('current');
    expect(result.errors[0]?.details?.expectedHash).toBe('original-hash-current');
    expect(result.errors[0]?.details?.actualHash).toBe('modified-hash-current');
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn on missing historical evidence', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-historical-001',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/old/HistoricalComponent.tsx',
        kind: 'component',
        lifecycle: 'historical',
        claim: 'Historical component implementation',
        locator: 'file:src/old/HistoricalComponent.tsx',
        contentHash: 'hash-historical-001',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/old/HistoricalComponent.tsx', false]]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
    expect(result.warnings[0]?.path).toBe('src/old/HistoricalComponent.tsx');
    expect(result.warnings[0]?.details?.lifecycle).toBe('historical');
  });

  it('should warn on historical evidence content hash mismatch', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-historical-002',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/legacy/LegacyService.ts',
        kind: 'service',
        lifecycle: 'historical',
        claim: 'Historical service implementation',
        locator: 'file:src/legacy/LegacyService.ts',
        contentHash: 'original-hash-historical',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([['src/legacy/LegacyService.ts', true]]),
      new Map([['src/legacy/LegacyService.ts', 'modified-hash-historical']])
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_CONTENT_HASH_MISMATCH');
    expect(result.warnings[0]?.path).toBe('src/legacy/LegacyService.ts');
    expect(result.warnings[0]?.details?.lifecycle).toBe('historical');
    expect(result.warnings[0]?.details?.expectedHash).toBe('original-hash-historical');
    expect(result.warnings[0]?.details?.actualHash).toBe('modified-hash-historical');
  });

  it('should skip hash check for directory evidence regardless of lifecycle', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-dir-current',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/current-app',
        kind: 'directory',
        lifecycle: 'current',
        claim: 'Current application directory',
        locator: 'directory:apps/current-app',
        contentHash: '',
      },
      {
        evidenceId: 'evidence-dir-historical',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/old-app',
        kind: 'directory',
        lifecycle: 'historical',
        claim: 'Historical application directory',
        locator: 'directory:apps/old-app',
        contentHash: '',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([
        ['apps/current-app', true],
        ['apps/old-app', true],
      ]),
      new Map()
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should handle mixed current and historical evidence with appropriate severity', async () => {
    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-mix-001',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/types/CurrentType.ts',
        kind: 'type-definition',
        lifecycle: 'current',
        claim: 'Current type definition',
        locator: 'file:src/types/CurrentType.ts',
        contentHash: 'hash-current-type',
      },
      {
        evidenceId: 'evidence-mix-002',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/old/OldType.ts',
        kind: 'type-definition',
        lifecycle: 'historical',
        claim: 'Historical type definition',
        locator: 'file:src/old/OldType.ts',
        contentHash: 'hash-old-type',
      },
      {
        evidenceId: 'evidence-mix-003',
        scannerName: 'D3-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'src/services/CurrentService.ts',
        kind: 'service',
        lifecycle: 'current',
        claim: 'Current service',
        locator: 'file:src/services/CurrentService.ts',
        contentHash: 'hash-current-service',
      },
    ];

    const snapshot = createMockSnapshot(evidence);
    const adapter = createMockAdapter(
      new Map([
        ['src/types/CurrentType.ts', false], // current missing → error
        ['src/old/OldType.ts', false], // historical missing → warning
        ['src/services/CurrentService.ts', true], // current exists with hash mismatch → error
      ]),
      new Map([
        ['src/services/CurrentService.ts', 'modified-hash-current-service'],
      ])
    );

    const result = await validateEvidencePaths(snapshot, adapter);

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]?.code).toBe('CURRENT_EVIDENCE_PATH_NOT_FOUND');
    expect(result.errors[1]?.code).toBe('CURRENT_EVIDENCE_CONTENT_HASH_MISMATCH');
    
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe('HISTORICAL_EVIDENCE_PATH_NOT_FOUND');
  });
});
