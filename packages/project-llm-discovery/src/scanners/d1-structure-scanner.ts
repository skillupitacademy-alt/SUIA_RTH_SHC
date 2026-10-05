import { join } from 'node:path';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { ApplicationInfo, PackageInfo, ServiceInfo } from '../contracts/snapshot.js';
import { FileNotFoundError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';

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
  const collector = new EvidenceCollector();
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
    collector.add(
      collector.createEvidence(
        scannerName,
        'directory',
        appPath,
        '',
        'Application directory discovered',
        `directory:${appPath}`
      )
    );

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      collector.add(
        collector.createEvidence(
          scannerName,
          'package',
          pkgJsonPath,
          contentHash,
          'Application package.json discovered',
          `file:${pkgJsonPath}`
        )
      );

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
    collector.add(
      collector.createEvidence(
        scannerName,
        'directory',
        packagePath,
        '',
        'Package directory discovered',
        `directory:${packagePath}`
      )
    );

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      collector.add(
        collector.createEvidence(
          scannerName,
          'package',
          pkgJsonPath,
          contentHash,
          'Package package.json discovered',
          `file:${pkgJsonPath}`
        )
      );

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
    collector.add(
      collector.createEvidence(
        scannerName,
        'directory',
        servicePath,
        '',
        'Service directory discovered',
        `directory:${servicePath}`
      )
    );

    if (await adapter.fileExists(pkgJsonPath)) {
      const pkgContent = await adapter.readFile(pkgJsonPath);
      const contentHash = await adapter.getFileHash(pkgJsonPath);
      
      // Generate evidence for package.json
      collector.add(
        collector.createEvidence(
          scannerName,
          'package',
          pkgJsonPath,
          contentHash,
          'Service package.json discovered',
          `file:${pkgJsonPath}`
        )
      );

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
    evidence: collector.getAll(),
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
