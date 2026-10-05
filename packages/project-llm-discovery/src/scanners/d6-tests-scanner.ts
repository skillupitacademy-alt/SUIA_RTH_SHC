import { randomUUID } from 'node:crypto';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { Evidence } from '../contracts/evidence.js';
import type { TestSuite } from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../contracts/errors.js';

interface TestsData {
  unit: TestSuite[];
  integration: TestSuite[];
  e2e: TestSuite[];
}

const VITEST_WORKSPACE_PATH = 'vitest.workspace.ts';
const PLAYWRIGHT_CONFIG_PATH = 'playwright.config.ts';

/**
 * D6 Tests Scanner
 * 
 * Discovers test infrastructure across repository:
 * - Unit tests: vitest.workspace.ts configuration + **\/__tests__\/*.test.ts files
 * - Integration tests: __tests__/integration/ directories
 * - E2E tests: playwright.config.ts + tests/e2e/ directory
 */
export async function scanTests(
  adapter: RepositoryAdapter
): Promise<ScannerResult<TestsData>> {
  const scannerName = 'D6-tests-scanner';
  const timestamp = new Date().toISOString();
  const evidence: Evidence[] = [];
  const findings: Finding[] = [];

  const unit: TestSuite[] = [];
  const integration: TestSuite[] = [];
  const e2e: TestSuite[] = [];

  // Step 1: Discover Vitest workspace configuration
  try {
    if (await adapter.fileExists(VITEST_WORKSPACE_PATH)) {
      const vitestContent = await adapter.readFile(VITEST_WORKSPACE_PATH);
      const contentHash = await adapter.getFileHash(VITEST_WORKSPACE_PATH);

      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: VITEST_WORKSPACE_PATH,
        kind: 'config',
        claim: 'Vitest workspace configuration discovered',
        locator: `file:${VITEST_WORKSPACE_PATH}`,
        contentHash,
      });

      // Parse vitest workspace for test projects
      const vitestProjects = parseVitestWorkspace(vitestContent);
      
      for (const project of vitestProjects) {
        unit.push({
          name: project,
          path: project,
          testCount: 0, // Would need to scan actual test files
        });
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'info',
        category: 'tests-discovery',
        message: `Vitest workspace configuration not found: ${VITEST_WORKSPACE_PATH}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'tests-discovery',
        message: `Failed to read vitest configuration: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 2: Discover test files and group by type
  try {
    const allFiles = await adapter.listFiles('.');
    const testFiles = allFiles.filter(f => 
      ((f.endsWith('.test.ts') || f.endsWith('.spec.ts') || f.endsWith('.ts')) && 
       f.includes('__tests__')) &&
      !f.includes('node_modules')
    );

    const unitDirs = new Set<string>();
    const integrationDirs = new Set<string>();
    const testFileCounts = new Map<string, number>();

    for (const testFile of testFiles) {
      // Skip e2e tests (handled separately)
      if (testFile.includes('/e2e/') || testFile.includes('\\e2e\\')) {
        continue;
      }

      // Determine type based on path
      const isIntegration = testFile.includes('/__tests__/integration/') || 
                            testFile.includes('\\__tests__\\integration\\');
      const isUnit = testFile.includes('/__tests__/unit/') || 
                     testFile.includes('\\__tests__\\unit\\') ||
                     (testFile.includes('__tests__') && !isIntegration);

      if (isIntegration) {
        // Extract directory path (e.g., "packages/project-llm-discovery/__tests__/integration")
        // Normalize to forward slashes first
        const normalizedPath = testFile.replace(/\\/g, '/');
        const dirMatch = normalizedPath.match(/^(.+\/__tests__\/integration)/);
        if (dirMatch && dirMatch[1]) {
          const dir = dirMatch[1];
          integrationDirs.add(dir);
          testFileCounts.set(dir, (testFileCounts.get(dir) ?? 0) + 1);
        }
      } else if (isUnit) {
        // Extract package or component directory
        const normalizedPath = testFile.replace(/\\/g, '/');
        const dirMatch = normalizedPath.match(/^(.+\/__tests__)/);
        if (dirMatch && dirMatch[1]) {
          const dir = dirMatch[1];
          unitDirs.add(dir);
          testFileCounts.set(dir, (testFileCounts.get(dir) ?? 0) + 1);
        }
      }

      // Generate evidence for each test file
      try {
        const contentHash = await adapter.getFileHash(testFile);
        evidence.push({
          evidenceId: randomUUID(),
          scannerName,
          timestamp,
          path: testFile,
          kind: 'test-file',
          claim: 'Test file discovered',
          locator: `file:${testFile}`,
          contentHash,
        });
      } catch (error) {
        if (error instanceof FileNotFoundError) {
          findings.push({
            findingId: randomUUID(),
            severity: 'warning',
            category: 'tests-discovery',
            message: `Test file disappeared during scan: ${testFile}`,
          });
        }
        // Continue processing other files
      }
    }

    // Convert sets to TestSuite arrays
    for (const dir of integrationDirs) {
      integration.push({
        name: dir.split('/').pop() ?? dir,
        path: dir,
        testCount: testFileCounts.get(dir) ?? 0,
      });
    }

    for (const dir of unitDirs) {
      unit.push({
        name: dir.split('/').pop() ?? dir,
        path: dir,
        testCount: testFileCounts.get(dir) ?? 0,
      });
    }
  } catch (error) {
    if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'tests-discovery',
        message: `Failed to list test files: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 3: Discover Playwright E2E configuration
  try {
    if (await adapter.fileExists(PLAYWRIGHT_CONFIG_PATH)) {
      const playwrightContent = await adapter.readFile(PLAYWRIGHT_CONFIG_PATH);
      const contentHash = await adapter.getFileHash(PLAYWRIGHT_CONFIG_PATH);

      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: PLAYWRIGHT_CONFIG_PATH,
        kind: 'config',
        claim: 'Playwright E2E configuration discovered',
        locator: `file:${PLAYWRIGHT_CONFIG_PATH}`,
        contentHash,
      });

      const testDir = parsePlaywrightTestDir(playwrightContent);
      if (testDir !== null) {
        e2e.push({
          name: 'Playwright E2E',
          path: testDir,
          testCount: 0,
        });
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'info',
        category: 'tests-discovery',
        message: `Playwright configuration not found: ${PLAYWRIGHT_CONFIG_PATH}`,
      });
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'tests-discovery',
        message: `Failed to read Playwright configuration: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  // Step 4: Discover tests/e2e/ directory
  const e2eDir = 'tests/e2e';
  try {
    if (await adapter.fileExists(e2eDir)) {
      const allFiles = await adapter.listFiles('.');
      const e2eFiles = allFiles.filter(f => f.startsWith(e2eDir));
      
      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: e2eDir,
        kind: 'test-directory',
        claim: 'E2E test directory discovered',
        locator: `directory:${e2eDir}`,
        contentHash: '',
      });

      // Check if this directory is already covered by Playwright config
      const normalizedPath = e2eDir.replace(/^\.\//, '');
      const existingSuite = e2e.find(suite => 
        suite.path === e2eDir || 
        suite.path === `./${e2eDir}` ||
        suite.path.replace(/^\.\//, '') === normalizedPath
      );

      if (existingSuite !== undefined) {
        // Update test count if we found actual files
        existingSuite.testCount = Math.max(existingSuite.testCount, e2eFiles.length);
      } else {
        // Add new suite
        e2e.push({
          name: 'E2E Tests',
          path: e2eDir,
          testCount: e2eFiles.length,
        });
      }
    }
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      // E2E directory is optional, no finding needed
    } else if (error instanceof RepositoryAccessError) {
      findings.push({
        findingId: randomUUID(),
        severity: 'error',
        category: 'tests-discovery',
        message: `Failed to access E2E directory: ${error.message}`,
      });
    } else {
      throw error;
    }
  }

  findings.push({
    findingId: randomUUID(),
    severity: 'info',
    category: 'tests-discovery',
    message: `Discovered ${unit.length} unit test suites, ${integration.length} integration test suites, ${e2e.length} E2E test suites`,
  });

  if (unit.length === 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'tests-missing',
      message: 'No unit test suites discovered',
      recommendation: 'Configure vitest.workspace.ts and add unit tests',
    });
  }

  return {
    scannerName,
    timestamp,
    evidence,
    findings,
    data: {
      unit,
      integration,
      e2e,
    },
  };
}

