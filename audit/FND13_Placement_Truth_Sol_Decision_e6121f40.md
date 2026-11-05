# Sol placement truth decision and workflow checkpoint

Recorded 2026-11-06 at implementation submission e6121f40. The repeat loop should end
and submit its current evidence for review. This checkpoint authorizes the bounded
placement correction below within the complete FND01-FND30 assignment. It does not
accept FND12, FND17, FND13-FND16 or G3 as complete.

## Placement contract selected

Unknown matching quality is unavailable. No-profile and failed/no matching computation
must not produce a numeric match percentage from list position, readiness or a floor.
The proposed match:1 placeholder is not selected. It remains an invented measurement.
Readiness is a separate source value and must not become profile completion or interview
count. A vector similarity result alone does not establish a calibrated percentage.

Keep persisted open jobs browsable in their documented database order when matching
is unavailable. The jobs list is a catalog, with numeric match absent/unavailable.
This avoids confusing missing matching capability with absence of job listings.
An actually empty jobs store remains an empty list. Database failure must remain a
failure and cannot manufacture a profile or job list.

Authorize these explicit response/type semantics for the affected SkillUp placement
boundary, with all actual consumers migrated and tested in the same reviewable slice.

- profile is null when no active profile row exists. Provide an accurate missing-profile
  state to the UI, with no personal data from FALLBACK_PLACEMENT.
- With an existing profile, expose source-backed skills, readinessScore and other actual
  selected persisted fields using their original names and units. Any retained legacy
  roleGoal/resumeStatus/profileCompletion/interviewCount field is nullable and unavailable
  until its own authoritative source is established. Do not derive it from readiness,
  active status or the first skill.
- Every returned job retains its persisted identity/company/title/location. match is
  number|null in the shared type. Return null until the service contract proves the
  measurement's calibration and units. Zero is a valid measured value when established,
  and must not be clamped to one. No numeric placeholder or rank-based decrement.
- An additive matchingStatus distinguishes missing_profile, unavailable and uncalibrated
  as observed. Use matched only when an authoritative documented measurement exists.
  Keep job availability separate from the matching status. Do not add a new ranking
  engine, product enrollment gate or scoring calibration in this slice.
- Existing source-backed profile and job records remain visible, with client formatting
  handling null explicitly. Unsupported external callers require a documented compatible
  rollout/version adapter before deployment. Physical deployment is outside this task.

## Exact bounded implementation scope

FND13 owns apps/skillup-web/src/lib/skillup-data.ts, skillup-types.ts, skillup-api.ts,
the actual apps/skillup-web/src/app/api/student/placement/route.ts and the existing
placement pages/components/tests that consume this response. Produce a source manifest
enumerating those consumers before edits. Reuse the existing verified learner principal
and tenant rules. Any discovered resource-ownership defect remains linked to FND03/FND05.

The assignment already authorizes this source-backed truth correction, and this Sol
decision selects its nullable contract. Proceed with implementation rather than another
options-only brief. Scope excludes physical accounts, DB/vector/queue operations,
migrations, rollout, new dependencies and changes in other placement applications.
If an actual cross-app consumer is found, provide its exact compatibility requirement
while continuing the independently supported portion of this slice.

Required isolated acceptance controls use the mandatory pre-import network guard.
Exercise no profile, persisted profile, genuine zero, no jobs, valid and invalid vector
scores, unmatched vector IDs, vector failure, DB failure and null dates. Prove no invented
match percentage, interview count, completion percentage or personal profile is returned.
Retain documented legitimate catalog ordering and selected source values.

Compose the actual GET handler with the actual helper and isolated stores, alongside
the existing helper controls. Verify authenticated subject forwarding, unauthenticated
denial before helper/store effects and serialized null/status fields. Add the real
consumer's unavailable/missing/zero rendering control if an active consumer exists.
Disclose mocked auth and physical store limits. Run the affected SkillUp typecheck,
targeted lint and exact final-range whitespace check. Submit IMPLEMENTED_UNVERIFIED
with implementation, tests and API compatibility evidence in the existing handoff.

## Inventory and coverage correction

FND12_Complete_Truth_Inventory.md claims 181 callers, while its classification summary
accounts for 109 entries. Its five stated domain counts also sum to 109, with 72 called
additional without equivalent enumerated evidence in the summary. The document cites
program-truth.test.ts as 22 passes although that file's known selection has three.
Its January dates are inconsistent with the current November review context.

FND17_W2_Coverage_Map.md still marks the Sol stale-report control as failed, although
the focused ten-test selection was independently passing at cc100f47. A coverage map
is not current merely because an earlier review's failure was copied into it. The
reported 177-finding set needs exact unique original IDs, row enumeration, source/finding
citations, W2 applicability and duplicate handling before exhaustive coverage is accepted.
Security findings in other waves should be cross-linked as dependencies, with their
actual root causes and wave ownership retained.

Reconcile both artifacts against actual current source and exact runner selections.
Supply mechanically countable rows per caller/finding and classification. Keep baseline
claims and new observations separately dated. Label inventory/coverage PARTIAL until
the enumeration and accepted domain boundary support completion. Correct stale review
findings rather than reimplementing already passing fixes. This remains FND01/FND12/
FND17/FND28 work in the existing thirty-task assignment.

## Workflow handling

Choose submission of the current checkpoint rather than another uninformed repeat.
The new placement correction is now authorized, so it can proceed as a subsequent
bounded implementation alongside other independent tasks. A local workflow reviewer
APPROVED verdict is review feedback and cannot assign Sol group acceptance. An iteration
limit does not change requirements or prove completion. Test harness failures need the
documented jsdom/React/alias configuration rather than a product-defect conclusion.

All thirty FND tasks remain active. Continue independent W2/W3 work while the actual
authority and runtime dependencies are addressed. Batch 08, BROWSER-01, RC-ID-01 and
all nine group acceptance gates retain their recorded open state.
