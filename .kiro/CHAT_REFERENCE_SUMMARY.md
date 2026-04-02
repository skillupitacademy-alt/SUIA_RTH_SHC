# Chat Reference Summary

This note captures the work completed in this chat and the remaining items identified from the `.kiro` specs, so the next session can resume without re-reading everything.

## Completed In This Chat

### Backend
- Week 1: brand-aware auth foundation
- Week 2: Identity Bridge, migration scripts, and multi-brand health checks
- Week 3: security testing, security fixes, OpenAPI docs, and audit trail enhancements

### Frontend
- Mapped the existing frontend apps and auth stacks
- Added SkillUp auth recovery pages:
  - `forgot-password`
  - `reset-password`
  - `verify-email`
- Verified the new SkillUp pages type-check cleanly

### Repo / Docs
- Added API docs for:
  - `api-server`
  - `skillhubcore-service`
- Added migration log handling to `.gitignore`
- Committed the backend milestones and docs milestones

## Key Findings From `.kiro`

### Active Frontend Docs
- `frontend/README.md`
- `frontend/01_DESIGN_PRINCIPLES.md`
- `frontend/02_EXISTING_ANALYSIS.md`
- `frontend/FIGMA_DESIGN_BRIEF.md`
- `frontend/INTEGRATION_SEQUENCE.md`

### Frontend Docs Still Marked `TO CREATE`
- `03_MISSING_PAGES_SPEC.md`
- `04_FIGMA_DESIGN_SPEC.md`
- `05_IMPLEMENTATION_SEQUENCE.md`
- `06_API_INTEGRATION.md`
- `07_COMPONENT_LIBRARY.md`

### Frontend Work Still Pending
- RTH user auth parity pages
- SkillUp account-management polish
- Shared brand/theme utilities
- Shared component library
- Brand-specific feature flags and portal differences
- Accessibility and responsive polish

### Future / Optional
- 2FA
- OAuth / social login
- GDPR export / delete flows

## Frontend Order Suggested In This Chat

1. Create the missing frontend spec docs
2. Add RTH user auth parity pages
3. Add SkillUp auth recovery/success pages
4. Add account locked page
5. Add session management page
6. Add profile/settings page
7. Standardize auth request helpers
8. Add shared brand/theme utilities
9. Build shared auth/component library
10. Add brand-specific feature flags and portal differences
11. Polish accessibility and responsive behavior
12. Reconcile spec vs repo naming

## Figma Note

No live Figma connector was available in this session, so the frontend work was driven from the `.kiro` docs and the existing repo structure.

## Required Reply Line

If you want, I can turn this into a week-by-week frontend plan with concrete file targets next.

## Follow-Up Note

Keep this exact line available for the next planning step:

If you want, I can turn this into a week-by-week frontend plan with concrete file targets next.

## Frontend Plan

### Week-by-Week Plan

| Week | Goal | Concrete file targets |
|---|---|---|
| Week 1 | Finish the missing auth/account flows and align the two brand portals on the same auth contract | `apps/skillup-web/src/app/forgot-password/page.tsx`, `apps/skillup-web/src/app/reset-password/page.tsx`, `apps/skillup-web/src/app/verify-email/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/signup/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/forgot-password/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/reset-password/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/verify-email/page.tsx`, shared auth helpers in `apps/realtutorialhub-quiz/src/utils/` and `apps/skillup-web/src/components/auth/` |
| Week 1 | Add missing account-management screens | `apps/realtutorialhub-quiz/src/app/(authenticated)/account-locked/page.tsx`, `apps/realtutorialhub-quiz/src/app/(authenticated)/sessions/page.tsx`, `apps/realtutorialhub-quiz/src/app/(authenticated)/settings/page.tsx`, matching `apps/skillup-web/src/app/...` equivalents where needed |
| Week 1 | Create shared frontend docs that the `.kiro` README says are still missing | `.kiro/specs/multi-brand-auth-architecture/frontend/03_MISSING_PAGES_SPEC.md`, `04_FIGMA_DESIGN_SPEC.md`, `05_IMPLEMENTATION_SEQUENCE.md`, `06_API_INTEGRATION.md`, `07_COMPONENT_LIBRARY.md` |
| Week 2 | Standardize shared theme/component primitives across brands | `packages/ui/src/` shared auth/button/input/alert/card components, brand theme utilities, `apps/realtutorialhub-quiz/src/app/layout.tsx`, `apps/skillup-web/src/app/layout.tsx` |
| Week 2 | Add brand-specific feature flags and portal differences | `packages/ui/src/utils/brandFeatures.ts`, `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/page.tsx`, `apps/skillup-web/src/app/student/page.tsx`, admin portal surfaces under `apps/realtutorialhub-admin/src/` and `apps/skillup-admin/src/` |
| Week 2 | Finish the page-level polish the spec wants | Loading/error/success states, responsive layouts, accessibility fixes in the auth and account pages above |
| Week 2 | Reconcile spec names with actual repo paths | Align `.kiro` docs that mention `apps/realtutorialhub-user` / `apps/skillup-user` to the actual repo apps `apps/realtutorialhub-quiz` and `apps/skillup-web` |

