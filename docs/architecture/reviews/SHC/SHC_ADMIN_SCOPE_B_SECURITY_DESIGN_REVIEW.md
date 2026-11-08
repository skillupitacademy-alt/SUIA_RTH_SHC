# SHC Admin Scope B — focused authorization design review

Date: 2026-11-08 (Asia/Kolkata). Reviewer: Sol architectural-review role.
Inspected clean local `main`: `86d44c1db2a54a34dfe1588995f6e26b325be35c`.
Input: owner's pasted Scope A/B alignment and the bounded proposal in section 8 of
`SHC_ADMIN_TECHNICAL_VERIFICATION_REPORT.md`. No separate revised specification file
was found in this review package; this document states the concrete reviewed contract.

**Decision: Scope B direction is CONDITIONALLY ACCEPTABLE with the mandatory design
corrections below. The older cookie-presence/layout-only examples are not approved.
Implementation requires the owner's separate Scope B authorization.** This is neither
implementation acceptance nor permission for Scope A, deployment, migrations or W4.
The existing 62-row ledger remains authoritative; its 2 PASS / 21 FAIL / 39 PENDING
states are unchanged by this design review. PSEG-001 v1.1 remains proposed.

## 1. Source-backed observations and bounded responsibility

| Source | Observation and consequence |
| --- | --- |
| `apps/skillhubcore-admin/src/proxy.ts:5-19` | API-only matcher and explicit API/origin guards. Extend page protection without replacing these branches. |
| `src/app/(admin)/layout.tsx:10-16`, `src/app/(authenticated)/layout.tsx:11-17` (under SHC app) | Both return AdminGuard → ClientShell → children; retain that structure after server authorization. |
| `src/components/auth/AdminGuard.tsx:37-44,94-107,130-205` | Client question-route development bypass, stored-role shortcut and 401/403-to-login behavior. These are not server authority. Preserve auth synchronization, lock/retry UX and shell behavior, while correcting forbidden handling within approved Scope B. |
| `src/lib/auth-helpers.ts:53-97,117-143,174-209` | Existing token cookie selection, signature verification through TokenService, exact shc-admin audience and skillhubcore brand, shared role normalization and RBAC. Reuse this policy rather than adding a second JWT or role authority. |
| `packages/auth/src/token.service.ts:407-433`; `packages/auth/src/rbac/{roles,normalize-roles,rbac.service,role-permissions}.ts` | Shared verifier checks admin token class and identity; RBAC admin level is admin/super_admin. Client's infrastructure alias is not an additional server permission grant. JWT verification alone does not check current account activity or immediate access-token revocation. |
| `apps/api-server/src/app/api/shc/auth/me/route.ts`; `src/modules/auth/shc-auth.service.ts:166-219` | Session lookup selects SHC/non-deleted identity and returns current role/isActive; logout revokes refresh tokens. Lookup does not itself reject inactive results, and its route collapses exceptions into 401. Do not assume current grant/revocation/error semantics are already complete. |
| `src/lib/admin-route-guard.ts`, `src/lib/upstream-proxy.ts` (SHC app) | Keep handler-level guards, trusted header reconstruction, permissions and mutation-origin checks. Page admission cannot replace them. |

All abbreviated `src/` paths above belong to `apps/skillhubcore-admin` unless explicitly
qualified. This review covers SHCA-U07, F02, F03 and A02; related A03/I01/I03/F24 remain
their existing unclosed criteria. No full re-audit, UI redesign or new authority framework.

## 2. Selected security boundary design

**Proxy:** use the existing Next 16 `src/proxy.ts` for early HTML/RSC/HEAD/prefetch
admission checks on actual protected URLs. Cookie existence is only a cheap rejection
check, never success. Preserve all existing API, login/logout origin and health behavior.
Do not create competing middleware.ts, skip authentication for prefetch/RSC headers, or
trust client x-user-id/x-brand/x-user-roles or arbitrary forwarded host values.

**Server policy:** one server-only principal-verification operation, reused by proxy,
protected layouts and sensitive server reads/actions with framework-specific adapters.
Resolve the actual supported runtime/import dependencies first; do not pull DB/client UI
barrels into Proxy just to reuse a helper. If extracting the existing cookie verifier,
preserve its API callers and regression behavior. Server Components read cookies using
Next's server API; API/proxy adapters read the request. No browser tokens, raw headers or
request-derived origin become a new source of authority. Never introduce guessed
getServerSession behavior from a session library not configured in this project.

