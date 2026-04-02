# Deployment Status Matrix

Last updated: April 2, 2026

This file is the current deployment truth source for the multi-brand rollout.
It supersedes older planning assumptions in `.kiro` where those assumptions no longer match the live system.

The repo and production are now materially closer to the intended architecture:
- RTH and SkillUp public auth flows are live and largely working
- GitHub deploy automation is green on the latest fixes; the newest placement lint repair is in flight
- Cloudflare routing for `user.*`, `admin.skillupitacademy.com`, and `faculty.skillupitacademy.com` is live
- `placement.skillhubcore.in` now serves the shared placement frontend
- Full mailbox-backed end-to-end verification is still incomplete because inbox access is not available from this workspace

## Canonical April 2, 2026 Status

### Latest production-changing commits on `main`

| Commit | Status | Purpose |
|---|---|---|
| `4a7ef74b` | Live | Brand-bound audit logging |
| `d9e18637` | Live | Original-host brand routing |
| `80b5583b` | Live | Relation-free brand auth lookups |
| `fc84675c` | Live | Explicit `platform` support in auth routes |
| `765dbe97` | Live | Original-host cookie scoping |
| `d5dfe51e` | Live | CSRF cookie domain alignment |
| `52ec2de8` | Live | Restore RTH public login and stabilize quality tests |
| `c34abef3` | Live | Add SkillUp admin/faculty gateway host routes |
| `635e2d22` | Live | Add shared SkillHub placement app |
| `af18625b` | Live | Wire shared apply flow and SkillUp placement redirects |
| `957aac0d` | Pushed, CI running | Add ESLint config for the new placement app |

### Latest verified GitHub runs

| Run | Type | Status | Notes |
|---|---|---|---|
| `23887313090` | Deploy Cloud Run Apps | Success | Deployed updated app stack for latest auth/public-host fixes |
| `23887313095` | Quality | Success | `type-check`, `lint`, `test`, `build`, `e2e-smoke`, and `bundle-check` all passed |
| `23887839520` | Deploy API Gateway | Success | Published worker route fix for SkillUp admin/faculty custom hosts |

## Executive Summary

| Area | Current state | Result |
|---|---|---|
| Multi-brand auth API | Verified live | Working for both brands |
| Signup shadow-user sync | Verified live | Working for both brands |
| Refresh token creation | Verified live | Working for both brands |
| Verify-email | Verified live | Working for both brands with correct redirects |
| Forgot-password | Verified live | Working for both brands |
| Reset-password | Verified live | Working for both brands |
| RTH public login host | Verified live | Fixed, now returns `200` |
| SkillUp public login host | Verified live | Returns `200` |
| SkillUp admin host | Verified live | Fixed, now returns `200` |
| SkillUp faculty host | Verified live | Fixed, now returns `200` |
| Cross-brand refresh isolation | Verified live | Working, no cross-brand auth leakage |
| Placement shared host | Verified live | Returns `200` and serves shared frontend |
| Placement first-pass apply persistence | Implemented in repo | Shared apply route writes to `placement_prod`; deeper E2E still pending |
| Mailbox-backed E2E | Incomplete | Inbox access unavailable here |

## Canonical Host Map

This is the host map that currently matches the repo and live production more closely than older `.kiro` references.

