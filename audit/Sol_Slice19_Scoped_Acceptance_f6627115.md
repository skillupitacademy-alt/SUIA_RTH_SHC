# Sol Slice 19 scoped acceptance and foundation checkpoint

Date: 2026-11-07. **Slice verdict: ACCEPTED WITHIN THE SOURCE/ADAPTER BOUNDARY BELOW.**
**Overall W1-W3 disposition: PARTIAL_ACCEPTANCE; closure and W4 entry NOT APPROVED.**

## Actual revisions and integrity

Initial actual HEAD: `746079ddc5bc28c196ad40a8a0817e84715431b5`, clean, on
`remediation/w1-2-batch-05-targeted`.

| Revision | Actual Git object |
| --- | --- |
| Argon production source | `f6627115a8a2f9dacf12bc4d711aecf3677c11ee` |
| Argon handoff | `4b42e2276a878aa656ca0d60fea192764f39e5cb` |
| Gemini test changes | `ee1cb0836b1ee21ced64f3a4a8e1c5f247e31e6c` |
| Gemini report | `1732fb8187336757c02ce97648e289c7c04486a4` |
| Subsequent Gemini runner alias correction | `746079ddc5bc28c196ad40a8a0817e84715431b5` |

Production diff from f6627115 to the initial reviewed HEAD is unchanged: subsequent
changes are test/audit paths. Gemini's report had incorrect full source/handoff/test
hashes despite correct short prefixes; this review corrects those metadata values.
The runner correction is part of the independently exercised test state.

## Accepted corrections (do not reimplement these without a reproduced regression)

1. **Implicit outbox fallback removal:** resolve/find/upsert/dispatch reject missing or
   incomplete persistence dependencies; arbitrary aggregate/owner values do not bypass
   this boundary. Environment strings no longer select transactional authority.
2. **Actual certificate/badge dependency wiring:** initial and recovery paths resolve and
   pass the repository; domain-plus-intent writes pass the transaction to the outbox
   adapter; dispatch requires the durable repository argument.
3. **Invitation transaction boundary:** creation/claim use the repository interface;
   redemption requires a transaction; commit requires a returned redeemed SQL row or
   conforming redeemAtomic port and no longer needs a process-global invitation record.
4. **Queue credential denial:** missing/empty required QStash credentials produce failure
   and prevent successful completion acknowledgment of required pending publication.
5. **Retained lease boundary:** the previously reviewed atomic adapter/unsupported-store
   denial controls continue passing. Canonical persisted-envelope publication support is
   retained; correctness must continue to use the authoritative stored envelope.

This supersedes the earlier S1/S3 review failures ONLY for those enumerated source and
adapter boundaries. It does not certify SQL commit/rollback/concurrency at infrastructure
level, every worker effect, all historical compatibility paths, or an entire parent FND/TC.
Explicit isolated test adapters are simulation; they must remain explicitly selected and
must not become production fallback authority. Temp-file test helpers do not prove the
production SQL outbox is durable.

## Independent Sol evidence at the reviewed revision

Pre-import `audit/W1_W3_Offline_Test_Network_Guard.ts`, service bindings cleared, no live
DB/cache/queue/storage operations. Selections remain separate, without a total implying
distinct requirements or full-program coverage.

| Selection | Observed result | Evidence boundary |
| --- | --- | --- |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | 1 file / 8 passed; exit 0 | Selected caller authority and negative adapter controls |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | 1 file / 6 passed; exit 0 | Generalized arbitrary-ID/owner, partial-port and injected-positive controls |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | 1 file / 7 passed; exit 0 | Retained atomic-interface boundary and unsupported-store controls |
| Certificate, badge and outbox recovery route files, programmatic guarded Vitest | 3 files / 11 passed; exit 0 | Actual route composition with mocked infrastructure and explicit test repositories |

Worker review invocation used `startVitest('test', files, options)` from `vitest/node` via
`node --input-type=module -e`, with these exact files:

```text
apps/realtutorialhub-web/src/app/api/workers/issue-certificate/__tests__/route.test.ts
apps/realtutorialhub-web/src/app/api/workers/award-project-badge/__tests__/route.test.ts
apps/realtutorialhub-web/src/app/api/workers/__tests__/outbox-recovery-probe.test.ts
```

