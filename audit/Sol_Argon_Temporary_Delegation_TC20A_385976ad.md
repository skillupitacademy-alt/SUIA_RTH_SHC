# Sol Decision — Temporary Critical Implementation Delegation to Argon

- **Decision by**: Sol (Claude Opus 5.5, assigned by the owner), 2026-11-06
- **Baseline**: branch `remediation/w1-2-batch-05-targeted`, HEAD `385976ad`
- **Inputs read**: `W1_W3_Sol_Decisions_And_Gemini_Review_f88fef44.md` (D5–D7), `Tera_W1_W3_Critical_Implementation_Assignment.md` (TC17, TC18, TC20), `Tera_W1_W3_Critical_Handoff.md` (L44–L57), `Gemini_W1_W3_Independent_Verification_Report.md` (FAIL-04–FAIL-06), and a source trace of `packages/marketing-site/src/lib/analytics`
- **Disclosure**: The FAIL-04 control (`brand-dedupe-control.test.ts`) came from this conversation's earlier Gemini session. Gemini must therefore re-run the acceptance tests independently, using a fresh context.

## 1. Decision

| Slice | Owner | Status |
| --- | --- | --- |
| **TC20-A** Downstream analytics state isolation by brand | **Argon** | **APPROVED; implement now** |
| TC20-A2 Analytics ingress brand authority | Argon | **Inventory only.** Edits need a separate Sol approval. |
| TC18 Recursive nested-document validation (D6) | Argon | **Inventory only.** Edits need a separate Sol approval after TC20-A is frozen. |
| TC17 Option-ID scoring contract (D5) | Argon | **Inventory only.** Edits need a separate Sol approval. Shares no files with TC18. |
| TC20-B Durable event delivery (`packages/events`, D7 claim/lease) | **Tera** | Retained |
| TC01–TC16, TC19, integration and review packet | **Tera** | Retained |

Argon edits **one slice at a time**. Read-only inventories for the next slice may run in parallel with work on the current one.

## 2. Why TC20-A is wider than two maps

The source trace shows that cross-brand contamination is not limited to `lead-scoring.ts` and `session-timeline.ts`. In `dispatchToInternalWarehouse` (`server/pipeline.ts` L151–197), every downstream store is keyed without the brand:

| Store | Key today | Effect |
| --- | --- | --- |
| `lead-scoring.ts` `scoreState` | `anonymousId` | Score 2→4 across brands (FAIL-04) |
| `session/session-timeline.ts` `timelines` (via `session-manager.ts`) | `sessionId` | Depth 1→2 across brands (FAIL-04) |
| `funnel.ts` `funnelState` | `funnelId + sessionId` | Funnel progress shared across brands |
| `identity/identity-store.ts` `identityIndex` / `identityStore` | identifier type + value | Deterministic match links identities across brands |
| `journey/timeline-engine.ts`, `attribution/touchpoint-tracker.ts`, `ai-features/feature-store.ts` | `identityId` | Inherit any cross-brand identity link. FAIL-04 shows the journey path accumulating across brands. |

`ingestAnalyticsEvent` overwrites `event.context.brandId` with the server-supplied `input.brandId` (L291–297). Inside the pipeline, that value is the brand to key by.

## 3. TC20-A allowed-file manifest

**Argon may modify only these files:**
1. `packages/marketing-site/src/lib/analytics/lead-scoring.ts`
2. `packages/marketing-site/src/lib/analytics/session/session-timeline.ts`
3. `packages/marketing-site/src/lib/analytics/session/session-manager.ts`
4. `packages/marketing-site/src/lib/analytics/funnel.ts`
5. `packages/marketing-site/src/lib/analytics/identity/identity-store.ts`
6. `packages/marketing-site/src/lib/analytics/identity/identity-resolver.ts`
7. `packages/marketing-site/src/lib/analytics/server/pipeline.ts`: **only the call sites inside `dispatchToInternalWarehouse`**, to pass the brand through. No changes to the dedupe, rate-limit, dispatch, provider or dead-letter logic.
8. `packages/marketing-site/src/index.ts`: only if an exported signature must change.
9. One **new** implementer diagnostic test file under `packages/marketing-site/src/lib/analytics/__tests__/`.

**Read-only. Isolation must be inherited through a brand-scoped identity ID:** `journey/**`, `attribution/**`, `ai-features/**`. If inheritance cannot be proved, stop and request a manifest amendment rather than editing these files.

