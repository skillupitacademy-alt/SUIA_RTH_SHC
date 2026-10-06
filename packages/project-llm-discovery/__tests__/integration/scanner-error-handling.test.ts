import { describe, it, expect, vi } from 'vitest';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';
import { FileNotFoundError, PermissionError } from '../../src/contracts/errors.js';
import { scanRepositoryStructure } from '../../src/scanners/d1-structure-scanner.js';
import { scanRuntime } from '../../src/scanners/d2-runtime-scanner.js';
import { scanBlocks } from '../../src/scanners/d3-blocks-scanner.js';
import { scanComposer } from '../../src/scanners/d4-composer-scanner.js';
import { scanDependencies } from '../../src/scanners/d5-dependencies-scanner.js';
import { scanTests } from '../../src/scanners/d6-tests-scanner.js';

/**
 * Integration tests for scanner error handling
 * 
 * Verifies that scanners handle FileNotFoundError gracefully (log finding, continue)
 * and propagate PermissionError/RepositoryAccessError (critical infrastructure failures).
 */
describe('Scanner Error Handling Integration', () => {
  describe('D1 structure scanner', () => {
    it('should handle missing apps/ directory gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn(),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanRepositoryStructure(mockAdapter);

      expect(result.data.applications).toEqual([]);
      expect(result.data.packages).toEqual([]);
      expect(result.data.services).toEqual([]);
      // Should not throw, should return empty arrays
    });

    it('should propagate PermissionError from directory listing', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn().mockRejectedValue(
          new PermissionError('apps', '/test/repo', 'read')
        ),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn(),
        getGitRoot: vi.fn(),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      await expect(scanRepositoryStructure(mockAdapter)).rejects.toThrow(PermissionError);
    });
  });

  describe('D2 runtime scanner', () => {
    it('should handle missing pnpm-workspace.yaml gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn(),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanRuntime(mockAdapter);

      expect(result.data.workspace.manager).toBe('unknown');
      expect(result.data.buildSystem.tool).toBe('unknown');
      // Should not throw, should continue with defaults
    });

    it('should propagate PermissionError from directory listing', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn().mockRejectedValue(
          new PermissionError('apps', '/test/repo', 'read')
        ),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn(),
        getGitRoot: vi.fn(),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      // Mock pnpm-workspace.yaml with apps/* pattern
      vi.mocked(mockAdapter.readFile).mockResolvedValue('packages:\n  - "apps/*"');

      await expect(scanRuntime(mockAdapter)).rejects.toThrow(PermissionError);
    });
  });

  describe('D3 blocks scanner', () => {
    it('should handle missing block corpus doc gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn().mockResolvedValue([]),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanBlocks(mockAdapter);

      // When file doesn't exist, fileExists returns false and scanner continues
      expect(result.data.documented).toEqual([]);
      // Should not throw, should continue with empty documented list
    });

    it('should handle FileNotFoundError during readFile gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn().mockRejectedValue(
          new FileNotFoundError('ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md', '/test/repo')
        ),
        fileExists: vi.fn().mockResolvedValue(true), // File exists check passes, but read fails
        listFiles: vi.fn().mockResolvedValue([]),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanBlocks(mockAdapter);

      expect(result.data.documented).toEqual([]);
      
      // D3 logs warning when corpus doc read fails with FileNotFoundError
      const hasWarning = result.findings.some(f => {
        return f.severity === 'warning' && 
               f.category === 'blocks-discovery' &&
               f.message.includes('Block corpus registry not found');
      });
      expect(hasWarning).toBe(true);
      // Should not throw, should log warning and continue
    });
  });

  describe('D4 composer scanner', () => {
    it('should handle missing composer service gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn().mockRejectedValue(
          new FileNotFoundError('packages/db-tutorial/src/services/tutorial-composer.service.ts', '/test/repo')
        ),
        fileExists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn().mockResolvedValue([]),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanComposer(mockAdapter);

      expect(result.data.services).toEqual([]);
      expect(result.findings.some(f => f.severity === 'error' && f.message.includes('No TutorialComposerService found'))).toBe(true);
      // Should not throw, should log error finding and continue
    });

    it('should propagate PermissionError from API directory listing', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn(),
        fileExists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn().mockRejectedValue(
          new PermissionError('apps/skillhubcore-admin/src/app/api/tutorial-composer', '/test/repo', 'read')
        ),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn(),
        getGitRoot: vi.fn(),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      await expect(scanComposer(mockAdapter)).rejects.toThrow(PermissionError);
    });
  });

  describe('D5 dependencies scanner', () => {
    it('should handle missing package.json gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn().mockRejectedValue(
          new FileNotFoundError('packages/test-pkg/package.json', '/test/repo')
        ),
        fileExists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn(),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const structureData = {
        applications: [],
        packages: [
          { name: '@quiz/test-pkg', path: 'packages/test-pkg', version: '1.0.0', dependencies: [], exports: [] },
        ],
        services: [],
      };

      const result = await scanDependencies(mockAdapter, structureData);

      expect(result.data.nodes).toHaveLength(1);
      expect(result.data.edges).toEqual([]);
      expect(result.findings.some(f => f.severity === 'warning' && f.message.includes('Package file not found'))).toBe(true);
      // Should not throw, should log warning and continue
    });

    it('should propagate PermissionError from package.json read', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn().mockRejectedValue(
          new PermissionError('packages/test-pkg/package.json', '/test/repo', 'read')
        ),
        fileExists: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn(),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn(),
        getGitRoot: vi.fn(),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const structureData = {
        applications: [],
        packages: [
          { name: '@quiz/test-pkg', path: 'packages/test-pkg', version: '1.0.0', dependencies: [], exports: [] },
        ],
        services: [],
      };

      await expect(scanDependencies(mockAdapter, structureData)).rejects.toThrow(PermissionError);
    });
  });

  describe('D6 tests scanner', () => {
    it('should handle missing vitest config gracefully', async () => {
      const mockAdapter: RepositoryAdapter = {
        readFile: vi.fn().mockRejectedValue(
          new FileNotFoundError('vitest.config.ts', '/test/repo')
        ),
        fileExists: vi.fn().mockResolvedValue(false),
        listFiles: vi.fn().mockResolvedValue([]),
        getFileHash: vi.fn(),
        getGitCommit: vi.fn().mockResolvedValue('abc123'),
        getGitRoot: vi.fn().mockResolvedValue('/test/repo'),
        runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
      };

      const result = await scanTests(mockAdapter);

      // D6 scanner continues without test framework config
      expect(result.data).toBeDefined();
      // Should not throw, should continue with empty test data
    });
  });
});
