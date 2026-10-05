import { describe, it, expect } from 'vitest';
import type {
  RepositoryAdapter,
  Evidence,
  Finding,
  ScannerResult,
  RepositorySnapshot,
} from '../../src/index.js';

describe('Contract types', () => {
  it('should export RepositoryAdapter interface', () => {
    const adapter: RepositoryAdapter = {
      readFile: async () => '',
      fileExists: async () => false,
      listFiles: async () => [],
      getFileHash: async () => '',
      getGitCommit: async () => '',
      getGitRoot: async () => '',
    };
    expect(adapter).toBeDefined();
  });

  it('should export Evidence interface', () => {
    const evidence: Evidence = {
      evidenceId: 'test',
      scannerName: 'test-scanner',
      timestamp: '2024-01-01',
      path: '/test',
      kind: 'file',
      claim: 'test claim',
      locator: 'test:locator',
      contentHash: 'abc123',
    };
    expect(evidence).toBeDefined();
  });

  it('should export Finding interface', () => {
    const finding: Finding = {
      findingId: 'test',
      severity: 'info',
      category: 'test',
      message: 'test message',
    };
    expect(finding).toBeDefined();
  });

  it('should export ScannerResult interface', () => {
    const result: ScannerResult = {
      scannerName: 'test',
      timestamp: '2024-01-01',
      evidence: [],
      findings: [],
      data: {},
    };
    expect(result).toBeDefined();
  });

  it('should export RepositorySnapshot interface', () => {
    const snapshot: RepositorySnapshot = {
      schemaVersion: '1.0.0',
      repository: {
        owner: 'test',
        name: 'test',
        commitSha: 'abc123',
        scanTimestamp: '2024-01-01',
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
          version: '9.0.0',
          packages: [],
        },
        buildSystem: {
          tool: 'turbo',
          version: '2.0.0',
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
      canonicalHash: 'abc123',
    };
    expect(snapshot).toBeDefined();
  });
});
