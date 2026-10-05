import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanRepositoryStructure } from '../../src/scanners/d1-structure-scanner.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';

describe('D1 Structure Scanner', () => {
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

  it('should discover applications from apps/ directory', async () => {
    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'apps') {
        return ['apps/app1/package.json', 'apps/app2/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);
    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path.includes('app1')) {
        return JSON.stringify({
          name: '@quiz/app1',
          version: '1.0.0',
          dependencies: { next: '^16.0.0' },
        });
      }
      if (path.includes('app2')) {
        return JSON.stringify({
          name: '@quiz/app2',
          version: '1.0.0',
          dependencies: { express: '^4.0.0' },
        });
      }
      return '';
    });

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.scannerName).toBe('D1-structure-scanner');
    expect(result.data.applications).toHaveLength(2);
    expect(result.data.applications[0]?.name).toBe('@quiz/app1');
    expect(result.data.applications[0]?.framework).toBe('next');
    expect(result.data.applications[1]?.name).toBe('@quiz/app2');
    expect(result.data.applications[1]?.framework).toBe('express');
  });

  it('should discover packages from packages/ directory', async () => {
    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'packages') {
        return ['packages/pkg1/package.json', 'packages/pkg2/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);
    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path.includes('pkg1')) {
        return JSON.stringify({
          name: '@quiz/pkg1',
          version: '0.1.0',
          dependencies: { typescript: '^5.0.0' },
          exports: { '.': './src/index.ts' },
        });
      }
      if (path.includes('pkg2')) {
        return JSON.stringify({
          name: '@quiz/pkg2',
          version: '0.2.0',
          devDependencies: { vitest: '^4.0.0' },
        });
      }
      return '';
    });

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.data.packages).toHaveLength(2);
    expect(result.data.packages[0]?.name).toBe('@quiz/pkg1');
    expect(result.data.packages[0]?.version).toBe('0.1.0');
    expect(result.data.packages[0]?.dependencies).toContain('typescript');
    expect(result.data.packages[0]?.exports).toContain('.');
    expect(result.data.packages[1]?.name).toBe('@quiz/pkg2');
    expect(result.data.packages[1]?.dependencies).toContain('vitest');
  });

  it('should discover services from services/ directory', async () => {
    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'services') {
        return ['services/api-gateway/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);
    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path.includes('api-gateway')) {
        return JSON.stringify({
          name: '@quiz/api-gateway',
          version: '1.0.0',
          dependencies: { fastify: '^5.0.0' },
        });
      }
      return '';
    });

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.data.services).toHaveLength(1);
    expect(result.data.services[0]?.name).toBe('@quiz/api-gateway');
    expect(result.data.services[0]?.type).toBe('service');
  });

  it('should generate evidence for discovered entities', async () => {
    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'apps') {
        return ['apps/app1/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);
    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.readFile).mockResolvedValue(
      JSON.stringify({
        name: '@quiz/app1',
        version: '1.0.0',
      })
    );

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.evidence.length).toBeGreaterThan(0);
    
    const directoryEvidence = result.evidence.find((e) => e.kind === 'directory');
    expect(directoryEvidence).toBeDefined();
    expect(directoryEvidence?.claim).toContain('directory discovered');
    
    const packageEvidence = result.evidence.find((e) => e.kind === 'package');
    expect(packageEvidence).toBeDefined();
    expect(packageEvidence?.contentHash).toBe('hash123');
  });

  it('should handle missing directories gracefully', async () => {
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);
    vi.mocked(mockAdapter.fileExists).mockResolvedValue(false);

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.data.applications).toEqual([]);
    expect(result.data.packages).toEqual([]);
    expect(result.data.services).toEqual([]);
  });

  it('should handle invalid package.json gracefully', async () => {
    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'packages') {
        return ['packages/invalid/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.fileExists).mockResolvedValue(true);
    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.readFile).mockResolvedValue('invalid json{');

    const result = await scanRepositoryStructure(mockAdapter);

    expect(result.data.packages).toEqual([]);
  });
});