| Host | Purpose | Live status | Current routing |
|---|---|---|---|
| `user.realtutorialhub.com` | RTH user portal | Live, verified | Cloudflare proxied CNAME to `realtutorialhub-web`; public login fixed |
| `admin.realtutorialhub.com` | RTH admin portal | Live, verified | Worker-backed/admin app reachable |
| `api.realtutorialhub.com` | RTH auth/API edge | Live, verified | Cloudflare Worker route |
| `user.skillupitacademy.com` | SkillUp user portal | Live, verified | Cloudflare proxied CNAME to `skillup-web` |
| `admin.skillupitacademy.com` | SkillUp admin portal | Live, verified | Cloudflare Worker route fixed on April 2 |
| `faculty.skillupitacademy.com` | SkillUp faculty portal | Live, verified | Cloudflare Worker route fixed on April 2 |
| `api.skillupitacademy.com` | SkillUp auth/API edge | Live, verified | Cloudflare Worker route |
| `quiz.skillhubcore.in` | Shared quiz engine | Live, verified | Worker-backed/shared frontend |
| `tutorial.skillhubcore.in` | Shared tutorial engine | Live, verified | Worker-backed/shared frontend |
| `placement.skillhubcore.in` | Shared placement host | Live, verified | Worker-backed/shared placement frontend on `skillhub-placement` |
| `api.skillhubcore.in` | Shared SkillHub API edge | Live, partially verified | Worker route present |
| `admin.skillhubcore.in` | SkillHub super admin | Live, verified | Cloud Run/custom host reachable |

## Verified Live Checks

### HTTP checks confirmed on April 2, 2026

| URL | Expected | Actual |
|---|---|---|
| `https://api.realtutorialhub.com/api/auth/signup` | `200` | Verified |
| `https://api.skillupitacademy.com/api/auth/signup` | `200` | Verified |
| `https://api.realtutorialhub.com/api/health/live` | `200` | Verified |
| `https://user.realtutorialhub.com/login` | `200` | Verified after `52ec2de8` deploy |
| `https://user.skillupitacademy.com/login` | `200` | Verified |
| `https://admin.skillupitacademy.com/` | `200` | Verified after `c34abef3` gateway deploy |
| `https://admin.skillupitacademy.com/login` | `200` | Verified after `c34abef3` gateway deploy |
| `https://faculty.skillupitacademy.com/` | `200` | Verified after `c34abef3` gateway deploy |
| `https://faculty.skillupitacademy.com/login` | `200` | Verified after `c34abef3` gateway deploy |
| `https://quiz.skillhubcore.in/` | `200` | Verified |
| `https://tutorial.skillhubcore.in/` | `200` | Verified |
| `https://placement.skillhubcore.in/` | `200` | Verified |
| `https://placement.skillhubcore.in/api/healthz` | `200` | Verified |
| `https://placement.skillhubcore.in/?brand=realtutorialhub` | `200` | Verified |

### Authentication behavior confirmed live

- `signup` returns `200` for both brands
- shadow users are created in `people_prod` for both brands
- `refresh_tokens` are created for both brands
- verify-email works for both brands and returns the correct redirect URLs
- forgot-password works for both brands
- reset-password works for both brands
- RTH login sets cookies on `.realtutorialhub.com`
- SkillUp login works when `platform: "skillup"` is present and refresh works on that brand
- cross-brand refresh with an RTH cookie jar against SkillUp does not authenticate

## Prompt Completion Matrix

This section reconciles `.kiro/AI_PROMPTS_TO_COMPLETE_TASKS.md` with the current repo and live state.

| Prompt | Task | Current status | Notes |
|---|---|---|---|
| 1 | Fix Cloudflare token | Completed | Current token in `.env.local` verifies successfully |
| 2 | Add missing env vars | Completed | Requested vars are already present locally |
| 3 | Brand-specific email templates | Completed in repo | Email service is already brand-aware |
| 4 | Brand-aware email verification | Completed in repo and live | Correct per-brand redirects verified |
| 5 | Brand-aware password reset | Completed in repo and live | Correct per-brand reset flows verified |
| 6 | RBAC brand isolation | Completed in repo | `requirePlatform()` already exists |
| 7 | Account lockout brand tracking | Completed in repo | Brand-aware lockout wiring already exists |
| 8 | Session management endpoints | Completed in repo | Brand-aware session endpoints exist |
| 9 | Wire identity bridge to signup | Completed in repo and live | Shadow-user sync already wired and observed live |
| 10 | Verify Cloudflare DNS | Mostly completed | Active production hosts verified; old `quiz/notes/app` student hosts no longer resolve |
| 11 | Deploy all services | Mostly completed | Main app and gateway deploys succeeded; latest placement lint repair is still running through CI |
| 12 | Full end-to-end auth testing | Partially completed | API/browser checks done; mailbox-dependent checks still incomplete |

