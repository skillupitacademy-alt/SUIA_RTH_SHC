import { join } from 'node:path';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { DependencyNode, DependencyEdge, PackageInfo } from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';
import { randomUUID } from 'node:crypto';
import { parse as parseYaml } from 'yaml';

interface DependenciesData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface StructureData {
  applications: unknown[];
  packages: PackageInfo[];
  services: unknown[];
}

interface DependencyDeclaration {
  from: string;
  to: string;
  kind: 'dependency' | 'devDependency' | 'peerDependency';
  requestedVersion: string;
  evidenceId: string;
}

interface WorkspaceResolution {
  packageName: string;
  version: string;
}

interface LockfileResolution {
  packageName: string;
  resolvedVersion: string;
}

/**
 * D5 Dependencies Scanner
 * 
 * M2.5 Three-Stage Dependency Analysis:
 * - Stage 1: Workspace Declaration (read package.json)
 * - Stage 2: Workspace Resolution (resolve workspace:* references)
 * - Stage 3: Lockfile Resolution (parse pnpm-lock.yaml for external packages)
 * 
 * Tracks ALL dependencies (workspace + external) with complete version resolution.
 * Detects cycles and version conflicts.
 * 
 * Input: StructureData from D1 scanner (package list)
 * Output: Complete dependency graph with resolved versions
 */
export async function scanDependencies(
  adapter: RepositoryAdapter,
  structureData: StructureData
): Promise<ScannerResult<DependenciesData>> {
  const scannerName = 'd5-dependencies-scanner';
  const timestamp = new Date().toISOString();
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];

  // Build nodes from workspace packages
  for (const pkg of structureData.packages) {
    nodes.push({
      id: pkg.name,
      name: pkg.name,
      version: pkg.version,
      type: 'package',
      evidenceId: pkg.evidenceId, // Reuse evidence from D1 structure scanner
    });
  }

  // Stage 1 & 2: Workspace Declaration and Resolution
  const declarations = await stageOneAndTwo(adapter, structureData, collector, findings);

  // Stage 3: Lockfile Resolution
  const lockfileResolutions = await stageThree(adapter, collector, findings);

  // Build a set of all external package names
  const externalPackages = new Set<string>();
  for (const decl of declarations) {
    const isWorkspace = decl.requestedVersion.startsWith('workspace:');
    if (!isWorkspace) {
      externalPackages.add(decl.to);
    }
  }

  // Create nodes for external packages
  for (const pkgName of externalPackages) {
    const resolution = lockfileResolutions.external.get(pkgName);
    nodes.push({
      id: pkgName,
      name: pkgName,
      version: resolution?.resolvedVersion || 'unknown',
      type: 'package',
      // External packages don't have direct evidence - they're discovered through dependencies
      // We can reuse the lockfile evidence for all external packages
      evidenceId: lockfileResolutions.lockfileEvidenceId || 'external-package',
    });
  }

  // Build edges with complete resolution
  for (const decl of declarations) {
    const isWorkspace = decl.requestedVersion.startsWith('workspace:');
    let resolvedVersion: string | undefined;

    if (isWorkspace) {
      // Workspace dependency - look up in workspace resolutions
      const resolution = lockfileResolutions.workspace.get(decl.to);
      resolvedVersion = resolution?.version;
    } else {
      // External dependency - look up in lockfile
      const resolution = lockfileResolutions.external.get(decl.to);
      resolvedVersion = resolution?.resolvedVersion;
    }

    edges.push({
      from: decl.from,
      to: decl.to,
      kind: decl.kind,
      requestedVersion: decl.requestedVersion,
      resolvedVersion,
      evidenceId: decl.evidenceId,
    });
  }

  const workspaceCount = edges.filter(e => e.requestedVersion?.startsWith('workspace:')).length;
  const externalCount = edges.length - workspaceCount;

  findings.push({
    findingId: randomUUID(),
    severity: 'info',
    category: 'dependencies-discovery',
    message: `Built dependency graph with ${nodes.length} nodes (${structureData.packages.length} workspace, ${externalPackages.size} external) and ${edges.length} edges (${workspaceCount} workspace, ${externalCount} external)`,
  });

  // Detect circular dependencies
  const cycles = detectCircularDependencies(nodes, edges);
  if (cycles.length > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'dependencies-circular',
      message: `Detected ${cycles.length} circular dependency cycle(s): ${cycles.map(c => c.join(' → ')).join('; ')}`,
      recommendation: 'Review and refactor circular dependencies to improve build performance',
    });
  }

  // Detect version conflicts
  const conflicts = detectVersionConflicts(edges);
  if (conflicts.length > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'dependencies-version-conflict',
      message: `Detected ${conflicts.length} version conflict(s): ${conflicts.join('; ')}`,
      recommendation: 'Review version mismatches and align dependency versions',
    });
  }

  return {
    scannerName,
    timestamp,
    evidence: collector.getAll(),
    findings,
    data: {
      nodes,
      edges,
    },
  };
}

