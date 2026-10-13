import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanRuntime } from '../../src/scanners/d2-runtime-scanner.js';
import type { RepositoryAdapter, ApprovedOperation } from '../../src/contracts/repository-adapter.js';

describe('D2 Runtime Scanner', () => {
  let mockAdapter: RepositoryAdapter;

  beforeEach(() => {
    mockAdapter = {
      readFile: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
      getFileHash: vi.fn(),
      getGitCommit: vi.fn(),
      getGitRoot: vi.fn(),
      runCommand: vi.fn().mockImplementation(async (operation: ApprovedOperation) => {
        // Mock successful version detection
        const versionMap: Record<string, string> = {
          node_version: 'v20.11.0',
          pnpm_version: '9.0.0',
          turbo_version: '2.0.0',
          tsc_version: 'Version 5.3.0',
          vitest_version: '1.0.0',
          playwright_version: 'Version 1.40.0',
        };
        return {
          stdout: versionMap[operation] ?? '',
          stderr: '',
          exitCode: 0,
        };
      }),
    };
  });

  it('should parse pnpm-workspace.yaml', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'pnpm-workspace.yaml';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]); // Mock listFiles for apps scanning

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'pnpm-workspace.yaml') {
        return `packages:
  - "apps/*"
  - "packages/*"
  - "services/*"`;
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    expect(result.data.workspace.manager).toBe('pnpm');
    expect(result.data.workspace.packages).toEqual([
      'apps/*',
      'packages/*',
      'services/*',
    ]);
  });

  it('should parse turbo.json', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'turbo.json';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'turbo.json') {
        return JSON.stringify({
          tasks: {
            build: { dependsOn: ['^build'] },
            test: { dependsOn: ['^build'] },
          },
          concurrency: 2,
        });
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    expect(result.data.buildSystem.tool).toBe('turbo');
    expect(result.data.buildSystem.config).toContain('build');
    expect(result.data.buildSystem.config).toContain('test');
  });

  it('should detect frameworks from root package.json', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'package.json' || path === 'pnpm-workspace.yaml';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'pnpm-workspace.yaml') {
        return 'packages:\n  - "apps/*"';
      }
      if (path === 'package.json') {
        return JSON.stringify({
          name: 'quiz-platform',
          dependencies: {},
          devDependencies: {
            next: '16.1.6',
            turbo: '2.3.3',
            pnpm: '9.15.4',
          },
        });
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    expect(result.data.frameworks).toHaveLength(1);
    expect(result.data.frameworks[0]?.name).toBe('next');
    expect(result.data.frameworks[0]?.version).toBe('16.1.6');
    expect(result.data.workspace.version).toBe('9.0.0'); // Detected from runCommand mock
  });

  it('should scan apps for framework usage', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'pnpm-workspace.yaml' || path === 'apps/app1/package.json';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');

    vi.mocked(mockAdapter.listFiles).mockImplementation(async (path: string) => {
      if (path === 'apps') {
        return ['apps/app1/package.json'];
      }
      return [];
    });

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'pnpm-workspace.yaml') {
        return `packages:
  - "apps/*"`;
      }
      if (path === 'apps/app1/package.json') {
        return JSON.stringify({
          name: '@quiz/app1',
          dependencies: {
            next: '^16.0.0',
          },
        });
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    expect(result.data.frameworks).toHaveLength(1);
    expect(result.data.frameworks[0]?.name).toBe('next');
    expect(result.data.frameworks[0]?.packages).toContain('@quiz/app1');
  });

  it('should generate evidence for configuration files', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'pnpm-workspace.yaml' || path === 'turbo.json';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'pnpm-workspace.yaml') {
        return 'packages:\n  - "apps/*"';
      }
      if (path === 'turbo.json') {
        return JSON.stringify({ tasks: {} });
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    expect(result.evidence.length).toBeGreaterThanOrEqual(2);
    
    const pnpmEvidence = result.evidence.find((e) => e.path === 'pnpm-workspace.yaml');
    expect(pnpmEvidence).toBeDefined();
    expect(pnpmEvidence?.kind).toBe('file');
    expect(pnpmEvidence?.contentHash).toBe('hash123');
    
    const turboEvidence = result.evidence.find((e) => e.path === 'turbo.json');
    expect(turboEvidence).toBeDefined();
    expect(turboEvidence?.claim).toContain('Turbo');
  });

  it('should handle missing configuration files gracefully', async () => {
    vi.mocked(mockAdapter.fileExists).mockResolvedValue(false);
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);

    const result = await scanRuntime(mockAdapter);

    expect(result.data.workspace.manager).toBe('unknown');
    expect(result.data.buildSystem.tool).toBe('unknown');
    expect(result.data.frameworks).toEqual([]);
  });

  it('should handle invalid YAML gracefully', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'pnpm-workspace.yaml';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);

    vi.mocked(mockAdapter.readFile).mockResolvedValue('invalid: yaml: [');

    const result = await scanRuntime(mockAdapter);

    // Should still set manager to pnpm since file exists, but with unknown version
    expect(result.data.workspace.manager).toBe('pnpm');
  });

  it('should handle invalid JSON gracefully', async () => {
    vi.mocked(mockAdapter.fileExists).mockImplementation(async (path: string) => {
      return path === 'turbo.json';
    });

    vi.mocked(mockAdapter.getFileHash).mockResolvedValue('hash123');
    vi.mocked(mockAdapter.listFiles).mockResolvedValue([]);

    vi.mocked(mockAdapter.readFile).mockImplementation(async (path: string) => {
      if (path === 'turbo.json') {
        return 'invalid json{';
      }
      return '';
    });

    const result = await scanRuntime(mockAdapter);

    // Invalid JSON means we don't parse it, so it stays unknown
    // (We only set tool to 'turbo' when we successfully parse the JSON)
    expect(result.data.buildSystem.tool).toBe('unknown');
  });
});