## GCP / Cloud Run Status

### Current Cloud Run services observed in `asia-south1`

| Service | Status | Notes |
|---|---|---|
| `quiz-api-server` | Live | Current revision observed |
| `quiz-web-app` | Live | Current revision observed |
| `quiz-admin-app` | Live | Current revision observed |
| `realtutorialhub-web` | Live | Current revision observed; public login fix deployed |
| `skillup-web` | Live | Current revision observed |
| `skillup-admin` | Live | Current revision observed |
| `faculty-app` | Live | Current revision observed |
| `skillhubcore-admin` | Live | Current revision observed |
| `skillhubcore-service` | Live | Current revision observed |
| `skillhub-placement` | Live | Current revision observed; placement host serves through gateway |

### Cloud Run assessment

| Item | Status | Notes |
|---|---|---|
| Artifact Registry / Cloud Run deploy automation | Verified | Latest deploy workflow succeeded |
| Cloud Run app health for active auth surfaces | Verified | Public checks passed |
| Cloud Run custom domain mappings | Not used as the main current pattern | Active setup is Cloudflare proxied CNAME plus worker routing where needed |
| Placement public surface | Verified live | Shared frontend now deployed and reachable |

## Cloudflare / Worker / DNS Status

### Current DNS/edge findings

| Item | Status | Notes |
|---|---|---|
| `user.realtutorialhub.com` DNS | Verified | Proxied CNAME to `realtutorialhub-web-...a.run.app` |
| `api.realtutorialhub.com` DNS | Verified | Proxied CNAME to worker dev hostname |
| `user.skillupitacademy.com` DNS | Verified | Proxied CNAME to `skillup-web-...a.run.app` |
| `admin.skillupitacademy.com` DNS | Verified | Proxied CNAME to `skillup-admin-...a.run.app`; worker host route now active |
| `faculty.skillupitacademy.com` DNS | Verified | Proxied CNAME to `faculty-app-...a.run.app`; worker host route now active |
| `api.skillupitacademy.com` DNS | Verified | Proxied CNAME to worker dev hostname |
| `admin.skillhubcore.in` DNS | Verified | Proxied CNAME to `skillhubcore-admin-...a.run.app` |
| `quiz.skillhubcore.in` DNS | Verified | Proxied CNAME present |
| `tutorial.skillhubcore.in` DNS | Verified | Proxied CNAME present |
| `placement.skillhubcore.in` DNS | Verified | Proxied CNAME exists; live host now serves the shared placement frontend through the gateway |
| Worker host routes for SkillUp admin/faculty | Completed | Fixed by `c34abef3` and deploy run `23887839520` |
| Cloudflare token validity | Verified | `.env.local` token verifies successfully and can read zone/DNS inventory |
| SSL mode direct audit | Not fully verified | Current token can read DNS but returned `403` on direct zone SSL setting queries |
| Worker route full inventory | Not fully verified | Current token is not sufficient for full account-level worker route audit |

### Active worker route configuration in repo

Current `services/api-gateway/wrangler.toml` production routes cover:
- `user.realtutorialhub.com/*`
- `user.skillupitacademy.com/*`
- `admin.skillupitacademy.com/*`
- `faculty.skillupitacademy.com/*`
- `api.realtutorialhub.com/*`
- `api.skillupitacademy.com/*`
- `api.skillhubcore.in/*`
- `quiz.skillhubcore.in/*`
- `tutorial.skillhubcore.in/*`
- `placement.skillhubcore.in/*`

## Repo Implementation Status

