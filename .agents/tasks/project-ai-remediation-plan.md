# Project AI Remediation Implementation Plan

**Document ID:** project-ai-remediation-plan  
**Branch:** m2-project-ai-foundation  
**Date:** 2025-01-30  
**Based on:** project-ai-remediation-design.md (APPROVED)

---

## Overview

This plan implements 9 Project AI remediation waves organized into 4 phases following the approved technical design. Waves execute in strict sequential/parallel order per phase architecture:

- **PHASE 1 (Sequential):** R1 → R8 → R2 (Foundation & Evidence Logging)
- **PHASE 2 (Mixed):** R3 → (R4 + R5) (Certification & Agents)  
- **PHASE 3 (Sequential):** R6 → R7 → R9 (Runtime & Final Gate)
- **PHASE 4:** Integration Validation

**Status:** R1 ✅ COMPLETE, R2 ✅ COMPLETE, R5 ✅ COMPLETE  
**To Implement:** R8, R3, R4, R6, R9, Integration  
**Deferred to M3:** R7 (Playwright integration)

---

## Implementation Order

### PHASE 1: Foundation (Sequential R1 → R8 → R2)

- [ ] **Wave R1:** Snapshot Lifecycle — ✅ ALREADY COMPLETE (M2.1)
- [ ] **Wave R8:** Evidence Logging Standard — CREATE (.project-ai/ structure, EvidenceRecord, logger)
- [ ] **Wave R2:** Architecture Boundary — ✅ ALREADY COMPLETE (M2.2)

### PHASE 2: Certification (R3 → R4 parallel handlers + R5)

- [ ] **Wave R3:** Placement Manifest Integration — UPDATE (gates.py manifest validation)
- [ ] **Wave R4:** Six Agent Handlers — CREATE (agents/ directory, 6 handlers, dispatch)
- [ ] **Wave R5:** Three Certification Gates — ✅ ALREADY COMPLETE

### PHASE 3: Runtime Verification (Sequential R6 → R7 → R9)

- [ ] **Wave R6:** Runtime Verification — UPDATE (health checks, timeouts, shutdown)
- [ ] **Wave R7:** Playwright Integration — ⚠️ DEFERRED TO M3 (prerequisites not met)
- [ ] **Wave R9:** Final Gate Metadata — CREATE (final_gate.py, verdict generation)

### PHASE 4: Integration Validation

- [ ] Generate TypeScript snapshot
- [ ] Fix integration tests
- [ ] Verify 241+ tests passing

---

## Detailed Implementation Steps

## PHASE 1: Foundation

### Wave R8: Evidence Logging Standard

**Goal:** Create .project-ai/ directory structure and evidence logging infrastructure.

**Files to Create:**
- `services/project-ai/app/models/evidence.py` — EvidenceRecord dataclass
- `services/project-ai/app/evidence/logger.py` — EvidenceLogger class
- `tests/evidence/test_logger.py` — Evidence logging tests

**Files to Modify:**
- None (Wave R8 only creates new files)

**Implementation:**

- [ ] 1. Create `services/project-ai/app/models/evidence.py` with EvidenceRecord dataclass matching TypeScript Evidence interface exactly:
  ```python
  @dataclass
  class EvidenceRecord:
      evidence_id: str
      scanner_name: str
      timestamp: str
      path: str
      kind: str
      claim: str
      locator: str
      content_hash: str
      lifecycle: str
      symbol: Optional[str] = None
      metadata: Dict[str, Any] = field(default_factory=dict)
      
      @classmethod
      def from_snapshot(cls, record: Dict[str, Any]) -> 'EvidenceRecord':
          return cls(
              evidence_id=record['evidenceId'],
              scanner_name=record['scannerName'],
              timestamp=record['timestamp'],
              path=record['path'],
              kind=record['kind'],
              claim=record['claim'],
              locator=record['locator'],
              content_hash=record['contentHash'],
              lifecycle=record['lifecycle'],
              symbol=record.get('symbol'),
              metadata=record.get('metadata', {})
          )
  ```
  **Files:** `services/project-ai/app/models/evidence.py`  
  **Verify:** `grep -n 'class EvidenceRecord' services/project-ai/app/models/evidence.py`

