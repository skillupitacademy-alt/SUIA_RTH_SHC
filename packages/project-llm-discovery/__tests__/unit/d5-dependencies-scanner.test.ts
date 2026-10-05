import { describe, it, expect, vi } from 'vitest';
import { scanDependencies } from '../../src/scanners/d5-dependencies-scanner.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import type { PackageInfo } from '../../src/contracts/snapshot.js';

describe('D5 Dependencies Scanner', () => {
  it('should build dependency graph from package.json files', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/types',
          path: 'packages/types',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: ['@quiz/types'],
          exports: [],
        },
        {
          name: '@quiz/db-tutorial',
          path: 'packages/db-tutorial',
          version: '1.0.0',
          dependencies: ['@quiz/types'],
          exports: [],
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('packages/types')) {
          return JSON.stringify({
            name: '@quiz/types',
            version: '1.0.0',
            dependencies: {},
          });
        }
        if (path.includes('packages/ui')) {
          return JSON.stringify({
            name: '@quiz/ui',
            version: '1.0.0',
            dependencies: {
              '@quiz/types': 'workspace:*',
              'react': '^18.0.0',
            },
          });
        }
        if (path.includes('packages/db-tutorial')) {
          return JSON.stringify({
            name: '@quiz/db-tutorial',
            version: '1.0.0',
            dependencies: {
              '@quiz/types': 'workspace:*',
            },
          });
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    // Verify nodes
    expect(result.data.nodes).toHaveLength(3);
    expect(result.data.nodes[0]?.name).toBe('@quiz/types');
    expect(result.data.nodes[1]?.name).toBe('@quiz/ui');
    expect(result.data.nodes[2]?.name).toBe('@quiz/db-tutorial');

    // Verify edges (only workspace dependencies)
    expect(result.data.edges.length).toBeGreaterThan(0);
    
    const uiToTypes = result.data.edges.find(
      e => e.from === '@quiz/ui' && e.to === '@quiz/types'
    );
    expect(uiToTypes).toBeDefined();
    expect(uiToTypes?.kind).toBe('dependency');
  });

  it('should only track workspace dependencies (@quiz/*)', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('packages/ui')) {
          return JSON.stringify({
            name: '@quiz/ui',
            version: '1.0.0',
            dependencies: {
              '@quiz/types': 'workspace:*',
              'react': '^18.0.0',
              'next': '^16.0.0',
            },
          });
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    // Should only have edges for @quiz/* dependencies
    expect(result.data.edges).toHaveLength(1);
    expect(result.data.edges[0]?.to).toBe('@quiz/types');
  });

  it('should distinguish between dependency types', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('packages/ui')) {
          return JSON.stringify({
            name: '@quiz/ui',
            version: '1.0.0',
            dependencies: {
              '@quiz/types': 'workspace:*',
            },
            devDependencies: {
              '@quiz/test-utils': 'workspace:*',
            },
            peerDependencies: {
              '@quiz/config': 'workspace:*',
            },
          });
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    expect(result.data.edges).toHaveLength(3);
    
    const depEdge = result.data.edges.find(e => e.kind === 'dependency');
    expect(depEdge?.to).toBe('@quiz/types');
    
    const devDepEdge = result.data.edges.find(e => e.kind === 'devDependency');
    expect(devDepEdge?.to).toBe('@quiz/test-utils');
    
    const peerDepEdge = result.data.edges.find(e => e.kind === 'peerDependency');
    expect(peerDepEdge?.to).toBe('@quiz/config');
  });

  it('should detect circular dependencies', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/a',
          path: 'packages/a',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
        {
          name: '@quiz/b',
          path: 'packages/b',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('packages/a')) {
          return JSON.stringify({
            name: '@quiz/a',
            dependencies: { '@quiz/b': 'workspace:*' },
          });
        }
        if (path.includes('packages/b')) {
          return JSON.stringify({
            name: '@quiz/b',
            dependencies: { '@quiz/a': 'workspace:*' },
          });
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    const circularFinding = result.findings.find(
      f => f.category === 'dependencies-circular'
    );
    expect(circularFinding).toBeDefined();
    expect(circularFinding?.severity).toBe('warning');
  });

  it('should generate evidence for each package.json read', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/types',
          path: 'packages/types',
          version: '1.0.0',
          dependencies: [],
          exports: [],
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(JSON.stringify({
        name: '@quiz/types',
        dependencies: {},
      })),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    expect(result.evidence.length).toBeGreaterThan(0);
    
    const pkgEvidence = result.evidence.find(e => e.kind === 'package');
    expect(pkgEvidence).toBeDefined();
    expect(pkgEvidence?.claim).toContain('dependencies analyzed');
  });
});
