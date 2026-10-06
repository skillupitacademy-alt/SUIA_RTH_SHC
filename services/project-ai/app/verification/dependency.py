"""
Dependency Graph Verification Module.

ARCHITECTURAL RULE:
- Verify dependency graph from snapshot.dependencies ONLY
- Check for circular dependencies
- Check for version conflicts
- Check for unlicensed packages
- Return evidence_ids from snapshot

Dependency Verification Flow:
    Read snapshot.dependencies → Build dependency graph
        → Detect circular dependencies (DFS cycle detection)
        → Check version conflicts (semver comparison)
        → Check package licenses (allowed list)
        → Return evidence_ids

Error Types:
    - Circular dependencies: A → B → C → A
    - Version conflicts: package@^1.0.0 vs package@^2.0.0
    - Unlicensed packages: packages without approved licenses
"""

from typing import Dict, Any, List, Set, Tuple


def verify_dependency_graph(
    dependencies: Dict[str, Any],
    snapshot: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Verify dependency graph from snapshot data.
    
    Args:
        dependencies: Dependency data from snapshot.dependencies
        snapshot: Full TypeScript discovery snapshot
    
    Returns:
        Dict with verification results:
        - circular_dependencies: List of circular dependency chains
        - version_conflicts: List of version conflicts
        - unlicensed_packages: List of unlicensed packages
        - evidence_ids: List of evidence IDs from snapshot
    """
    result = {
        'circular_dependencies': [],
        'version_conflicts': [],
        'unlicensed_packages': [],
        'evidence_ids': []
    }
    
    # Collect evidence IDs from dependency evidence
    all_evidence = snapshot.get('evidence', [])
    for evidence in all_evidence:
        if evidence.get('kind') == 'dependency':
            result['evidence_ids'].append(evidence['evidenceId'])
    
    # Get dependency graph from snapshot
    dependency_graph = dependencies.get('graph', {})
    packages = dependencies.get('packages', [])
    
    # 1. Detect circular dependencies
    circular_deps = _detect_circular_dependencies(dependency_graph)
    result['circular_dependencies'] = circular_deps
    
    # 2. Check version conflicts
    version_conflicts = _detect_version_conflicts(packages)
    result['version_conflicts'] = version_conflicts
    
    # 3. Check unlicensed packages
    unlicensed = _detect_unlicensed_packages(packages)
    result['unlicensed_packages'] = unlicensed
    
    return result


def _detect_circular_dependencies(
    graph: Dict[str, List[str]]
) -> List[List[str]]:
    """
    Detect circular dependencies using DFS cycle detection.
    
    Args:
        graph: Dependency graph {package: [dependencies]}
    
    Returns:
        List of circular dependency chains
    """
    cycles: List[List[str]] = []
    visited: Set[str] = set()
    rec_stack: Set[str] = set()
    path: List[str] = []
    
    def dfs(node: str) -> bool:
        """DFS with cycle detection."""
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                # Found cycle - extract the cycle path
                cycle_start = path.index(neighbor)
                cycle = path[cycle_start:] + [neighbor]
                cycles.append(cycle)
                return True
        
        path.pop()
        rec_stack.remove(node)
        return False
    
    # Check all nodes
    for node in graph:
        if node not in visited:
            dfs(node)
    
    return cycles


def _detect_version_conflicts(
    packages: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """
    Detect version conflicts in package dependencies.
    
    Args:
        packages: List of package records from snapshot
    
    Returns:
        List of version conflicts
    """
    conflicts: List[Dict[str, str]] = []
    package_versions: Dict[str, List[str]] = {}
    
    # Group packages by name
    for pkg in packages:
        name = pkg.get('name', '')
        version = pkg.get('version', '')
        
        if name and version:
            if name not in package_versions:
                package_versions[name] = []
            package_versions[name].append(version)
    
    # Check for multiple versions of same package
    for name, versions in package_versions.items():
        if len(set(versions)) > 1:
            # Multiple versions found - potential conflict
            conflicts.append({
                'package': name,
                'required': versions[0],
                'installed': versions[1] if len(versions) > 1 else versions[0]
            })
    
    return conflicts


def _detect_unlicensed_packages(
    packages: List[Dict[str, Any]]
) -> List[str]:
    """
    Detect packages without approved licenses.
    
    Approved licenses:
    - MIT
    - Apache-2.0
    - BSD-2-Clause
    - BSD-3-Clause
    - ISC
    - CC0-1.0
    
    Args:
        packages: List of package records from snapshot
    
    Returns:
        List of unlicensed package names
    """
    APPROVED_LICENSES = {
        'MIT',
        'Apache-2.0',
        'BSD-2-Clause',
        'BSD-3-Clause',
        'ISC',
        'CC0-1.0',
        'CC-BY-4.0',
        'Unlicense',
    }
    
    unlicensed: List[str] = []
    
    for pkg in packages:
        name = pkg.get('name', '')
        license_type = pkg.get('license', '')
        
        if not name:
            continue
        
        # Check if license is approved
        if not license_type or license_type not in APPROVED_LICENSES:
            unlicensed.append(name)
    
    return unlicensed
