import type { RepositoryAdapter, ApprovedOperation } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { FrameworkInfo, WorkspaceInfo, BuildSystemInfo } from '../contracts/snapshot.js';
import { FileNotFoundError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';

interface RuntimeData {
  frameworks: FrameworkInfo[];
  workspace: WorkspaceInfo;
  buildSystem: BuildSystemInfo;
  toolchains: ToolchainInfo[];
}

interface ToolchainInfo {
  name: string;
  declaredVersion: string;
  detectedVersion: string;
  mismatch: boolean;
  evidenceId?: string;
}


interface PnpmWorkspace {
  packages?: string[];
}

interface TurboConfig {
  tasks?: Record<string, unknown>;
  concurrency?: string | number;
}

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: {
    node?: string;
  };
}

export async function scanRuntime(
  adapter: RepositoryAdapter
): Promise<ScannerResult<RuntimeData>> {
  const scannerName = 'D2-runtime-scanner';
  const timestamp = new Date().toISOString();
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const frameworks: FrameworkInfo[] = [];
  const toolchains: ToolchainInfo[] = [];
  let workspace: WorkspaceInfo = {
    manager: 'unknown',
    version: 'unknown',
    packages: [],
  };
  let buildSystem: BuildSystemInfo = {
    tool: 'unknown',
    version: 'unknown',
    config: '',
  };

  // Read root package.json to extract declared versions
  const packageJsonPath = 'package.json';
  let declaredNodeVersion = 'unknown';
  let declaredPnpmVersion = 'unknown';
  let declaredTurboVersion = 'unknown';
  let declaredTscVersion = 'unknown';
  let declaredVitestVersion = 'unknown';
  let declaredPlaywrightVersion = 'unknown';

  if (await adapter.fileExists(packageJsonPath)) {
    const content = await adapter.readFile(packageJsonPath);
    const contentHash = await adapter.getFileHash(packageJsonPath);

    collector.add(
      collector.createEvidence(
        scannerName,
        'file',
        packageJsonPath,
        contentHash,
        'Root package.json discovered for toolchain version detection',
        `file:${packageJsonPath}`
      )
    );

    try {
      const pkg: PackageJson = JSON.parse(content);

      // Extract declared versions
      declaredNodeVersion = pkg.engines?.node ?? 'unknown';
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      declaredPnpmVersion = allDeps['pnpm'] ?? 'unknown';
      declaredTurboVersion = allDeps['turbo'] ?? 'unknown';
      declaredTscVersion = allDeps['typescript'] ?? 'unknown';
      declaredVitestVersion = allDeps['vitest'] ?? 'unknown';
      declaredPlaywrightVersion = allDeps['@playwright/test'] ?? allDeps['playwright'] ?? 'unknown';

      // Detect frameworks from dependencies
      if (allDeps['next'] !== undefined) {
        frameworks.push({
          name: 'next',
          version: allDeps['next'],
          packages: ['next'],
        });
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // Execute toolchain version detection commands
  const toolchainOperations: Array<{
    operation: ApprovedOperation;
    name: string;
    declaredVersion: string;
  }> = [
    { operation: 'node_version' as ApprovedOperation, name: 'node', declaredVersion: declaredNodeVersion },
    { operation: 'pnpm_version' as ApprovedOperation, name: 'pnpm', declaredVersion: declaredPnpmVersion },
    { operation: 'turbo_version' as ApprovedOperation, name: 'turbo', declaredVersion: declaredTurboVersion },
    { operation: 'tsc_version' as ApprovedOperation, name: 'tsc', declaredVersion: declaredTscVersion },
    { operation: 'vitest_version' as ApprovedOperation, name: 'vitest', declaredVersion: declaredVitestVersion },
    { operation: 'playwright_version' as ApprovedOperation, name: 'playwright', declaredVersion: declaredPlaywrightVersion },
  ];

  for (const { operation, name, declaredVersion } of toolchainOperations) {
    const result = await adapter.runCommand(operation);

    let detectedVersion = 'detection-failed';
    let reason = '';

    if (result.exitCode === 0 && result.stdout) {
      // Parse version string (e.g., "v20.11.0" -> "20.11.0")
      const parsed = parseVersionString(result.stdout);
      if (parsed) {
        detectedVersion = parsed;
      } else {
        reason = `Could not parse version from: ${result.stdout}`;
      }
    } else if (result.exitCode === -1) {
      reason = result.stderr || 'Command timeout or spawn failure';
    } else {
      reason = `Exit code ${result.exitCode}: ${result.stderr || 'No stderr'}`;
    }

    // Create evidence for successful execution
    let evidenceId: string | undefined;
    if (detectedVersion !== 'detection-failed') {
      const evidence = collector.createEvidence(
        scannerName,
        'config',
        name,
        createHash(result.stdout),
        `${name} version detected: ${detectedVersion}`,
        `toolchain:${name}`
      );
      // Mark toolchain evidence as historical since paths don't exist as files
      evidence.lifecycle = 'historical';
      collector.add(evidence);
      evidenceId = evidence.evidenceId;
    }

    // Check for mismatch
    const mismatch = detectedVersion !== 'detection-failed' &&
                      declaredVersion !== 'unknown' &&
                      !versionsMatch(declaredVersion, detectedVersion);

    if (mismatch) {
      findings.push({
        findingId: `${scannerName}-toolchain-mismatch-${name}`,
        severity: 'warning',
        category: 'toolchain-mismatch',
        message: `${name}: declared version ${declaredVersion} does not match detected ${detectedVersion}`,
        path: packageJsonPath,
        recommendation: `Update ${name} version in package.json or sync environment`,
      });
    }

    if (detectedVersion === 'detection-failed') {
      findings.push({
        findingId: `${scannerName}-toolchain-detection-failed-${name}`,
        severity: 'info',
        category: 'toolchain-detection-failed',
        message: `${name}: version detection failed - ${reason}`,
        path: packageJsonPath,
        recommendation: `Ensure ${name} is installed and accessible in PATH`,
      });
    }

    toolchains.push({
      name,
      declaredVersion,
      detectedVersion,
      mismatch,
      evidenceId,
    });
  }


  // Read pnpm-workspace.yaml
  const pnpmWorkspacePath = 'pnpm-workspace.yaml';
  if (await adapter.fileExists(pnpmWorkspacePath)) {
    const content = await adapter.readFile(pnpmWorkspacePath);
    const contentHash = await adapter.getFileHash(pnpmWorkspacePath);
    
    collector.add(
      collector.createEvidence(
        scannerName,
        'file',
        pnpmWorkspacePath,
        contentHash,
        'pnpm workspace configuration discovered',
        `file:${pnpmWorkspacePath}`
      )
    );

    try {
      const pnpmWorkspace = parseYaml(content);
      const pnpmToolchain = toolchains.find(t => t.name === 'pnpm');
      workspace = {
        manager: 'pnpm',
        version: pnpmToolchain?.detectedVersion ?? 'unknown',
        packages: pnpmWorkspace.packages ?? [],
      };
    } catch {
      // Skip invalid YAML
    }
  }

  // Read turbo.json
  const turboJsonPath = 'turbo.json';
  if (await adapter.fileExists(turboJsonPath)) {
    const content = await adapter.readFile(turboJsonPath);
    const contentHash = await adapter.getFileHash(turboJsonPath);
    
    collector.add(
      collector.createEvidence(
        scannerName,
        'file',
        turboJsonPath,
        contentHash,
        'Turbo build configuration discovered',
        `file:${turboJsonPath}`
      )
    );

    try {
      const turboConfig: TurboConfig = JSON.parse(content);
      const turboToolchain = toolchains.find(t => t.name === 'turbo');
      buildSystem = {
        tool: 'turbo',
        version: turboToolchain?.detectedVersion ?? 'unknown',
        config: JSON.stringify(turboConfig.tasks ?? {}),
      };
    } catch {
      // Skip invalid JSON
    }
  }

  // Read root package.json for framework detection
  // (Already processed above for toolchain declarations, now scan apps)

  // Scan apps for framework usage
  const apps = workspace.packages.filter((p) => p.startsWith('apps/'));
  if (apps.length > 0) {
    for (const appPattern of apps) {
      // For simplicity, we'll just check a few common app directories
      // A full implementation would glob match the pattern
      const appDirs = await getAppDirectories(adapter, appPattern);
      
      for (const appDir of appDirs) {
        const appPackageJsonPath = `${appDir}/package.json`;
        if (await adapter.fileExists(appPackageJsonPath)) {
          const content = await adapter.readFile(appPackageJsonPath);
          const contentHash = await adapter.getFileHash(appPackageJsonPath);
          
          collector.add(
            collector.createEvidence(
              scannerName,
              'package',
              appPackageJsonPath,
              contentHash,
              `App package.json discovered for framework detection`,
              `file:${appPackageJsonPath}`
            )
          );

          try {
            const pkg: PackageJson = JSON.parse(content);
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            
            // Check for Next.js (if not already detected)
            if (allDeps['next'] !== undefined) {
              const existingNext = frameworks.find((f) => f.name === 'next');
              if (existingNext === undefined) {
                frameworks.push({
                  name: 'next',
                  version: allDeps['next'],
                  packages: [pkg.name ?? appDir],
                });
              } else {
                // Add to packages list
                const pkgName = pkg.name ?? appDir;
                if (!existingNext.packages.includes(pkgName)) {
                  existingNext.packages.push(pkgName);
                }
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  return {
    scannerName,
    timestamp,
    evidence: collector.getAll(),
    findings,
    data: {
      frameworks,
      workspace,
      buildSystem,
      toolchains,
    },
  };
}

// Simple YAML parser for pnpm-workspace.yaml (very basic, handles our use case)
function parseYaml(content: string): PnpmWorkspace {
  const lines = content.split('\n');
  const result: PnpmWorkspace = {};
  
  let inPackages = false;
  const packages: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'packages:') {
      inPackages = true;
      continue;
    }
    
    if (inPackages) {
      if (trimmed.startsWith('-')) {
        // Extract package pattern
        const pkg = trimmed.substring(1).trim().replace(/^["']/, '').replace(/["']$/, '');
        packages.push(pkg);
      } else if (trimmed !== '' && !trimmed.startsWith('#')) {
        // End of packages section
        inPackages = false;
      }
    }
  }
  
  if (packages.length > 0) {
    result.packages = packages;
  }
  
  return result;
}

async function getAppDirectories(adapter: RepositoryAdapter, pattern: string): Promise<string[]> {
  // Simple glob expansion for apps/* pattern
  if (pattern.endsWith('/*')) {
    const baseDir = pattern.slice(0, -2);
    
    try {
      const files = await adapter.listFiles(baseDir);
      
      // Extract unique directory names
      const dirs = new Set<string>();
      for (const file of files) {
        const relativePath = file.replace(baseDir + '/', '').replace(baseDir + '\\', '');
        const firstSegment = relativePath.split(/[/\\]/)[0];
        if (firstSegment !== undefined && firstSegment !== '') {
          dirs.add(`${baseDir}/${firstSegment}`);
        }
      }
      
      return Array.from(dirs);
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        // Base directory doesn't exist
        return [];
      }
      // PermissionError or RepositoryAccessError: propagate upward
      throw error;
    }
  }
  
  // Direct path
  const exists = await adapter.fileExists(pattern);
  return exists ? [pattern] : [];
}

/**
 * Parse version string from command output.
 * Handles formats like "v20.11.0", "20.11.0", "Version 9.4.0", etc.
 */
function parseVersionString(output: string): string | null {
  // Try to extract version pattern: X.Y.Z (with optional v prefix or "Version" prefix)
  const patterns = [
    /v?(\d+\.\d+\.\d+)/,           // Matches "v20.11.0" or "20.11.0"
    /Version\s+(\d+\.\d+\.\d+)/i,  // Matches "Version 9.4.0"
    /(\d+\.\d+)/,                  // Fallback for major.minor only
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if two version strings match.
 * Handles semver ranges in declaredVersion (e.g., "^20.0.0", ">=18.0.0").
 */
function versionsMatch(declaredVersion: string, detectedVersion: string): boolean {
  // Strip semver range operators
  const cleanDeclared = declaredVersion.replace(/^[\^~>=<]+/, '');
  
  // For exact match
  if (cleanDeclared === detectedVersion) {
    return true;
  }

  // For caret/tilde ranges, check if major version matches
  if (declaredVersion.startsWith('^') || declaredVersion.startsWith('~')) {
    const declaredMajor = cleanDeclared.split('.')[0];
    const detectedMajor = detectedVersion.split('.')[0];
    return declaredMajor === detectedMajor;
  }

  return false;
}

/**
 * Create SHA-256 hash from string content
 */
function createHash(content: string): string {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