- [ ] 2. Create `.project-ai/runs/` directory structure in repository root.
  **Files:** `.project-ai/runs/` (directory)  
  **Verify:** `ls -la .project-ai/`

- [ ] 3. Create `services/project-ai/app/evidence/logger.py` with EvidenceLogger class containing:
  - `create_run_directory(commit_sha, snapshot_hash, snapshot_path)` — Creates run directory with metadata.json, copies snapshot, creates subdirectories (gates/, agents/, screenshots/), updates current symlink (with Windows fallback to current.txt)
  - `log_gate_result(run_dir, gate_name, result)` — Writes gate JSON to gates/{gate-name}.json with 2-space indentation
  - `log_agent_result(run_dir, result)` — Writes agent JSON to agents/{agent-id}.json with 2-space indentation
  - `_get_current_branch()` — Gets git branch using subprocess.run(['git', 'branch', '--show-current'])
  
  **Files:** `services/project-ai/app/evidence/logger.py`  
  **Verify:** `grep -n 'class EvidenceLogger' services/project-ai/app/evidence/logger.py`

- [ ] 4. Create `tests/evidence/test_logger.py` with 7 tests:
  - `test_run_directory_creation()` — Verify directory structure created
  - `test_metadata_generation()` — Verify metadata.json valid
  - `test_snapshot_copy()` — Verify snapshot.json copied to run directory
  - `test_gate_result_logging()` — Verify gate results logged to gates/
  - `test_agent_result_logging()` — Verify agent results logged to agents/
  - `test_current_symlink_update()` — Verify symlink points to latest run
  - `test_current_fallback_windows()` — Verify fallback to current.txt on Windows
  
  **Files:** `tests/evidence/test_logger.py`  
  **Verify:** `cd services/project-ai && pytest tests/evidence/test_logger.py -v`

**Interfaces:**
- `EvidenceRecord` dataclass with `from_snapshot()` classmethod
- `EvidenceLogger` class with `create_run_directory()`, `log_gate_result()`, `log_agent_result()` methods
- Run directory structure: `.project-ai/runs/{commit-sha}-{snapshot-hash}/` with gates/, agents/, screenshots/ subdirectories

**Tests:**
- `tests/evidence/test_logger.py` — 7 tests covering all evidence logging functionality

**Evidence:**
- `.project-ai/runs/` directory exists
- `metadata.json` files with runId, commitSha, snapshotHash, branch, timestamp, status
- Gate result JSON files in gates/ subdirectory
- Agent result JSON files in agents/ subdirectory

**Verification:**
```bash
cd services/project-ai && pytest tests/evidence/test_logger.py -v
ls -la .project-ai/runs/
grep -n 'indent=2' services/project-ai/app/evidence/logger.py
```

---

## PHASE 2: Certification

### Wave R3: Placement Manifest Integration

**Goal:** Enforce PlacementManifest usage in all certification gates with validation.

**Files to Create:**
- None (Wave R3 only modifies existing gate file)

**Files to Modify:**
- `services/project-ai/app/certification/gates.py` — Add manifest validation to CertificationGateExecutor

**Implementation:**

- [ ] 1. Add `_validate_manifest()` helper method to CertificationGateExecutor class in `services/project-ai/app/certification/gates.py`:
  ```python
  def _validate_manifest(self, manifest: PlacementManifest) -> Tuple[bool, List[str]]:
      errors = []
      
      # Verify manifest hash (tamper detection)
      manifest_copy = manifest.model_copy()
      manifest_copy.manifestHash = ""
      manifest_json = manifest_copy.model_dump_json(exclude_none=True, indent=2)
      computed_hash = hashlib.sha256(manifest_json.encode('utf-8')).hexdigest()
      if computed_hash != manifest.manifestHash:
          errors.append("Manifest hash verification failed (tampering detected)")
      
      # Verify no path inference from block name
      if manifest.candidateId.lower().replace('-', '/') in manifest.targetPath:
          errors.append("Target path appears inferred from block name")
      
      # Verify evidence IDs exist in snapshot
      snapshot_evidence_ids = {e['evidenceId'] for e in self.snapshot.get('evidence', [])}
      for evidence_id in manifest.evidenceIds:
          if evidence_id not in snapshot_evidence_ids:
              errors.append(f"Evidence ID {evidence_id} not found in snapshot")
      
      return (len(errors) == 0, errors)
  ```
  **Files:** `services/project-ai/app/certification/gates.py`  
  **Verify:** `grep -n '_validate_manifest' services/project-ai/app/certification/gates.py`

