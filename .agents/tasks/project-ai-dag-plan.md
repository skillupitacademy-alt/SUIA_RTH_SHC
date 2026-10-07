# Implementation Plan: 15-Agent DAG Architecture for Project AI

**Repository:** e:\onlinewebsites\quiz-platform  
**Branch:** m2-project-ai-foundation  
**Design Document:** .agents/tasks/project-ai-dag-design.md (v1.2 - Approved)  
**Python Service:** services/project-ai/  
**Test Framework:** pytest 9.1.1 with pytest-asyncio  
**Total Agents:** 15 core agents + 7 certification gate modules (implemented as methods in certification/gates.py)

---

## Architecture Summary

This plan implements the approved 15-agent DAG architecture with:
- **Sequential Foundation Chain:** Agents 01-04 (Repository → Snapshot → Evidence → Specification)
- **Sequential Candidate Pipeline:** Agents 05-11 (Intake → Classification → Comparison → Manifest → Approval → Execution → Verification)
- **Parallel Certification Gates:** 7-9 gate methods running concurrently after placement (Contract, Dependency, UBRC, Registry, Renderer, Brand, Theme, Composer, Evidence)
- **Sequential Runtime Chain:** Agents 12K-12L (Runtime → Playwright Browser)
- **Sequential Final Sequence:** Agents 13-15 (Final Evidence Freeze → Final Gate → Human Certification)

**Key Architectural Invariants:**
1. TypeScript generates all repository facts via snapshot - Python never scans files
2. Snapshot generated ONCE at Agent 02, frozen forever (no regeneration)
3. Placement executor consumes ONLY approved manifest hash, never recomputes
4. Every PASS requires evidence_ids + commit_sha + snapshot_hash
5. Brand/Theme gates consume snapshot.brand/snapshot.theme - NO Path.read_text()
6. Final gate requires 14 gates (ILS/LSNB/RSSB deferred to Phase 2, so 11 in MVP)

---

## Wave A: Foundation Contracts (Models + DAG Definition)

### Overview
Create foundational model contracts and DAG structure that all agents depend on. Extract AgentResult from agent_coordinator.py into dedicated model.

- [ ] **1. Create specification.py model**
      Define CandidateBlockSpecification with SpecificationStatus enum, StructuralRequirement dataclass, CandidateBlockSpecification dataclass, SpecificationResult dataclass per design doc section 2.1.
      Files: services/project-ai/app/models/specification.py
      Verify: `cd services/project-ai && python -c 'from app.models.specification import CandidateBlockSpecification, SpecificationStatus, StructuralRequirement, SpecificationResult; print("OK")'`

- [ ] **2. Create agent_result.py model**
      Extract AgentStatus enum, GateStatus enum, AgentResult dataclass from agent_coordinator.py lines 23-63 into dedicated model file. Include all fields: agent_id, status, outputs, evidence_ids, errors, warnings, execution_time_ms, timestamp, passed property, failed property, to_dict() method.
      Files: services/project-ai/app/models/agent_result.py
      Verify: `cd services/project-ai && python -c 'from app.models.agent_result import AgentResult, AgentStatus, GateStatus; print("OK")'`

- [ ] **3. Create gate_result.py model**
      Define GateVerdict enum (PASS/FAIL/BLOCKED), GateResult dataclass with gate_id, verdict, message, evidence_ids, blockers, execution_time_ms, timestamp, passed property, blocked property, to_dict() method.
      Files: services/project-ai/app/models/gate_result.py
      Verify: `cd services/project-ai && python -c 'from app.models.gate_result import GateResult, GateVerdict; print("OK")'`

- [ ] **4. Create placement.py model**
      Define PlacementAction enum, PlacementEntry dataclass, PlacementManifest dataclass with complete fields including entries, evidence_ids, manifest_hash, approval fields. May need to import/extend existing PlacementManifest from candidate.py.
      Files: services/project-ai/app/models/placement.py
      Verify: `cd services/project-ai && python -c 'from app.models.placement import PlacementManifest, PlacementEntry, PlacementAction; print("OK")'`

