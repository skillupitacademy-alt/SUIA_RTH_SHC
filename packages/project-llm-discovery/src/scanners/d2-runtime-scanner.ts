import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { FrameworkInfo, WorkspaceInfo, BuildSystemInfo } from '../contracts/snapshot.js';
import { FileNotFoundError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';

interface RuntimeData {
  frameworks: FrameworkInfo[];
  workspace: WorkspaceInfo;
  buildSystem: BuildSystemInfo;
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
      workspace = {
        manager: 'pnpm',
        version: 'unknown', // Would need to exec pnpm --version
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
      buildSystem = {
        tool: 'turbo',
        version: 'unknown', // Would need to exec turbo --version
        config: JSON.stringify(turboConfig.tasks ?? {}),
      };
    } catch {
      // Skip invalid JSON
    }
  }

  // Read root package.json for framework detection
  const packageJsonPath = 'package.json';
  if (await adapter.fileExists(packageJsonPath)) {
    const content = await adapter.readFile(packageJsonPath);
    const contentHash = await adapter.getFileHash(packageJsonPath);
    
    collector.add(
      collector.createEvidence(
        scannerName,
        'file',
        packageJsonPath,
        contentHash,
        'Root package.json discovered',
        `file:${packageJsonPath}`
      )
    );

    try {
      const pkg: PackageJson = JSON.parse(content);
      
      // Detect frameworks from dependencies
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Check for Next.js
      if (allDeps['next'] !== undefined) {
        frameworks.push({
          name: 'next',
          version: allDeps['next'],
          packages: ['next'],
        });
      }

      // Update workspace manager version if available
      if (allDeps['pnpm'] !== undefined && workspace.manager === 'pnpm') {
        workspace = {
          ...workspace,
          version: allDeps['pnpm'],
        };
      }

      // Update build system version if available
      if (allDeps['turbo'] !== undefined && buildSystem.tool === 'turbo') {
        buildSystem = {
          ...buildSystem,
          version: allDeps['turbo'],
        };
      }
    } catch {
      // Skip invalid JSON
    }
  }

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