- [ ] 2. Update all 6 gate methods to require `manifest: PlacementManifest` parameter and call `_validate_manifest()` first:
  - `execute_ubrc_gate(manifest: PlacementManifest)`
  - `execute_brand_independence_gate(manifest: PlacementManifest)`
  - `execute_registry_verification_gate(manifest: PlacementManifest)`
  - `execute_renderer_verification_gate(manifest: PlacementManifest)`
  - `execute_evidence_binding_gate(manifest: PlacementManifest)`
  - `execute_composer_verification_gate(manifest: PlacementManifest)`
  
  Each gate must:
  ```python
  valid, errors = self._validate_manifest(manifest)
  if not valid:
      return GateExecutionResult(
          status=CertificationGateStatus.BLOCKED,
          message="Manifest validation failed",
          evidence_ids=[],
          blockers=errors
      )
  ```
  **Files:** `services/project-ai/app/certification/gates.py`  
  **Verify:** `grep -A 5 'def execute_ubrc_gate' services/project-ai/app/certification/gates.py | grep 'manifest'`

- [ ] 3. Add 5 tests to `tests/certification/test_gates.py`:
  - `test_manifest_hash_verification()` — Valid hash → validation passes
  - `test_manifest_tampering_detection()` — Tampered hash → BLOCKED
  - `test_path_inference_detection()` — Inferred path → BLOCKED
  - `test_gate_execution_with_invalid_manifest()` — Invalid manifest → BLOCKED
  - `test_manifest_evidence_validation()` — Missing evidence ID → BLOCKED
  
  **Files:** `tests/certification/test_gates.py`  
  **Verify:** `cd services/project-ai && pytest tests/certification/test_gates.py -v -k manifest`

**Interfaces:**
- `_validate_manifest(manifest: PlacementManifest) -> Tuple[bool, List[str]]` method in CertificationGateExecutor
- All gate methods accept `manifest: PlacementManifest` parameter

**Tests:**
- 5 new tests in `tests/certification/test_gates.py` covering manifest validation scenarios

**Evidence:**
- Manifest hash verification prevents tampering
- Path inference detection prevents automatic path derivation
- Evidence ID validation ensures all IDs exist in snapshot

**Verification:**
```bash
cd services/project-ai && pytest tests/certification/test_gates.py -v
grep -n 'PlacementManifest' services/project-ai/app/certification/gates.py | wc -l
```

---

### Wave R4: Six Agent Handlers

**Goal:** Create agent handler infrastructure from scratch with dispatch mechanism.

**Files to Create:**
- `services/project-ai/app/agents/__init__.py` — Package initialization
- `services/project-ai/app/agents/toolchain.py` — Toolchain analysis handler
- `services/project-ai/app/agents/dependency.py` — Dependency graph analysis handler
- `services/project-ai/app/agents/intake.py` — Candidate classification handler
- `services/project-ai/app/agents/placement.py` — Placement manifest generation handler
- `services/project-ai/app/agents/governance.py` — Approval workflow handler
- `services/project-ai/app/agents/documentation.py` — Canonical documentation handler
- `tests/agents/__init__.py` — Test package initialization
- `tests/agents/test_toolchain.py` — Toolchain handler tests
- `tests/agents/test_dependency.py` — Dependency handler tests
- `tests/agents/test_intake.py` — Intake handler tests
- `tests/agents/test_placement.py` — Placement handler tests
- `tests/agents/test_governance.py` — Governance handler tests
- `tests/agents/test_documentation.py` — Documentation handler tests

**Files to Modify:**
- `services/project-ai/app/orchestration/agent_coordinator.py` — Add dispatch mechanism to execute_agent()

**Implementation:**

- [ ] 1. Create `services/project-ai/app/agents/` directory and `__init__.py`.
  **Files:** `services/project-ai/app/agents/__init__.py`  
  **Verify:** `ls -la services/project-ai/app/agents/`