Options: config false, watch false, maxWorkers 1, fileParallelism false, environment node,
reporter dot; @ alias to apps/realtutorialhub-web/src, @quiz/db-tutorial to
packages/db-tutorial/src, @quiz/events to packages/events/src; setupFiles is the offline
guard; exclude node_modules and .worktrees. DATABASE/DIRECT_URL/REDIS/UPSTASH/NEON/QSTASH
matching environment keys were removed before the runner. Remaining broad suites and
six scoped typechecks are attributed to Gemini's report, not new Sol full-workspace runs.

## What remains before foundation closure

Use the [single consolidated thirty-task checklist](Claude_Sonnet45_W1_W3_Completion_Directive.md#consolidated-remaining-work-checklist-for-w4-readiness).
Scope is unchanged. The next campaign must advance the full checklist instead of repeatedly
submitting the same now-accepted adapter slice as all-foundation completion.

| Remaining package | Required output / acceptance owner |
| --- | --- |
| Finding/coverage reconciliation (FND01/FND12/FND17) | Argon reconciles enumerated original findings and counts; Gemini validates crosswalk/coverage. No assumed exhaustive count. |
| Remaining source/caller completeness (FND03-FND23) | Argon cites existing code and completes genuinely missing original requirements. Preserve accepted corrections; distinguish missing evidence from absent implementation. |
| Real repository semantics | Gemini instantiates actual EventOutboxRepository and StudentInvitationRepository using controlled SQL executors with discriminating predicates, tx rollback, affected-row truth, two-instance claim/replacement/replay and stable-envelope retry assertions. Mocked repository return values alone are not this proof. |
| Full contract integration/adverse regression (FND24/FND25) | Independent actual producer/handler/service/repository chains across six canonical domains and all required positives/denials; retain exact historical compatibility and all known failure dispositions. |
| Quality/compatibility (FND26/FND27) | Applicable lint/typecheck/build/test gates with precise treatment of red, skipped, collection and interrupted results. No blanket workspace acceptance from six filtered checks. |
| Runtime/physical readiness | Concrete reviewed execution packets for SQL provenance/constraints/concurrency, queue/crash/ack effects, installed-browser owner transitions, storage/export permissions and applicable root-cause/release gates. Execute only with separately granted authorization. |
| Independent re-audit/entry/closure (FND28-FND30) | Original G1-G9 requirement-by-requirement evidence and Sol dispositions, W4.1-W4.6 dependency/readiness matrix, integrated source/test SHAs, rollout/rollback and final explicit decision. |

The group table in Gemini's report is useful organization, but entries marked automated
Verified are tester claims about selected evidence, not Sol acceptance of entire groups.
For example, taxonomy/nested-schema tests do not certify all W2 truth findings; email lookup
tests do not certify physical uniqueness; headers do not certify installed-browser owner
transitions. RC-ID-01 remains the original identity/session/authorization/brand root cause.
No automatic deferral or closure is granted for RC-ID-01, BROWSER-01, Batch 08 or required
physical gates. A mandatory prerequisite remains open until observed or disposed only via
an exception actually permitted by governing policy.

## Responsibilities and next handoff

**Argon:** remains owner of ALL TC01-TC20/FND01-FND30 implementation and integrated handoff.
Update the existing ledger with scoped acceptance, remaining source gaps and required
execution packets. Complete the remaining checklist, not another unneeded rewrite of the
accepted strict adapter boundary. Standing authorization continues without routine approvals.

**Gemini:** tests/audit only. Complete actual-repository and full original GM/FND/group
coverage. Record exact source/test/report revisions, commands and PASS/FAIL/NOT_EXECUTED/
BLOCKED. Keep runtime/physical limits explicit; no production edits or weakened denials.

**Sol:** accepts this source slice only within the boundary above, then reviews the final
whole-foundation evidence and gate dispositions. W4 readiness preparation is FND29 and can
continue now; W4 implementation requires an explicit scoped GO. New independent findings
against existing requirements remain actionable, but this acceptance adds no new project scope.

No push, main merge, deployment, physical migration, credential/account mutation or live
database/queue/storage/browser execution is authorized by this review.
