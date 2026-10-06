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
          evidenceId: 'evidence-types',
        },
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: ['@quiz/types'],
          exports: [],
          evidenceId: 'evidence-ui',
        },
        {
          name: '@quiz/db-tutorial',
          path: 'packages/db-tutorial',
          version: '1.0.0',
          dependencies: ['@quiz/types'],
          exports: [],
          evidenceId: 'evidence-db-tutorial',
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
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/ui:
    dependencies:
      '@quiz/types':
        specifier: workspace:*
        version: link:../types
      react:
        specifier: ^18.0.0
        version: 18.2.0
  packages/db-tutorial:
    dependencies:
      '@quiz/types':
        specifier: workspace:*
        version: link:../types
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockImplementation(async (path: string) => {
        return path !== 'nonexistent.json';
      }),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    // Verify nodes (3 workspace + 1 external)
    expect(result.data.nodes).toHaveLength(4);
    
    const workspaceNodes = result.data.nodes.filter(n => n.name.startsWith('@quiz/'));
    expect(workspaceNodes).toHaveLength(3);
    expect(workspaceNodes[0]?.name).toBe('@quiz/types');
    expect(workspaceNodes[1]?.name).toBe('@quiz/ui');
    expect(workspaceNodes[2]?.name).toBe('@quiz/db-tutorial');
    
    // External node for react
    const reactNode = result.data.nodes.find(n => n.name === 'react');
    expect(reactNode).toBeDefined();
    expect(reactNode?.version).toBe('18.2.0');

    // Verify edges now include ALL dependencies (workspace + external)
    expect(result.data.edges.length).toBeGreaterThan(0);
    
    const uiToTypes = result.data.edges.find(
      e => e.from === '@quiz/ui' && e.to === '@quiz/types'
    );
    expect(uiToTypes).toBeDefined();
    expect(uiToTypes?.kind).toBe('dependency');
    expect(uiToTypes?.requestedVersion).toBe('workspace:*');
    
    // Should also track external dependencies now
    const uiToReact = result.data.edges.find(
      e => e.from === '@quiz/ui' && e.to === 'react'
    );
    expect(uiToReact).toBeDefined();
    expect(uiToReact?.requestedVersion).toBe('^18.0.0');
    expect(uiToReact?.resolvedVersion).toBe('18.2.0');
  });

  it('should track both workspace and external dependencies', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: [],
          exports: [],
          evidenceId: 'evidence-ui',
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
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/ui:
    dependencies:
      '@quiz/types':
        specifier: workspace:*
        version: link:../types
      react:
        specifier: ^18.0.0
        version: 18.2.0
      next:
        specifier: ^16.0.0
        version: 16.1.0
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    // Should have edges for ALL dependencies (workspace + external)
    expect(result.data.edges).toHaveLength(3);
    
    const workspaceEdge = result.data.edges.find(e => e.to === '@quiz/types');
    expect(workspaceEdge?.requestedVersion).toBe('workspace:*');
    
    const externalEdges = result.data.edges.filter(e => !e.requestedVersion?.startsWith('workspace:'));
    expect(externalEdges).toHaveLength(2);
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
          evidenceId: 'evidence-ui',
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
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/ui:
    dependencies:
      '@quiz/types':
        specifier: workspace:*
        version: link:../types
    devDependencies:
      '@quiz/test-utils':
        specifier: workspace:*
        version: link:../test-utils
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
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
          evidenceId: 'evidence-a',
        },
        {
          name: '@quiz/b',
          path: 'packages/b',
          version: '1.0.0',
          dependencies: [],
          exports: [],
          evidenceId: 'evidence-b',
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
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/a:
    dependencies:
      '@quiz/b':
        specifier: workspace:*
        version: link:../b
  packages/b:
    dependencies:
      '@quiz/a':
        specifier: workspace:*
        version: link:../a
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    const circularFinding = result.findings.find(
      f => f.category === 'dependencies-circular'
    );
    expect(circularFinding).toBeDefined();
    expect(circularFinding?.severity).toBe('warning');
  });

  it('should detect version conflicts', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/ui',
          path: 'packages/ui',
          version: '1.0.0',
          dependencies: [],
          exports: [],
          evidenceId: 'evidence-ui',
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
              'react': '^18.0.0', // Requested v18
            },
          });
        }
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/ui:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 19.0.0  # Resolved to v19 - breaking change!
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    const conflictFinding = result.findings.find(
      f => f.category === 'dependencies-version-conflict'
    );
    expect(conflictFinding).toBeDefined();
    expect(conflictFinding?.severity).toBe('warning');
  });

  it('should generate evidence for dependency declarations and resolutions', async () => {
    const structureData = {
      applications: [],
      packages: [
        {
          name: '@quiz/types',
          path: 'packages/types',
          version: '1.0.0',
          dependencies: [],
          exports: [],
          evidenceId: 'evidence-types',
        },
      ] as PackageInfo[],
      services: [],
    };

    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('packages/types')) {
          return JSON.stringify({
            name: '@quiz/types',
            dependencies: {},
          });
        }
        if (path === 'pnpm-lock.yaml') {
          return `
lockfileVersion: '9.0'
importers:
  packages/types:
    dependencies: {}
`;
        }
        return '{}';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanDependencies(mockAdapter, structureData);

    expect(result.evidence.length).toBeGreaterThan(0);
    
    // Should have evidence for dependency declarations
    const declarationEvidence = result.evidence.find(e => e.kind === 'dependency-declaration');
    expect(declarationEvidence).toBeDefined();
    
    // Should have evidence for lockfile resolution
    const resolutionEvidence = result.evidence.find(e => e.kind === 'dependency-resolution');
    expect(resolutionEvidence).toBeDefined();
  });
});