### Day-by-Day Frontend Checklist

| Day | Frontend Task | Notes |
|---|---|---|
| Day 1 | Create or refine the shared auth request helper | Unify `NEXT_PUBLIC_API_URL`, `x-portal-identity`, and `platform` handling |
| Day 2 | Finish RTH login/register parity | Match the existing SkillUp styling and auth contract |
| Day 3 | Finish RTH forgot/reset/verify pages if still missing | Reuse the SkillUp patterns where appropriate |
| Day 4 | Finish SkillUp recovery + verification UX | You already added the SkillUp pages, but this is where final polish lives |
| Day 5 | Add account locked + session management pages | These are explicitly called out in the spec as missing for both brands |
| Day 6 | Add profile/settings page and tighten auth state handling | Make the user portal account management complete |
| Day 7 | Build shared brand theme utilities and reusable components | Start moving repeated UI into `packages/ui` |
| Day 8 | Update dashboards and shared surfaces for brand-specific behavior | Faculty vs AI tutor, batch/session labels, brand-specific labels |
| Day 9 | Add accessibility and responsive fixes | Keyboard nav, focus states, labels, mobile layouts |
| Day 10 | Final integration and cleanup | Remove duplication, verify route consistency, and align docs with repo paths |

### Later / Optional

| Later | Optional / Future | Notes |
|---|---|---|
| After frontend core | Figma-driven visual refresh | Only if you want to redesign beyond the current repo patterns |
| After frontend core | 2FA UI | Not currently implemented in the backend spec work we completed |
| After frontend core | OAuth/social login UI | Also not currently implemented |
| After frontend core | GDPR flows | Future enhancement only |

## Exact Next-Step Line

If you want, I can turn this into a day-by-day implementation checklist with exact page/component names for the current repo.

## Day-By-Day Frontend Checklist

The `.kiro` frontend docs use some aspirational app names, but the current repo paths below are the concrete targets to use.

| Day | Focus | Exact current repo files |
|---|---|---|
| Day 1 | Standardize auth request behavior | `apps/realtutorialhub-quiz/src/utils/apiBase.ts`, `apps/skillup-web/src/lib/skillup-api.ts`, `packages/ui/src/lib/auth-portal.ts`, `packages/ui/src/hooks/use-auth-sync.ts` |
| Day 2 | Align RTH public auth pages with the shared auth contract | `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/signup/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/forgot-password/page.tsx`, `apps/realtutorialhub-quiz/src/app/(public)/reset-password/page.tsx` |
| Day 3 | Tighten RTH auth components and page UX | `apps/realtutorialhub-quiz/src/components/auth/AuthForms.tsx`, `apps/realtutorialhub-quiz/src/components/auth/SessionWatcher.tsx`, `apps/realtutorialhub-quiz/src/components/auth/SessionExpiryModal.tsx` |
| Day 4 | Finish SkillUp recovery and verification flow polish | `apps/skillup-web/src/app/forgot-password/page.tsx`, `apps/skillup-web/src/app/reset-password/page.tsx`, `apps/skillup-web/src/app/verify-email/page.tsx` |
| Day 5 | Align SkillUp login/register UX with the shared contract | `apps/skillup-web/src/app/login/page.tsx`, `apps/skillup-web/src/app/register/page.tsx`, `apps/skillup-web/src/components/auth/LoginForm.tsx`, `apps/skillup-web/src/components/auth/RegisterForm.tsx` |
| Day 6 | Add account-management pages | `apps/realtutorialhub-quiz/src/app/(authenticated)/profile/page.tsx`, `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/settings/page.tsx`, `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/sessions/page.tsx`, plus the matching `apps/skillup-web/src/app/...` routes where you want parity |
| Day 7 | Add account-locked UI and session-management UI | New `account-locked/page.tsx` and session-management pages in the authenticated route groups for both apps |
| Day 8 | Build the shared brand/theme primitives | `packages/ui/src/theme-store.ts`, `packages/ui/src/lib/auth-portal.ts`, new shared theme/component files under `packages/ui/src/` |
| Day 9 | Add brand-specific dashboard/portal behavior | `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/page.tsx`, `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/*.tsx`, `apps/skillup-web/src/app/student/page.tsx`, `apps/skillup-web/src/app/student/*.tsx` |
| Day 10 | Accessibility, responsive polish, and cleanup | The auth and account pages above, plus any shared components extracted into `packages/ui/src/` |