- [ ] **5. Create certification.py model**
      Define CertificationVerdict enum, HumanCertificationDecision enum, FinalCertification dataclass with gate aggregation fields.
      Files: services/project-ai/app/models/certification.py
      Verify: `cd services/project-ai && python -c 'from app.models.certification import FinalCertification, CertificationVerdict, HumanCertificationDecision; print("OK")'`

- [ ] **6. Update models/__init__.py exports**
      Export all new models for easy importing.
      Files: services/project-ai/app/models/__init__.py
      Verify: `cd services/project-ai && python -c 'from app.models import CandidateBlockSpecification, AgentResult, GateResult, PlacementManifest, FinalCertification; print("OK")'`

- [ ] **7. Update agent_coordinator.py imports**
      Replace local AgentResult/AgentStatus/GateStatus class definitions (lines 23-63) with import from models.agent_result: `from app.models.agent_result import AgentResult, AgentStatus, GateStatus`. Remove duplicate class definitions.
      Files: services/project-ai/app/orchestration/agent_coordinator.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_coordinator.py -v`

- [ ] **8. Create workflow_dag.py with AGENT_WORKFLOW_DAG**
      Define complete DAG dictionary with all 15 agents and their dependencies. Structure: `{'agent-01-repository-auditor': {'name': 'Repository Auditor', 'depends_on': [], 'parallel_group': None}, ...}`. Certification gates in parallel_group 'certification-gates' all depending on agent-11.
      Files: services/project-ai/app/orchestration/workflow_dag.py
      Verify: `cd services/project-ai && python -c 'from app.orchestration.workflow_dag import AGENT_WORKFLOW_DAG; assert len(AGENT_WORKFLOW_DAG) == 15, f"Expected 15 agents, got {len(AGENT_WORKFLOW_DAG)}"; print("OK")'`

- [ ] **9. Update orchestration/__init__.py exports**
      Export AGENT_WORKFLOW_DAG for use by workflow engine.
      Files: services/project-ai/app/orchestration/__init__.py
      Verify: `cd services/project-ai && python -c 'from app.orchestration import AGENT_WORKFLOW_DAG; print("OK")'`

- [ ] **10. Update evidence logger with directory structure helper**
      Add create_evidence_directory_structure() method to EvidenceLogger that creates subdirs: gates/, agents/, screenshots/, commands/, logs/, results/, browser/, final/.
      Files: services/project-ai/app/evidence/logger.py
      Verify: `cd services/project-ai && python -m pytest tests/evidence/test_logger.py -v -k directory_structure`

---

## Wave B: Foundation Agents (01-04)

### Overview
Implement foundation agents that establish frozen snapshot and evidence baseline.

- [ ] **11. Create repository_auditor.py (Agent 01)**
      Validate git repository state. Check: .git/ exists, working directory clean via `git status --porcelain`, branch validation (m2-project-ai-foundation or feature/*), no merge conflicts via `git ls-files -u`, remote reachable via `git remote -v`. Return BLOCKED if dirty or remote unreachable. Output: commit_sha (via `git rev-parse HEAD`), branch_name, is_clean, remote_reachable, health_status.
      Files: services/project-ai/app/agents/repository_auditor.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_repository_auditor.py -v`

- [ ] **12. Create snapshot_authority.py (Agent 02)**
      Call TypeScript discovery via `subprocess.run(['pnpm', 'tsx', '.agents/scripts/regenerate-m1-snapshot.mjs'], timeout=300)`. Read snapshot from .agents/output/snapshot.json. Extract snapshot.canonicalHash (TypeScript computed). Copy snapshot to .project-ai/runs/{commit-sha[:8]}-{snapshot-hash[:8]}/snapshot.json. Output: snapshot_hash, snapshot_path, evidence_count.
      Files: services/project-ai/app/agents/snapshot_authority.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_snapshot_authority.py -v`

- [ ] **13. Create evidence_freeze.py (Agent 03)**
      Read snapshot from prior agent. Extract all evidence records from snapshot.evidence array. Validate structure: required fields, contentHash format (64-char SHA-256 hex), no duplicates, valid lifecycle values. Create evidence index. NO file recomputation. Output: evidence_count, binding_valid, format_valid, evidence_ids.
      Files: services/project-ai/app/agents/evidence_freeze.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_evidence_freeze.py -v`

