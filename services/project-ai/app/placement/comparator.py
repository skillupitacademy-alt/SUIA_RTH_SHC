"""Evidence-backed canonical comparison for candidate blocks."""

from pathlib import Path
import json
import re
from typing import Any, Dict, List, Optional, Tuple

from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    PlacementDecision,
    PlacementFileAction,
    PlacementFileOperation,
)
from app.placement.patcher import compute_sha256


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

    def derive_file_operations(
        self,
        files: List[Any],
        family: BlockFamily | str,
        version: str,
        workspace_root: str | Path
    ) -> List[PlacementFileOperation]:
        """
        Derive granular, snapshot-backed file-level operations with pre-image hashes.
        
        Args:
            files: Candidate files (list of CandidateFile models or dicts)
            family: Target block family
            version: Target block version code (e.g. 'O1')
            workspace_root: Root directory of target repository
            
        Returns:
            List of validated PlacementFileOperation objects
        """
        ws = Path(workspace_root)
        family_name = family.value if isinstance(family, BlockFamily) else str(family)
        family_lower = family_name.lower()
        version_upper = version.upper()
        
        operations: List[PlacementFileOperation] = []
        
        # Target paths for canonical patched files
        renderer_rel_path = "packages/ui/src/tutorial/TutorialBlockRenderer.tsx"
        registry_rel_path = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts"
        types_rel_path = "packages/types/src/tutorial-page-content.types.ts"

        def get_pre_hash(rel_path: str) -> Optional[str]:
            full_path = ws / rel_path
            if full_path.exists():
                try:
                    return compute_sha256(full_path.read_bytes())
                except Exception:
                    return None
            return None

        component_name = None
        has_renderer_signal = False
        integration_filename = None
        integration_metadata = None

        for f in files:
            filename = f.get('filename') if isinstance(f, dict) else f.filename
            content = f.get('content') if isinstance(f, dict) else f.content
            if filename == "block.integration.json":
                try:
                    integration_metadata = json.loads(content)
                except (TypeError, json.JSONDecodeError) as error:
                    raise ValueError(f"block.integration.json must be valid JSON: {error}")
                if integration_metadata.get("family", "").lower() != family_lower:
                    raise ValueError("block.integration.json family must match the workflow target")
                if str(integration_metadata.get("version", "")).upper() != version_upper:
                    raise ValueError("block.integration.json version must match the workflow target")
                if integration_metadata.get("typeId", "").lower() != family_lower:
                    raise ValueError("block.integration.json typeId must match the workflow target")
                if not integration_metadata.get("componentFile") or not integration_metadata.get("componentExport"):
                    raise ValueError("block.integration.json must declare componentFile and componentExport")
                required_contract_fields = ("testFile", "jsonSchemaFile", "typeSchemaFile", "defaultPayload")
                missing_contract_fields = [
                    field for field in required_contract_fields if not integration_metadata.get(field)
                ]
                if missing_contract_fields:
                    raise ValueError(
                        "block.integration.json missing required portable contract fields: "
                        + ", ".join(missing_contract_fields)
                    )
                if not isinstance(integration_metadata["defaultPayload"], dict):
                    raise ValueError("block.integration.json defaultPayload must be an object")
                if not integration_metadata["defaultPayload"]:
                    raise ValueError("block.integration.json defaultPayload must not be empty")
                integration_filename = filename
                component_name = str(integration_metadata["componentExport"])
                break

        if integration_metadata is None:
            raise ValueError("Candidate package missing required block.integration.json")

        candidate_filenames = {
            (f.get('filename') if isinstance(f, dict) else f.filename)
            for f in files
        }
        for metadata_key in ("componentFile", "testFile", "jsonSchemaFile", "typeSchemaFile"):
            referenced_file = integration_metadata[metadata_key]
            if referenced_file not in candidate_filenames:
                raise ValueError(
                    f"block.integration.json {metadata_key} '{referenced_file}' is not in the candidate package"
                )

        for f in files:
            filename = f.get('filename') if isinstance(f, dict) else f.filename
            content = f.get('content') if isinstance(f, dict) else f.content
            source_sha = compute_sha256(content)
            
            # 1. Block Component
            if filename.endswith('.tsx') and not filename.endswith('.test.tsx') and not filename.endswith('.spec.tsx') and filename != 'TutorialBlockRenderer.tsx':
                if filename != integration_metadata["componentFile"]:
                    raise ValueError(
                        f"Component file '{filename}' does not match block.integration.json componentFile "
                        f"'{integration_metadata['componentFile']}'"
                    )
                component_export = re.escape(str(integration_metadata["componentExport"]))
                if not re.search(rf"export\s+(?:function|const|class)\s+{component_export}\b|\bas\s+{component_export}\b", content):
                    raise ValueError(
                        f"Component file '{filename}' does not export the declared "
                        f"componentExport '{integration_metadata['componentExport']}'"
                    )
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.CREATE,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path=f"packages/ui/src/tutorial/blocks/{filename}",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Create {family_name} {version_upper} React UI block component"
                ))
            
            # 2. Block Unit Tests
            elif filename.endswith('.test.tsx') or filename.endswith('.spec.tsx'):
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.CREATE,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path=f"packages/ui/src/tutorial/blocks/__tests__/{filename}",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Create Jest/React unit test suite for {family_name} {version_upper}"
                ))
            
            # 3. JSON Schema
            elif filename.endswith('.schema.json'):
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.CREATE,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path=f"packages/ui/src/tutorial/schemas/{filename}",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Create JSON schema validation contract for {family_name} {version_upper}"
                ))

            # 4. TypeScript Schema / Types
            elif filename.endswith('.schema.ts') or filename.endswith('.types.ts'):
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.CREATE,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path=f"packages/ui/src/tutorial/types/{filename}",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Create TypeScript types for {family_name} {version_upper}"
                ))

            # 5. Admin Composer Registry Entry
            elif filename == "block.integration.json":
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.SKIP,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path="",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description="Use portable integration metadata to generate controlled shared-file patches"
                ))

            # Legacy shared integration files are deliberately never copied into the repository.
            elif filename.lower() in ['registry.ts', f'{family_lower}.registry.ts', 'tutorialblockrenderer.tsx', 'tutorial-composer.service.ts']:
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.SKIP,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path="",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Project LLM owns shared integration; skip legacy shared file {filename}"
                ))

            # 7. Skip README / meta files
            else:
                operations.append(PlacementFileOperation(
                    action=PlacementFileAction.SKIP,
                    source_filename=filename,
                    source_sha256=source_sha,
                    target_path="",
                    expected_pre_hash=None,
                    patch_strategy=None,
                    description=f"Skip {filename} from canonical repository placement (metadata/doc)"
                ))

        # Add Runtime Renderer Patch Operation if component is present
        if component_name or has_renderer_signal:
            comp = component_name or f"{family_name}{version_upper}Block"
            operations.append(PlacementFileOperation(
                action=PlacementFileAction.PATCH_RENDERER,
                source_filename="TutorialBlockRenderer.tsx",
                source_sha256=compute_sha256(f"patch_renderer:{comp}"),
                target_path=renderer_rel_path,
                expected_pre_hash=get_pre_hash(renderer_rel_path),
                patch_strategy="DISPATCH_BRANCH",
                description=f"Surgically register {comp} in TutorialBlockRenderer.tsx runtime dispatch"
            ))

        family_registry_rel_path = f"apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/{family_lower}.registry.ts"
        family_registry_exists = (ws / family_registry_rel_path).exists()
        operations.append(PlacementFileOperation(
            action=PlacementFileAction.PATCH_FAMILY_REGISTRY,
            source_filename=integration_filename,
            source_sha256=compute_sha256(json.dumps(integration_metadata, sort_keys=True)),
            target_path=family_registry_rel_path,
            expected_pre_hash=get_pre_hash(family_registry_rel_path),
            patch_strategy="APPEND_VERSION" if family_registry_exists else "CREATE_FAMILY_REGISTRY",
            description=f"Safely add {family_name} {version_upper} without replacing existing family versions"
        ))

        if not family_registry_exists:
            operations.append(PlacementFileOperation(
                action=PlacementFileAction.PATCH_REGISTRY,
                source_filename=integration_filename,
                source_sha256=compute_sha256(f"patch_registry:{family_lower}Registry"),
                target_path=registry_rel_path,
                expected_pre_hash=get_pre_hash(registry_rel_path),
                patch_strategy="REGISTER_BLOCK",
                description=f"Register new {family_lower} family in Tutorial Composer index.ts"
            ))

        # Add Types Union Patch Operation
        if f"'{family_lower}'" not in (ws / types_rel_path).read_text(encoding='utf-8'):
            operations.append(PlacementFileOperation(
                action=PlacementFileAction.PATCH_TYPES,
                source_filename=integration_filename,
                source_sha256=compute_sha256(f"patch_types:{family_lower}"),
                target_path=types_rel_path,
                expected_pre_hash=get_pre_hash(types_rel_path),
                patch_strategy="UNION_MEMBER",
                description=f"Surgically add '{family_lower}' to TutorialPageContentType union"
            ))

        return operations