## Current-Repo Targets to Keep in Mind

- RTH public auth exists at `apps/realtutorialhub-quiz/src/app/(public)/`
- SkillUp auth exists at `apps/skillup-web/src/app/`
- Shared auth/session hooks live in `packages/ui/src/`
- The frontend docs still need the missing markdown specs listed above

If you want, I can turn this into a day-by-day implementation checklist with exact page/component names for the current repo.

## Concrete File-By-File Implementation Order

### 1. Shared auth behavior first
1. [`packages/ui/src/lib/auth-portal.ts`](/d:/onlinewebsites/quiz-platform/packages/ui/src/lib/auth-portal.ts)
2. [`packages/ui/src/hooks/use-auth-sync.ts`](/d:/onlinewebsites/quiz-platform/packages/ui/src/hooks/use-auth-sync.ts)
3. [`apps/realtutorialhub-quiz/src/utils/apiBase.ts`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/utils/apiBase.ts)
4. [`apps/skillup-web/src/lib/skillup-api.ts`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/lib/skillup-api.ts)

### 2. SkillUp auth recovery flow
1. [`apps/skillup-web/src/app/forgot-password/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/forgot-password/page.tsx)
2. [`apps/skillup-web/src/app/reset-password/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/reset-password/page.tsx)
3. [`apps/skillup-web/src/app/verify-email/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/verify-email/page.tsx)
4. [`apps/skillup-web/src/components/auth/LoginForm.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/components/auth/LoginForm.tsx)
5. [`apps/skillup-web/src/components/auth/RegisterForm.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/components/auth/RegisterForm.tsx)

### 3. RTH auth parity
1. [`apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx)
2. [`apps/realtutorialhub-quiz/src/app/(public)/signup/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(public)/signup/page.tsx)
3. [`apps/realtutorialhub-quiz/src/app/(public)/forgot-password/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(public)/forgot-password/page.tsx)
4. [`apps/realtutorialhub-quiz/src/app/(public)/reset-password/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(public)/reset-password/page.tsx)
5. [`apps/realtutorialhub-quiz/src/components/auth/AuthForms.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/components/auth/AuthForms.tsx)

### 4. Account management pages
1. [`apps/realtutorialhub-quiz/src/app/(authenticated)/profile/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(authenticated)/profile/page.tsx)
2. [`apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/settings/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/settings/page.tsx)
3. [`apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/sessions/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/sessions/page.tsx)
4. Create matching SkillUp pages under [`apps/skillup-web/src/app/`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/)
5. Add account-locked pages for both apps

### 5. Shared theme / component system
1. [`packages/ui/src/theme-store.ts`](/d:/onlinewebsites/quiz-platform/packages/ui/src/theme-store.ts)
2. Add shared brand/theme utilities in [`packages/ui/src/`](/d:/onlinewebsites/quiz-platform/packages/ui/src/)
3. Extract repeated auth UI into shared components in [`packages/ui/src/`](/d:/onlinewebsites/quiz-platform/packages/ui/src/)

### 6. Brand-specific portal behavior
1. [`apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/page.tsx)
2. [`apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/*.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/)
3. [`apps/skillup-web/src/app/student/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/student/page.tsx)
4. [`apps/skillup-web/src/app/student/*.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/student/)
5. Align faculty vs AI tutor presentation and shared service labels

### 7. Docs and spec cleanup
1. Create the missing frontend docs in `.kiro/specs/multi-brand-auth-architecture/frontend/`
2. Reconcile aspirational spec names with the current repo naming
3. Keep this reference note updated as frontend files are added

## Practical Start Point

If you want the shortest path, start with:
1. `packages/ui/src/lib/auth-portal.ts`
2. `packages/ui/src/hooks/use-auth-sync.ts`
3. `apps/skillup-web/src/app/forgot-password/page.tsx`
4. `apps/skillup-web/src/app/reset-password/page.tsx`
5. `apps/skillup-web/src/app/verify-email/page.tsx`
6. `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx`
7. `apps/realtutorialhub-quiz/src/app/(public)/signup/page.tsx`