- [ ] **14. Create block_specification.py (Agent 04)**
      Read candidate package from context. Parse TypeScript AST for structural analysis. Compare to canonical blocks using placement/comparator.py CanonicalComparator. Generate StructuralRequirement list. Determine block_family and detected_type. Output: specification (CandidateBlockSpecification), evidence_ids.
      Files: services/project-ai/app/agents/block_specification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_block_specification.py -v`

- [ ] **15. Create test files for foundation agents**
      Create comprehensive test coverage: test_repository_auditor.py (test clean repo, dirty repo blocked, merge conflicts, invalid branch, remote unreachable), test_snapshot_authority.py (test snapshot generation, hash extraction, copy to run dir, typescript failure), test_evidence_freeze.py (test validation, duplicates, invalid hash format, missing fields), test_block_specification.py (test specification generation, canonical comparison, structural requirements, block family determination).
      Files: services/project-ai/tests/agents/test_repository_auditor.py, test_snapshot_authority.py, test_evidence_freeze.py, test_block_specification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_repository_auditor.py tests/agents/test_snapshot_authority.py tests/agents/test_evidence_freeze.py tests/agents/test_block_specification.py -v`

- [ ] **16. Update agent_registry.py with foundation agents**
      Register new AgentType enum values: REPOSITORY_AUDITOR, SNAPSHOT_AUTHORITY, EVIDENCE_FREEZE, BLOCK_SPECIFICATION with capabilities.
      Files: services/project-ai/app/orchestration/agent_registry.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_registry.py -v`

---

## Wave C: Candidate Pipeline (05-11)

### Overview
Implement candidate intake through placement execution pipeline. Reuses existing comparator.py for Agent 07.

- [ ] **17. Extend intake.py (Agent 05)**
      Extend execute_intake() to validate candidate package structure, compute file hashes, extract metadata, integrate with block specification from Agent 04. Output: candidate_validation_status, candidate_id, file_hashes.
      Files: services/project-ai/app/agents/intake.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_intake.py -v`

- [ ] **18. Create classification.py (Agent 06)**
      Read CandidateBlockSpecification from prior agent. Classify into BlockFamily using structural features. Output: block_family, confidence (0.0-1.0), reasoning, similar_canonical_blocks (evidence IDs).
      Files: services/project-ai/app/agents/classification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_classification.py -v`

- [ ] **19. Create placement_manifest.py (Agent 08)**
      Use placement/comparator.py CanonicalComparator for canonical comparison (Agent 07 logic). Generate PlacementManifest with PlacementEntry list. Compute manifest_hash as SHA-256 of manifest JSON (sorted keys). Output: manifest (PlacementManifest), evidence_ids.
      Files: services/project-ai/app/agents/placement_manifest.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_placement_manifest.py -v`

- [ ] **20. Create approval.py (Agent 09)**
      Implement database polling approval workflow. Read timeout from env var PROJECT_AI_APPROVAL_TIMEOUT_SEC (default 86400, min 60, max 604800). Create approval request in approval_requests table. Poll every 30 seconds. Validate manifest_hash on approval. Return BLOCKED until approved. Output: approval_status, approved_manifest_hash, reviewer.
      Files: services/project-ai/app/agents/approval.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_approval.py -v`

- [ ] **21. Create placement_executor.py (Agent 10)**
      Read approved PlacementManifest. Verify manifest_hash matches approval. Execute each PlacementEntry using placement/executor.py PlacementExecutor. Output: files_created, files_updated, files_skipped, execution_result (PlacementExecutionResult).
      Files: services/project-ai/app/agents/placement_executor.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_placement_executor.py -v`

