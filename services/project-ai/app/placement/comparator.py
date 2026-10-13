"""Evidence-backed canonical comparison for candidate blocks."""

import re
from typing import Any, Dict, List, Optional, Tuple

from app.models.candidate import BlockFamily, CandidateFile, PlacementDecision


class StructuralFeatures:
    """Extracted structural features from a block for comparison."""
    
    def __init__(self):
        self.data_attributes: set[str] = set()
        self.css_classes: set[str] = set()
        self.html_tags: set[str] = set()
        self.component_names: set[str] = set()
        self.has_quiz_logic: bool = False
        self.has_media_embed: bool = False
        self.has_step_navigation: bool = False
        self.file_count: int = 0
        self.has_typescript: bool = False
        self.has_styles: bool = False


class CanonicalComparator:
    """
    Evidence-backed comparison engine for candidate blocks.
    
    Compares candidate structural features against canonical blocks
    from the TypeScript discovery snapshot.
    """
    
    def __init__(self, snapshot: Dict[str, Any]):
        """
        Initialize comparator with snapshot data.
        
        Args:
            snapshot: TypeScript discovery snapshot
        """
        self.snapshot = snapshot
    
    def extract_features(self, files: List[CandidateFile]) -> StructuralFeatures:
        """
        Extract structural features from candidate files.
        
        Args:
            files: List of candidate files
            
        Returns:
            Extracted structural features
        """
        features = StructuralFeatures()
        features.file_count = len(files)
        
        for file in files:
            content = file.content.lower()
            filename = file.filename.lower()
            
            # Track file types
            if filename.endswith(('.ts', '.tsx')):
                features.has_typescript = True
            if filename.endswith(('.css', '.scss', '.module.css')):
                features.has_styles = True
            
            # Extract data attributes
            data_attrs = re.findall(r'data-[\w-]+', content)
            features.data_attributes.update(data_attrs)
            
            # Extract CSS classes (case-insensitive for className/classname)
            class_matches = re.findall(r'class(?:name)?=["\']([^"\']+)["\']', content, re.IGNORECASE)
            for match in class_matches:
                features.css_classes.update(match.split())
            
            # Extract HTML tags
            tag_matches = re.findall(r'<(\w+)', content)
            features.html_tags.update(tag_matches)
            
            # Extract component names (React/TypeScript)
            component_matches = re.findall(r'(?:function|const)\s+(\w+)(?:\s*:\s*React\.FC)?', content)
            features.component_names.update(component_matches)
            
            # Detect specific patterns
            if any(keyword in content for keyword in ['question', 'answer', 'quiz', 'assessment']):
                features.has_quiz_logic = True
            
            if any(tag in features.html_tags for tag in ['video', 'audio', 'iframe']):
                features.has_media_embed = True
            
            if any(keyword in content for keyword in ['step', 'next', 'previous', 'navigation']):
                features.has_step_navigation = True
        
        return features
    
    def compare_to_canonical(
        self,
        candidate_features: StructuralFeatures,
        family: BlockFamily,
        candidate_files: List[CandidateFile]
    ) -> Tuple[Optional[str], float, List[str], List[str]]:
        """
        Compare candidate against canonical blocks from snapshot.
        
        Args:
            candidate_features: Extracted candidate features
            family: Detected block family
            candidate_files: Candidate files for detailed comparison
            
        Returns:
            Tuple of (best_match_id, similarity_score, differences, evidence_ids)
        """
        blocks = self.snapshot.get('blocks', {})
        verified_blocks = blocks.get('verified', [])
        
        if not verified_blocks:
            return (None, 0.0, ["No verified blocks in snapshot"], [])
        
        # Filter blocks by family
        family_blocks = [
            block for block in verified_blocks
            if self._matches_family(block.get('blockType', ''), family)
        ]
        
        if not family_blocks:
            return (
                None,
                0.0,
                [f"No verified {family.value} blocks found in repository"],
                []
            )
        
        # Compare against each family block
        best_match = None
        best_score = 0.0
        best_differences = []
        best_evidence_ids = []
        
        for block in family_blocks:
            score, differences, evidence_ids = self._compare_to_block(
                candidate_features,
                block,
                candidate_files
            )
            
            if score > best_score:
                best_score = score
                best_match = block.get('blockId') or block.get('blockType')
                best_differences = differences
                best_evidence_ids = evidence_ids
        
        return (best_match, best_score, best_differences, best_evidence_ids)
    
    def _compare_to_block(
        self,
        candidate_features: StructuralFeatures,
        canonical_block: Dict[str, Any],
        candidate_files: List[CandidateFile]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Compare candidate features to a single canonical block.
        
        Args:
            candidate_features: Candidate structural features
            canonical_block: Canonical block from snapshot
            candidate_files: Candidate files
            
        Returns:
            Tuple of (similarity_score, differences, evidence_ids)
        """
        score_components = []
        differences = []
        evidence_ids = []
        
        # Collect evidence IDs from canonical block
        if 'evidenceId' in canonical_block:
            evidence_ids.append(canonical_block['evidenceId'])
        
        block_type = canonical_block.get('blockType', '')
        
        # Compare structural elements
        canonical_path = canonical_block.get('implementationPath', '')
        
        # Data attribute similarity
        if 'data-block-type' in candidate_features.data_attributes:
            score_components.append(0.2)
        else:
            differences.append("Missing data-block-type attribute")
        
        if 'data-block-version' in candidate_features.data_attributes:
            score_components.append(0.15)
        else:
            differences.append("Missing data-block-version (UBRC required)")
        
        # File structure similarity
        if candidate_features.has_typescript:
            score_components.append(0.15)
        else:
            differences.append("No TypeScript files (canonical blocks use TypeScript)")
        
        if candidate_features.has_styles:
            score_components.append(0.1)
        
        # Family-specific features
        if 'tutorial' in block_type.lower():
            if candidate_features.has_step_navigation:
                score_components.append(0.2)
            else:
                differences.append("Missing step navigation (expected for Tutorial)")
        
        if 'assessment' in block_type.lower() or 'quiz' in block_type.lower():
            if candidate_features.has_quiz_logic:
                score_components.append(0.2)
            else:
                differences.append("Missing quiz/assessment logic")
        
        if 'media' in block_type.lower():
            if candidate_features.has_media_embed:
                score_components.append(0.2)
            else:
                differences.append("Missing media embed elements")
        
        # UBRC compliance check
        ubrc_status = canonical_block.get('ubrcDetails', {}).get('ubrcStatus')
        if ubrc_status == 'UBRC_VALID':
            score_components.append(0.1)
            differences.append("Canonical block is UBRC compliant")
        else:
            differences.append(f"Canonical block UBRC status: {ubrc_status}")
        
        # Renderer check
        if canonical_block.get('rendered'):
            score_components.append(0.1)
        
        total_score = sum(score_components)
        
        return (total_score, differences, evidence_ids)
    
    def determine_placement_action(
        self,
        similarity_score: float,
        best_match: Optional[str],
        family: BlockFamily
    ) -> PlacementDecision:
        """
        Determine placement action based on similarity score.
        
        Args:
            similarity_score: Computed similarity (0.0-1.0)
            best_match: ID of best matching canonical block, if any
            family: Detected block family
            
        Returns:
            Placement decision
        """
        if best_match is None:
            return PlacementDecision.ADD
        
        if similarity_score >= 0.85:
            # Very high similarity: update existing block
            return PlacementDecision.UPDATE
        elif similarity_score >= 0.6:
            # Moderate similarity: extend family with new variant
            return PlacementDecision.EXTEND
        elif similarity_score >= 0.4:
            # Some similarity: add as new block in family
            return PlacementDecision.ADD
        else:
            # Low similarity: may not be suitable
            return PlacementDecision.REJECT
    
    def determine_target_path(
        self,
        decision: PlacementDecision,
        family: BlockFamily,
        candidate_id: str,
        best_match: Optional[str]
    ) -> str:
        """
        Determine target repository path based on placement decision.
        
        Args:
            decision: Placement decision
            family: Block family
            candidate_id: Candidate identifier
            best_match: Best matching canonical block ID
            
        Returns:
            Target path in repository
        """
        family_dir = family.value.lower()
        
        if decision == PlacementDecision.UPDATE and best_match:
            # Find existing block path from snapshot
            blocks = self.snapshot.get('blocks', {}).get('verified', [])
            for block in blocks:
                if block.get('blockId') == best_match or block.get('blockType') == best_match:
                    impl_path = block.get('implementationPath', '')
                    if impl_path:
                        return impl_path
            
            # Fallback if path not found
            return f"packages/blocks/{family_dir}/{best_match}"
        
        elif decision == PlacementDecision.EXTEND:
            return f"packages/blocks/{family_dir}/{candidate_id}"
        
        elif decision == PlacementDecision.ADD:
            return f"packages/blocks/{family_dir}/{candidate_id}"
        
        else:  # REJECT or REUSE
            return ""
    
    def _matches_family(self, block_type: str, family: BlockFamily) -> bool:
        """
        Check if block type matches a block family.
        
        Args:
            block_type: Block type from snapshot
            family: Block family to match
            
        Returns:
            True if block type matches family
        """
        block_type_lower = block_type.lower()
        
        family_keywords = {
            BlockFamily.INTRODUCTION: ['intro', 'introduction', 'i1', 'i2'],
            BlockFamily.TUTORIAL: ['tutorial', 'lesson', 't1', 't2', 't3'],
            BlockFamily.ASSESSMENT: ['quiz', 'assessment', 'test', 'q1', 'a1'],
            BlockFamily.MEDIA: ['media', 'video', 'audio', 'm1'],
            BlockFamily.SUMMARY: ['summary', 'recap', 's1'],
            BlockFamily.CUSTOM: ['custom', 'c1'],
        }
        
        keywords = family_keywords.get(family, [])
        return any(keyword in block_type_lower for keyword in keywords)
