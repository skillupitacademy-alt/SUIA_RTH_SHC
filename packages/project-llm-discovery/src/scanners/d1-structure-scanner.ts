import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { Evidence } from '../contracts/evidence.js';
import type { ApplicationInfo, PackageInfo, ServiceInfo } from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';

interface StructureData {
  applications: ApplicationInfo[];
  packages: PackageInfo[];
  services: ServiceInfo[];
}

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: Record<string, unknown> | string;
}

export async function scanRepositoryStructure(
  adapter: RepositoryAdapter
): Promise<ScannerResult<StructureData>> {
  const scannerName = 'D1-structure-scanner';
  const timestamp = new Date().toISOString();
  const evidence: Evidence[] = [];
  const findings: Finding[] = [];

  const applications: ApplicationInfo[] = [];
  const packages: PackageInfo[] = [];
  const services: ServiceInfo[] = [];

  // Scan apps/ directory
  const appsPath = 'apps';
  const appDirs = await scanDirectory(adapter, appsPath);
  
  for (const appDir of appDirs) {
    const appPath = join(appsPath, appDir);
    const pkgJsonPath = join(appPath, 'package.json');
    
    // Generate evidence for directory
    evidence.push({
      evidenceId: randomUUID(),
      scannerName,
      timestamp,
      path: appPath,
      kind: 'directory',
      claim: 'Application directory discovered',
      locator: `directory:${appPath}`,
      contentHash: '',
    });

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: pkgJsonPath,
        kind: 'package',
        claim: 'Application package.json discovered',
        locator: `file:${pkgJsonPath}`,
        contentHash,
      });

      try {
        const pkg: PackageJson = JSON.parse(pkgContent);
        
        applications.push({
          name: pkg.name ?? appDir,
          path: appPath,
          type: 'application',
          framework: detectFramework(pkg),
          entrypoint: 'src/index.ts', // Default, could be improved
        });
      } catch {
        // Skip invalid package.json
      }
    }
  }

  // Scan packages/ directory
  const packagesPath = 'packages';
  const packageDirs = await scanDirectory(adapter, packagesPath);
  
  for (const packageDir of packageDirs) {
    const packagePath = join(packagesPath, packageDir);
    const pkgJsonPath = join(packagePath, 'package.json');
    
    // Generate evidence for directory
    evidence.push({
      evidenceId: randomUUID(),
      scannerName,
      timestamp,
      path: packagePath,
      kind: 'directory',
      claim: 'Package directory discovered',
      locator: `directory:${packagePath}`,
      contentHash: '',
    });

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: pkgJsonPath,
        kind: 'package',
        claim: 'Package package.json discovered',
        locator: `file:${pkgJsonPath}`,
        contentHash,
      });

      try {
        const pkg: PackageJson = JSON.parse(pkgContent);
        
        const dependencies = [
          ...Object.keys(pkg.dependencies ?? {}),
          ...Object.keys(pkg.devDependencies ?? {}),
        ];

        const exports = extractExports(pkg);
        
        packages.push({
          name: pkg.name ?? packageDir,
          path: packagePath,
          version: pkg.version ?? '0.0.0',
          dependencies,
          exports,
        });
      } catch {
        // Skip invalid package.json
      }
    }
  }

  // Scan services/ directory
  const servicesPath = 'services';
  const serviceDirs = await scanDirectory(adapter, servicesPath);
  
  for (const serviceDir of serviceDirs) {
    const servicePath = join(servicesPath, serviceDir);
    const pkgJsonPath = join(servicePath, 'package.json');
    
    // Generate evidence for directory
    evidence.push({
      evidenceId: randomUUID(),
      scannerName,
      timestamp,
      path: servicePath,
      kind: 'directory',
      claim: 'Service directory discovered',
      locator: `directory:${servicePath}`,
      contentHash: '',
    });

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      evidence.push({
        evidenceId: randomUUID(),
        scannerName,
        timestamp,
        path: pkgJsonPath,
        kind: 'package',
        claim: 'Service package.json discovered',
        locator: `file:${pkgJsonPath}`,
        contentHash,
      });

      try {
        const pkg: PackageJson = JSON.parse(pkgContent);
        
        services.push({
          name: pkg.name ?? serviceDir,
          path: servicePath,
          type: 'service',
          entrypoint: 'src/index.ts', // Default, could be improved
        });
      } catch {
        // Skip invalid package.json
      }
    }
  }

  return {
    scannerName,
    timestamp,
    evidence,
    findings,
    data: {
      applications,
      packages,
      services,
    },
  };
}

async function scanDirectory(adapter: RepositoryAdapter, path: string): Promise<string[]> {
  const exists = await adapter.fileExists(path);
  if (!exists) {
    return [];
  }

  try {
    // List all entries in directory (non-recursive for top-level scan)
    const allFiles = await adapter.listFiles(path);
    
    // Extract unique directory names at the top level
    const dirs = new Set<string>();
    for (const file of allFiles) {
      const relativePath = file.replace(path + '/', '').replace(path + '\\', '');
      const firstSegment = relativePath.split(/[/\\]/)[0];
      if (firstSegment !== undefined && firstSegment !== '') {
        dirs.add(firstSegment);
      }
    }
    
    return Array.from(dirs);
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      // Directory disappeared during scan (rare race condition)
      return [];
    }
    // PermissionError or RepositoryAccessError: propagate upward
    throw error;
  }
}

function detectFramework(pkg: PackageJson): string {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  if (deps['next'] !== undefined) {
    return 'next';
  }
  if (deps['express'] !== undefined) {
    return 'express';
  }
  if (deps['fastify'] !== undefined) {
    return 'fastify';
  }
  
  return 'unknown';
}

function extractExports(pkg: PackageJson): string[] {
  if (pkg.exports === undefined) {
    return [];
  }
  
  if (typeof pkg.exports === 'string') {
    return [pkg.exports];
  }
  
  return Object.keys(pkg.exports);
}