**Layouts:** await the shared check, then retain the exact AdminGuard/ClientShell nesting
and existing children/context. Do not replace either layout with children alone. Client
auth synchronization, current lock/logout flow, responsive shell and navigation remain.
No new dev exception may bypass the server policy. The current client-only questions
bypass must not permit private HTML/RSC/data; remove its security effect in the bounded
implementation and test NODE_ENV=development as well as production. Stored client role,
isAdmin or a failed backend call must not override server denial.

**Data/service authority:** a successful parent layout is insufficient: nested rendering,
parallel data loading, Server Actions and reused layouts can run on different paths.
Before each sensitive server read/write/forward, verify the principal and applicable
action/brand/resource permission at the actual owning boundary. Do not start private
queries at module scope or before the check. Retain existing API guards and repository
scope predicates. Page-shell permission is not unlimited cross-brand permission. These
changes do not resolve the separate role-only brand/subtopic grant policy by assumption.

## 3. Principal, cookies and current-session contract

1. Validate signature with the supported admin verifier, exact `shc-admin` audience,
   `tokenType=admin`, `brand=skillhubcore` and nonempty verified identity claims. Require
   a valid, finite expiration and enforce nbf/expiry. Pin algorithm/issuer to the actual
   trusted SHC signing contract, not request headers or arbitrary token metadata. Current
   generation uses HS256 and skillhubcore.in; verify legitimate issued-token compatibility
   in tests before tightening accepted claims. No decode-only, generic-user-token or
   generic-admin-audience fallback.
2. Preserve documented cookie compatibility. Current code selects accessToken before
   admin_accessToken. Use one consistent selection policy for proxy/layout/API; do not
   try another cookie after a selected token fails, which could mask conflicting identity.
   Explicitly test missing/empty/identical/conflicting cookies. Changing that precedence
   or rejecting all unequal legacy cookies requires a reviewed compatibility decision,
   not a silent page-only policy divergence. Scope B must not expose token values to RSC
   payloads or logs.
3. Normalize roles through the existing policy. Current admin-level admission is admin
   or super_admin plus ADMIN_PANEL permission; do not elevate student/faculty/unknown/
   empty roles, a standalone isAdmin flag or infrastructure spelling. Test mixed role
   arrays against existing API behavior. Action permissions still apply separately.
4. Use the existing trusted SHC backend/session authority for current active account and
   grant checks when qualifying sensitive access. Bind returned identity to the verified
   principal (including the documented original/local ID mapping), require SHC platform,
   active/non-deleted account and current permitted role. Do not accept a successful HTTP
   status or hardcoded isAdmin alone. Reconcile role changes against the current grant;
   stale token roles cannot re-grant removed permissions.
5. Use an explicitly configured trusted upstream adapter/base, bounded timeout, no-store
   and typed results; do not call the same app's guarded /api/auth/me recursively from
   Proxy or derive an upstream origin from untrusted forwarding headers. No direct new
   cross-app service import or database access inside the admin layout. If the existing
   backend cannot express unavailable vs invalid or an active/revoked session reliably,
   record the exact prerequisite and obtain approval for the bounded contract correction;
   do not pretend it is satisfied or silently expand Scope B into a session redesign.
6. Existing JWT verification does not prove immediate revocation of an already issued
   access token; refresh-token revocation is a different guarantee. State the supported
   freshness/expiry policy and test it. No new session table, Redis deployment, secret
   rotation or blanket auth-service rewrite is authorized by this design. Required
   revocation/account controls remain OPEN until actual authority evidence exists.

## 4. Required outcomes, refresh and caching

| Outcome | Page behavior | API/data behavior |
| --- | --- | --- |
| Missing/invalid/expired credentials | Redirect to same-origin /login with a validated internal return target; no private payload | 401 before effects |
| Verified identity without current page/action permission | Safe access-denied outcome, distinct from login; no private payload or login loop | 403 before effects |
| Valid active authorized principal | Render existing protected shell and permitted page only | Apply action/brand/object predicates before effects |
| Backend unavailable, missing config, malformed/unconfirmed session result | Fail closed with retryable unavailable UI/status; do not render private data or declare logout | Bounded 5xx/unavailable, no invented principal |

A minimal denial UI may be added outside protected layout groups only within the
owner-approved Scope B manifest; it must not contain private data or introduce a bypass.
If a redirect is used because native forbidden status requires unconfigured framework
features, record that redirect and final safe response accurately, rather than claiming
an HTTP 403 was sent. Client useAuthSync's forbidden callback must use this distinction;
preserve unauthorized, lock and retry behavior rather than replacing AdminGuard.

