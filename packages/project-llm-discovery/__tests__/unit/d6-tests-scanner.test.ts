import { describe, it, expect, vi } from 'vitest';
import { scanTests } from '../../src/scanners/d6-tests-scanner.js';
import type { RepositoryAdapter } from '../../src/contracts/repository-adapter.js';

describe('D6 Tests Scanner', () => {
  it('should discover Vitest workspace configuration', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('vitest.workspace.ts')) {
          return `
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'apps/*',
]);
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.data.unit.length).toBeGreaterThan(0);
    
    const packagesProject = result.data.unit.find(s => s.name === 'packages/*');
    expect(packagesProject).toBeDefined();
    
    const appsProject = result.data.unit.find(s => s.name === 'apps/*');
    expect(appsProject).toBeDefined();
  });

  it('should discover __tests__ directories', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path === '.') {
          return [
            'packages/types/__tests__/unit/types.test.ts',
            'packages/ui/__tests__/unit/components.test.ts',
            'packages/db-tutorial/__tests__/integration/service.test.ts',
          ];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.data.unit.length).toBeGreaterThan(0);
    expect(result.data.integration.length).toBeGreaterThan(0);
  });

  it('should discover test files (*.test.ts, *.spec.ts)', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path === '.') {
          return [
            'packages/types/__tests__/blocks.test.ts',
            'packages/ui/__tests__/components/Button.spec.ts',
            'node_modules/some-lib/test.test.ts', // Should be ignored
          ];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    // Should find test files evidence
    const testFileEvidence = result.evidence.filter(e => e.kind === 'test-file');
    expect(testFileEvidence.length).toBeGreaterThan(0);
    
    // Should not include node_modules
    const nodeModulesEvidence = testFileEvidence.find(e => e.path.includes('node_modules'));
    expect(nodeModulesEvidence).toBeUndefined();
  });

  it('should discover Playwright E2E configuration', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('playwright.config.ts')) {
          return `
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
});
          `;
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.data.e2e.length).toBeGreaterThan(0);
    
    const e2eSuite = result.data.e2e.find(s => s.path === './tests/e2e');
    expect(e2eSuite).toBeDefined();
  });

  it('should discover tests/e2e directory', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path === '.') {
          return [
            'tests/e2e/login.spec.ts',
            'tests/e2e/tutorial.spec.ts',
            'tests/e2e/admin.spec.ts',
          ];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.data.e2e.length).toBeGreaterThan(0);
    
    const e2eSuite = result.data.e2e.find(s => s.path === 'tests/e2e');
    expect(e2eSuite).toBeDefined();
    expect(e2eSuite?.testCount).toBe(3);
  });

  it('should group tests by suite type (unit vs integration vs e2e)', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockImplementation(async (path: string) => {
        if (path === '.') {
          return [
            'packages/types/__tests__/unit/types.test.ts',
            'packages/db-tutorial/__tests__/integration/service.test.ts',
            'tests/e2e/login.spec.ts',
          ];
        }
        return [];
      }),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.data.unit.length).toBeGreaterThan(0);
    expect(result.data.integration.length).toBeGreaterThan(0);
    expect(result.data.e2e.length).toBeGreaterThan(0);
  });

  it('should generate warning if no unit tests found', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockResolvedValue(''),
      fileExists: vi.fn().mockResolvedValue(false),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    const noUnitTestsFinding = result.findings.find(
      f => f.category === 'tests-missing' && f.severity === 'warning'
    );
    expect(noUnitTestsFinding).toBeDefined();
    expect(noUnitTestsFinding?.message).toContain('No unit test suites discovered');
  });

  it('should generate evidence for all test infrastructure discoveries', async () => {
    const mockAdapter: RepositoryAdapter = {
      readFile: vi.fn().mockImplementation(async (path: string) => {
        if (path.includes('vitest.workspace.ts')) {
          return "export default ['packages/*']";
        }
        return '';
      }),
      fileExists: vi.fn().mockResolvedValue(true),
      listFiles: vi.fn().mockResolvedValue([]),
      getFileHash: vi.fn().mockResolvedValue('mockhash'),
      getGitCommit: vi.fn().mockResolvedValue('abc123'),
      getGitRoot: vi.fn().mockResolvedValue('/repo'),
      runCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    };

    const result = await scanTests(mockAdapter);

    expect(result.evidence.length).toBeGreaterThan(0);
    
    const configEvidence = result.evidence.find(e => e.kind === 'config');
    expect(configEvidence).toBeDefined();
    expect(configEvidence?.claim).toContain('configuration discovered');
  });
});