- [ ] 2-7. Create 6 agent handler files (toolchain.py, dependency.py, intake.py, placement.py, governance.py, documentation.py), each with:
  ```python
  async def execute_{agent_name}(context: AgentContext) -> AgentResult:
      start_time = datetime.now(datetime.UTC)
      try:
          # Extract snapshot data
          snapshot = context.repository_snapshot
          
          # Agent-specific analysis
          outputs = await _analyze(snapshot, context)
          
          # Collect evidence IDs
          evidence_ids = _collect_evidence_ids(outputs, snapshot)
          
          return AgentResult(
              agent_id="{agent-name}",
              status=AgentStatus.SUCCESS,
              outputs=outputs,
              evidence_ids=evidence_ids,
              errors=[],
              warnings=[],
              execution_time_ms=(datetime.now(datetime.UTC) - start_time).total_seconds() * 1000,
              timestamp=datetime.now(datetime.UTC)
          )
      except Exception as e:
          return AgentResult(
              agent_id="{agent-name}",
              status=AgentStatus.FAILED,
              outputs={},
              evidence_ids=[],
              errors=[str(e)],
              warnings=[],
              execution_time_ms=(datetime.now(datetime.UTC) - start_time).total_seconds() * 1000,
              timestamp=datetime.now(datetime.UTC)
          )
  ```
  
  **Agent-Specific Logic:**
  - **toolchain.py:** Extract runtime.toolchains from snapshot, return toolchain_count and toolchains list
  - **dependency.py:** Extract dependencies, detect cycles and version conflicts, add warnings
  - **intake.py:** Use CanonicalComparator to classify candidate block family
  - **placement.py:** Generate PlacementManifest with hash, compare to canonical blocks
  - **governance.py:** Enforce self-approval prevention (submitter != approver), verify manifest hash
  - **documentation.py:** Append certification run to canonical backlog, never replace existing
  
  **Files:** `services/project-ai/app/agents/{toolchain,dependency,intake,placement,governance,documentation}.py`  
  **Verify:** `ls services/project-ai/app/agents/*.py | wc -l` (expect 7 files including __init__.py)

- [ ] 8. Add dispatch mechanism to `AgentCoordinator.execute_agent()` in `services/project-ai/app/orchestration/agent_coordinator.py`:
  ```python
  async def execute_agent(self, agent_id: str, context: AgentContext) -> AgentResult:
      if agent_id == "toolchain":
          from app.agents.toolchain import execute_toolchain
          return await execute_toolchain(context)
      elif agent_id == "dependency":
          from app.agents.dependency import execute_dependency
          return await execute_dependency(context)
      elif agent_id == "intake":
          from app.agents.intake import execute_intake
          return await execute_intake(context)
      elif agent_id == "placement":
          from app.agents.placement import execute_placement
          return await execute_placement(context)
      elif agent_id == "governance":
          from app.agents.governance import execute_governance
          return await execute_governance(context)
      elif agent_id == "documentation":
          from app.agents.documentation import execute_documentation
          return await execute_documentation(context)
      else:
          return AgentResult(
              agent_id=agent_id,
              status=AgentStatus.FAILED,
              outputs={},
              evidence_ids=[],
              errors=[f"Unknown agent: {agent_id}"],
              warnings=[],
              execution_time_ms=0,
              timestamp=datetime.now(datetime.UTC)
          )
  ```
  **Files:** `services/project-ai/app/orchestration/agent_coordinator.py`  
  **Verify:** `grep -A 20 'def execute_agent' services/project-ai/app/orchestration/agent_coordinator.py | grep 'if agent_id'`

- [ ] 9. Create `tests/agents/` directory and `__init__.py`.
  **Files:** `tests/agents/__init__.py`  
  **Verify:** `ls -la tests/agents/`

- [ ] 10-15. Create 6 test files (test_toolchain.py, test_dependency.py, test_intake.py, test_placement.py, test_governance.py, test_documentation.py), each with 4-5 tests:
  - Valid snapshot → SUCCESS
  - Agent-specific functionality (e.g., cycle detection, family classification, self-approval prevention)
  - Evidence collection from snapshot
  - Error handling
  
  **Files:** `tests/agents/test_{toolchain,dependency,intake,placement,governance,documentation}.py`  
  **Verify:** `cd services/project-ai && pytest tests/agents/ -v`

