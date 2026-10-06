import { join } from 'node:path';
import type { RepositoryAdapter } from '../contracts/repository-adapter.js';
import type { ScannerResult, Finding } from '../contracts/scanner.js';
import type { DependencyNode, DependencyEdge, PackageInfo } from '../contracts/snapshot.js';
import { FileNotFoundError, RepositoryAccessError } from '../adapters/index.js';
import { EvidenceCollector } from '../evidence/collector.js';
import { randomUUID } from 'node:crypto';

interface DependenciesData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface StructureData {
  applications: unknown[];
  packages: PackageInfo[];
  services: unknown[];
}

/**
 * D5 Dependencies Scanner
 * 
 * Builds dependency graph from package.json files across workspace.
 * Detects workspace dependencies (references to other @quiz/* packages).
 * 
 * Input: StructureData from D1 scanner (package list)
 * Output: Dependency graph with nodes (packages) and edges (dependencies)
 */
export async function scanDependencies(
  adapter: RepositoryAdapter,
  structureData: StructureData
): Promise<ScannerResult<DependenciesData>> {
  const scannerName = 'D5-dependencies-scanner';
  const timestamp = new Date().toISOString();
  const collector = new EvidenceCollector();
  const findings: Finding[] = [];

  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];

  // Build nodes from packages
  for (const pkg of structureData.packages) {
    nodes.push({
      id: pkg.name,
      name: pkg.name,
      version: pkg.version,
      type: 'package',
      evidenceId: pkg.evidenceId, // Reuse evidence from D1 structure scanner
    });
  }

  // Build edges from dependencies
  for (const pkg of structureData.packages) {
    // Normalize path separators to forward slashes for cross-platform compatibility
    const pkgJsonPath = join(pkg.path, 'package.json').replace(/\\/g, '/');

    if (await adapter.fileExists(pkgJsonPath)) {
      try {
        const pkgContent = await adapter.readFile(pkgJsonPath);
        const contentHash = await adapter.getFileHash(pkgJsonPath);

        const evidence = collector.createEvidence(
          scannerName,
          'package',
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

          // Add dependency edges
          if (pkgJson.dependencies !== undefined) {
            for (const [depName] of Object.entries(pkgJson.dependencies)) {
              // Only track workspace dependencies (@quiz/*)
              if (depName.startsWith('@quiz/')) {
                edges.push({
                  from: pkg.name,
                  to: depName,
                  kind: 'dependency',
                  evidenceId: evidence.evidenceId,
                });
              }
            }
          }

          // Add devDependency edges
          if (pkgJson.devDependencies !== undefined) {
            for (const [depName] of Object.entries(pkgJson.devDependencies)) {
              // Only track workspace dependencies (@quiz/*)
              if (depName.startsWith('@quiz/')) {
                edges.push({
                  from: pkg.name,
                  to: depName,
                  kind: 'devDependency',
                  evidenceId: evidence.evidenceId,
                });
              }
            }
          }

          // Add peerDependency edges
          if (pkgJson.peerDependencies !== undefined) {
            for (const [depName] of Object.entries(pkgJson.peerDependencies)) {
              // Only track workspace dependencies (@quiz/*)
              if (depName.startsWith('@quiz/')) {
                edges.push({
                  from: pkg.name,
                  to: depName,
                  kind: 'peerDependency',
                  evidenceId: evidence.evidenceId,
                });
              }
            }
          }
        } catch {
          // Skip invalid package.json
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

  findings.push({
    findingId: randomUUID(),
    severity: 'info',
    category: 'dependencies-discovery',
    message: `Built dependency graph with ${nodes.length} nodes and ${edges.length} workspace dependency edges`,
  });

  // Detect circular dependencies
  const cycles = detectCircularDependencies(nodes, edges);
  if (cycles.length > 0) {
    findings.push({
      findingId: randomUUID(),
      severity: 'warning',
      category: 'dependencies-circular',
      message: `Detected ${cycles.length} circular dependency cycles`,
      recommendation: 'Review and refactor circular dependencies to improve build performance',
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
          cycles.push(path.slice(cycleStart));
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
