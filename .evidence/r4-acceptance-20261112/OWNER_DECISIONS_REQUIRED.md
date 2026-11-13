# R4 decisions supported by reproduced runtime failures

Update on 13 November 2026. The owner approved both minimal correction scopes in this chat. This file retains the original reproduced findings and proposals. Current implementation inventory and results are in `APPROVED_CORRECTION_INVENTORY.md`, `gateway-device-binding-results.json` and `hierarchy-remote-results.json`.

13 November 2026. Current committed baseline was `bf1e39bc2d59e779a72629a28e7c55cf3b733492` when these probes were reconciled. R4 source corrections continue in the working tree.

## Individual device access-token revocation

The real two-device probe in `device-replay-before.json` logs in a synthetic RTH learner twice, logs device A out, removes A's refresh cookie and replays its original access token while device B stays active. A's profile request returns HTTP 200. Device B also remains authorized. Cleanup of the synthetic learner and both sessions was verified.

The existing identity handler accepts an access-only request when that user has any active refresh session. The access JWT contains no persisted per-session binding. The previous Scope B disclosures left individual stateless access-token revocation for an owner architecture decision. R4's existing refresh-pair correction rejects the revoked pair and preserves other devices, but the access-only fallback leaves this reproduced gap.

### Minimal proposed decision

For the two learner web applications, require the existing issued refresh cookie alongside the access cookie on private browser requests. The current login issues both and all 56 real lifecycle checks use those credentials. Validate that exact owner's persisted refresh record through the existing identity handler. Tokenless trusted service calls retain their authenticated service contract.

The proposed change would update `currentLearnerSession.ts`, the canonical `/api/auth/me` fallback and the browser/JWT path of `getAuthContext`. Protected backend session-management routes also need the same current-session admission. Test missing and different refresh cookies, device logout, surviving device B, rotation, expiry, current roles and authorized web workflows. Bearer/access-only integrations require an explicit owner disposition before their contract changes.

A different decision can bind issued access JWTs to existing persisted session identities. That affects issuance, refresh, verification and compatibility with older tokens. No new session-binding policy or migration has been approved by this review.

**Owner decision required before claiming complete per-device revocation.** The failing probe remains visible.

## MainDB/TutorialDB concurrent writer coordination

The opt-in `r4-remote-hierarchy.integration.test.ts` ran nine real PostgreSQL tests. Eight passed. The ninth began a TutorialDB transaction inserting a synthetic sidebar, then called the production MainDB topic deletion service before committing the sidebar. The service returned 200, the MainDB topic disappeared and the TutorialDB sidebar subsequently committed. Both records belonged to the run and cleanup was verified.

MainDB `FOR UPDATE` cannot observe or lock that uncommitted write in the other physical database. Existing fail-closed preflight protects completed dependencies and outages, which the eight passing scenarios verified. It does not serialize independently committing TutorialDB writers.

### Minimal proposed coordination design

Use the existing authoritative MainDB topic/subtopic rows as the coordination point. Every canonical TutorialDB writer takes the corresponding MainDB parent lock before validating hierarchy and holds it through the TutorialDB transaction. Deletion holds its existing exclusive parent lock, checks dependencies after acquiring it, and commits its MainDB deletion before releasing it. Acquire multiple locks in deterministic hierarchy/UUID order and preserve the current action-level SHC permissions.

Before implementing, map every active writer, including the sidebar persistence transaction, composer create/update paths and any active jobs/imports. A partial lock convention cannot guarantee integrity. Existing dependencies must remain intact, and failed TutorialDB writes must leave the MainDB hierarchy intact. Test both ordering directions, retained/deleted dependencies, timeouts, transaction rollback and direct database maintenance procedures.

This convention coordinates application writers through a common parent lock. A guarantee covering arbitrary direct SQL writers across both databases requires stronger database or distributed coordination and a separate design decision. No schema changes or deployment are authorized here.

**Owner decision required for the agreed writer-coordination boundary and implementation scope.** The failing race probe remains an acceptance blocker.