**Interfaces:**
- `execute_{agent_name}(context: AgentContext) -> AgentResult` function in each agent handler
- Dispatch mechanism in `AgentCoordinator.execute_agent()` maps agent_id to handler

**Tests:**
- 24+ tests across 6 test files in `tests/agents/` covering all agent handlers

**Evidence:**
- 6 agent handlers create AgentResult with evidence_ids from snapshot
- governance.py enforces self-approval prevention
- documentation.py appends to canonical backlog without replacing

**Verification:**
```bash
cd services/project-ai && pytest tests/agents/ -v
ls services/project-ai/app/agents/*.py | wc -l
grep 'submitter.*approver' services/project-ai/app/agents/governance.py
```

---

## PHASE 3: Runtime Verification

### Wave R6: Runtime Verification

**Goal:** Complete runtime verification with HTTP health checks and process management.

**Files to Create:**
- `tests/verification/test_runtime.py` — Runtime verification tests (or add to existing)

**Files to Modify:**
- `services/project-ai/app/verification/runtime.py` — Add health checks, timeouts, shutdown

**Implementation:**

- [ ] 1. Add APP_PORTS mapping to `services/project-ai/app/verification/runtime.py`:
  ```python
  APP_PORTS = {
      'skillhubcore-admin': 3000,
      'realtutorialhub-admin': 3001,
      'suia-admin': 3009,
  }
  ```
  **Files:** `services/project-ai/app/verification/runtime.py`  
  **Verify:** `grep 'APP_PORTS' services/project-ai/app/verification/runtime.py`

- [ ] 2. Add `get_health_url(target: str) -> str` function:
  ```python
  def get_health_url(target: str) -> str:
      port = APP_PORTS.get(target, 3000)
      return f"http://localhost:{port}/api/health"
  ```
  **Files:** `services/project-ai/app/verification/runtime.py`  
  **Verify:** `grep -n 'def get_health_url' services/project-ai/app/verification/runtime.py`

- [ ] 3. Add `verify_health()` method to ApplicationProcess with 3-level fallback:
  ```python
  def verify_health(self, health_url: str, timeout: int = 10) -> bool:
      import requests
      
      # Try /api/health
      try:
          response = requests.get(health_url, timeout=timeout)
          if response.status_code == 200:
              return True
      except requests.RequestException:
          pass
      
      # Fallback: try /health
      base_url = health_url.rsplit('/api/health', 1)[0]
      try:
          response = requests.get(f"{base_url}/health", timeout=timeout)
          if response.status_code == 200:
              return True
      except requests.RequestException:
          pass
      
      # Fallback: try / (root)
      try:
          response = requests.get(base_url, timeout=timeout)
          if response.status_code == 200:
              return True
      except requests.RequestException:
          pass
      
      return False
  ```
  **Files:** `services/project-ai/app/verification/runtime.py`  
  **Verify:** `grep -A 10 'def verify_health' services/project-ai/app/verification/runtime.py`

- [ ] 4. Update `ApplicationProcess.start()` method with timeout enforcement:
  ```python
  def start(self, timeout: int = 30) -> bool:
      self.process = subprocess.Popen(
          ["pnpm", "--filter", self.target, "dev"],
          cwd=self.repository_root,
          stdout=subprocess.PIPE,
          stderr=subprocess.PIPE,
          shell=False
      )
      
      health_url = get_health_url(self.target)
      start_time = time.time()
      while time.time() - start_time < timeout:
          if self.verify_health(health_url):
              return True
          time.sleep(1)
      
      self.stop()
      return False
  ```
  **Files:** `services/project-ai/app/verification/runtime.py`  
  **Verify:** `grep -n 'timeout' services/project-ai/app/verification/runtime.py`

- [ ] 5. Add clean shutdown to `ApplicationProcess.stop()`:
  ```python
  def stop(self, timeout: int = 10) -> bool:
      if not self.process:
          return True
      
      self.process.terminate()
      
      try:
          self.process.wait(timeout=timeout)
          return True
      except subprocess.TimeoutExpired:
          self.process.kill()
          self.process.wait()
          return False
  ```
  **Files:** `services/project-ai/app/verification/runtime.py`  
  **Verify:** `grep -A 10 'def stop' services/project-ai/app/verification/runtime.py`

