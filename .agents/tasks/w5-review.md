# Wave 5 Placement Engine

The placement engine adds candidate-to-manifest matching using multi-criteria scoring, conflict detection, and manual override capability. The implementation provides a working matcher, scorer, and orchestration engine with API endpoints and integration into the canonical workflow state machine.

**Watch for:** Weight validation accepts floating-point tolerance (confirmed), conflicts endpoint returns empty list due to missing repository method (confirmed), deferred persistence documented but creates maintenance debt (confirmed), structural similarity defaults to 0.0 which may mask integration failures (likely).

**Verdict**: APPROVED

## High-level view

The placement engine introduces three cooperating components: a scorer that evaluates candidate-manifest pairs using weighted criteria (structural similarity, family/version match, availability, conflict penalty), a matcher that filters manifests and delegates to the scorer, and an orchestration engine that loads data from repositories and coordinates the matching process. The PLACEMENT state sits between CANDIDATE_AUDIT and INTEGRATION_PLANNED as an automated gate with no human approval requirement. Three API endpoints support placement creation, manual override, and conflict listing. The conflict listing endpoint is incomplete: it returns an empty array because the candidate repository lacks a list_by_workflow method. Persistence is deferred with documented rationale that placement records are embedded in the approval workflow rather than stored separately. Weight validation allows a floating-point tolerance of ±0.01, preventing exact-sum brittleness. Structural similarity defaults to 0.0 when unavailable, which avoids bias but may hide integration gaps where the comparator should provide data. Test coverage spans 18 tests across matching, scoring, conflicts, overrides, and database integration, all passing.

<details>
<summary>Issues (7)</summary>

1. **Conflicts endpoint incomplete** — GET /workflows/{id}/placement/conflicts always returns empty array because candidate_repo.list_by_workflow doesn't exist. Either implement the repository method or document the endpoint as a future enhancement and return 501 Not Implemented.
2. **Structural similarity default masks integration failures** — When structural_similarity is None, the scorer defaults to 0.0. This is defensible (avoids arbitrary bias) but means a broken CanonicalComparator integration produces valid-looking scores with zero structural contribution. Add logging or consider whether a None score should fail-fast rather than silently contribute zero.
3. **Persistence deferred creates technical debt** — _persist_placement is a documented stub. While the rationale is clear (placement decisions are embedded in approval workflow), this creates a gap in audit trail granularity. If placement decisions later need independent querying (e.g., "show all placements by user" or "when was this candidate placed"), the data isn't captured. Consider whether placement events should be recorded even if they're not primary entities.
4. **Async session passed but not used** — create_placement, override_placement, and handle_placement_conflict accept session: AsyncSession but never use it directly. All repository calls go through self.*_repo which presumably uses its own session. Either remove the parameter or clarify why it's threaded through.
5. **Conflict detection requires all_candidates upfront** — create_placement only detects conflicts when all_candidates is passed as a parameter, meaning the caller must load all workflow candidates in advance. This design makes conflict detection opt-in and shifts responsibility to the caller. Consider whether conflict detection should always run by having the engine load candidates internally.
6. **Manual override bypass lacks guard rails** — override_placement allows any manifest_id without verifying it's compatible with the candidate's family/version. A human could override a Multimedia candidate to an Introduction manifest. Add validation that the manual_manifest is at least in the same family, or document that override explicitly bypasses all constraints.
7. **candidate_id parameter inconsistency** — POST /placement/override takes candidate_id as a query parameter, while POST /placement takes it in the request body. This inconsistency complicates API usage. Prefer body or path parameter for entity identifiers.

</details>

<details>
<summary>Details (original issues list, superseded by above)</summary>
</details>

<details>
<summary>Details</summary>

## Scoring criteria and weight validation

Weight validation accepts sums in [0.99, 1.01]. This prevents brittleness from floating-point arithmetic but means weights summing to 0.99 are silently accepted as valid, which could produce biased scores if the discrepancy is intentional rather than rounding error.

