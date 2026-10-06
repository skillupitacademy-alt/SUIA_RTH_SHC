"""
Block Specification Agent (Agent 04)

Generates CandidateBlockSpecification by parsing candidate structure and
comparing to canonical blocks using evidence-backed comparison.

Architecture Rules:
- Agent 04 parses candidate files for structural analysis
- Uses CanonicalComparator for evidence-backed comparison
- Generates StructuralRequirement list from matched patterns
- Determines block_family and detected_type
- Returns specification with evidence_ids from canonical blocks
"""

from datetime import datetime, UTC
from typing import Any, Dict, List

from app.models.agent_result import AgentResult, AgentStatus
from app.models.candidate import BlockFamily, CandidateFile, CandidatePackage
from app.orchestration.agent_coordinator import AgentContext
from app.placement.comparator import CanonicalComparator


async def execute_block_specification(context: AgentContext) -> AgentResult:
    """
    Execute block specification agent.
    
    Generates CandidateBlockSpecification:
    1. Read candidate package from context.workflow_state
    2. Extract candidate files
    3. Parse structural features (props, components, exports)
    4. Compare to canonical blocks using CanonicalComparator
    5. Generate StructuralRequirement list
    6. Determine block_family and detected_type
    
    Args:
        context: Agent execution context with snapshot and candidate
        
    Returns:
        AgentResult with specification and evidence_ids
    """
    start_time = datetime.now(UTC)
    
    try:
        # Get candidate package from workflow state
        candidate_package_data = context.workflow_state.get('candidate_package')
        
        if not candidate_package_data:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="block_specification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["No candidate_package found in workflow state"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Parse candidate package
        candidate_package = CandidatePackage(**candidate_package_data)
        
        # Get snapshot for canonical comparison
        snapshot = context.repository_snapshot
        
        if not snapshot:
            execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
            return AgentResult(
                agent_id="block_specification",
                status=AgentStatus.BLOCKED,
                outputs={},
                evidence_ids=[],
                errors=["No snapshot available for canonical comparison"],
                warnings=[],
                execution_time_ms=execution_time,
                timestamp=datetime.now(UTC)
            )
        
        # Initialize comparator
        comparator = CanonicalComparator(snapshot)
        
        # Extract structural features from candidate files
        features = comparator.extract_features(candidate_package.files)
        
        # Classify candidate to determine block family
        classification = _classify_candidate_family(candidate_package.files, features)
        block_family = BlockFamily(classification['family'])
        
        # Compare to canonical blocks
        best_match, similarity_score, differences, evidence_ids = comparator.compare_to_canonical(
            candidate_features=features,
            family=block_family,
            candidate_files=candidate_package.files
        )
        
        # Generate structural requirements
        structural_requirements = _generate_structural_requirements(
            features=features,
            differences=differences,
            block_family=block_family
        )
        
        # Determine detected type from candidate files
        detected_type = _determine_detected_type(candidate_package.files)
        
        # Build specification
        specification = {
            "candidateId": candidate_package.candidateId,
            "blockFamily": block_family.value,
            "detectedType": detected_type,
            "bestCanonicalMatch": best_match,
            "similarityScore": similarity_score,
            "structuralRequirements": structural_requirements,
            "differences": differences,
            "featureSummary": {
                "fileCount": features.file_count,
                "hasTypeScript": features.has_typescript,
                "hasStyles": features.has_styles,
                "hasQuizLogic": features.has_quiz_logic,
                "hasMediaEmbed": features.has_media_embed,
                "hasStepNavigation": features.has_step_navigation,
                "dataAttributes": sorted(list(features.data_attributes)),
                "componentNames": sorted(list(features.component_names))
            }
        }
        
        # Build outputs
        outputs = {
            "specification": specification,
            "block_family": block_family.value,
            "detected_type": detected_type,
            "similarity_score": similarity_score,
            "best_canonical_match": best_match,
            "structural_requirements_count": len(structural_requirements)
        }
        
        # Calculate execution time
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return AgentResult(
            agent_id="block_specification",
            status=AgentStatus.SUCCESS,
            outputs=outputs,
            evidence_ids=evidence_ids,
            errors=[],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )
    
    except Exception as e:
        execution_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        return AgentResult(
            agent_id="block_specification",
            status=AgentStatus.FAILED,
            outputs={},
            evidence_ids=[],
            errors=[f"Block specification execution failed: {str(e)}"],
            warnings=[],
            execution_time_ms=execution_time,
            timestamp=datetime.now(UTC)
        )