- [ ] 6. Create `tests/verification/test_runtime.py` with 6 tests:
  - `test_health_check_success()` — Running app → True
  - `test_health_check_failure()` — Stopped app → False
  - `test_health_check_fallback()` — /api/health 404 → /health → True
  - `test_startup_timeout()` — Slow start → RUNTIME_START_FAILURE
  - `test_clean_shutdown()` — SIGTERM → clean exit
  - `test_force_kill_on_timeout()` — Hung process → SIGKILL
  
  **Files:** `tests/verification/test_runtime.py`  
  **Verify:** `cd services/project-ai && pytest tests/verification/test_runtime.py -v`

**Interfaces:**
- `get_health_url(target: str) -> str` function
- `ApplicationProcess.verify_health(health_url: str, timeout: int) -> bool` method
- `ApplicationProcess.start(timeout: int) -> bool` with health check polling
- `ApplicationProcess.stop(timeout: int) -> bool` with graceful shutdown

**Tests:**
- 6 tests in `tests/verification/test_runtime.py` covering health checks, timeouts, shutdown

**Evidence:**
- Health check fallback strategy implemented (/api/health → /health → /)
- Timeout enforcement in start() method
- Graceful shutdown with SIGTERM then SIGKILL

**Verification:**
```bash
cd services/project-ai && pytest tests/verification/test_runtime.py -v
grep -n 'verify_health' services/project-ai/app/verification/runtime.py
```

---

### Wave R7: Playwright Integration

**Status:** ⚠️ **DEFERRED TO M3**

**Reason:** Prerequisites not met:
1. Playwright not installed in project-ai service
2. data-block-version attributes missing in 13 block renderers
3. No deterministic application start/stop infrastructure

**Note:** Browser verification gracefully degrades when Playwright unavailable. No blocking impact on M2 completion.

---

### Wave R9: Final Gate Metadata

**Goal:** Generate final gate verdict and append to canonical documentation.

**Files to Create:**
- `services/project-ai/app/agents/final_gate.py` — Final gate verdict handler
- `tests/agents/test_final_gate.py` — Final gate tests

**Files to Modify:**
- `services/project-ai/app/orchestration/agent_coordinator.py` — Add final-gate dispatch case

**Implementation:**

- [ ] 1. Create `services/project-ai/app/agents/final_gate.py` with `execute_final_gate()` function:
  ```python
  async def execute_final_gate(context: AgentContext) -> AgentResult:
      run_dir = Path(context.workflow_state.get('run_dir'))
      
      # Read all gate results
      gate_results = {}
      for gate_file in (run_dir / 'gates').glob('*.json'):
          gate_data = json.loads(gate_file.read_text())
          gate_results[gate_data['gateId']] = gate_data['status']
      
      # Read all agent results
      agent_results = {}
      for agent_file in (run_dir / 'agents').glob('*.json'):
          agent_data = json.loads(agent_file.read_text())
          agent_results[agent_data['agentId']] = agent_data['status']
      
      # Determine verdict
      all_gates_pass = all(status == 'PASS' for status in gate_results.values())
      all_agents_succeed = all(status == 'SUCCESS' for status in agent_results.values())
      verdict = 'APPROVED' if all_gates_pass and all_agents_succeed else 'REJECTED'
      
      # Compute statistics
      def _compute_statistics(snapshot):
          return {
              'evidenceRecords': len(snapshot.get('evidence', [])),
              'blockImplementations': len(snapshot.get('blocks', {}).get('implementations', [])),
              'blockRenderers': len(snapshot.get('blocks', {}).get('rendered', [])),
              'verifiedBlocks': len(snapshot.get('blocks', {}).get('verified', []))
          }
      
      # Generate FinalVerdict
      final_verdict = {
          'verdictId': f"remediation-{datetime.now(datetime.UTC).strftime('%Y-%m-%d')}",
          'timestamp': datetime.now(datetime.UTC).isoformat(),
          'branch': context.repository_snapshot['repository']['name'],
          'commitSha': context.repository_snapshot['repository']['commitSha'],
          'snapshotHash': context.repository_snapshot['canonicalHash'],
          'verdict': verdict,
          'gateResults': gate_results,
          'agentResults': agent_results,
          'statistics': _compute_statistics(context.repository_snapshot)
      }
      
      # Write verdict file
      verdict_path = context.repository_root / '.agents' / 'tasks' / f"final-gate-verdict-{datetime.now(datetime.UTC).strftime('%Y-%m-%d')}.json"
      verdict_path.write_text(json.dumps(final_verdict, indent=2))
      
      # Append to canonical backlog
      backlog_path = context.repository_root / '.agents' / 'tasks' / 'm1-m2-backlog.md'
      existing = backlog_path.read_text()
      
      update_section = f"""
---

## Final Certification Gate — {final_verdict['verdictId']}

**Status:** {verdict}  
**Date:** {datetime.now(datetime.UTC).strftime('%Y-%m-%d')}  
**Commit:** {final_verdict['commitSha']}  

### Gate Results

| Gate | Status |
|------|--------|
"""
      for gate_name, status in gate_results.items():
          update_section += f"| {gate_name} | {status} |\n"
      
      backlog_path.write_text(existing + "\n" + update_section)
      
      return AgentResult(
          agent_id="final-gate",
          status=AgentStatus.SUCCESS,
          outputs={
              'verdict': verdict,
              'verdict_file': str(verdict_path),
              'canonical_update': str(backlog_path)
          },
          evidence_ids=[],
          errors=[],
          warnings=[],
          execution_time_ms=0,
          timestamp=datetime.now(datetime.UTC)
      )
  ```
  **Files:** `services/project-ai/app/agents/final_gate.py`  
  **Verify:** `ls services/project-ai/app/agents/final_gate.py`