Do not weaken API guards to facilitate page rendering. Do not turn server-render GET
into a session refresh mutation. The reviewed SHC app has no demonstrated local refresh
handler; access expiry may safely require reauthentication in this bounded design.
If preserving seamless refresh is a product requirement, trace and approve the actual
existing refresh endpoint/rotation/origin flow before implementation. No self-fetch or
redirect-refresh loop and no assumption that client auto-refresh can run before a server
guard denies initial rendering. Distinguish that limitation from current working login.

Private HTML/RSC/denials and session responses must not be shared cached. Read request
cookies on protected server paths, use no-store for session calls, and use request-local
memoization at most; never cache a principal across requests/users. Server role/subject
must agree with client hydration; do not serialize secrets. Test stale client state,
logout, browser back, client navigation and prefetched RSC so layout reuse cannot bypass
current sensitive-data checks. Do not make unrelated public assets uncached globally.

## 5. Complete current page coverage

Mechanical current inventory: **34 page.tsx entries, 32 under protected groups; /login
and / are outside them.** Root currently redirects to /login. All 32 protected URLs are
listed below; route groups are omitted from URLs. Map through exact match or
`pathname === prefix || pathname.startsWith(prefix + '/')`, never raw startsWith(prefix).
The /tools subtree includes all listed tools; /factory is limited to the inventoried
question-generator family unless the policy is explicitly expanded.

| Actual URL | Source page | Admission |
| --- | --- | --- |
| `/audit` | `(admin)/audit/page.tsx` | Protected SHC page |
| `/certificate-generator` | `(admin)/certificate-generator/page.tsx` | Protected SHC page |
| `/certificate-preview` | `(admin)/certificate-preview/page.tsx` | Protected SHC page |
| `/content-generation/layman-architecture` | `(admin)/content-generation/layman-architecture/page.tsx` | Protected SHC page |
| `/dashboard` | `(admin)/dashboard/page.tsx` | Protected SHC page |
| `/events` | `(admin)/events/page.tsx` | Protected SHC page |
| `/marketing` | `(admin)/marketing/page.tsx` | Protected SHC page |
| `/metrics` | `(admin)/metrics/page.tsx` | Protected SHC page |
| `/subscriptions/[id]` | `(admin)/subscriptions/[id]/page.tsx` | Protected SHC page |
| `/subscriptions` | `(admin)/subscriptions/page.tsx` | Protected SHC page |
| `/tools/project-llm/candidate-upload` | `(admin)/tools/project-llm/candidate-upload/page.tsx` | Protected SHC page |
| `/tools/project-llm/compliance-brief` | `(admin)/tools/project-llm/compliance-brief/page.tsx` | Protected SHC page |
| `/tools/project-llm/create` | `(admin)/tools/project-llm/create/page.tsx` | Protected SHC page |
| `/tools/project-llm/explorer` | `(admin)/tools/project-llm/explorer/page.tsx` | Protected SHC page |
| `/tools/project-llm/external-ai-handoff` | `(admin)/tools/project-llm/external-ai-handoff/page.tsx` | Protected SHC page |
| `/tools/project-llm/integration-certification` | `(admin)/tools/project-llm/integration-certification/page.tsx` | Protected SHC page |
| `/tools/project-llm/matrix` | `(admin)/tools/project-llm/matrix/page.tsx` | Protected SHC page |
| `/tools/project-llm/mix-match` | `(admin)/tools/project-llm/mix-match/page.tsx` | Protected SHC page |
| `/tools/project-llm` | `(admin)/tools/project-llm/page.tsx` | Protected SHC page |
| `/tools/project-llm/registry` | `(admin)/tools/project-llm/registry/page.tsx` | Protected SHC page |
| `/tools/project-llm/specification-review` | `(admin)/tools/project-llm/specification-review/page.tsx` | Protected SHC page |
| `/tools/project-llm/workflow-details` | `(admin)/tools/project-llm/workflow-details/page.tsx` | Protected SHC page |
| `/tools/tutorial-block-composer` | `(admin)/tools/tutorial-block-composer/page.tsx` | Protected SHC page |
| `/tools/tutorial-left-sidebar` | `(admin)/tools/tutorial-left-sidebar/page.tsx` | Protected SHC page |
| `/tools/tutorial-page-content` | `(admin)/tools/tutorial-page-content/page.tsx` | Protected SHC page |
| `/users/[userId]` | `(admin)/users/[userId]/page.tsx` | Protected SHC page |
| `/users` | `(admin)/users/page.tsx` | Protected SHC page |
| `/factory/question-generator` | `(authenticated)/factory/question-generator/page.tsx` | Protected SHC page |
| `/factory/question-generator/review` | `(authenticated)/factory/question-generator/review/page.tsx` | Protected SHC page |
| `/questions/[id]/edit` | `(authenticated)/questions/[id]/edit/page.tsx` | Protected SHC page |
| `/questions/new` | `(authenticated)/questions/new/page.tsx` | Protected SHC page |
| `/questions` | `(authenticated)/questions/page.tsx` | Protected SHC page |
| `/login` | `(public)/login/page.tsx` | Public login |
| `/` | `page.tsx` | Public redirect to /login |

