# Sol acceptance of Slice 20 Q1/Q2 corrections

Date: 2026-11-07. **Q1/Q2 verdict: ACCEPTED within source/generated-SQL/caller simulation.**
**Overall W1-W3: PARTIAL_ACCEPTANCE. Closure and W4 implementation NOT APPROVED.**

## Actual revisions and role attribution

Initial reviewed HEAD and adapted test revision:
`5614579187bfd28b36e770d2739e61037eb3da74`, clean, branch
`remediation/w1-2-batch-05-targeted`.
Production: `dc75ace5286d2b0f0da97a8d3e9406f809dec46a`.
Earlier Slice 19 production: `f6627115a8a2f9dacf12bc4d711aecf3677c11ee`.

Gemini made the two production changes while acting for unavailable Argon and then ran
tests. Preserve that implementation attribution; those runs are implementer diagnostics
for its own fix, not independently authored-source verification by a separate implementer.
This Sol source inspection and fresh executions provide the separate review for the
specific accepted corrections. Do not revert correct code merely for the role deviation.
This review grants no standing permission for future testing sessions to edit production;
Argon remains the production owner and source defects should return to that role.

The committed repository Gemini report at initial HEAD was still the earlier report;
the new report pasted by the owner is attributed as submitted evidence, not a separately
committed latest REPORT_SHA. This acceptance is a current committed review record and
does not rely on inventing a report hash or external host artifact accessibility.

## Accepted correction and test adaptation

**Q1:** `StudentInvitationRepository.claimForRedemption` now uses UPDATE RETURNING for
expiry. A successful mutation returns the actual row. A zero-row mutation rereads with
findById and truthfully reports redeemed/revoked/expired/missing state; an unexpected
concurrent state fails closed. It no longer manufactures an expired record from the
stale preliminary SELECT. The retained zero-row/concurrent-terminal test passes.

**Q2:** `commitStudentInvitationInTransaction` now delegates redemption to the canonical
StudentInvitationRepository bound to the same tx (or selected explicit tx-bound port).
The separate application UPDATE policy was removed. Repository mutation checks ID,
claiming status, owner token, unexpired claim lease AND unexpired invitation. Both
application expiry-denial cases and the legitimate unexpired positive pass.

Commit 56145791 adds redeemAtomic to the earlier mocked repository used for the positive
SQL-only-claim composition test. This is an appropriate positive fixture adaptation for
the selected delegation, with its original no-global-record assertion retained. The mock
does not prove SQL predicates; the unmodified 40-test repository campaign separately
executes the actual class and real Drizzle SQL against the controlled executor. No
required negative expectation was relaxed for this acceptance.

## Fresh independent evidence

Offline pre-import guard, service environment bindings cleared. No physical database,
Redis, queue, storage, account, migration or browser operations.

| Exact command | Observed result |
| --- | --- |
| `node audit/Sol_Slice20_Repository_Review.mjs` | 1 file / 40 passed; exit 0 |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | 1 file / 8 passed; exit 0 |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | 1 file / 6 passed; exit 0 |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | 1 file / 7 passed; exit 0 |
| `node audit/Sol_W1_W3_Checkpoint_f88fef44.mjs boundary placement nested analytics` | boundary 64, placement 24, nested 23, analytics 3: 12 selected file executions / 114 passed; process exit 0 |
| `node audit/Sol_W1_W3_Integrated_Review_f574daa5.mjs scoring exports admin analytics` | scoring 2, exports 60, admin 9, analytics 28: 15 selected file executions / 99 passed; process exit 0 |
| `pnpm --filter @quiz/db-people exec tsc --noEmit` | exit 0 |
| `pnpm --filter @quiz/skillup-admin exec tsc --noEmit` | exit 0 |

The pasted latest table's 3 checkpoint tests and 28 integrated tests describe only the
LAST selections, not the complete commands. Correct fresh command-level totals are 114
and 99, while preserving each selection above. Do not sum overlapping suite counts into
unique requirements or acceptance coverage. Expected simulated denial/error logs in
export tests are not failing tests; final per-selection results pass.

Updated synthetic generated SQL/parameter/affected-row evidence is retained in
`audit/Sol_Slice20_SQL_Evidence.json`. Full broad runner outputs remain on disk as
`audit/Sol_Slice20_Q1Q2_Checkpoint.log` and `audit/Sol_Slice20_Q1Q2_Integrated.log`.
These are safe fixture logs; no production credentials were loaded. The controlled SQL
executor is a limited expression/row model, not PostgreSQL isolation/locking/SQLSTATE
qualification. Earlier three failures are historical, superseded by the passing Q1/Q2
source revision. Keep that history rather than overwriting old failure transcripts.

## Remaining readiness work: unchanged scope

No further Q1/Q2 source defect was reproduced in this review. Do not reimplement these
accepted corrections merely because the entire foundation is still open. Continue the
[single consolidated thirty-task checklist](Claude_Sonnet45_W1_W3_Completion_Directive.md#consolidated-remaining-work-checklist-for-w4-readiness)
and the [Slice 19 remaining-package checkpoint](Sol_Slice19_Scoped_Acceptance_f6627115.md).

Still required for overall acceptance:

1. Reconcile the finding/caller inventories and original unique IDs, including unresolved
   109/181 and distinct-finding claims; cite enumerated rows, not assumed exhaustive counts.
2. Complete or supply missing source/caller/compatibility evidence for every original
   FND01-FND30 and TC01-TC20 requirement. A green latest slice cannot substitute for
   operational truth, taxonomy caller, identity bridge or historical compatibility coverage.
3. Finish six-domain integration, adverse regressions and applicable quality gates.
   Record workspace typecheck failures, lint prerequisites, skipped/interrupted selections
   and exact source/test attribution without blanket workspace-green statements.
4. Prepare and separately authorize the required physical SQL provenance/migration/
   constraint/concurrency, queue/ack/restart, installed-browser owner-transition and storage/
   export permission proofs. The six PostgreSQL concurrency cases from the Slice 20 packet
   remain NOT_EXECUTED here. Missing proof is not a pass or an automatically permitted deferral.
5. Supply independent per-requirement/per-group G1-G9 audit evidence, FND28-FND30 closure
   artifacts and a W4.1-W4.6 dependency/readiness matrix for Sol's explicit decision.

The nine-group automated Verified labels in a tester report are evidence claims, not
Sol's whole-group acceptance. RC-ID-01, BROWSER-01 and applicable Batch 08/runtime gates
retain original scope and open requirements. No new project scope is added by this review.

## Next owners

Argon continues all remaining implementation/integration/evidence preparation under the
standing authorization. Gemini returns to independent tests and accurate committed audit
evidence, including real SQL only if the execution gate is authorized. Sonnet may provide
optional disjoint documentation support. Sol retains final architecture/group/closure and
W4-entry decisions. Readiness preparation can proceed; W4 implementation still needs GO.

No push, main merge, deployment, physical migration, credential/account mutation or live
service execution is authorized by this source acceptance.