- [ ] 2. Add 'final-gate' dispatch case to `AgentCoordinator.execute_agent()`:
  ```python
  elif agent_id == "final-gate":
      from app.agents.final_gate import execute_final_gate
      return await execute_final_gate(context)
  ```
  **Files:** `services/project-ai/app/orchestration/agent_coordinator.py`  
  **Verify:** `grep 'final-gate' services/project-ai/app/orchestration/agent_coordinator.py`

- [ ] 3. Create `tests/agents/test_final_gate.py` with 4 tests:
  - `test_final_verdict_all_pass()` — All PASS → APPROVED
  - `test_final_verdict_any_fail()` — Any FAIL → REJECTED
  - `test_canonical_backlog_append()` — Backlog extended, not replaced
  - `test_verdict_file_creation()` — JSON file created
  
  **Files:** `tests/agents/test_final_gate.py`  
  **Verify:** `cd services/project-ai && pytest tests/agents/test_final_gate.py -v`

**Interfaces:**
- `execute_final_gate(context: AgentContext) -> AgentResult` function
- FinalVerdict JSON schema with verdictId, timestamp, verdict, gateResults, agentResults, statistics

**Tests:**
- 4 tests in `tests/agents/test_final_gate.py` covering verdict generation and canonical append

**Evidence:**
- Final verdict JSON files in `.agents/tasks/final-gate-verdict-{date}.json`
- Canonical backlog appended with certification run summary

**Verification:**
```bash
cd services/project-ai && pytest tests/agents/test_final_gate.py -v
grep 'append' services/project-ai/app/agents/final_gate.py
```

---

## PHASE 4: Integration Validation

**Goal:** Generate snapshot, fix integration tests, verify complete test suite passes.

**Files to Modify:**
- `tests/integration/test_i2_e2e_certification.py` (if failing, update expectations)

**Implementation:**

- [ ] 1. Generate TypeScript snapshot:
  ```bash
  pnpm --filter @quiz/project-llm-discovery scan
  ```
  **Files:** `packages/project-llm-discovery/output/snapshot.json`  
  **Verify:** `ls -lh packages/project-llm-discovery/output/snapshot.json`

- [ ] 2. Verify snapshot valid:
  ```bash
  grep '"schemaVersion"' packages/project-llm-discovery/output/snapshot.json
  grep '"evidence"' packages/project-llm-discovery/output/snapshot.json | head -1
  ```
  **Expected:** schemaVersion: "1.1.0", evidence array with 842 records

