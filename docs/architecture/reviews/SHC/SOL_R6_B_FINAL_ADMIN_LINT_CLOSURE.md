# R6-B Final Admin Lint Quality-Gate Closure

Reviewed 14 November 2026 against local main `2abe642a314863aa75617b9f0a51fcdcea958876`. The initial working tree was clean.

## Results

The full SUIA Admin lint command passes with zero errors and zero warnings. The application typecheck passes. All 24 selected admission, invitation, email-boundary and UUID-reporting tests pass across four files. An additional TypeScript configuration explicitly includes the two edited test files and passes.

| File | Before | Correction | After |
|---|---|---|---|
| `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts` | 9 explicit-any warnings | Typed predicates and their metadata, table handles, SQL interpolation values, row resolver and transaction callback. Capture the nullable query predicate before invoking the filter callback. | 0 diagnostics |
| `apps/skillup-admin/src/app/api/admin/students/__tests__/invitation-redemption.test.ts` | 25 explicit-any and 3 unused-binding warnings | Typed mock write values and row collections, inferred mock database shape, existing invitation-port parameter types, generic transaction return and actual NextRequest fixtures. Remove the unused imports and destructured database binding. | 0 diagnostics |
| `apps/skillup-admin/src/lib/student-invitation.ts` | 8 explicit-any warnings | Use the existing PeopleDB repository constructor, DbClient method signatures, transaction callback type and existing invitation port. Unknown injected executors retain the existing capability checks. | 0 diagnostics |

BEFORE_AFTER_LINT.json records every original warning with rule, message and source position alongside current diagnostics. The typed SQL executor assertions occur at the existing unknown dependency boundary and identify the existing canonical DbClient. They replace the previous unconstrained any boundary. The branch conditions and repository calls preserve their original behavior.

## Verification receipts

| Command | Result | Exit |
|---|---|---|
| `pnpm --filter @quiz/skillup-admin lint --max-warnings=0` | PASS, zero errors and warnings | 0 |
| `pnpm --filter @quiz/skillup-admin type-check` | PASS, full application typecheck | 0 |
| `pnpm --filter @quiz/skillup-admin exec vitest run --config ../../.evidence/r6-admin-lint-closure/invitation-tests.vitest.config.mts --maxWorkers=1 --reporter=verbose` | PASS, 24 tests in four files | 0 |
| `pnpm exec tsc --noEmit -p .evidence/r6-admin-lint-closure/tests.tsconfig.json` | PASS, includes edited test fixtures | 0 |
| `node .evidence/r6-admin-lint-closure/check-assertions.cjs` | PASS, 38 redemption and 26 collision assertions preserved | 0 |
| `node .evidence/r6-admin-lint-closure/compare-lint.cjs` | PASS, 45 to zero diagnostics and identical runtime tokens | 0 |

The final runner inherits the prior transport guard, which blocks TCP, TLS and outbound fetch. Database/provider environment values are cleared. The focused Vitest configuration uses node and controlled adapters, with no dotenv loading. The tests exercise expiry, replay, tampering, tenant boundaries, duplicate account rejection, zero-row failures, password-update failure/retry, UUID reporting and authorized positive controls.

The optional explicit test-file typecheck initially found a nullable predicate invocation in the newly typed mock. Capturing the predicate in a local constant corrected that narrowing issue. The failed receipt and corrected rerun are preserved. The selected runtime tests passed before and after this correction.

PRODUCTION_EMIT_COMPARISON.json records the emitted runtime-token comparison for student-invitation.ts against the baseline, ignoring comments, whitespace and redundant namespace parentheses. ASSERTION_PRESERVATION.json records the unchanged assertion expressions after type erasure. These checks supplement the executed tests and application typecheck.

The previous full Admin production build passed at the baseline. This task reran the requested lint, application typecheck and affected controlled tests. Production-build evidence from the preceding closure remains associated with its original source snapshot.

## Scope and owner review

The change is limited to the three authorized files and focused evidence. Existing project governance applies through SHC 00, proposed PSEG-001 v1.1 and annexes 02–04. The original 62-row acceptance ledger and Q01–Q48 register retain their owner-controlled status. Q48 is OPEN.

PeopleDB uniqueness migration and isolated real-PostgreSQL qualification require their separate owner approvals. Historical exam-grace behavior retains the prior unresolved product/security contract disposition. The three unlinked accounts, migration 0009 ordering, backup/restore rehearsal and deployment gates retain the previously documented prerequisites.

Exact changed-file SHA-256 hashes, preserved-source checks, command timings, diagnostics and local raw-log hashes are recorded under `.evidence/r6-admin-lint-closure`. Changes are available locally for owner review.
