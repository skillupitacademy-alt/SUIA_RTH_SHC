# Deployment Status Matrix

Last updated: April 2, 2026

This file is the current deployment truth source for the multi-brand rollout.
It supersedes older planning assumptions in `.kiro` where those assumptions no longer match the live system.

The repo and production are now materially closer to the intended architecture:
- RTH and SkillUp public auth flows are live and largely working
- GitHub deploy and quality automation are green on the latest fixes
- Cloudflare routing for `user.*`, `admin.skillupitacademy.com`, and `faculty.skillupitacademy.com` is live
- The main remaining live gap is `placement.skillhubcore.in`
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
| Placement shared host | Live blocker remains | Returns `403`, architecture still incomplete |
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
| `placement.skillhubcore.in` | Shared placement host | Live but failing | Reaches backend contract that returns `403`; not a healthy public app yet |
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
| `https://placement.skillhubcore.in/` | Healthy public response | Still `403` |
| `https://placement.skillhubcore.in/jobs` | Healthy public response | Still `403` |

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
| 10 | Verify Cloudflare DNS | Partially completed | Core active hosts verified; route/SSL inventory still limited by token scope |
| 11 | Deploy all services | Mostly completed | Main app and gateway deploys succeeded; placement architecture still unresolved |
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

### Cloud Run assessment

| Item | Status | Notes |
|---|---|---|
| Artifact Registry / Cloud Run deploy automation | Verified | Latest deploy workflow succeeded |
| Cloud Run app health for active auth surfaces | Verified | Public checks passed |
| Cloud Run custom domain mappings | Not used as the main current pattern | Active setup is Cloudflare proxied CNAME plus worker routing where needed |
| Placement public surface | Not complete | Existing backend target is not a public placement frontend |

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
| `placement.skillhubcore.in` DNS | Verified | Proxied CNAME present, but target behavior is still wrong |
| Worker host routes for SkillUp admin/faculty | Completed | Fixed by `c34abef3` and deploy run `23887839520` |
| Worker route/SSL full inventory | Not fully verified | Current token cannot fully inspect all worker routes or SSL mode |

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
| `placement.skillhubcore.in` points at `skillhubcore-service`, not a real public placement app | Live `403`, still not go-live ready |
| Mailbox-backed verification cannot be executed from this workspace | Final Prompt 12 cannot be fully closed |
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
- [x] Latest Quality workflow succeeded
- [x] Cross-brand refresh isolation was verified

### Still open

- [ ] `placement.skillhubcore.in` must either be implemented as a real public surface or removed from the live architecture
- [ ] Mailbox-backed email receipt verification remains incomplete
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
- placement service/public host architecture
- mailbox-backed final E2E evidence
- stale-document cleanup across every older `.kiro` and `docs/` reference

## Next Actions

1. Decide whether `placement.skillhubcore.in` should be:
   a. a real frontend/service, or
   b. removed from the active go-live architecture until implemented.
2. If external audit completeness matters, use a stronger Cloudflare token to verify worker route inventory and SSL mode directly.
3. Normalize older `.kiro` and `docs/` files so they no longer contradict the active host map.
4. Close Prompt 12 only after mailbox-backed verification is performed.