- [ ] **22. Create post_placement_verification.py (Agent 11)**
      Use `git diff HEAD` to verify placement changes. NO new snapshot generation. Validate changed files match PlacementManifest. Compute file hashes of placed files. Output: verification_status, changed_files, placed_file_hashes, diff_matches_manifest.
      Files: services/project-ai/app/agents/post_placement_verification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_post_placement_verification.py -v`

- [ ] **23. Create database schema for approval_requests**
      Define table: request_id TEXT PRIMARY KEY, manifest_id TEXT, manifest_hash TEXT, candidate_id TEXT, requested_at TIMESTAMP, status TEXT CHECK(status IN ('PENDING','APPROVED','REJECTED','TIMEOUT')), reviewer TEXT, reviewed_at TIMESTAMP, comments TEXT. Document as SQL or create migration.
      Files: services/project-ai/migrations/001_approval_requests.sql or docs/database-schema.md
      Verify: `cd services/project-ai && cat migrations/001_approval_requests.sql` or check documentation

- [ ] **24. Create test files for candidate pipeline agents**
      Create comprehensive tests: test_classification.py, test_placement_manifest.py (including manifest hash computation), test_approval.py (mock database polling), test_placement_executor.py (mock file operations), test_post_placement_verification.py (mock git diff).
      Files: services/project-ai/tests/agents/test_classification.py, test_placement_manifest.py, test_approval.py, test_placement_executor.py, test_post_placement_verification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_classification.py tests/agents/test_placement_manifest.py tests/agents/test_approval.py tests/agents/test_placement_executor.py tests/agents/test_post_placement_verification.py -v`

- [ ] **25. Update agent_registry.py with candidate pipeline agents**
      Register: CANDIDATE_CLASSIFICATION, PLACEMENT_MANIFEST, HUMAN_APPROVAL, PLACEMENT_EXECUTOR, POST_PLACEMENT_VERIFICATION.
      Files: services/project-ai/app/orchestration/agent_registry.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_registry.py -v`

---

## Wave D+E: Certification Gates and Runtime Chain (12A-12L)

### Overview
Add 9 gate methods to certification/gates.py and implement runtime agents. Gates run in parallel after Agent 11.

- [ ] **26. Add execute_contract_gate() method to gates.py**
      Verify TutorialBlock interface compliance by checking snapshot for packages/types/src/tutorial-rich-document.ts interface evidence. Check required fields (id, type, content, metadata). Return GateExecutionResult with PASS if compliant, evidence_ids from type definition.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_contract_gate_pass -v`

- [ ] **27. Add execute_dependency_gate() method to gates.py**
      Validate dependency graph from snapshot.dependencies. Check for circular dependencies, version conflicts, unlicensed packages. Return GateExecutionResult with PASS if no violations, evidence_ids from dependency evidence.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_dependency_gate_pass -v`

- [ ] **28. Update execute_ubrc_gate() method in gates.py**
      Verify data-block-version attributes from snapshot evidence. Ensure all blocks have valid UBRC versions. Add evidence_ids binding.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_ubrc_gate_pass -v`

- [ ] **29. Update execute_registry_verification_gate() method**
      Verify block registry entries from snapshot. Check all placed blocks registered correctly. Add evidence_ids binding.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_registry_gate_pass -v`

- [ ] **30. Update execute_renderer_verification_gate() method**
      Verify renderer compatibility from snapshot renderer evidence. Add evidence_ids binding.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_renderer_gate_pass -v`

- [ ] **31. Update execute_brand_independence_gate() method**
      Consume snapshot.brand data (NO Path.read_text()). Verify neutral palette, no hardcoded brand markers. Add evidence_ids binding. Calls verification/brand.py.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_brand_gate_pass -v`

- [ ] **32. Update execute_theme_compatibility_gate() method**
      Consume snapshot.theme data (NO Path.read_text()). Verify CSS variables, theme overrides. Add evidence_ids binding. Calls verification/theme.py.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_theme_gate_pass -v`

- [ ] **33. Update execute_composer_verification_gate() method**
      Verify composer integration via verification/composer.py. Add evidence_ids binding.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_composer_gate_pass -v`

- [ ] **34. Update execute_evidence_binding_gate() method**
      Validate all evidence from prior gates bound to commit_sha + snapshot_hash. Verify no orphaned evidence.
      Files: services/project-ai/app/certification/gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py::test_evidence_binding_gate_pass -v`