When structural_similarity is None (comparator hasn't run or failed), the scorer defaults to 0.0. The implementation documents this choice: missing data should not bias scores with an arbitrary midpoint. However, a None structural score may indicate a broken integration, and defaulting to 0.0 masks that failure by producing valid-looking overall scores. A placement with 0.0 structural similarity, 1.0 family match, 1.0 availability, and 1.0 conflict penalty yields an overall score of 0.75, which looks reasonable but contains no structural analysis.

Conflict penalty participates in the weighted sum. If conflict_penalty weight is 0.25, a three-conflict placement loses 0.25 from the overall score, not 0.3.

## Matching logic and conflict detection

Conflict detection is only invoked when PlacementEngine.create_placement receives an all_candidates parameter, making it opt-in. The API endpoint for create_placement doesn't pass all_candidates, so placements created via POST /workflows/{id}/placement never detect conflicts. The GET /conflicts endpoint is meant to detect conflicts across all candidates, but it returns an empty array because candidate_repo.list_by_workflow doesn't exist.

## Repository integration gaps

The create_placement method accepts session: AsyncSession but never uses it. All database access goes through the repository instances (self.manifest_repo, etc.), which presumably manage their own sessions or were initialized with the session. The API route handlers manage the session lifecycle (commit on success, rollback on failure), but the session parameter in create_placement is vestigial.

_persist_placement is a documented stub with a clear rationale: placement records are embedded in the approval workflow, so there's no separate placement table. This is better than an uncommented pass statement, but it creates technical debt. If placement decisions later need to be queried independently (e.g., "show all placements by user", "when was this candidate first placed"), the data isn't captured.

handle_placement_conflict implements highest-score-wins resolution. The method calls _persist_placement for each loser, but since _persist_placement is a stub, those updates aren't recorded. This method isn't called by any API endpoint, so conflict resolution is manual (call the method directly) rather than automatic.

## Manual override bypass

override_placement doesn't validate that the manual manifest is compatible with the candidate. A human could override a Multimedia candidate to an Introduction manifest, and the override would succeed. The evidence records the override reason but doesn't flag incompatibility. This creates a path for placement errors that won't be caught until implementation fails.

There's no test for an incompatible override (wrong family, wrong version, wrong target path).

## State machine integration

canonical_workflow.py adds PLACEMENT between CANDIDATE_AUDIT and INTEGRATION_PLANNED. The docstring correctly identifies the next states as INTEGRATION_PLANNED (success) or REJECTED (failure). The PLACEMENT state doesn't appear elsewhere in canonical_workflow.py (no transition guards, no enforcement logic), which is consistent with it being an automated gate.

## API endpoint structure

POST /workflows/{workflow_id}/placement doesn't pass all_candidates, so conflicts are never populated in the response.

POST /workflows/{workflow_id}/placement/override takes candidate_id as a query parameter rather than in the request body. This is inconsistent with create_placement, which takes candidate_id in the body. Query parameters for entity identifiers are unusual in REST design.

GET /workflows/{workflow_id}/placement/conflicts always returns an empty list because candidate_repo.list_by_workflow doesn't exist. The implementation includes a comment acknowledging the gap.

## Test coverage gaps

18 tests cover matching (5), scoring (4), conflicts (3), overrides (2), database persistence (1), and dataclass instantiation (3). 

The database persistence test verifies that _persist_placement exists, but doesn't test that it actually writes to the database (because it's a stub). One override test claims "override requires approval" but only checks that ApprovalEnforcer exists, not that it enforces anything.

Several tests use mock repositories that return None or empty lists, limiting what can be verified. test_override_placement_manual uses mocks that return mock objects with expected attributes, allowing it to exercise the full override_placement code path.

Not tested: create_placement populating conflicts when all_candidates is provided, the conflicts endpoint, invalid weights raising ValueError, REJECT manifest filtering when it's the only manifest available, handle_placement_conflict updating losers to REJECT.

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
