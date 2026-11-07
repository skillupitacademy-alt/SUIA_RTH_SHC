# Slice 20 independent repository verification

Prepared 2026-11-07 by Sol (this Codex session). This is Sol's independent evidence,
not an assertion that a Gemini Flash runtime was launched. Production code unchanged.
**Verdict: CHANGES_REQUESTED for Slice 20.** Overall W1-W3 remains PARTIAL_ACCEPTANCE;
Slice 19 source/adapter scoped acceptance is retained; no W4 implementation approval.

## Revisions

- Actual initial tested HEAD: `8afc5508e2a38fbb88295c8edf9909e46da2ea9d`, branch
  `remediation/w1-2-batch-05-targeted`, clean.
- SOURCE_SHA: `e70868e3886f178fb4d2cfc47514a83edd925f1d`.
- INVENTORY_SHA: `5a700d4f61eb6b8574cd226d616d98415d403452`.
- Production source at tested HEAD is unchanged from SOURCE_SHA; later changes are audit
  handoff/authorization records. Test/report revision is the local commit containing this
  packet; its actual SHA is supplied after commit, not invented as a self-reference.

## Implementation and verification method

`audit/Sol_Slice20_Repository_Contracts.test.ts` directly instantiates the ACTUAL
StudentInvitationRepository and EventOutboxRepository. Neither class nor Drizzle's
predicate operators/schema/SQL generation is mocked. An injected `drizzle-orm/pg-proxy`
driver records generated SQL and bound parameters and evaluates its supported WHERE
expressions against controlled rows. Unsupported SQL throws; it never returns a desired
row irrespective of predicates. This isolates source SQL semantics from network effects.

`audit/Sol_Controlled_SQL_Executor.ts` is a deliberately limited test model, not a SQL
server or a PostgreSQL locking/transaction implementation. It covers conjunction/disjunction,
ID/status/owner comparisons, temporal inequalities, IS NULL, JSONB structural equality,
insert/update/returning and an explicit snapshot-abort simulation. Synchronous row mutation
hooks model specific interleavings; no sleep-based scheduling. Physical locking, isolation,
deadlock, SQLSTATE and driver transaction semantics are NOT established by this model.

The offline DNS/socket/fetch guard loads before imports; DB/cache/queue bindings are
removed. All tokens, identities and data in transcripts are synthetic. No secret values,
live SQL, real account mutations, migrations or queue/storage operations were used.

## Results

Command: `node audit/Sol_Slice20_Repository_Review.mjs`.
**1 file / 40 tests: 37 passed, 3 failed; exit 1.**
SQL evidence: `audit/Sol_Slice20_SQL_Evidence.json` (generated SQL, synthetic parameters,
affected row counts). Transcript: `audit/Sol_Slice20_Repository_Review.log`.

The initial test harness had timestamp wire-format/JSON decoding and an incorrect
terminal-row expectation; these were corrected in TEST code before this result. They
are not attributed to production defects. Supported positive cases now pass.

| Requirement selection | Result and boundary |
| --- | --- |
| Invitation expiry before/equal/after now | PASS: equality expires; later timestamp may claim |
| Pending/claiming expiry | PASS with ID/time/status predicates in actual UPDATE |
| Redeemed/revoked terminal status preservation | PASS: no terminal overwrite |
| Invalid claim TTL 0, negative, NaN, +/-Infinity; valid TTL calculation | PASS |
| Competing repository claims | PASS: one winner in controlled atomic-row model |
| Wrong owner, expired claim, expired invitation, terminal row redemption | PASS in actual repository redeemAtomic |
| Valid owner/redemption SQL predicate evidence | PASS: claim and invitation expiry checked in mutation |
| Stale expiry UPDATE returning correct concurrent state | FAIL: Q1 below |
| Actual application commit helper with expired claim/invitation | 2 FAIL: Q2 below |
| Actual application commit helper with valid owner/time | PASS |
| New outbox identity, first NULL install and IS NULL SQL | PASS |
| Existing envelope conflict, exact replay/property-order equivalence | PASS |
| Competing first installations, equal and different envelopes | PASS: mutation-hook model preserves winner |
| Missing/wrong owner; same owner with matching/conflicting envelope | PASS |
| Completion without supplied envelope | PASS: documented existing envelope retained |
| Already-published matching/conflicting replay | PASS |
| Owner replacement before completion and final stored envelope | PASS |
| Two outbox claims with one winner | PASS: controlled atomic-row model |
| Invitation/outbox abort rollback | PASS only in explicit controlled snapshot simulation |

## Q1: conditional expiry returns an invented expired record after zero-row mutation

Severity: MEDIUM, incorrect result/evidence under concurrency; no demonstrated terminal
row corruption. Maps to TC08 / FND11 / FND16, original G2/G3 acceptance boundaries.

Source: `packages/db-people/src/repositories/student-invitation.repository.ts`,
claimForRedemption expiry branch, approximately lines 277-291.

Reproducer `zero-row expiry after another actor redeems reports actual terminal state`:
1. Initial SELECT observes a pending row whose invitation has expired at the supplied time.
2. Before the conditional expiry UPDATE, a modeled other actor finalizes the row redeemed.
3. UPDATE's ID/time/eligible-status predicates correctly affect zero rows: stored status
   remains redeemed. However, repository unconditionally returns reason expired and a
   copied stale record with status changed to expired, without checking mutation outcome.

