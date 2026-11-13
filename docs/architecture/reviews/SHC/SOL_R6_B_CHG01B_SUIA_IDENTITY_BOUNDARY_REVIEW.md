# CHG-01B SUIA identity boundary correction

13 November 2026. Owner-reported GitHub baseline is `bc5a4b1452c6489e18844ac9548923bc69d258c1`. The local starting snapshot contains 768 file hashes in `.evidence/r6-chg01b/BASELINE.json`. Provenance uses local byte comparisons. No Git CLI command or local HEAD assertion was used.

The original `requireStudentAuth()` selected `payload.shadowUserId` first, then fell back to `payload.userId`, returning either value under `userId`. Tutorial forwarding callers treated that result as a brand-local learner ID. Existing operational callers passed the same field into PeopleDB-owned profile and enrollment relationships. The original test fixture reversed those concepts and used opaque labels that concealed the mistake.

The correction makes the two contracts explicit in the existing helper and its callers. It reuses the existing PeopleDB fields and read API. It adds no identity persistence, service, migration or background process.

| Helper mode | Returned identity and authority | Failure behavior |
| --- | --- | --- |
| Explicit learner mode | `learnerUserId` comes from verified `payload.userId`. `peoplePersonId` is null because this path deliberately leaves the PeopleDB projection unresolved. There is no deprecated `userId` alias in this mode. | Existing JWT, brand, role and subject checks apply. PeopleDB is not queried. |
| Explicit people mode | `learnerUserId` retains the brand-local subject. A UUID-shaped signed `shadowUserId` becomes `peoplePersonId` only after an existing PeopleDB read confirms id, externalId, platform, active state and deletion state. | Missing/invalid person claim or absent/mismatched/inactive/deleted mapping returns403 with a generic response and private/no-store. Lookup/configuration failure returns sanitized503 with private/no-store. |
| Deprecated default mode | Same validated PeopleDB contract as explicit people mode. `userId` is documented as a PeopleDB primary-key compatibility alias. It never falls back to the learner UUID. | Uses the same fail-closed behavior. This preserves the required identifier for the held callers while preventing unsafe substitution. |

The PeopleDB predicate requires `users.id = signed shadowUserId`, `users.externalId = learnerUserId`, `users.platform = skillup`, `users.isActive = true` and `users.deletedAt IS NULL`. It never establishes identity by email or by UUID equality alone. An accidentally equal local/person UUID must still have the explicit persisted mapping. The existing `(platform, external_id)` relationship is reused. PeopleDB's global email uniqueness and its migration remain outside CHG-01B.

The person lookup is loaded only for PeopleDB-backed authentication. Learner-only progress and catalogue paths gain no PeopleDB availability dependency. A valid signed person claim by itself is not returned as a resolved live person identity by learner mode. Callers that need the person relationship explicitly request people mode.

## Complete caller inventory

The inventory covers all 20 production route files calling `requireStudentAuth()`. `.evidence/r6-chg01b/CALLER_INVENTORY.csv` lists each source path and classification. No production caller remains unclassified.

| Group | Existing callers | Identity choice |
| --- | --- | --- |
| 11 tutorial route files | Progress GET/POST, sections, interactions GET/POST, ILS visit, active-time, block-active-time, block-visit, block-completion, complete-node, navigation progress and subtopic progress | Explicit learner mode. Forward `learnerUserId` and SkillUp brand context. Existing credential/session/CSRF forwarding stays in place. |
| 3 authentication-only catalogue callers | Programs list, program detail and faculty list fallback | Explicit learner mode. The returned identifier is used for authentication context. These catalogue functions receive no learner/person ID as a data-query argument. Existing primary authentication and brand checks retain their path. |
| 4 operational callers | Student dashboard, my-batch, batches and existing placement profile | Explicit people mode, passing `peoplePersonId`. Placement retains its existing person-reference contract. Placement schema or ownership redesign is outside this task. |
| 2 held callers | Attendance and payments | Endpoint source bytes are preserved. Existing default calls use only the deprecated, validated PeopleDB alias. No held business logic, query or endpoint was rewritten. |

Four operational caller tests verify the actual handler-to-existing-data-function argument with distinct learner/person UUIDs. Missing person claims and stale mappings deny before the business lookup. Helper tests assert the exact signed-person/local-subject/platform predicate. These are mocked persistence tests and do not establish current remote row completeness.