- [ ] **35. Create runtime_agent.py (Agent 12K)**
      Call verification/runtime.py verify_runtime(). Set up test environment, run runtime verification, collect results. Output: runtime_status, test_results, evidence_ids.
      Files: services/project-ai/app/agents/runtime_agent.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_runtime_agent.py -v`

- [ ] **36. Create playwright_browser_agent.py (Agent 12L)**
      Orchestrate Node Playwright via `subprocess.run(['pnpm', 'exec', 'playwright', 'test', '--config=playwright.project-ai.config.ts'], timeout=600)`. Set env vars: PROJECT_AI_BASE_URL, PROJECT_AI_RUN_ID, PROJECT_AI_COMMIT_SHA, PROJECT_AI_SNAPSHOT_HASH. Parse .project-ai/runs/current/results/playwright.json. Output: browser_status, tests_passed, tests_failed, screenshot_paths, evidence_ids. NO Python Playwright.
      Files: services/project-ai/app/agents/playwright_browser_agent.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_playwright_browser_agent.py -v`

- [ ] **37. Update verification modules to accept snapshot and return evidence_ids**
      Modify brand.py, theme.py, composer.py, runtime.py, browser.py to accept snapshot parameter and include evidence_ids in return values. Ensure NO direct file scanning.
      Files: services/project-ai/app/verification/brand.py, theme.py, composer.py, runtime.py, browser.py
      Verify: `cd services/project-ai && python -m pytest tests/verification/ -v -k evidence_ids`

- [ ] **38. Create comprehensive gate test file**
      Create or extend tests/certification/test_gates.py with test cases for all 9 gates covering pass/fail scenarios with mocked snapshot data.
      Files: services/project-ai/tests/certification/test_gates.py
      Verify: `cd services/project-ai && python -m pytest tests/certification/test_gates.py -v`

- [ ] **39. Create runtime and playwright agent test files**
      Create test_runtime_agent.py (test success, failure, environment setup, evidence collection) and test_playwright_browser_agent.py (test execution, environment vars, JSON parsing, screenshots, timeout, no Python Playwright). Mock subprocess calls.
      Files: services/project-ai/tests/agents/test_runtime_agent.py, test_playwright_browser_agent.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_runtime_agent.py tests/agents/test_playwright_browser_agent.py -v`

- [ ] **40. Update agent_registry.py with runtime agents**
      Register: RUNTIME_AGENT, PLAYWRIGHT_BROWSER_AGENT.
      Files: services/project-ai/app/orchestration/agent_registry.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_registry.py -v`

---

## Wave F: Final Certification Sequence (13-15)

### Overview
Implement final evidence freeze, gate aggregation, and human certification. Update orchestration for DAG execution.

- [ ] **41. Create final_evidence_freeze.py (Agent 13)**
      Read all evidence from prior agents. Validate evidence binding to commit_sha + snapshot_hash. Check no orphaned evidence, no duplicates. Freeze final evidence set. Output: total_evidence_count, binding_valid, all_evidence_ids.
      Files: services/project-ai/app/agents/final_evidence_freeze.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_final_evidence_freeze.py -v`

- [ ] **42. Extend final_gate.py FinalGateAgent (Agent 14)**
      Aggregate ALL gate results (11 in MVP: CONTRACT, UBRC, REGISTRY, RENDERER, COMPOSER, RUNTIME, BROWSER, BRAND_INDEPENDENCE, THEME_COMPATIBILITY, EVIDENCE + future ILS/LSNB/RSSB). Check all passed. Generate FinalCertification with verdict CERTIFICATION_READY if all pass, FAIL if any fail, BLOCKED if missing evidence. Output: final_certification (FinalCertification), verdict, gate_summary.
      Files: services/project-ai/app/agents/final_gate.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_final_gate.py -v`

- [ ] **43. Create human_certification.py (Agent 15)**
      Read FinalCertification from Agent 14. Poll database table certification_reviews. Fields: certification_id, decision (CERTIFIED/REJECTED/PENDING), reviewer, reviewed_at, comments. Timeout from env var PROJECT_AI_CERTIFICATION_TIMEOUT_SEC (default 86400). Output: human_decision, reviewer, comments.
      Files: services/project-ai/app/agents/human_certification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_human_certification.py -v`

- [ ] **44. Update workflow_engine.py for DAG execution**
      Replace step-based workflow with DAG-based execution using workflow_dag.py AGENT_WORKFLOW_DAG. Call agent_coordinator.execute_dag() with DAG. Handle sequential agents and parallel gate groups.
      Files: services/project-ai/app/orchestration/workflow_engine.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_workflow_engine.py -v`