Required bounded correction: use RETURNING/affected-row truth. Return the actual changed
expired record on success. On zero rows, reread/classify the authoritative current state,
or return an explicit truthful conflict/outcome under the selected contract; do not report
a transition that did not happen. Preserve the terminal-row and valid-expiry controls.
This confirms the specific race hypothesis in the approved assignment; it is no longer
merely speculative. The hook models a stale read/terminal commit interval, not physical SQL.

## Q2: application redemption mutation bypasses repository expiry predicates

Severity: HIGH; expired invitation or claim can be accepted by the actual application
commit helper. Maps to TC08 / FND11 / FND16, existing secure invitation contract.

Source: `apps/skillup-admin/src/lib/student-invitation.ts`,
commitStudentInvitationInTransaction direct-SQL branch, approximately lines 431-454.
Normal redeem route invokes that helper inside the account activation transaction.

The changed StudentInvitationRepository.redeemAtomic correctly requires BOTH
claimExpiresAt > now and expiresAt > now along with ID/claiming/owner. Its controlled
negative tests pass. The application helper independently constructs another UPDATE
that checks only ID, claiming status and owner. Therefore the new repository correction
does not protect this supported normal caller path.

Two executable failures invoke the actual helper with a real Drizzle update executor:
- claim expiry equal to now, invitation otherwise valid: helper succeeds and marks redeemed;
- invitation expiry equal to now, claim otherwise valid: helper succeeds and marks redeemed.
The valid unexpired helper positive passes. Generated SQL confirms the omitted expiry
conditions. These are application-source simulation findings, not physical account exploits.

Required bounded correction: delegate the transaction-bound helper to the canonical
StudentInvitationRepository(tx).redeemAtomic (or a faithfully equivalent selected port),
so the mutation uses the same expiry/owner/affected-row invariant. Preserve the exact shared
transaction, no-global-state requirement and RETURNING confirmation from Slice 19. Do not
copy another independent policy with missing conditions or relax the expiry denials.
This is a necessary within-contract caller manifest extension; no routine new approval is
needed under the standing authorization. Argon fixes production, Gemini independently tests.

## Retained regression and quality evidence

Independently rerun by Sol in this campaign:

| Command | Result |
| --- | --- |
| `node audit/Sol_SQL_Authority_Review_7f66e7eb.mjs` | 8 passed; exit 0 |
| `node audit/Gemini_SQL_Authority_Invariant_Review.mjs` | 6 passed; exit 0 |
| `node audit/Sol_Lease_Adapter_Review_27243c6e.mjs` | 7 passed; exit 0 |
| `pnpm --filter @quiz/db-people exec tsc --noEmit` | exit 0 |
| `pnpm --filter @quiz/db-tutorial exec tsc --noEmit` | exit 0 |
| `pnpm exec eslint --no-ignore --max-warnings=0 src/repositories/student-invitation.repository.ts` in packages/db-people | exit 0 using that package's configured lint rules |
| `pnpm exec eslint --no-ignore --max-warnings=0 audit/Sol_Controlled_SQL_Executor.ts audit/Sol_Slice20_Repository_Contracts.test.ts` | exit 2: no ESLint config found for audit/; lint NOT qualified |
| `pnpm exec tsc --noEmit` (workspace root) | exit 2: syntax errors in unchanged `packages/db-tutorial/migrations/schema.ts`, beginning lines 694-700; separate red gate |

Workspace output is retained in `audit/Sol_Slice20_Workspace_Typecheck.log`; audit lint
output is in `audit/Sol_Slice20_Lint.log`. A scoped typecheck does not qualify workspace
compilation. Full affected package suites are not newly
claimed executed here; prior Gemini results retain their own revision/boundary.

## Physical PostgreSQL group C

No exact disposable database execution/migration authorization was present in this
assignment. No endpoint discovery or connection was attempted.

| Physical case | Status | Required next input |
| --- | --- | --- |
| Two connections claiming one invitation | NOT_EXECUTED | Authorized disposable PostgreSQL target/schema and isolated connection recipe |
| Redemption versus expiration | NOT_EXECUTED | Same target, transaction barriers and expected commit ordering |
| Expiration versus terminal state | NOT_EXECUTED | Same authorization and state/affected-row inspection |
| Two concurrent envelope installations | NOT_EXECUTED | Authorized outbox schema and independent transactions |
| Completion versus owner/lease loss | NOT_EXECUTED | Controlled time/owner replacement and separate transaction observations |
| Transaction abort and rollback | NOT_EXECUTED | Authorized real transaction runner and cleanup plan |

All six remain separate from the offline model. SQLSTATE, real isolation/locking and
physical rollback must not be inferred from controlled executor success.

## Continuation and ownership

Argon: correct Q1/Q2 under existing contracts, with exact manifest and preserved accepted
boundaries; continue the full existing TC01-TC20/FND01-FND30 checklist. Freeze source
IMPLEMENTED_UNVERIFIED. Gemini: independently rerun actual repositories and caller paths,
all required positives/denials, and actual physical cases only when separately authorized;
record PASS/FAIL/BLOCKED/NOT_EXECUTED with separate source/test/report SHAs. Sol: review
scoped fixes and complete group/readiness evidence. Sonnet support remains optional.

Inventory row/finding claims retain their open evidence requirements; this campaign does
not substantiate additional callers or findings. Nine-group closure, BROWSER-01 and
RC-ID-01 retain original meanings and remaining gates. No push, main merge, physical
migration, live account/queue/storage/database mutation, deployment or W4 GO is authorized.