The actual proxy matcher must remain static/analyzable under Next and retain /api
handling; generate policy coverage tests against page/group inventory so a new protected
page cannot silently omit the early check. Layout/data checks remain authoritative even
if a matcher is accidentally incomplete. Test /questions-evil and /login-extra as
distinct from /questions and /login; do not grant public status by prefix coincidence.
Exclude only required framework/public asset paths, not arbitrary extensions or caller
headers. Query parameters never select a different privilege policy.

## 6. Proposed implementation boundary (requires owner approval)

Production allowlist: existing SHC `src/proxy.ts`, both protected layouts,
`src/components/auth/AdminGuard.tsx`, and `src/lib/auth-helpers.ts` only as needed to
reuse verification; new `src/lib/server-page-auth.ts` (server-only session adapter) and
`src/lib/admin-page-policy.ts` (pure page policy); optional minimal
`src/app/(public)/forbidden/page.tsx` denial view. Preserve ClientShell and its
context/hook implementations unless a demonstrated integration defect requires a
separately identified change. Include focused tests beside these modules and HTTP/E2E
coverage in the existing SHC test structure. No broad shared-RBAC rewrite.

Sensitive server loaders/actions affected by the actual trace must be individually
named before implementation; this is not permission for wildcard route rewrites.
Changes to the backend session/error/freshness contract require their exact additional
source paths and owner approval. Current source does not establish that prerequisite
as fully satisfied. Keep Scope A separate, including its redirect-sanitizer ownership;
Scope B consumes its validated return-target behavior or supplies a bounded safe default.

## 7. Mandatory verification and rollback

- Real signed local test tokens: allowed admin/super_admin positives; invalid signature,
  expired/not-yet-valid/missing expiry, wrong key/issuer/audience/type/brand, missing
  identity, student/faculty/unknown/empty roles, mixed roles and conflicting cookies.
  Do not rely exclusively on mocked TokenService outcomes.
- Pure route classification covers all 34 pages, descendants, segment collisions,
  public/login/logout/health exceptions, malformed URLs, and no prefetch/RSC bypass.
- Production-like isolated HTTP tests for direct HTML, HEAD and RSC/prefetch requests
  across both groups; valid shell/navigation and denial-with-zero-private-effects.
  Include /audit, /events, /metrics, certificate pages and all authoring/factory families.
- Components retain ShellContext, menus and auth sync; distinct 401/403/unavailable,
  no login loop, logout/lock behavior, cold load, client transition, reload and back cache.
- Data-boundary tests deny before query/forward/action for missing, forbidden,
  inactive/deleted/currently demoted principal and dependency failure; compare current
  subject/brand; preserve action/object/field controls and origin checks.
- Re-run existing 61 security tests and static boundary tripwire, targeted typecheck/
  lint/build and relevant Scope A interactions, under proven isolation. Preserve the
  existing failed fixture diagnostic visibly; do not weaken it or claim broad green.

Record exact SHA, token-policy fixture construction (no keys), selected cases/exits,
HTML/RSC exposure checks and unexecuted dependencies. No live Hostinger/DB/provider
execution is authorized here. Implement as a dedicated Scope B commit series after
owner approval, with the pre-change SHA and exact file manifest recorded. On regression
revert that bounded series without bypass flags, deleting data or reverting unrelated
Scope A/source work. No migration or secret-state rollback is involved.

## 8. Review evidence and next decision

Independently executed on this source: `node apps/skillhubcore-admin/scripts/check-api-boundaries.mjs`
exit 0 / 80 static handlers; guarded config-free Vitest of existing admin-boundary and
upstream-proxy files, **2 files / 61 passed, exit 0**. Used the existing pre-import offline
network guard, stripped infrastructure bindings, explicit SHC/share-branding/workspace
aliases, one worker and no local-env loading. These protect existing behavior only;
no new Scope B code exists and its required tests above were NOT EXECUTED. No browser,
live SQL, gateway, deployment or source implementation occurred in this review.

Next: technical implementer incorporates this contract into the exact Scope B proposal,
including current-session/error and refresh limitations, then owner separately authorizes
the bounded manifest. Sol's design review is complete at this scope; it does not require
another 62-row audit and does not grant implementation or architecture acceptance.