/**
 * Stage 1 & 2: Workspace Declaration and Resolution
 * Read all package.json files and resolve workspace:* references
 */
async function stageOneAndTwo(
  adapter: RepositoryAdapter,
  structureData: StructureData,
  collector: EvidenceCollector,
  findings: Finding[]
): Promise<DependencyDeclaration[]> {
  const scannerName = 'd5-dependencies-scanner';
  const declarations: DependencyDeclaration[] = [];

  // Build workspace package map for resolution
  const workspacePackages = new Map<string, PackageInfo>();
  for (const pkg of structureData.packages) {
    workspacePackages.set(pkg.name, pkg);
  }

  // Read each package's dependencies
  for (const pkg of structureData.packages) {
    const pkgJsonPath = join(pkg.path, 'package.json').replace(/\\/g, '/');

    if (await adapter.fileExists(pkgJsonPath)) {
      try {
        const pkgContent = await adapter.readFile(pkgJsonPath);
        const contentHash = await adapter.getFileHash(pkgJsonPath);

        const evidence = collector.createEvidence(
          scannerName,
          'dependency-declaration',
          pkgJsonPath,
          contentHash,
          'Package dependencies analyzed',
          `file:${pkgJsonPath}`,
          pkg.name
        );
        collector.add(evidence);

        try {
          const pkgJson = JSON.parse(pkgContent) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
          };

          // Process all dependency types
          const depTypes: Array<{ key: keyof typeof pkgJson; kind: DependencyDeclaration['kind'] }> = [
            { key: 'dependencies', kind: 'dependency' },
            { key: 'devDependencies', kind: 'devDependency' },
            { key: 'peerDependencies', kind: 'peerDependency' },
          ];

          for (const { key, kind } of depTypes) {
            const deps = pkgJson[key];
            if (deps !== undefined) {
              for (const [depName, requestedVersion] of Object.entries(deps)) {
                declarations.push({
                  from: pkg.name,
                  to: depName,
                  kind,
                  requestedVersion,
                  evidenceId: evidence.evidenceId,
                });
              }
            }
          }
        } catch {
          findings.push({
            findingId: randomUUID(),
            severity: 'warning',
            category: 'dependencies-parsing',
            message: `Failed to parse ${pkgJsonPath}`,
          });
        }
      } catch (error) {
        if (error instanceof FileNotFoundError) {
          findings.push({
            findingId: randomUUID(),
            severity: 'warning',
            category: 'dependencies-parsing',
            message: `Package file not found: ${pkgJsonPath} (existed during structure scan but missing now)`,
          });
        } else if (error instanceof RepositoryAccessError) {
          findings.push({
            findingId: randomUUID(),
            severity: 'error',
            category: 'dependencies-parsing',
            message: `Failed to read package file: ${error.message}`,
          });
          throw error;
        } else {
          throw error;
        }
      }
    }
  }

  return declarations;
}

/**
 * Stage 3: Lockfile Resolution
 * Parse pnpm-lock.yaml to resolve external package versions
 */