### Items now completed in code

| Area | Status | Notes |
|---|---|---|
| Brand-specific email templates | Done | Present in `apps/api-server` |
| Brand-aware signup verification | Done | Present in `signup.service.ts` |
| Brand-aware password reset | Done | Present in `password-recovery.service.ts` |
| Brand-aware security lockout tracking | Done | Present in `security.service.ts` |
| Brand-isolated RBAC middleware | Done | `requirePlatform()` exists |
| Brand-aware session endpoints | Done | Present in `services/skillhubcore-service` |
| Identity bridge wiring | Done | Signup flow already syncs shadow users |
| RTH public login route | Done | Fixed in `apps/realtutorialhub-web` and deployed |
| Quality test stabilization | Done | Latest Quality run fully green |

### Remaining repo/architecture gaps

| Gap | Impact |
|---|---|
| Mailbox-backed verification cannot be executed from this workspace | Final Prompt 12 cannot be fully closed |
| Shared placement cross-domain session handoff is still incomplete | Deep authenticated placement workflow is not fully closed |
| Older `.kiro` and `docs/` references still mention retired or superseded hostnames | Documentation drift remains |
| Full Cloudflare route and SSL inventory is limited by current token permissions | External cleanup is not fully proven |

## Stale Architecture and Documentation Drift

These names still appear widely in historical docs but do not reflect the active April 2 rollout shape:

| Older hostname/reference | Current reality |
|---|---|
| `quiz.realtutorialhub.com` as the main RTH user auth host | Replaced operationally by `user.realtutorialhub.com` for the current multi-brand public auth flow |
| `notes.realtutorialhub.com` as the main RTH tutorial host | Current active public flow centers on `user.realtutorialhub.com` |
| `app.skillupitacademy.com` as the SkillUp student host | Replaced operationally by `user.skillupitacademy.com` |

Use this file as the normalization layer until the older docs are cleaned up.

## Final Go-Live Gate

### Completed

- [x] Main auth/API flows work in production for both brands
- [x] RTH public browser login host is fixed
- [x] SkillUp public browser login host is healthy
- [x] SkillUp admin and faculty hosts are healthy
- [x] Latest deploy workflows succeeded
- [x] Placement public host is serving live
- [x] Cross-brand refresh isolation was verified

### Still open

- [ ] Mailbox-backed email receipt verification remains incomplete
- [ ] Placement shared-host authenticated session handoff needs a deeper live smoke
- [ ] Newest placement CI rerun (`957aac0d`) should finish green
- [ ] Full Cloudflare stale-route / SSL cleanup still needs higher-permission verification if strict external audit is required
- [ ] Older stale docs should be normalized to the current host map

## Practical Conclusion

The multi-brand auth pass is no longer in a broad “planning” state.
It is now in a narrow “final cleanup” state.

What is effectively complete:
- brand-aware auth
- brand-aware recovery and verification
- identity bridge wiring
- public host fixes
- gateway route fixes
- deploy automation
- CI quality gate

What is not fully complete:
- mailbox-backed final E2E evidence
- placement shared-host authenticated session handoff and deeper workflow smoke
- stale-document cleanup across every older `.kiro` and `docs/` reference

## Next Actions

1. Let the `957aac0d` placement CI rerun finish and confirm `Quality` is green again.
2. Do a deeper authenticated smoke on `placement.skillhubcore.in` beyond anonymous page loads.
3. If external audit completeness matters, use a stronger Cloudflare token to verify worker route inventory and SSL mode directly.
4. Normalize older `.kiro` and `docs/` files so they no longer contradict the active host map.
5. Close Prompt 12 only after mailbox-backed verification is performed.

## Appendix: Current Repo Delta After April 2 Verification

This appendix captures repo changes verified after the main body of this file was written.
Use it to avoid re-opening already-closed placement questions from older sections above.

### Placement Repo Delta

