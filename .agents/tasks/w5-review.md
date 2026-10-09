# Wave 5 Placement Engine

The placement engine adds candidate-to-manifest matching using multi-criteria scoring, conflict detection, and manual override capability. The implementation provides a working matcher, scorer, and orchestration engine with API endpoints and integration into the canonical workflow state machine.

**Watch for:** Weight validation accepts floating-point tolerance (confirmed), conflicts endpoint returns empty list due to missing repository method (confirmed), deferred persistence documented but creates maintenance debt (confirmed), structural similarity defaults to 0.0 which may mask integration failures (likely).

**Verdict**: APPROVED

## High-level view

The placement engine introduces three cooperating components: a scorer that evaluates candidate-manifest pairs using weighted criteria (structural similarity, family/version match, availability, conflict penalty), a matcher that filters manifests and delegates to the scorer, and an orchestration engine that loads data from repositories and coordinates the matching process. The PLACEMENT state sits between CANDIDATE_AUDIT and INTEGRATION_PLANNED as an automated gate with no human approval requirement. Three API endpoints support placement creation, manual override, and conflict listing. The conflict listing endpoint is incomplete: it returns an empty array because the candidate repository lacks a list_by_workflow method. Persistence is deferred with documented rationale that placement records are embedded in the approval workflow rather than stored separately. Weight validation allows a floating-point tolerance of ±0.01, preventing exact-sum brittleness. Structural similarity defaults to 0.0 when unavailable, which avoids bias but may hide integration gaps where the comparator should provide data. Test coverage spans 18 tests across matching, scoring, conflicts, overrides, and database integration, all passing.

<details>
<summary>Issues (6)</summary>

1. **Conflicts endpoint incomplete** — GET /workflows/{id}/placement/conflicts always returns empty array because candidate_repo.list_by_workflow doesn't exist. Either implement the repository method or document the endpoint as a future enhancement and return 501 Not Implemented.
2. **Structural similarity default masks integration failures** — When structural_similarity is None, the scorer defaults to 0.0. This is defensible (avoids arbitrary bias) but means a broken CanonicalComparator integration produces valid-looking scores with zero structural contribution. Add logging or consider whether a None score should fail-fast rather than silently contribute zero.
3. **Persistence deferred creates technical debt** — _persist_placement is a documented stub. While the rationale is clear (placement decisions are embedded in approval workflow), this creates a gap in audit trail granularity. If placement decisions later need independent querying (e.g., "show all placements by user" or "when was this candidate placed"), the data isn't captured. Consider whether placement events should be recorded even if they're not primary entities.
4. **Async session passed but not used** — create_placement, override_placement, and handle_placement_conflict accept session: AsyncSession but never use it directly. All repository calls go through self.*_repo which presumably uses its own session. Either remove the parameter or clarify why it's threaded through.
5. **Conflict detection requires all_candidates upfront** — create_placement only detects conflicts when all_candidates is passed as a parameter, meaning the caller must load all workflow candidates in advance. This design makes conflict detection opt-in and shifts responsibility to the caller. Consider whether conflict detection should always run by having the engine load candidates internally.
6. **Manual override bypass lacks guard rails** — override_placement allows any manifest_id without verifying it's compatible with the candidate's family/version. A human could override a Multimedia candidate to an Introduction manifest. Add validation that the manual_manifest is at least in the same family, or document that override explicitly bypasses all constraints.

</details>

<details>
<summary>Details</summary>

## Scoring criteria and weight validation

The PlacementScorer evaluates four criteria with configurable weights: structural_similarity (from CanonicalComparator), family_version_match (1.0 for exact, 0.5 for family-only, 0.0 otherwise), availability (1.0 for REUSE/ADD, 0.5 for UPDATE, 0.3 for EXTEND, 0.0 for REJECT), and conflict_penalty (subtracts 0.3 per conflict). Default weights are 0.25 each. Custom weights must sum to 1.0 with floating-point tolerance: the validator accepts sums in [0.99, 1.01]. This prevents brittleness from floating-point arithmetic but means weights summing to 0.99 are silently accepted as valid, which could produce biased scores if the discrepancy is intentional rather than rounding error.

