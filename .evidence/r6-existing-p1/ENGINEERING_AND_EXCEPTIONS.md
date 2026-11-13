# Affected engineering boundaries and remaining exceptions

| Existing boundary | Applied rule | Evidence / limit |
| --- | --- | --- |
| SHC backend admin admission | Reuse the existing PeopleDB account authority. Current eligibility and least privilege apply to direct backend callers. | Current account helper tests and real signed-token HTTP probes. Existing internal/service and tenant-admin authorities retain separate contracts. |
| RTH browser cancellation | Authenticate current persisted learner session at the existing proxy, then enforce resource ownership in the existing service. Exact DELETE UUID path only. | Proxy negatives cover anonymous, revoked, hostile origin, extra segments and adjacent methods. Populated actual HTTP proves owner200, foreign403, retained foreign row. |
| RTH response boundary | Reuse the existing sanitized server-error helper and correlation mechanism. Private success and denial responses prohibit storage. | Injected provider failure is opaque500. Typed ownership/missing errors remain403/404. |
| Quiz answer mutation | Existing exam engine owns exam eligibility, user ownership and exam-question membership. Authorization precedes idempotency acknowledgement and cache/persistence effects. | Before/after regressions include foreign exam, unrelated question, stale completed state and legitimate accepted retries. Current state is fetched for answer mutations. |
| Test ownership | Replace obsolete public error-message and authority assumptions with precise boundary assertions. Preserve failure logs and zero-query invariants. | Detailed verifier policy is asserted independently from sanitized public401. Fault injection proves independent RBAC denial. No guard or lint rule was disabled. |
| Existing hierarchy coordination | R6-A makes no hierarchy/reconciliation or schema change. | Source comparison of hierarchy-coordination.ts matches R4. Concurrency/recovery acceptance remains with Gemini R6-D. |

The widened exam suite has one remaining failure in exam.observer.tail.test.ts. It expects the default report-generator origin to be localhost3002, while the current implementation defaults to api.skillhubcore.in. Source inspection also finds a literal fallback internal credential in that existing observer. No report generation was invoked against a remote provider. The correct configured report-generator owner, default URL and missing-secret failure contract require a focused disposition. The failing test and source finding are retained. It would be inaccurate to call the complete exam suite PASS.

One actual SUIA owner quiz-result request returned500 during a cold start under local memory pressure. A separate warmed run succeeded202 for both portals with new synthetic identities and cleanup verification. The original result is retained. This campaign does not establish cold-start/load acceptance or whole-site performance.

The answer authorization fixes do not establish serializable concurrent answer-versus-completion behavior. They prevent demonstrated stale-cache admission by fetching current state at the mutation entry point. A transaction-level race qualification requires separate bounded concurrency evidence for the existing exam persistence contract. MainDB/TutorialDB distributed atomicity is outside this change.

| Project acceptance family | Bounded R6-A disposition |
| --- | --- |
| PSEG U01/U02 authoritative owner and separation | Existing account service, cancellation service and exam engine retain their responsibilities. This observation does not close the separate SHCA-U01 hierarchy-owner finding. |
| PSEG U03/U04 dependency direction and simplicity | Existing helpers and authorities are reused. Changes are restricted to demonstrated admission, error and answer-scope boundaries. Full monorepo SOLID/DRY qualification remains PENDING. |
| PSEG U06/U07 typed contracts and authorization | Typed403/404/503 classifications and current-authority checks have bounded executed proof. Full per-method contract qualification remains PARTIAL. |
| PSEG U09/U10 safe errors and observability | Cancellation provider errors are opaque, carry the existing correlation mechanism and prohibit caching. The report-generator and cold-start exceptions remain visible. |
| PSEG U11/D01 testing and local gates | Exact command receipts and source hashes accompany tests, typechecks, lint and builds. Wider suite failures retain FAIL. Production release evidence remains outside local execution. |
| PSEG F03/F05/I01/I02/I03 | Selected current-session, private-data, cross-brand, role-removal, subject-header and owner assertions pass. Full membership/enrollment and forged-header coverage for every active operation remains PARTIAL/PENDING. |

Canonical SHCA criteria and PSEG criterion families have separate identities. The derived evidence does not edit or replace either the62-row ledger or original48-task register. PSEG-001 retains its working/proposed status under the governing precedence.

Automatic continuation, MainDB identity schema changes, report-generator replacement, new services and infrastructure are outside the current R6-A implementation. Attendance/payment/Marketing/accessibility work retains HOLD. No canonical acceptance status is promoted by these engineering observations.
