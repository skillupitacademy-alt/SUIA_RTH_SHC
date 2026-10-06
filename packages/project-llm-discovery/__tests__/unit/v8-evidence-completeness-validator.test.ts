import { describe, it, expect } from 'vitest';
import { validateEvidenceCompleteness } from '../../src/validation/v8-evidence-completeness-validator.js';
import type { RepositorySnapshot } from '../../src/contracts/snapshot.js';
import type { Evidence } from '../../src/contracts/evidence.js';
import type { ApplicationInfo, PackageInfo, ServiceInfo } from '../../src/contracts/snapshot.js';

describe('V8 Evidence Completeness Validator', () => {
  function createMockSnapshot(
    applications: ApplicationInfo[],
    packages: PackageInfo[],
    services: ServiceInfo[],
    evidence: Evidence[]
  ): RepositorySnapshot {
    return {
      repository: {
        rootPath: '/test/repo',
        scanTimestamp: '2024-01-01T00:00:00.000Z',
      },
      structure: {
        applications,
        packages,
        services,
      },
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
    } as RepositorySnapshot;
  }

  it('should not warn when application has matching evidence', async () => {
    const applications: ApplicationInfo[] = [
      {
        name: 'admin',
        path: 'apps/admin',
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-001',
      },
    ];

    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-001',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/admin',
        kind: 'package',
        claim: 'Application package.json discovered',
        locator: 'file:apps/admin/package.json',
        contentHash: 'hash001',
        lifecycle: 'current',
      },
    ];

    const snapshot = createMockSnapshot(applications, [], [], evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when application has no matching evidence', async () => {
    const applications: ApplicationInfo[] = [
      {
        name: 'admin',
        path: 'apps/admin',
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-999',
      },
    ];

    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-002',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/other/package.json',
        kind: 'package',
        claim: 'Other package discovered',
        locator: 'file:apps/other/package.json',
        contentHash: 'hash002',
        lifecycle: 'current',
      },
    ];

    const snapshot = createMockSnapshot(applications, [], [], evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.code).toBe('UNKNOWN_EVIDENCE_ID');
    expect(result.errors[0]?.path).toBe('apps/admin');
  });

  it('should normalize Windows and Unix paths correctly', async () => {
    const applications: ApplicationInfo[] = [
      {
        name: 'admin',
        path: 'apps\\admin', // Windows path
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-003',
      },
    ];

    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-003',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps\\admin', // Must match exactly
        kind: 'package',
        claim: 'Application package.json discovered',
        locator: 'file:apps/admin/package.json',
        contentHash: 'hash003',
        lifecycle: 'current',
      },
    ];

    const snapshot = createMockSnapshot(applications, [], [], evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn for missing package evidence', async () => {
    const packages: PackageInfo[] = [
      {
        name: '@quiz/ui',
        path: 'packages/ui',
        version: '1.0.0',
        dependencies: [],
        exports: [],
        evidenceId: '', // Empty evidenceId
      },
    ];

    const evidence: Evidence[] = [];

    const snapshot = createMockSnapshot([], packages, [], evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.code).toBe('MISSING_EVIDENCE_ID');
    expect(result.errors[0]?.path).toBe('packages/ui');
  });

  it('should warn for missing service evidence', async () => {
    const services: ServiceInfo[] = [
      {
        name: 'api-service',
        path: 'services/api',
        type: 'service',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-service-001',
      },
    ];

    const evidence: Evidence[] = [];

    const snapshot = createMockSnapshot([], [], services, evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.code).toBe('UNKNOWN_EVIDENCE_ID');
    expect(result.errors[0]?.path).toBe('services/api');
  });

  it('should handle multiple entities with mixed evidence', async () => {
    const applications: ApplicationInfo[] = [
      {
        name: 'admin',
        path: 'apps/admin',
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-004',
      },
      {
        name: 'web',
        path: 'apps/web',
        type: 'application',
        framework: 'next',
        entrypoint: 'src/index.ts',
        evidenceId: 'evidence-web-missing',
      },
    ];

    const evidence: Evidence[] = [
      {
        evidenceId: 'evidence-004',
        scannerName: 'D1-scanner',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: 'apps/admin',
        kind: 'package',
        claim: 'Admin application discovered',
        locator: 'file:apps/admin/package.json',
        contentHash: 'hash004',
        lifecycle: 'current',
      },
    ];

    const snapshot = createMockSnapshot(applications, [], [], evidence);
    const result = await validateEvidenceCompleteness(snapshot);

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.code).toBe('UNKNOWN_EVIDENCE_ID');
    expect(result.errors[0]?.details?.entity).toBe('web');
  });
});