def _classify_candidate_family(files: List[CandidateFile], features: Any) -> Dict[str, Any]:
    """
    Classify candidate block family based on files and features.
    
    Args:
        files: Candidate files
        features: Extracted structural features
        
    Returns:
        Dict with 'family' and 'reasoning'
    """
    # Check for assessment/quiz indicators
    if features.has_quiz_logic:
        return {
            'family': BlockFamily.ASSESSMENT.value,
            'reasoning': 'Quiz/assessment logic detected in candidate'
        }
    
    # Check for media indicators
    if features.has_media_embed:
        return {
            'family': BlockFamily.MEDIA.value,
            'reasoning': 'Media embed elements detected in candidate'
        }
    
    # Check for tutorial indicators
    if features.has_step_navigation:
        return {
            'family': BlockFamily.TUTORIAL.value,
            'reasoning': 'Step navigation detected in candidate'
        }
    
    # Check filenames for hints
    for file in files:
        filename_lower = file.filename.lower()
        
        if 'intro' in filename_lower:
            return {
                'family': BlockFamily.INTRODUCTION.value,
                'reasoning': 'Introduction indicator in filename'
            }
        
        if 'summary' in filename_lower or 'recap' in filename_lower:
            return {
                'family': BlockFamily.SUMMARY.value,
                'reasoning': 'Summary indicator in filename'
            }
    
    # Default to custom
    return {
        'family': BlockFamily.CUSTOM.value,
        'reasoning': 'No clear family indicators, classified as custom'
    }


def _generate_structural_requirements(
    features: Any,
    differences: List[str],
    block_family: BlockFamily
) -> List[Dict[str, Any]]:
    """
    Generate structural requirements based on features and differences.
    
    Args:
        features: Extracted structural features
        differences: Differences from canonical comparison
        block_family: Detected block family
        
    Returns:
        List of structural requirements
    """
    requirements = []
    
    # UBRC compliance requirement
    if 'data-block-version' not in features.data_attributes:
        requirements.append({
            "requirement": "Add data-block-version attribute for UBRC compliance",
            "category": "UBRC",
            "priority": "high",
            "reason": "Required for Universal Block Registry Contract"
        })
    
    if 'data-block-type' not in features.data_attributes:
        requirements.append({
            "requirement": "Add data-block-type attribute for UBRC compliance",
            "category": "UBRC",
            "priority": "high",
            "reason": "Required for block type identification"
        })
    
    # TypeScript requirement
    if not features.has_typescript:
        requirements.append({
            "requirement": "Convert to TypeScript",
            "category": "Toolchain",
            "priority": "high",
            "reason": "Canonical blocks use TypeScript for type safety"
        })
    
    # Styles requirement
    if not features.has_styles:
        requirements.append({
            "requirement": "Add CSS Module or styled-components",
            "category": "Styling",
            "priority": "medium",
            "reason": "Canonical blocks use modular styling"
        })
    
    # Family-specific requirements
    if block_family == BlockFamily.TUTORIAL and not features.has_step_navigation:
        requirements.append({
            "requirement": "Implement step navigation controls",
            "category": "Tutorial",
            "priority": "high",
            "reason": "Tutorial blocks require step-by-step navigation"
        })
    
    if block_family == BlockFamily.ASSESSMENT and not features.has_quiz_logic:
        requirements.append({
            "requirement": "Implement quiz/assessment logic",
            "category": "Assessment",
            "priority": "high",
            "reason": "Assessment blocks require interactive quiz functionality"
        })
    
    if block_family == BlockFamily.MEDIA and not features.has_media_embed:
        requirements.append({
            "requirement": "Add media embed support (video/audio/iframe)",
            "category": "Media",
            "priority": "high",
            "reason": "Media blocks require embedded media elements"
        })
    
    # Component structure requirements
    if len(features.component_names) == 0:
        requirements.append({
            "requirement": "Define React component",
            "category": "Structure",
            "priority": "high",
            "reason": "Canonical blocks are React components"
        })
    
    return requirements


def _determine_detected_type(files: List[CandidateFile]) -> str:
    """
    Determine detected block type from candidate files.
    
    Args:
        files: Candidate files
        
    Returns:
        Detected block type string
    """
    # Try to find a main component file
    for file in files:
        filename = file.filename.lower()
        
        # Look for index.tsx or BlockName.tsx
        if filename.endswith('.tsx') and ('index' in filename or 'block' in filename):
            # Extract component name from file content
            content = file.content
            
            # Look for export default or export function
            import re
            
            # Match: export default function ComponentName
            match = re.search(r'export\s+default\s+function\s+(\w+)', content)
            if match:
                return match.group(1)
            
            # Match: export function ComponentName
            match = re.search(r'export\s+function\s+(\w+)', content)
            if match:
                return match.group(1)
            
            # Match: const ComponentName = () =>
            match = re.search(r'const\s+(\w+)\s*=\s*\(', content)
            if match:
                return match.group(1)
    
    # Fallback to first TypeScript file name
    for file in files:
        if file.filename.endswith('.tsx'):
            # Remove extension and capitalize
            name = file.filename[:-4]
            return name.replace('-', '').replace('_', '')
    
    return "UnknownBlock"