Two existing shared unit suites include incidental attendance/payment cases. Their common mocked authentication shape was extended to the explicit fields required by the changed non-HOLD callers. Held test cases, endpoint logic and database queries were preserved. The focused caller tests import only the non-HOLD operational routes. No dedicated held capability test campaign was performed.

## Preserved token and session contract

TokenService verification, the `user` audience, existing role gate, exact SkillUp brand check, cookie/bearer selection and proxy persisted-session validation retain their existing contracts. Forged subject, brand, host and shadow headers cannot replace the signed identities consumed by this helper.

The shared JWT verifier currently requires a nonempty `shadowUserId`. A cryptographically signed JWT missing that mandatory claim is still rejected401. Four real-signature tests exercise the current verifier using disposable signing keys, including valid local identity, missing mandatory claim, wrong signature and wrong brand. Mocked helper tests also cover absent/invalid optional person identity after a controlled successful verifier result. These latter cases establish helper fail-closed behavior, without claiming that the current production verifier accepts a JWT missing its mandatory claim.

A valid JWT may refer to an absent or stale PeopleDB projection. Learner-only routes continue with the verified local subject and make zero PeopleDB queries. PeopleDB-backed operations deny until the existing projection is valid. Repairing old projections, relaxing JWT claims or changing signup/bridge behavior would require its own task. No person ID is invented to make a test pass.

The existing tutorial progress route already used `payload.userId` for ownership. It now uses the explicit `learnerUserId` field with the same local-ID semantics. Sections, interactions and ILS forwarding now select that same learner contract. Regression tests assert the local header value with a distinct signed person ID and prove a forged request/body subject cannot become the owner. The progress tests retain the same access/refresh-cookie and CSRF forwarding checks. Retired content/writer routes retain410 responses in the existing tests.

## Verification and exact changes

The final command receipts are in `.evidence/r6-chg01b/QUALITY_RESULTS.json`. Exact changed paths and before/after hashes are in `SOURCE_AND_CALLERS.json`. The initial snapshot records the pre-change bytes for all affected existing source/test files. The two newly added test files have explicit final hashes.

| Gate | Outcome |
| --- | --- |
| Focused helper, caller, real-signature, proxy/session, affected route and boundary suites | PASS, 98/98 tests across 12 files, completed exit 0 |
| SUIA TypeScript | PASS, `pnpm --filter @quiz/skillup-web type-check`, completed exit 0 |
| SUIA ESLint | PASS, `pnpm --filter @quiz/skillup-web lint --max-warnings=0`, zero warnings, completed exit 0 |

The final test command explicitly lists its 12 files. Its included shared app suites exercise prior auth/cache behavior with controlled data and HTTP doubles. No real database or provider is used. Existing R6-A/P0 backend source hashes, RTH source, shared proxy/session source, canonical SHC ledger and original Q-register are compared against the starting snapshot. The static comparison does not claim a complete three-app runtime requalification.

The initial new caller tests had two failures because their mock reused one already-consumed Response for successive fetches. The test setup now returns a fresh controlled Response for each request. The failure receipt is retained. That fixture correction required no production response-handling change.

The repository-required AST graph update completed with exit0. Its existing cache-root, extraction and community-label warnings are retained in the graph receipts. Source hashes and executed tests carry this task's acceptance evidence.

The scope contains the existing helper, 18 non-HOLD caller files, their affected tests and the two new security regression files. The only shared-test changes involving held cases are the common mock identity fields described above. No SHC/RTH account authority or schema change was made. CHG-02A, uniqueness migration, MainDB foreign-key migration and cold-start runtime reproduction retain their separate owner gates.

The new mapping check can deny legacy operational sessions whose PeopleDB rows lack the correct external mapping, are disabled/deleted or whose signed person ID is invalid. This fail-closed compatibility effect is intentional under the owner's CHG-01B instruction. Remote affected-account counts and live availability were not measured under the no-database-access verification approach. All demonstrated results are source and isolated test evidence. An end-to-end browser/database qualification remains unexecuted.

No migration, database modification, dummy-data reset, Git CLI operation, deployment, new service/table/queue or paid provider call occurred. No production build or server restart was needed for the requested typecheck/lint scope. The canonical acceptance register and Q48 retain their owner-controlled states. Work stops after CHG-01B for the next separate approval.