**Must not be modified:** `__tests__/brand-dedupe-control.test.ts` (Gemini's control), `server/route.ts`, `providers/**`, `packages/events/**`, any migration, scoring, document or auth file.

## 4. Required behaviour

1. **Brand-qualified keys.** Each store in the manifest is keyed by brand plus its existing key. Use nested maps, or a single collision-free key helper, rather than naive `${brand}:${id}` concatenation.
2. **Fail closed.** A missing or unknown brand is rejected **before any state mutation**, per the D7 rule against tenant-private effects without a verified tenant. Functions that today take only `sessionId`, such as `updateSession`, `endSession`, `recordSessionInteraction` and `getSessionTimeline`, gain a required brand parameter.
3. **No unscoped aggregate getters remain exported.** `getLeadScores`, `getFunnelState` and `listIdentityNodes` either require a brand and return only that brand's data, or become internal diagnostics. No in-repo consumers exist outside the package; this was verified by `git grep` across `apps/` and `src/`.
4. **No cross-brand identity linking.** Index keys and generated identity IDs include the brand. Matching the same email, phone or userId across brands produces two separate identities. Cross-brand linking would need its own Sol decision and consent policy, and is not authorized.
5. **Same-brand continuity is preserved.** The same brand with the same session or anonymous ID continues its timeline, score, funnel and identity as it does today. Existing dedupe and retry behaviour is unchanged.
6. **Process-local only.** No persistence, migration or replay. In-memory state from before the fix is not migrated; it resets on restart. State this in the handoff.
7. **No client-trusted authority is added.** Argon must not read the brand from the event body or from headers inside these modules.

## 5. TC20-A acceptance controls (Gemini, fresh context, frozen commit)

- FAIL-04 in `brand-dedupe-control.test.ts` passes **unchanged**: the second brand has `sessionDepth` 1 and `leadScore` 2, and the existing dedupe test still passes.
- New adverse controls: funnel progress, identity (same hashed email across two brands gives two identities), journey path, features and attribution touchpoints, all isolated across brands.
- Positive controls: same-brand continuity for session, score, funnel and identity.
- Missing or unknown brand at each changed entry point is rejected with no state mutation.
- `pnpm --filter @quiz/marketing-site exec tsc --noEmit` exits 0, and the existing analytics suites pass: `marketing-intelligence`, `marketing-phase2`, `ingest-failure-behavior`, `tracker-provider-http`, `internal-http-failure`.
- Runs offline with `audit/W1_W3_Offline_Test_Network_Guard.ts` and credential variables cleared.

**Known limitation (not a TC20-A defect):** `server/route.ts` L17 reads a client-supplied `x-analytics-brand` header, and an unknown host falls back to RTH (Tera handoff L55). TC20-A stops brands from accidentally sharing state. It does **not** stop a client from deliberately writing into another brand. TC20 remains open until TC20-A2 is resolved.

## 6. Next slices: inventory deliverables required before approval

- **TC20-A2 (ingress authority):** both ingress paths (the public Next route and the collector), how the brand is derived from host or deployment configuration, unknown-host handling, and the proposed file manifest.
- **TC18 (D6):** the historical shape and consumer matrix (import, composer, delivery, membership); the four container positions; the `MAX_NESTING_DEPTH=3`, 10,000-node and 500-root boundaries; the storage-preparation example-injection site; and the exact manifest. Expected roots are `packages/types/src/tutorial-rich-document/schemas/**` and `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/**`.
- **TC17 (D5):** every option-ID, label and text producer and consumer across the editor, bulk import, API, the immediate scorer, the batch scorer (`apps/api-server/src/modules/scoring-engine/**`) and retrieval; plus the versioned ingress and legacy adapter plan. Physical regrading is **not** authorized.

## 7. Operating rules

- Work in an isolated worktree: `git worktree add .worktrees/argon-tc20a -b argon/tc20a-analytics-isolation 385976ad`.
- Commit locally, marked `IMPLEMENTED_UNVERIFIED`, with a handoff entry giving the frozen SHA, the manifest diff confirming no out-of-manifest files changed, and the commands with their exit codes.
- Preserve every failing security test. Never weaken an assertion to pass.
- Before starting each slice, check `Tera_W1_W3_Critical_Handoff.md` and `git log` for overlapping Tera work, and stop if any exists. If Tera resumes while a slice is in flight, Argon freezes it and hands it to Gemini; Tera does not edit the same files meanwhile.
- Run `graphify update .` after code changes.
- Not authorized: live databases, migrations, deployment, push, main merge, browser or queue execution, self-acceptance, or marking TC20 or any FND gate complete.

**Handoff chain:** Argon (TC20-A, frozen) → Gemini (independent controls in §5) → Sol (acceptance) → next approved slice.

