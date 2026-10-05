import type { RepositorySnapshot } from '../contracts/snapshot.js';
import type { ValidationError, ValidationWarning } from './validator.js';

export async function validateDependencyGraph(
  snapshot: RepositorySnapshot
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const nodeIds = new Set(snapshot.dependencies.nodes.map((node) => node.id));

  // V6.1: Check that all edges reference existing nodes
  for (const edge of snapshot.dependencies.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push({
        validator: 'V6-dependency-graph',
        code: 'EDGE_INVALID_FROM',
        message: `Dependency edge references non-existent 'from' node: ${edge.from}`,
        details: { edge },
      });
    }

    if (!nodeIds.has(edge.to)) {
      errors.push({
        validator: 'V6-dependency-graph',
        code: 'EDGE_INVALID_TO',
        message: `Dependency edge references non-existent 'to' node: ${edge.to}`,
        details: { edge },
      });
    }
  }

  // V6.2: Detect cycles using DFS
  const cycles = detectCycles(snapshot.dependencies.nodes, snapshot.dependencies.edges);

  if (cycles.length > 0) {
    for (const cycle of cycles) {
      errors.push({
        validator: 'V6-dependency-graph',
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        details: { cycle },
      });
    }
  }

  return { errors, warnings };
}

interface Node {
  id: string;
}

interface Edge {
  from: string;
  to: string;
}

function detectCycles(nodes: Node[], edges: Edge[]): string[][] {
  const cycles: string[][] = [];
  const adjacencyList = new Map<string, string[]>();

  // Build adjacency list
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }

  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.from);
    if (neighbors !== undefined) {
      neighbors.push(edge.to);
    }
  }

  // DFS with cycle detection
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId);
    if (neighbors !== undefined) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected
          const cycleStartIndex = path.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cycle = [...path.slice(cycleStartIndex), neighbor];
            cycles.push(cycle);
          }
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycles;
}
