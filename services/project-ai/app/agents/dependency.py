"""Dependency graph analysis agent handler."""

from datetime import datetime, UTC
from typing import Any, Dict, List, Set

from app.orchestration.agent_coordinator import AgentContext, AgentResult, AgentStatus


async def execute_dependency(context: AgentContext) -> AgentResult:
    """
    Execute dependency graph analysis agent.
    
    Analyzes dependency graph from the repository snapshot:
    - Detects circular dependencies
    - Identifies version conflicts
    - Maps dependency relationships
    
    Args:
        context: Agent execution context with snapshot
        
    Returns:
        AgentResult with dependency analysis outputs and warnings
    """
    start_time = datetime.now(UTC)
    
    try:
        # Extract snapshot data (frozen, never re-read files)
        snapshot = context.repository_snapshot
        dependencies_data = snapshot.get('dependencies', {})
        nodes = dependencies_data.get('nodes', [])
        edges = dependencies_data.get('edges', [])
        
        # Detect cycles
        cycles = _detect_cycles(nodes, edges)
        
        # Detect version conflicts
        conflicts = _detect_version_conflicts(nodes)
        
        # Collect evidence IDs from snapshot
        evidence_ids = _collect_dependency_evidence(nodes, snapshot)
        
        # Build outputs
        outputs = {
            'node_count': len(nodes),
            'edge_count': len(edges),
            'cycles_detected': len(cycles),
            'version_conflicts': len(conflicts),
            'cycles': cycles,
            'conflicts': conflicts
        }
        
        # Generate warnings
        warnings = []
        if cycles:
            warnings.append(f"Detected {len(cycles)} circular dependency cycle(s)")
        if conflicts:
            warnings.append(f"Detected {len(conflicts)} version conflict(s)")
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="dependency",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=[],
            warnings=warnings,
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="dependency",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[str(e)],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _detect_cycles(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Detect circular dependencies in the dependency graph.
    
    Args:
        nodes: List of dependency nodes
        edges: List of dependency edges
        
    Returns:
        List of cycles (each cycle is a list of node IDs)
    """
    # Build adjacency list
    graph: Dict[str, List[str]] = {node.get('id', ''): [] for node in nodes}
    for edge in edges:
        source = edge.get('from', '')
        target = edge.get('to', '')
        if source in graph:
            graph[source].append(target)
    
    # DFS-based cycle detection
    cycles = []
    visited: Set[str] = set()
    rec_stack: Set[str] = set()
    path: List[str] = []
    
    def dfs(node: str) -> bool:
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                # Found a cycle
                cycle_start = path.index(neighbor)
                cycles.append(path[cycle_start:])
                return True
        
        path.pop()
        rec_stack.remove(node)
        return False
    
    for node_id in graph:
        if node_id not in visited:
            dfs(node_id)
    
    return cycles


def _detect_version_conflicts(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect version conflicts in dependencies.
    
    Args:
        nodes: List of dependency nodes
        
    Returns:
        List of conflicts with package name and conflicting versions
    """
    # Group by package name
    package_versions: Dict[str, List[str]] = {}
    for node in nodes:
        package = node.get('package', '')
        version = node.get('version', '')
        if package and version:
            if package not in package_versions:
                package_versions[package] = []
            package_versions[package].append(version)
    
    # Find conflicts (multiple versions of same package)
    conflicts = []
    for package, versions in package_versions.items():
        unique_versions = set(versions)
        if len(unique_versions) > 1:
            conflicts.append({
                'package': package,
                'versions': sorted(unique_versions)
            })
    
    return conflicts


def _collect_dependency_evidence(nodes: List[Dict[str, Any]], snapshot: Dict[str, Any]) -> List[str]:
    """
    Collect evidence IDs related to dependencies.
    
    Args:
        nodes: List of dependency nodes
        snapshot: Repository snapshot
        
    Returns:
        List of evidence IDs
    """
    evidence_ids = []
    all_evidence = snapshot.get('evidence', [])
    
    # Find evidence for dependency declarations and resolutions
    for evidence in all_evidence:
        kind = evidence.get('kind', '')
        if kind in ['dependency-declaration', 'dependency-resolution']:
            evidence_ids.append(evidence.get('evidenceId', ''))
    
    return [eid for eid in evidence_ids if eid]
