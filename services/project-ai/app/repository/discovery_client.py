"""
Discovery client for reading TypeScript-generated snapshots.

ARCHITECTURAL RULE:
This client READS the TypeScript snapshot JSON. It does NOT scan the repository
independently. All repository facts come from the TypeScript D1-D8 scanners.
"""

import json
from pathlib import Path
from typing import Any, Dict

from pydantic import BaseModel, Field


class DiscoveryClient:
    """
    Client for reading and validating TypeScript-generated discovery snapshots.
    
    This client enforces the architectural boundary: Python orchestrates AI,
    TypeScript discovers facts. Never scan files or run shell commands here.
    """
    
    def __init__(self, snapshot_path: str | Path):
        """
        Initialize discovery client with path to snapshot file.
        
        Args:
            snapshot_path: Path to the TypeScript-generated snapshot JSON file
        """
        self.snapshot_path = Path(snapshot_path)
        self._cached_snapshot: Dict[str, Any] | None = None
    
    def load_snapshot(self) -> Dict[str, Any]:
        """
        Load and validate the TypeScript snapshot.
        
        Returns:
            Parsed snapshot data
            
        Raises:
            FileNotFoundError: If snapshot file doesn't exist
            ValueError: If snapshot is invalid or missing required keys
        """
        if self._cached_snapshot is not None:
            return self._cached_snapshot
        
        if not self.snapshot_path.exists():
            raise FileNotFoundError(
                f"Snapshot file not found: {self.snapshot_path}. "
                "Run TypeScript discovery scan first: "
                "pnpm --filter @quiz/project-llm-discovery scan"
            )
        
        with open(self.snapshot_path, 'r', encoding='utf-8') as f:
            snapshot = json.load(f)
        
        # Validate required top-level keys
        required_keys = [
            'metadata',
            'applications',
            'packages',
            'services',
            'evidence',
            'findings'
        ]
        
        missing_keys = [key for key in required_keys if key not in snapshot]
        if missing_keys:
            raise ValueError(
                f"Invalid snapshot: missing required keys: {missing_keys}. "
                "The snapshot may be from an outdated scanner version."
            )
        
        self._cached_snapshot = snapshot
        return snapshot
    
    def get_evidence_by_id(self, evidence_id: str) -> Dict[str, Any] | None:
        """
        Retrieve specific evidence record by ID.
        
        Args:
            evidence_id: The unique evidence identifier
            
        Returns:
            Evidence record if found, None otherwise
        """
        snapshot = self.load_snapshot()
        evidence_list = snapshot.get('evidence', [])
        
        for evidence in evidence_list:
            if evidence.get('evidenceId') == evidence_id:
                return evidence
        
        return None
    
    def get_all_evidence(self) -> list[Dict[str, Any]]:
        """
        Get all evidence records from snapshot.
        
        Returns:
            List of all evidence records
        """
        snapshot = self.load_snapshot()
        return snapshot.get('evidence', [])
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get snapshot metadata (timestamps, scanner versions, etc).
        
        Returns:
            Snapshot metadata
        """
        snapshot = self.load_snapshot()
        return snapshot.get('metadata', {})
    
    def clear_cache(self):
        """Clear cached snapshot data to force reload on next access."""
        self._cached_snapshot = None