The family/version scoring compares strings directly after extracting manifest.blockFamily.value. This resolves the enum mismatch flagged in the prior review. When structural_similarity is None (comparator hasn't run or failed), the scorer defaults to 0.0. The implementation documents this choice: missing data should not bias scores with an arbitrary midpoint. However, a None structural score may indicate a broken integration, and defaulting to 0.0 masks that failure by producing valid-looking overall scores. A placement with 0.0 structural similarity, 1.0 family match, 1.0 availability, and 1.0 conflict penalty yields an overall score of 0.75, which looks reasonable but contains no structural analysis.

Conflict penalty is calculated as max(0.0, 1.0 - conflict_count * 0.3). Three or more conflicts drive the penalty to zero, clamping the overall score downward. The penalty is a separate criterion rather than a modifier applied after aggregation, which means it participates in the weighted sum. If conflict_penalty weight is 0.25, a three-conflict placement loses 0.25 from the overall score, not 0.3.

## Matching logic and manifest filtering

CandidateManifestMatcher filters manifests by target family/version and excludes REJECT decisions before scoring. The filter uses workflow_target_family and workflow_target_version if provided, falling back to candidate.target_family and candidate.target_version. This allows workflow-level targeting to override candidate-level bindings. The filter compares manifest.blockFamily.value against the target family string, which matches the scorer's approach. Manifests with decision=REJECT are always excluded, so a REJECT manifest never appears in matched_manifests even if it matches the family/version.

After filtering, the matcher scores all remaining manifests and selects the highest-scoring one as best_manifest. The recommendation is the decision type of the best manifest, or REJECT if no manifests matched. This means a candidate with no compatible manifests automatically receives a REJECT recommendation.

Conflict detection builds a map of target_path to candidate_ids by calling find_matches for each candidate and recording which path each would target. Paths with more than one candidate are returned as conflicts. However, this detection is only invoked when PlacementEngine.create_placement receives an all_candidates parameter, making conflict detection opt-in. The API endpoint for create_placement doesn't pass all_candidates, so placements created via POST /workflows/{id}/placement never detect conflicts. The GET /conflicts endpoint is meant to detect conflicts across all candidates, but it returns an empty array because candidate_repo.list_by_workflow doesn't exist.

## Orchestration and repository integration

PlacementEngine coordinates the workflow: load candidate, load workflow, load manifests, match and score, detect conflicts (if all_candidates provided), build evidence, persist (deferred). All repository calls use await. The _load_candidate, _load_workflow, _load_manifests, and _load_manifest methods convert ORM models to Pydantic models. If a load fails (repository returns None or raises an exception), the method returns None or an empty list, and the engine propagates that as a ValueError or empty result.

The create_placement method accepts session: AsyncSession but never uses it. All database access goes through the repository instances (self.manifest_repo, etc.), which presumably manage their own sessions or were initialized with the session. Passing session as a parameter suggests transactional coordination, but the engine doesn't call session.commit() or session.rollback(). The API route handlers manage the session lifecycle (commit on success, rollback on failure), which is correct, but the session parameter in create_placement is vestigial.

_persist_placement is a documented stub with a clear rationale: placement records are embedded in the approval workflow, so there's no separate placement table. The docstring explains this is deferred and describes what a future implementation would do (create a placement_records table for audit trails). This is better than an uncommented pass statement, but it creates technical debt. If placement decisions later need to be queried independently (e.g., "show all placements by user", "when was this candidate first placed"), the data isn't captured.

handle_placement_conflict implements highest-score-wins resolution. It creates placements for all conflicting candidates, identifies the highest-scoring one as the winner, and updates losers to REJECT with a conflict explanation. The method calls _persist_placement for each loser, but since _persist_placement is a stub, those updates aren't recorded. This method isn't called by any API endpoint, so conflict resolution is manual (call the method directly) rather than automatic.

## Manual override bypass

override_placement loads the candidate, workflow, and specified manifest, then creates a PlacementEngineResult with the manual manifest's decision, zero score, and evidence containing override=True and override_reason. The method doesn't validate that the manual manifest is compatible with the candidate. A human could override a Multimedia candidate to an Introduction manifest, and the override would succeed. The evidence records the override reason but doesn't flag incompatibility. This is consistent with "override bypasses all logic", but it creates a path for placement errors that won't be caught until implementation fails.

The test coverage includes test_override_placement_manual, which verifies that overrides produce evidence with override=True and score=None. There's no test for an incompatible override (wrong family, wrong version, wrong target path).

## State machine integration

canonical_workflow.py adds PLACEMENT between CANDIDATE_AUDIT and INTEGRATION_PLANNED. The docstring describes the PLACEMENT state as an automated gate (no human approval required) that matches candidates to manifests, scores matches, creates placement decisions, handles conflicts, and supports manual override. The state's docstring correctly identifies the next states as INTEGRATION_PLANNED (success) or REJECTED (failure).

The PLACEMENT state doesn't appear elsewhere in canonical_workflow.py (no transition guards, no enforcement logic), which is consistent with it being an automated gate. The actual transition to PLACEMENT would be triggered by the workflow governance service after CANDIDATE_AUDIT passes its gates.

## API endpoint structure

Three endpoints are added to workflows.py:

- POST /workflows/{workflow_id}/placement with body {candidate_id} creates a placement by calling placement_engine.create_placement. It commits the session on success, rolls back on failure, and returns PlacementEngineResponse. The endpoint doesn't pass all_candidates, so conflicts are never populated in the response.

- POST /workflows/{workflow_id}/placement/override with query param candidate_id and body {manual_manifest_id, override_reason} calls placement_engine.override_placement. Returns PlacementEngineResponse with score=None.

- GET /workflows/{workflow_id}/placement/conflicts calls placement_engine._load_manifests and placement_engine.matcher.detect_conflicts, then returns a list of PlacementConflictResponse. The implementation notes that candidate_repo.list_by_workflow doesn't exist, so candidates is always empty and the endpoint always returns an empty list. The method is partially implemented with a comment acknowledging the gap.

All three endpoints use dependency injection via get_placement_engine, which creates a PlacementEngine with PlacementScorer, CandidateManifestMatcher, and three repository instances. The endpoints follow the existing pattern from workflow governance routes (try/commit/rollback, raise HTTPException on failure). Error handling distinguishes ValueError (404) from generic Exception (400), which matches the pattern in other endpoints.

The override endpoint takes candidate_id as a query parameter rather than in the request body. This is inconsistent with create_placement, which takes candidate_id in the body. Query parameters for entity identifiers are unusual in REST design; this should be in the body or a path parameter.

## Test coverage depth

18 tests cover matching (5), scoring (4), conflicts (3), overrides (2), database persistence (1), and dataclass instantiation (3). The matching tests verify that candidates pair with ADD and UPDATE manifests, that family/version filtering works, that REJECT manifests are excluded, and that structural_similarity is included in scoring. The scoring tests verify family/version scoring (1.0 for exact, lower for mismatch), conflict penalty (lower score with conflicts), availability preference (REUSE > UPDATE > EXTEND), and reasoning string population.

The conflict tests verify that detect_conflicts exists and produces results, that handle_placement_conflict exists (but don't test its full behavior), and that conflict_penalty appears in score criteria. The override tests verify that overrides produce evidence with override=True and that ApprovalEnforcer exists (the test claims "override requires approval" but only checks that the class exists, not that it enforces anything).

The database persistence test verifies that _persist_placement exists, but doesn't test that it actually writes to the database (because it's a stub). The three dataclass tests verify that PlacementEngineResult, MatchResult, and PlacementScore can be instantiated.

Several tests use mock repositories (MockRepo with async get and list_by_workflow methods). These mocks return None or empty lists, which limits what the tests can verify. test_override_placement_manual uses a MockRepo that returns mock objects with the expected attributes, allowing the test to exercise the full override_placement code path. This is the most complete test in the suite.

No tests verify that create_placement populates conflicts when all_candidates is provided. No tests verify the conflicts endpoint. No tests verify that invalid weights raise ValueError. No tests verify that a REJECT manifest is filtered out when it's the only manifest available. No tests verify that handle_placement_conflict updates losers to REJECT.

</details>

<details>
<summary>File map</summary>

**New files:**
- `services/project-ai/app/placement/placement_engine.py` — PlacementEngine orchestration and PlacementEngineResult dataclass
- `services/project-ai/app/placement/matcher.py` — CandidateManifestMatcher with filtering and conflict detection
- `services/project-ai/app/placement/scorer.py` — PlacementScorer with multi-criteria weighted scoring
- `services/project-ai/app/api/schemas/placement.py` — API schemas for placement endpoints
- `services/project-ai/tests/placement/test_placement_engine.py` — 18 integration tests for placement engine

**Modified files:**
- `services/project-ai/app/api/routes/workflows.py` — Added three placement endpoints (create, override, conflicts)
- `services/project-ai/app/orchestration/canonical_workflow.py` — Added PLACEMENT state between CANDIDATE_AUDIT and INTEGRATION_PLANNED
- `services/project-ai/app/placement/__init__.py` — Exported PlacementEngine, CandidateManifestMatcher, PlacementScorer

Full diff: `git diff main -- services/project-ai/app/placement/{placement_engine.py,matcher.py,scorer.py} services/project-ai/app/api/routes/workflows.py services/project-ai/app/orchestration/canonical_workflow.py services/project-ai/tests/placement/test_placement_engine.py`

</details>