async function stageThree(
  adapter: RepositoryAdapter,
  collector: EvidenceCollector,
  findings: Finding[]
): Promise<{
  workspace: Map<string, WorkspaceResolution>;
  external: Map<string, LockfileResolution>;
  lockfileEvidenceId: string | null;
}> {
  const scannerName = 'd5-dependencies-scanner';
  const lockfilePath = 'pnpm-lock.yaml';
  const workspace = new Map<string, WorkspaceResolution>();
  const external = new Map<string, LockfileResolution>();
  let lockfileEvidenceId: string | null = null;

  try {
    if (await adapter.fileExists(lockfilePath)) {
      const lockfileContent = await adapter.readFile(lockfilePath);
      const contentHash = await adapter.getFileHash(lockfilePath);

      const evidence = collector.createEvidence(
        scannerName,
        'dependency-resolution',
        lockfilePath,
        contentHash,
        'Lockfile dependency resolution analyzed',
        `file:${lockfilePath}`,
        'pnpm-lockfile'
      );
      collector.add(evidence);
      lockfileEvidenceId = evidence.evidenceId;

      try {
        const lockfile = parseYaml(lockfileContent) as {
          importers?: Record<string, {
            dependencies?: Record<string, { specifier: string; version: string }>;
            devDependencies?: Record<string, { specifier: string; version: string }>;
          }>;
          packages?: Record<string, unknown>;
        };

        // Parse workspace packages from importers
        if (lockfile.importers) {
          for (const [importerPath, importer] of Object.entries(lockfile.importers)) {
            const allDeps = {
              ...importer.dependencies,
              ...importer.devDependencies,
            };

            for (const [pkgName, pkgInfo] of Object.entries(allDeps)) {
              if (pkgInfo.version.startsWith('link:')) {
                // This is a workspace package
                // Extract version from the workspace package itself
                const linkedPath = pkgInfo.version.replace('link:', '');
                workspace.set(pkgName, {
                  packageName: pkgName,
                  version: 'workspace-linked',
                });
              } else {
                // External package
                external.set(pkgName, {
                  packageName: pkgName,
                  resolvedVersion: pkgInfo.version,
                });
              }
            }
          }
        }

        findings.push({
          findingId: randomUUID(),
          severity: 'info',
          category: 'dependencies-resolution',
          message: `Resolved ${workspace.size} workspace packages and ${external.size} external packages from lockfile`,
        });
      } catch (err) {
        findings.push({
          findingId: randomUUID(),
          severity: 'warning',
          category: 'dependencies-resolution',
          message: `Failed to parse lockfile: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    } else {
      findings.push({
        findingId: randomUUID(),
        severity: 'warning',
        category: 'dependencies-resolution',
        message: 'Lockfile not found - external package versions unavailable',
      });
    }
  } catch (error) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'dependencies-resolution',
      message: `Failed to read lockfile: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return { workspace, external, lockfileEvidenceId };
}

/**
 * Detect circular dependencies using depth-first search
 */
function detectCircularDependencies(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  for (const edge of edges) {
    if (!adjacencyList.has(edge.from)) {
      adjacencyList.set(edge.from, []);
    }
    adjacencyList.get(edge.from)?.push(edge.to);
  }

  // DFS to detect cycles
  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), neighbor]);
        }
      }
    }

    recursionStack.delete(node);
  }

  // Run DFS from each node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Detect version conflicts between requested and resolved versions
 * Focus on major version mismatches (semver breaking changes)
 */
function detectVersionConflicts(edges: DependencyEdge[]): string[] {
  const conflicts: string[] = [];

  for (const edge of edges) {
    if (!edge.requestedVersion || !edge.resolvedVersion) {
      continue;
    }

    // Skip workspace: dependencies - they're always resolved correctly
    if (edge.requestedVersion.startsWith('workspace:')) {
      continue;
    }

    // Extract major versions
    const requestedMajor = extractMajorVersion(edge.requestedVersion);
    const resolvedMajor = extractMajorVersion(edge.resolvedVersion);

    if (requestedMajor !== null && resolvedMajor !== null && requestedMajor !== resolvedMajor) {
      conflicts.push(
        `${edge.from} → ${edge.to}: requested ${edge.requestedVersion} but resolved ${edge.resolvedVersion}`
      );
    }
  }

  return conflicts;
}

/**
 * Extract major version number from semver string
 * Handles formats like: ^1.2.3, ~1.2.3, 1.2.3, >=1.2.3, 1.x, etc.
 */
function extractMajorVersion(version: string): number | null {
  // Remove common semver prefixes
  const cleaned = version.replace(/^[\^~>=<]+/, '');
  
  // Extract first number
  const match = cleaned.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}