- [ ] 3. Run TypeScript tests:
  ```bash
  pnpm --filter @quiz/project-llm-discovery test
  ```
  **Expected:** 220/220 tests passing

- [ ] 4. Run Python integration tests:
  ```bash
  cd services/project-ai && pytest tests/integration/ -v
  ```
  **Expected:** All integration tests pass with snapshot present

- [ ] 5. Fix failing tests if necessary:
  - Update `test_i2_e2e_certification.py` if expectations incorrect
  - Ensure snapshot-dependent tests check for snapshot availability

- [ ] 6. Run full Python test suite:
  ```bash
  cd services/project-ai && pytest tests/ -v
  ```
  **Expected:** 241+ tests, 0 failures, 0-6 skipped

- [ ] 7. Verify evidence directory created:
  ```bash
  ls -la .project-ai/runs/
  ```
  **Expected:** Directory exists (may be empty)

- [ ] 8. Verify agent handlers wired:
  ```bash
  cd services/project-ai && python -c "from app.orchestration.agent_coordinator import AgentCoordinator; c = AgentCoordinator(); print('Agent dispatch ready')"
  ```
  **Expected:** No import errors

- [ ] 9. Run cross-feature integration check:
  - Create test run directory using EvidenceLogger
  - Execute one agent handler
  - Log results
  - Verify JSON files created with 2-space indentation

- [ ] 10. Final verification:
  ```bash
  pnpm --filter @quiz/project-llm-discovery test && cd services/project-ai && pytest tests/ -v
  ```
  **Expected:** Complete test suite passes

**Interfaces:**
- TypeScript snapshot.json with 842 evidence records
- Python test suite with 241+ tests

**Tests:**
- 220/220 TypeScript tests passing
- 241+ Python tests passing (0 failures)

**Evidence:**
- Snapshot generated successfully
- All tests passing
- Evidence directory structure exists
- Agent handlers importable and functional

**Verification:**
```bash
pnpm --filter @quiz/project-llm-discovery scan
pnpm --filter @quiz/project-llm-discovery test
cd services/project-ai && pytest tests/ -v --tb=short
ls -la .project-ai/
```

---

## Success Criteria

### Functional Requirements
- [x] R1: Snapshot lifecycle complete (schemaVersion 1.1.0, lifecycle field)
- [ ] R8: Evidence logging infrastructure (.project-ai/ structure, EvidenceRecord, logger)
- [x] R2: Architecture boundary enforced (DiscoveryClient reads snapshot only)
- [ ] R3: PlacementManifest required in all gates (manifest validation)
- [ ] R4: 6 agent handlers created (toolchain, dependency, intake, placement, governance, documentation)
- [x] R5: 6 certification gates operational
- [ ] R6: Runtime verification complete (health checks, timeouts, shutdown)
- [ ] R7: Playwright integration deferred to M3
- [ ] R9: Final gate metadata generation (verdict, canonical append)

### Test Coverage
- [ ] 220/220 TypeScript tests passing (100%)
- [ ] 241+ Python tests passing (97%+)
- [ ] 0 failing tests
- [ ] 0-6 skipped tests (only justified external service dependencies)

### Evidence Integrity
- [ ] .project-ai/runs/ directory structure created
- [ ] EvidenceRecord model matches TypeScript Evidence interface
- [ ] Evidence logger creates run directories with metadata, gate results, agent results
- [ ] All JSON files use 2-space indentation
- [ ] Current symlink (or current.txt fallback on Windows) points to latest run

### Governance
- [ ] Self-approval prevention enforced (submitter != approver)
- [ ] Manifest hash verification prevents tampering
- [ ] No path inference from block names
- [ ] All placement requires approved PlacementManifest

### Documentation
- [ ] Canonical backlog extended (not recreated)
- [ ] Final verdict appended to backlog
- [ ] FinalVerdict JSON created in .agents/tasks/

---

## Known Limitations

### Deferred to M3
- **Playwright Integration (R7):** Browser verification requires Playwright installation, data-block-version attributes in renderers, deterministic app lifecycle

### Technical Debt
- **Deprecation Warnings:** 297 datetime.utcnow() warnings in test code (Python 3.13 compatibility)
- **CI/CD Integration:** Snapshot generation not automated in pipeline

---

**End of Implementation Plan**
