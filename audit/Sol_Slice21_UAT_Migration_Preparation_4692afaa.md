# Slice 21 exact UAT migration preparation and execution boundary

Date: 2026-11-07. **APPROVED FOR OFFLINE PREPARATION ONLY. Physical execution NOT APPROVED.**
Read with `Sol_Slice21_Review_4692afaa.md`. No blanket `pnpm db:migrate` authorization.
The names of connected databases in a tester report do not establish environment ownership,
backup recoverability or permission to apply DDL. No new connection was attempted by Sol.

## Exact source artifacts reviewed

| Package target | File | SHA-256 at review |
| --- | --- | --- |
| People-owned invitation table | `packages/db-people/migrations/0009_student_invitations.sql` | `CD7AE2EF7C388C49FF303B89CC4FBF9E07876BC1704DBD2F19A5ECE3E5F1CA09` |
| Tutorial-owned outbox table | `packages/db-tutorial/migrations/0015_event_outbox.sql` | `AC81268627F2B552A54711DF00722C876CF3628A3300F07A8F80C8B6137E0639` |

The actual table names are `student_invitations` and `event_outbox`. The submitted SQL
harness queried `tutorial_event_outbox`; that result cannot establish actual outbox absence.
Invitation FK points at the people-owned users(id) and uses existing platform enum.
Expected outbox columns include event_id, aggregate_id, envelope, owner_token and
lease_expires_at. Invitation columns include user_id, token_hash, platform and claim fields.

Registration gap: People journal ends at 0008; tutorial journal ends at 0028. Neither
reviewed file is currently registered. Tutorial already has
`0015_backfill_summary_interview_ai_tutor_sections.sql`. Therefore numbering a new file
0015 does not make the migrator discover/execute it and creates an ordering ambiguity.
Argon must inspect actual migration/snapshot history, assign a unique correctly sequenced
tag or a separately reviewed one-off application recipe, and avoid executing earlier
blocked guessed-provenance migrations. Do not invent journal hashes/timestamps or mark an
unapplied migration applied. If artifacts change, regenerate this exact reviewed hash list.

## Prerequisite record Argon must prepare

1. Owner-confirmed UAT project/branch and database identity for EACH target, with a redacted
   endpoint identifier and explicit confirmation that business/production tenants are not
   affected. Prefer an isolated disposable clone/branch. Connection strings stay outside Git/logs.
2. Existing schema fingerprint: actual current_database/current_schema/search_path, users
   key and platform enum definitions, pgcrypto/gen_random_uuid availability, existing table/
   column/index/constraint definitions. Execute this read-only preflight only under the
   exact environment's authorization. An existing incompatible table is a STOP, not a
   reason to trust CREATE TABLE IF NOT EXISTS or overwrite its data.
3. Recoverable snapshot/branch/backup identifier, timestamp, restore owner and tested or
   reviewed restoration procedure. Describe effect of rollback on newly issued invitations
   and pending publication intents; rollback must not silently delete those records.
4. Exact DDL/diff, unique registration choice, expected new objects, locks/estimated duration,
   dry-run transaction recipe, migration ledger behavior and compatibility/rollout order.
   No user backfill, email join, credentials/account updates or unrelated DDL in this packet.
5. Deployment/build/source identity of apps that will use the schema and the minimal test
   fixtures required. Do not assume a local server is serving the frozen source revision.

## Bounded proposed execution recipe (for later explicit owner approval)

- Use an explicit operator-provided connection binding for each allowlisted disposable
  target. No automatic root .env.local discovery and no fallback connection.
- Preflight must match expected target fingerprint and source artifact hashes before DDL.
- Apply only the reviewed additive schema/index changes in a transaction on that database
  with bounded lock_timeout/statement_timeout. Treat the two databases as independent
  commits; do not claim one cross-database atomic migration. Stop on unexpected objects,
  privilege/dependency mismatch, lock timeout or migration-history conflict.
- Verify actual columns, types, FK/index definitions and table ownership, not merely table
  existence. A dry-run rollback and a subsequent separately approved apply must have distinct
  observations. Never apply to all package migration histories to obtain these two tables.
- Rollback before commit is transaction rollback. After commit, prefer disabling new writes
  and restoring the agreed isolated branch/snapshot. Dropping a table containing new data
  or pending outbox intents is destructive and requires its own reviewed disposition.
- Record redacted operator/time/target identifiers, committed schema fingerprints and
  exact test/source revisions. Keep secrets out of command echoes and stored transcripts.

## Gemini physical campaign after harness repair and authorized schema availability

Use actual repository implementations or actual generated predicates, independent checked-
out connections and barriers. No stale substitute schema or hand-written weaker policy.
Create explicitly approved synthetic parent users if FK fixtures require them; no existing
real account mutation. Per case: initial state, transaction A/B, expected invariant,
affected rows, committed final state and SQLSTATE/error if any. Cases:

1. Dual invitation claim: single winner with claiming status and owner/expiry fields.
2. Expiration versus redemption: both schedule orderings, terminal state never overwritten.
3. Claim-owner expiry/replacement and wrong token: stale owner cannot redeem.
4. Competing NULL-envelope install: equal replay accepted, conflicting envelope rejected.
5. Outbox claim/owner replacement versus completion: preserve replacement; immutable envelope.
6. Domain-plus-outbox and account-plus-invitation transaction abort: no partial commit.

Require rollback/release in finally blocks, targeted synthetic-ID cleanup and cleanup
verification. Do not hide a failed connection/cleanup as passed or leave open transactions.
Every absent physical observation remains NOT_EXECUTED/BLOCKED. Real Redis/QStash testing
requires its separate working endpoint, trust/namespace and side-effect authorization.

## What is needed before execution can be approved

Argon supplies the filled prerequisite record, corrected unique migration artifacts or
exact application recipe, and compatibility/rollback plan. Gemini supplies the corrected
production-schema harness and cleanup plan. Sol reviews the concrete packet; the owner
authorizes the named UAT targets and operations. Until then only offline preparation is
approved. This is a concrete readiness dependency, not a request to stop unrelated work.