/**
 * Parse vitest.workspace.ts for test projects
 */
function parseVitestWorkspace(content: string): string[] {
  const projects: string[] = [];

  // Try format 1: defineWorkspace(['packages/*', 'apps/*'])
  const workspaceRegex = /(?:defineWorkspace|export\s+default)\s*\(\s*\[([^\]]+)\]/;
  const workspaceMatch = content.match(workspaceRegex);

  if (workspaceMatch !== null && workspaceMatch[1] !== undefined) {
    const projectsStr = workspaceMatch[1];
    // Extract quoted strings
    const projectMatches = projectsStr.matchAll(/['"]([^'"]+)['"]/g);
    
    for (const projectMatch of projectMatches) {
      const project = projectMatch[1];
      if (project !== undefined) {
        projects.push(project);
      }
    }
    return projects;
  }

  // Try format 2: export default ['path1', 'path2']
  const arrayRegex = /export\s+default\s+\[([^\]]+)\]/;
  const arrayMatch = content.match(arrayRegex);

  if (arrayMatch !== null && arrayMatch[1] !== undefined) {
    const projectsStr = arrayMatch[1];
    // Extract quoted strings
    const projectMatches = projectsStr.matchAll(/['"]([^'"]+)['"]/g);
    
    for (const projectMatch of projectMatches) {
      const project = projectMatch[1];
      if (project !== undefined) {
        projects.push(project);
      }
    }
  }

  return projects;
}

/**
 * Parse playwright.config.ts for testDir
 */
function parsePlaywrightTestDir(content: string): string | null {
  // Match testDir: './tests/e2e'
  const testDirRegex = /testDir:\s*['"]([^'"]+)['"]/;
  const match = content.match(testDirRegex);

  if (match !== null && match[1] !== undefined) {
    return match[1];
  }

  return 'tests/e2e'; // Default
}