The repo no longer matches the earlier statement that shared placement is entirely missing.

Verified now in code:
- `apps/skillhub-placement` exists as a real Next.js shared frontend
- `services/api-gateway/wrangler.toml` includes `PLACEMENT_URL`
- `services/api-gateway/src/routes/routing-table.ts` routes `placement.skillhubcore.in/*` to `PLACEMENT_URL`
- `apps/skillhub-placement/src/lib/placement-data.ts` reads from `placement_prod` through `@quiz/db-placement`
- `apps/skillup-web/src/app/student/placement/page.tsx` now redirects users to `https://placement.skillhubcore.in/?brand=skillup`

### Placement Status Reclassification

Update the interpretation of the placement gap as follows:

| Area | Earlier April 2 assessment | Current repo assessment |
|---|---|---|
| Shared placement frontend | Missing / not a real app | Present in repo |
| Gateway routing for placement host | Assumed wrong target | Present in repo config |
| SkillUp student placement migration | Still brand-locked | Redirect-based migration now present in repo |
| Placement application flow | Placeholder only | First shared-host persistence pass now implemented in repo |
| Cross-domain placement auth/session handoff | Incomplete | Still incomplete |

### What Still Remains Open For Placement

- verify the new shared-host application persistence flow against live deployment
- complete the remaining end-to-end placement workflow beyond first-pass application capture
- finish cross-domain session handoff / callback behavior for `.skillhubcore.in`
- normalize this file's earlier placement references once live verification is re-run

### Placement Progress Note After Shared Apply Flow

The repo now includes a first working shared placement application path:
- job browsing on `apps/skillhub-placement`
- brand-aware routing between landing, detail, and apply pages
- shared-host application insert into `placement_prod`
- duplicate-application prevention for the same user and listing
- applied-state rendering back on the shared apply screen

This reduces the remaining placement gap from "missing host/app" to "live verification and deeper workflow completion".

## Appendix: Live Verification Update After Placement Recovery

This appendix records the live recovery work completed after the earlier April 2 matrix was written.

### Cloudflare Token Status

The `.env.local` Cloudflare API token is no longer invalid.

Verified live:
- token verification succeeded against `https://api.cloudflare.com/client/v4/user/tokens/verify`
- account worker inventory could be queried successfully

### Placement Recovery Actions Performed

Completed during this pass:
- built `apps/skillhub-placement`
- fixed `pnpm-lock.yaml` so the placement app is represented in the workspace lockfile
- built and pushed the `skillhub-placement` container through Cloud Build
- deployed Cloud Run service `skillhub-placement`
- updated GitHub secret `PLACEMENT_URL` to `https://skillhub-placement-plldp3atca-el.a.run.app`
- redeployed the API gateway from GitHub
- deployed the current local gateway bundle directly with Wrangler using the valid Cloudflare token

### Live Placement Results

| URL | Earlier status | Current live status |
|---|---|---|
| `https://placement.skillhubcore.in/` | `403` | `200` and serves the shared placement frontend |
| `https://placement.skillhubcore.in/api/healthz` | `403` | `200` |
| `https://placement.skillhubcore.in/?brand=realtutorialhub` | Not verified | `200` with RTH branding confirmed |
| `https://placement.skillhubcore.in/jobs` | Expected healthy public response in older docs | `404`; this path is not the canonical landing route in the current app |

### Placement Host Reclassification

Update the placement host classification from:
- live blocker

to:
- live and serving the shared frontend

Remaining placement scope is now:
- authenticated end-to-end placement workflow depth
- cross-domain callback/session handoff
- optional cleanup of stale Cloudflare worker artifacts

### Cloudflare Cleanup Note

The Cloudflare account still contains a legacy worker `quiz-platform-proxy` with wildcard route `*skillhubcore.in/*`.
It is no longer the active blocker for placement after the current gateway deployment, but it remains stale infrastructure and should be removed when route-management permissions are available.
