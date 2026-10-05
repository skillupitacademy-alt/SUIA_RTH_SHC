import { randomUUID } from 'node:crypto';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { Evidence } from '../contracts/evidence.js';
import type { TestSuite } from '../contracts/snapshot.js';

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

  // Step 2: Discover __tests__ directories
  const allFiles = await adapter.listFiles('.');
  const testDirs = allFiles.filter(f => f.includes('__tests__'));
  
  // Group by unit vs integration
  for (const testDir of testDirs) {
    const contentHash = await adapter.getFileHash(testDir);
    
    evidence.push({
      evidenceId: randomUUID(),
      scannerName,
      timestamp,
      path: testDir,
      kind: 'test-directory',
      claim: 'Test directory discovered',
      locator: `directory:${testDir}`,
      contentHash,
    });

    if (testDir.includes('integration')) {
      integration.push({
        name: testDir,
        path: testDir,
        testCount: 0,
      });
    } else if (testDir.includes('unit') || testDir.includes('__tests__')) {
      // Avoid duplicates - only add if not already in unit tests
      const existsInUnit = unit.some(suite => testDir.startsWith(suite.path));
      if (!existsInUnit) {
        unit.push({
          name: testDir,
          path: testDir,
          testCount: 0,
        });
      }
    }
  }

  // Step 3: Discover test files (*.test.ts, *.spec.ts)
  const testFiles = allFiles.filter(f => 
    (f.endsWith('.test.ts') || f.endsWith('.spec.ts')) && 
    !f.includes('node_modules')
  );

  for (const testFile of testFiles) {
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
  }

  // Step 4: Discover Playwright E2E configuration
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

  // Step 5: Discover tests/e2e/ directory
  const e2eDir = 'tests/e2e';
  if (await adapter.fileExists(e2eDir)) {
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