- [ ] **45. Update agent_coordinator.py for parallel execution groups**
      Enhance execute_dag() to handle parallel_group attribute. Collect all agents in same group and execute with execute_parallel(). Ensure certification gates (12A-12J) run in parallel after agent 11.
      Files: services/project-ai/app/orchestration/agent_coordinator.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_coordinator.py -v -k parallel`

- [ ] **46. Create database schema for certification_reviews**
      Define table: certification_id TEXT PRIMARY KEY, run_id TEXT, candidate_id TEXT, final_certification JSON, requested_at TIMESTAMP, decision TEXT CHECK(decision IN ('PENDING','CERTIFIED','REJECTED','TIMEOUT')), reviewer TEXT, reviewed_at TIMESTAMP, comments TEXT.
      Files: services/project-ai/migrations/002_certification_reviews.sql or docs/database-schema.md
      Verify: `cd services/project-ai && cat migrations/002_certification_reviews.sql` or check documentation

- [ ] **47. Create test files for final sequence agents**
      Create test_final_evidence_freeze.py (test aggregation, binding validation, duplicate detection), extend test_final_gate.py (test 11-gate aggregation, all pass, any fail, verdict generation), create test_human_certification.py (test pending, certified, rejected, timeout).
      Files: services/project-ai/tests/agents/test_final_evidence_freeze.py, test_final_gate.py (extended), test_human_certification.py
      Verify: `cd services/project-ai && python -m pytest tests/agents/test_final_evidence_freeze.py tests/agents/test_final_gate.py tests/agents/test_human_certification.py -v`

- [ ] **48. Create DAG execution test file**
      Create test_workflow_dag_execution.py covering: sequential execution order, parallel gate execution, dependency resolution, gate failure blocking final certification, full DAG success, DAG with blocked agent.
      Files: services/project-ai/tests/orchestration/test_workflow_dag_execution.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_workflow_dag_execution.py -v`

- [ ] **49. Create integration test for full certification workflow**
      Create test_full_certification_workflow.py that exercises complete 15-agent DAG from repository audit through human certification. Use fixtures for snapshot, candidate, approvals. Validate evidence flow, gate execution, final certification generation.
      Files: services/project-ai/tests/integration/test_full_certification_workflow.py
      Verify: `cd services/project-ai && python -m pytest tests/integration/test_full_certification_workflow.py -v`

- [ ] **50. Update agent_registry.py with final agents**
      Register: FINAL_EVIDENCE_FREEZE, FINAL_GATE_CONTROLLER, HUMAN_CERTIFICATION.
      Files: services/project-ai/app/orchestration/agent_registry.py
      Verify: `cd services/project-ai && python -m pytest tests/orchestration/test_agent_registry.py -v`

---

## Final Verification

After completing all waves, run the complete test suite:

```powershell
cd services/project-ai

# Run all tests
python -m pytest tests/ -v

# Verify all agents registered
python -c "from app.orchestration.agent_registry import AgentRegistry; r = AgentRegistry(); print(f'Registered {len(r.agents)} agents'); assert len(r.agents) >= 15"

# Verify DAG structure
python -c "from app.orchestration.workflow_dag import AGENT_WORKFLOW_DAG; print(f'DAG has {len(AGENT_WORKFLOW_DAG)} agents')"

# Verify all models import
python -c "from app.models import CandidateBlockSpecification, AgentResult, GateResult, PlacementManifest, FinalCertification; print('All models OK')"

# Run certification tests
python -m pytest tests/certification/ tests/agents/ tests/orchestration/ -v
```

---

## Summary

**Total Implementation Items:** 50 steps across 6 waves
**New Files Created:** ~35 (4 agents + 15 agents + 9 test files + 3 models + orchestration)
**Files Modified:** ~10 (existing agents, orchestration, models, verification modules)
**Test Coverage:** Comprehensive unit tests for all agents, gates, orchestration, plus integration test

**Key Success Criteria:**
- All 15 agents implemented with async execute functions returning AgentResult
- All 9 gate methods in certification/gates.py returning GateExecutionResult with evidence_ids
- DAG orchestration working with sequential and parallel execution
- Evidence binding enforced throughout workflow
- Snapshot immutability maintained (no regeneration after Agent 02)
- Human approval and certification workflows with database polling
- Complete test coverage (330+ tests → 450+ tests expected)
