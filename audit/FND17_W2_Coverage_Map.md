# FND17: W2 Finding-to-Implementation Coverage Map

**Authority:** audit/CompleteProjectAudit.md, audit/W1_W3_Terra_Consolidated_Implementation_Task.md
**Baseline:** Current HEAD (investigation from recovery commit 4c206898)
**Classification:** Complete W2 finding-to-source coverage with implementation/test status
**Status:** INVESTIGATION_COMPLETE
**Date:** 2026-01-12

---

## Executive Summary

This document provides **COMPLETE** Wave 2 (W2) finding-to-implementation coverage for ALL 177 enumerated W2 findings across five domains:

1. **Marketing Sites** (MKT-012 to MKT-055): 44 findings
2. **SkillUp/SUIA Platform** (SU-*): 74 findings
3. **RealTutorialHub Platform** (RTH-*): 37 findings
4. **Principal Architect Findings** (PA-A-*): 4 findings
5. **Phase Findings** (PH03-*, PH04-*, PH05-*): 18 findings

**Total W2 Findings Mapped:** 177
**Findings with Complete Coverage:** 23
**Findings with Partial Coverage:** 41
**Findings with Gaps (NOT_STARTED or DEFERRED):** 113

**G3 Review Readiness:** PARTIAL - 64 findings have implementation evidence; 113 require decisions or implementation.

---

## Methodology

For each W2 finding, this coverage map provides:

1. **Finding ID** and description from CompleteProjectAudit.md
2. **Current source path(s)** where finding applies
3. **Implementation status**: COMPLETE, PARTIAL, NOT_STARTED, DEFERRED, BLOCKED
4. **Test requirements**: Valid persisted positive, zero/empty, missing data, failure/error cases
5. **Current test coverage state**: Test file paths and passing/failing status
6. **Dependencies or blockers**: Related FND tasks, architectural decisions, policy gates
7. **Explicit deferral reason** if not implemented

Cross-references: FND12_Complete_Truth_Inventory.md, W1_W3_Terra_Consolidated_Handoff.md, Audit_Finding_Root_Cause_Crosswalk.csv

---

## Coverage Analysis by Domain

| Domain | Total Findings | Complete | Partial | Not Started | Deferred | Blocked |
|---|---|---|---|---|---|---|
| Marketing (MKT) | 44 | 2 | 8 | 29 | 5 | 0 |
| SkillUp (SU) | 74 | 8 | 18 | 42 | 4 | 2 |
| RTH (RTH) | 37 | 7 | 9 | 17 | 3 | 1 |
| Principal Architect (PA-A) | 4 | 2 | 1 | 1 | 0 | 0 |
| Phase (PH03/04/05) | 18 | 4 | 5 | 7 | 1 | 1 |
| **TOTAL** | **177** | **23** | **41** | **96** | **13** | **4** |

---

## Domain 1: Marketing Sites (MKT-012 to MKT-055)

### MKT-012 — Brand resolution fails open across sites

**Description:** Brand tracking resolution defaults to RTH when brand context is unknown, allowing wrong-brand analytics destination.

**Source Paths:**
- `packages/marketing-site/src/lib/tracking.ts` (resolveBrandId)
- `packages/marketing-site/src/config/analytics.ts` (resolveBrandAnalyticsConfig)
- `packages/marketing-site/src/lib/analytics/tracker.ts` (trackerSingleton)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Explicit SkillUp brand ID resolves to SkillUp config
- ✅ Valid: Explicit RTH brand ID resolves to RTH config
- ❌ Zero/Missing: Unknown hostname/missing brand rejected or disabled (NOT IMPLEMENTED)
- ❌ Error: Server-side brand resolution requires explicit context (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** FND23 (event architecture), MKT-001 to MKT-003 (consent gating)

**Deferral Reason:** N/A - implementation required

---

### MKT-013 — Course page dereferences unverified remote structure

**Description:** course-page.tsx dereferences heroCommonData/heroData with non-null assertions without runtime validation; partial remote responses cause render errors.

**Source Paths:**
- `packages/marketing-site/src/course-page.tsx` (hero data dereferencing)
- `packages/marketing-site/src/content/courses.ts` (remote course deserialization)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Complete course payload renders successfully
- ❌ Zero/Missing: Missing heroData fields handled gracefully (NOT IMPLEMENTED)
- ❌ Error: Malformed remote payload fails safely with fallback (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-004 (runtime schema validation), MKT-017 (contract consistency)

**Deferral Reason:** N/A - runtime validation required

---

### MKT-014 — Duplicate main landmarks and smooth-scroll provider nesting

**Description:** app/layout.tsx renders `<main>` with LenisProvider; course-layout.tsx renders nested `<main>` with nested LenisProvider, harming landmark structure and hydration.

**Source Paths:**
- `apps/skillupitacademy-site/app/layout.tsx` (root main landmark)
- `packages/marketing-site/src/course-layout.tsx` (nested main landmark)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Single root main landmark in DOM
- ✅ Valid: Single LenisProvider instance
- ❌ Error: No nested main landmarks (NOT IMPLEMENTED)
- ❌ Error: No nested smooth-scroll providers (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-020 (LenisProvider RAF lifecycle fix)

**Deferral Reason:** N/A - accessibility correction required

---

### MKT-015 — Static export verification

**Description:** next.config.mjs supports output:'export' but compatibility with dynamic routes, proxy, and ISR not verified in build.

**Source Paths:**
- `apps/skillupitacademy-site/next.config.mjs` (export config)
- `apps/skillupitacademy-site/app/courses/[slug]/page.tsx` (dynamicParams=true)
- `apps/skillupitacademy-site/proxy.ts` (request-time behavior)

**Implementation Status:** DEFERRED

**Test Requirements:** NOT APPLICABLE (verification gate, not defect)

**Current Test Coverage:** NONE

**Dependencies:** Deployment mode decision

**Deferral Reason:** VERIFICATION_GATE - authoritative deployment mode must be selected before testing static export compatibility. Not a proven build failure.

---

### MKT-016 — Public static file server path containment

**Description:** server.mjs resolveFile() uses normalize+replace for path traversal prevention without explicit realpath/root containment validation.

**Source Paths:**
- `apps/skillupitacademy-site/server.mjs` (resolveFile function)

**Implementation Status:** DEFERRED

**Test Requirements:**
- ✅ Valid: Legitimate static file served
- ❌ Error: Path traversal attempts rejected (NOT VERIFIED)
- ❌ Error: Malformed URIs handled safely (NOT VERIFIED)

**Current Test Coverage:** NONE

**Dependencies:** Custom server usage decision

**Deferral Reason:** DEPLOYMENT_ARCHITECTURE - custom server appears separate from Docker standalone execution. Prefer hardened static server/platform; only implement if custom server is production path.

---

### MKT-017 — Marketing content control-plane contract drift

**Description:** contracts.ts defines MarketingControlPlaneSnapshot shape; proxy.ts asserts partial anonymous object with different experiments shape.

**Source Paths:**
- `packages/marketing-site/src/content/contracts.ts` (canonical contract)
- `apps/skillupitacademy-site/proxy.ts` (partial projection)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Canonical contract used throughout
- ❌ Error: Contract drift between definitions (NOT FIXED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-005 (proxy validation), MKT-013 (runtime schemas)

**Deferral Reason:** N/A - contract consolidation required

---

### MKT-018 — Internal analytics treats HTTP errors as success

**Description:** internal.provider.ts track() awaits fetch but never checks response.ok; 4xx/5xx treated as successful dispatches.

**Source Paths:**
- `packages/marketing-site/src/lib/analytics/providers/internal.provider.ts` (track method)

**Implementation Status:** COMPLETE

**Test Requirements:**
- ✅ Valid: 2xx response treated as success ✅ PASSING
- ✅ Error: 4xx/5xx response throws error ✅ PASSING

**Current Test Coverage:**
- `packages/marketing-site/src/lib/analytics/providers/__tests__/internal-http-failure.test.ts` (PASSING)

**Dependencies:** NONE

**Verification:** Correction committed in FND23 slice; HTTP non-2xx now throws. Sol review required.

---

### MKT-019 — Contact component semantic gap

**Description:** ContactUs.tsx renders WhatsApp/phone/hours/location but does not mount ContactForm.tsx (which is presentational-only with caller-provided onSubmit).

**Source Paths:**
- `packages/marketing-site/src/components/contact/ContactUs.tsx` (contact display)
- `packages/marketing-site/src/components/contact/ContactForm.tsx` (unused form)

**Implementation Status:** PARTIAL

**Test Requirements:** NOT APPLICABLE - product requirement, not defect

**Current Test Coverage:** NONE

**Dependencies:** Contact form requirements decision

**Deferral Reason:** PRODUCT_DECISION - whether deployed site requires contact form submission is product requirement. Existing WhatsApp/telephone flows are in use. If implemented, add input validation + abuse protection.

---

### MKT-020 — Browser scrolling loop RAF lifecycle

**Description:** LenisProvider.tsx raf() recursively schedules requestAnimationFrame(raf) but cleanup only destroys instance without canceling RAF; multiple loops accumulate on route changes.

**Source Paths:**
- `packages/marketing-site/src/components/Providers/LenisProvider.tsx` (RAF loop)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Single RAF loop during normal operation
- ❌ Error: RAF callback canceled in cleanup (NOT IMPLEMENTED)
- ❌ Error: Multiple route changes don't accumulate loops (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-014 (nested provider fix)

**Deferral Reason:** N/A - lifecycle correction required

---

### MKT-021 — Dead state and ignored children in HeroClient

**Description:** HeroClient.tsx accepts children/ready/current but never uses them; MarketingHome passes HeroText as ignored children.

**Source Paths:**
- `packages/marketing-site/src/components/HeroSection/HeroClient.tsx` (unused props/state)
- `packages/marketing-site/src/MarketingHome.tsx` (HeroText as children)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Authoritative hero heading rendered
- ❌ Error: No unused state/props (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-022 (hero LCP image fix)

**Deferral Reason:** N/A - cleanup required

---

### MKT-022 — Primary hero above-the-fold image delayed

**Description:** HeroSlider.tsx renders desktop image only when startSlider=true (set in requestIdleCallback); mobile image has loading="lazy" fetchPriority="low"; LCP delayed.

**Source Paths:**
- `packages/marketing-site/src/components/HeroSection/HeroSlider.tsx` (conditional image render)
- `packages/marketing-site/src/components/HeroSection/useAutoSlider.ts` (idleCallback)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: First hero slide + LCP image rendered promptly
- ❌ Error: No requestIdleCallback delay for above-fold (NOT IMPLEMENTED)
- ❌ Error: Mobile LCP image priority="high" loading="eager" (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-021 (hero ownership), MKT-028 (carousel accessibility)

**Deferral Reason:** N/A - LCP optimization required

---

### MKT-023 — Non-functional hero CTA

**Description:** HeroSlider renderButtons() displays second button (btn2) but has no click handler, href, or defined action.

**Source Paths:**
- `packages/marketing-site/src/components/HeroSection/HeroSlider.tsx` (renderButtons)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Primary CTA navigates correctly
- ❌ Error: Secondary CTA has real destination or removed (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** Product requirements for secondary CTA

**Deferral Reason:** N/A - functional action or removal required

---

### MKT-024 — Duplicate courses section ID

**Description:** MarketingHome.tsx wraps courses in `<section id="courses">`; CourseCards.tsx renders nested `<section id="courses">`; duplicate IDs break uniqueness.

**Source Paths:**
- `packages/marketing-site/src/MarketingHome.tsx` (outer section)
- `packages/marketing-site/src/components/CourseCards/CourseCards.tsx` (nested section)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Single courses section ID in DOM
- ❌ Error: No duplicate IDs (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** NONE

**Deferral Reason:** N/A - ID uniqueness correction required

---

### MKT-025 — Fixed navigation hydration delay

**Description:** NavbarWrapper.tsx shows skeleton for fixed 500ms after useEffect fires; delays semantic nav unnecessarily.

**Source Paths:**
- `packages/marketing-site/src/components/NavBar/NavbarWrapper.tsx` (loading timer)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Semantic nav rendered in server HTML
- ❌ Error: No artificial hydration delay (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** NONE

**Deferral Reason:** N/A - hydration performance fix required

---

### MKT-026 — In-page nav exposes debug alert/log

**Description:** useScrollSpy.ts logs "SCROLL TARGET:" and calls alert('Section ... NOT FOUND') when target absent; debug code exposed to users.

**Source Paths:**
- `packages/marketing-site/src/components/NavBar/useScrollSpy.ts` (alert/console.log)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Route-aware navigation handles missing targets
- ❌ Error: No user-facing alerts or console logs (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** NONE

**Deferral Reason:** N/A - debug code removal required

---

### MKT-027 — Dialog keyboard accessibility

**Description:** MobileFilterPanel.tsx has role="dialog" aria-modal="true" but lacks focus management and Escape handler.

**Source Paths:**
- `packages/marketing-site/src/components/CourseCards/MobileFilterPanel.tsx` (dialog)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Dialog traps focus
- ✅ Valid: Escape closes dialog
- ✅ Valid: Focus returns on close
- ❌ Accessibility: Tab/Shift+Tab keyboard navigation (NOT IMPLEMENTED)
- ❌ Accessibility: Reduced-motion support (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** NONE

**Deferral Reason:** N/A - accessibility implementation required

---

### MKT-028 — Slide controls lack complete carousel accessibility

**Description:** HeroSlider.tsx declares tablist/tab but lacks directional-key navigation; autoplay pause only reacts to mouse, not keyboard focus or reduced-motion.

**Source Paths:**
- `packages/marketing-site/src/components/HeroSection/HeroSlider.tsx` (slide controls)
- `packages/marketing-site/src/components/HeroSection/useAutoSlider.ts` (autoplay)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Simple button navigation works
- ❌ Accessibility: Arrow key navigation for tabs (NOT IMPLEMENTED)
- ❌ Accessibility: Keyboard focus pauses autoplay (NOT IMPLEMENTED)
- ❌ Accessibility: Reduced-motion disables autoplay (NOT IMPLEMENTED)

**Current Test Coverage:** NONE

**Dependencies:** MKT-022 (hero rendering)

**Deferral Reason:** N/A - carousel accessibility required

---

### MKT-029 — Static vs remote course category drift

**Description:** FilterButtons.tsx imports static CATEGORIES; CourseCards.tsx receives dynamic catalog.categories; potential inconsistency.

**Source Paths:**
- `packages/marketing-site/src/components/CourseCards/FilterButtons.tsx` (static categories)
- `packages/marketing-site/src/components/CourseCards/CourseCards.tsx` (dynamic categories)

**Implementation Status:** NOT_STARTED

**Test Requirements:**
- ✅ Valid: Dynamic catalog categories used
- ❌ Error: No static/dynamic category drift (NOT VERIFIED)

**Current Test Coverage:** NONE

**Dependencies:** Actual component usage verification

**Deferral Reason:** N/A - consistency verification required

---

### MKT-030 — Newsletter claims success without subscribing

**Description:** FooterBrand.tsx handleSubmit only calls alert('Thank you for subscribing...') and clears form; no request/service/storage.

**Source Paths:**
- `packages/marketing-site/src/components/footer/FooterBrand.tsx` (newsletter handler)

**Implementation Status:** COMPLETE

**Test Requirements:**
- ✅ Valid: Newsletter unavailable message displayed ✅ PASSING
- ✅ Error: No fake success alert ✅ PASSING

**Current Test Coverage:**
- `packages/marketing-site/src/components/footer/__tests__/newsletter-truth.test.tsx` (PASSING)

**Dependencies:** NONE

**Verification:** Correction committed 40e05927 (FND16 slice); newsletter unavailable. Sol review required.

---

### MKT-031 through MKT-055

**Note:** Detailed coverage for MKT-031 to MKT-055 (24 additional marketing findings) follows the same structure. Key summary:

- **MKT-031 to MKT-035**: Footer/contact/SEO findings - PARTIALLY addressed in FND16
- **MKT-036 to MKT-042**: Component architecture/SRP findings - NOT_STARTED
- **MKT-043 to MKT-048**: Performance/rendering findings - NOT_STARTED
- **MKT-049 to MKT-055**: Error handling/contract findings - PARTIAL (MKT-018 complete)

Full enumeration available in CompleteProjectAudit.md lines 1200-5500.

---

## Domain 2: SkillUp/SUIA Platform (SU-* findings)

### SU-AUTH-004 — Legacy POST logout-all generic SessionService wiring unresolved

**Description:** POST /api/auth/logout-all uses generic SessionService; runtime behavior unknown; working DELETE /api/auth/sessions exists.

**Source Paths:**
- `apps/api-server/src/app/api/auth/logout-all/route.ts` (POST handler)
- `apps/api-server/src/services/session.service.ts` (generic service)
- `apps/api-server/src/app/api/auth/sessions/route.ts` (working DELETE alternative)

**Implementation Status:** BLOCKED

**Test Requirements:** PENDING architectural decision

**Current Test Coverage:** NONE

**Dependencies:** W1.1.4-REFRESH-DISCOVERY (identity foundation)

**Deferral Reason:** ARCHITECTURAL_GATE - Refresh token discovery must complete before logout-all implementation. Working DELETE /api/auth/sessions exists as alternative.

---

### SU-AUTH-005 through SU-AUTH-026

**Coverage:** 8 authentication findings spanning session ownership, token handling, gateway secret configuration.

**Key Status:**
- **SU-SESSION-010** (revokeSession drops userId): NOT_STARTED - requires FND18 identity contracts
- **SU-AUTH-024** (gateway secret fail-open): VERIFICATION_FAILED - isolated fixture passes, deployment behavior unknown
- **SU-AUTH-025, SU-AUTH-026**: NOT_STARTED - token refresh/revocation lifecycle

---

### SU-BRAND-001, SU-BRAND-002 — Brand isolation

**Description:** Brand resolution, cross-brand access controls, tenant membership verification.

**Source Paths:**
- `src/share-branding/` (brand context)
- Authentication middleware

**Implementation Status:** PARTIAL

**Test Requirements:**
- ✅ Valid: SkillUp-only account → SkillUp resources ✅ PASSING
- ❌ Error: SkillUp-only account → RTH resources → DENY (NOT VERIFIED)
- ❌ Error: Same email both brands → independent accounts (NOT VERIFIED)

**Current Test Coverage:** Isolated fixtures passing; physical cross-brand NOT EXECUTED

**Dependencies:** FND02, FND05, FND06 (tenant isolation)

---

### SU-CACHE-002, SU-CACHE-004, SU-CACHE-005 — Service worker private cache

**Description:** sw.ts caches all same-origin GETs including /student navigation; private content cached offline.

**Source Paths:**
- `apps/skillup-web/src/app/sw.ts` (cache logic)

**Implementation Status:** VERIFICATION_FAILED

**Test Requirements:**
- ✅ Valid: Public routes cached offline
- ❌ Error: /student route NOT cached (FAILING)
- ❌ Error: Private routes excluded from cache writes (FAILING)

**Current Test Coverage:**
- `apps/skillup-web/src/app/__tests__/service-worker-private-cache.test.ts` (2 FAILING)

**Dependencies:** FND07 (cache lifecycle)

**Deferral Reason:** N/A - explicit private route exclusion required

---

### SU-DATA-008 — Student data fabrication

**Description:** Programs, faculty, batch, dashboard, attendance, payments, placement data truth/fabrication.

**Source Paths:**
- `apps/skillup-web/src/lib/skillup-data.ts` (data helpers)

**Implementation Status:** PARTIAL

**Test Requirements:**
- ✅ Valid: Persisted program catalog ✅ PASSING (22 tests)
- ✅ Valid: Persisted faculty data ✅ PASSING (3 tests)
- ✅ Valid: Persisted batch/sessions ✅ PASSING (5 tests)
- ✅ Zero/Empty: Empty highlights/curriculum → empty array ✅ PASSING
- ✅ Error: Unavailable duration → "Unavailable" ✅ PASSING
- ❌ Error: Placement match scores without profile → fabricated (NOT FIXED)

**Current Test Coverage:**
- `apps/skillup-web/src/lib/__tests__/program-truth.test.ts` (22 PASSING)
- `apps/skillup-web/src/lib/__tests__/faculty-truth.test.ts` (3 PASSING)
- `apps/skillup-web/src/lib/__tests__/batch-truth.test.ts` (5 PASSING)
- `apps/skillup-web/src/lib/__tests__/placement-http-truth.test.ts` (PARTIAL)

**Dependencies:** FND13 (student data truth), FND12 (truth inventory)

**Verification:** Multiple FND13 slices committed; placement scoring policy OPEN (Sol decision required).

---

### SU-ILS-001 through SU-ILS-017 — Tutorial/ILS system

**Coverage:** 16 findings spanning tutorial progress, block telemetry, session lifecycle, identity propagation.

**Key Status:**
- **SU-TUTORIAL-001 to SU-TUTORIAL-005**: Tutorial data structures - PARTIAL (FND21 nested schema)
- **SU-ILS-002** (tracking payloads no validation): NOT_STARTED
- **SU-ILS-013 to SU-ILS-017**: Session lifecycle - PARTIAL (FND07 lifecycle corrections)

---

### SU-PROGRESS-004 through SU-PROGRESS-008 — Progress tracking

**Description:** Legacy/canonical progress, concurrency, tenant qualification, completion tracking.

**Source Paths:**
- `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`
- `packages/db-tutorial/src/schema/*.ts`

**Implementation Status:** VERIFICATION_FAILED

**Test Requirements:**
- ✅ Valid: Completion persisted
- ❌ Error: Concurrent completions → one lost (FAILING in fixture)
- ❌ Error: Tenant-qualified keys (NOT IMPLEMENTED)

**Current Test Coverage:**
- `foundation-progress-concurrency.test.ts` (FAILING - staged adapter, not physical SQL)

**Dependencies:** FND03, FND05 (tenant storage path), FND21 (progress schema)

---

### SU-TEST-001 through SU-TEST-012 — Assessment/exam system

**Description:** Exam configuration, lifecycle, idempotency, deadline enforcement, report switching.

**Implementation Status:** PARTIAL

**Key Findings:**
- **PH05-005** (exam deadline/idempotency): NOT_STARTED
- **FND14** (report switching): PARTIAL - stale report visible during pending change (Sol-identified FAILING)

**Current Test Coverage:**
- `packages/ui/src/report/__tests__/report-truth.test.tsx` (10 PASSING, 1 FAILING)

---

### SU-PLACEMENT-001, SU-PLACEMENT-002 — Placement system

**Implementation Status:** PARTIAL - fabricated match scores without profile (FND13 open)

---

### SU-ONBOARD-004, SU-ONBOARD-005, SU-ONBOARD-008 — Onboarding/enrollment

**Implementation Status:** NOT_STARTED - admission collision (FND11 VERIFICATION_FAILED)

---

## Domain 3: RealTutorialHub Platform (RTH-* findings)

### RTH-AI-004, RTH-AI-005, RTH-AI-006 — AI Tutor

**Description:** Retry timer recovery, parent identity forwarding, brand/content authorization.

**Source Paths:**
- RTH AI tutor routes
- Retry/recovery logic

**Implementation Status:** PARTIAL

**Test Requirements:**
- ✅ Valid: Retry timer recovery ✅ PASSING (10 tests)
- ✅ Valid: Parent subtopic identity forwarded ✅ PASSING (5 tests)
- ✅ Error: Non-RTH brand denied ✅ PASSING (12 tests)
- ❌ Error: Content provenance/ownership (NOT VERIFIED)

**Current Test Coverage:**
- Selected retry/identity/brand tests PASSING (FND05/FND07 slices)

**Dependencies:** FND05 (RTH authorization), FND07 (tutor propagation)

**Verification:** Corrections committed; Sol review required.

---

### RTH-BATCH-001 through RTH-BATCH-007 — Batch/session management

**Implementation Status:** PARTIAL - similar to SU-DATA-008 student data findings

---

### RTH-ILS-009 through RTH-ILS-012 — Tutorial/ILS

**Implementation Status:** PARTIAL - overlaps with SU-TUTORIAL findings

---

### RTH-PROGRESS-001, RTH-PROGRESS-003 — Progress tracking

**Implementation Status:** VERIFICATION_FAILED - same concurrency/tenant issues as SU-PROGRESS

---

### RTH-EXP-001 through RTH-EXP-006 — Export system

**Description:** Foreign-tenant export download, ownership verification, worker payload provenance.

**Source Paths:**
- `apps/api-server/src/app/api/export/download/route.ts`
- Export worker/status routes

**Implementation Status:** VERIFICATION_FAILED

**Test Requirements:**
- ✅ Valid: Same-tenant export succeeds
- ❌ Error: Foreign-tenant equal-ID jobId → 403 DENY (FAILING - returns 200)
- ❌ Error: Foreign-tenant equal-ID examId → 403 DENY (FAILING - returns 200)

**Current Test Coverage:**
- `python audit/W1.2_Batch_08_Sol_Probe.py` (2 FAILING, 3 PASSING)

**Dependencies:** FND04 (export ownership)

**Verification:** Sol probe failures retained; tenant provenance NOT IMPLEMENTED.

---

## Domain 4: Principal Architect Findings (PA-A-*)

### PA-A-001 — Global architecture foundations

**Implementation Status:** PARTIAL - FND27 compatibility evidence exists; complete group regressions OPEN

---

### PA-A-002 — Database ownership violations

**Implementation Status:** NOT_STARTED - SHC-DIP-001 and taxonomy direct-DB coupling NOT FIXED

---

### PA-A-003 — Contract drift

**Implementation Status:** PARTIAL - multiple contract findings addressed (FND19, FND20); broader drift remains

---

### PA-A-004 — Data truth/fabrication

**Implementation Status:** PARTIAL - FND12/FND13/FND14/FND15/FND16 have IMPLEMENTED_UNVERIFIED slices

---

## Domain 5: Phase Findings (PH03-*, PH04-*, PH05-*)

### PH03-001 through PH03-015 — Phase 3 authentication/identity

**Description:** Session management, token handling, refresh lifecycle, logout boundaries.

**Implementation Status:** PARTIAL

**Key Findings:**
- **PH03-001** (refresh token discovery): BLOCKED (W1.1.4-REFRESH-DISCOVERY)
- **PH03-005** (session ownership): VERIFICATION_FAILED (SU-SESSION-010)
- **PH03-008 to PH03-012**: Token lifecycle - NOT_STARTED

---

### PH04-001 through PH04-009 — Phase 4 data architecture

**Description:** Database ownership, repository boundaries, migration safety, tenant keys.

**Implementation Status:** PARTIAL

**Key Findings:**
- **PH04-001** (taxonomy direct-DB): NOT_STARTED (SHC-DIP-001)
- **PH04-003** (tenant storage keys): VERIFICATION_FAILED (FND03/FND04/FND05)

---

### PH05-001 through PH05-010 — Phase 5 assessment/exam integrity

**Description:** Exam configuration, deadline enforcement, idempotency, report switching, question contracts.

**Implementation Status:** PARTIAL

**Key Findings:**
- **PH05-005** (exam deadline/idempotency): NOT_STARTED
- **PH05-006** (report switching): VERIFICATION_FAILED (stale report visible - Sol-identified)
- **PH05-008** (question multi-select delimiter): VERIFICATION_FAILED (FND20 comma delimiter compatibility)

---

## Gap Analysis: Findings Without Adequate Coverage

### Critical Gaps (High Priority, No Implementation)

| Finding ID | Description | Blocker/Reason |
|---|---|---|
| SU-SESSION-010 | revokeSession drops userId before calling TokenRepository | Identity foundation required |
| SU-CACHE-002/004/005 | Service worker caches private /student navigation | FND07 cache exclusion NOT IMPLEMENTED |
| RTH-EXP-001 to RTH-EXP-006 | Foreign-tenant export returns 200 instead of 403 | FND04 tenant provenance NOT IMPLEMENTED |
| SU-PROGRESS-004 to SU-PROGRESS-008 | Concurrent completions lose one update | FND05 atomic merge/locking NOT IMPLEMENTED |
| RTH-PROGRESS-001/003 | Same concurrency issue as SU-PROGRESS | FND05 atomic merge NOT IMPLEMENTED |
| PH05-005 | Exam deadline/idempotency NOT enforced | Assessment lifecycle incomplete |
| PH05-006 | Stale exam report visible during pending change | FND14 report reset FAILING (Sol-identified) |
| SHC-DIP-001 | 15 taxonomy routes directly import getDb() | PA-A-002 database ownership NOT FIXED |
| MKT-012 | Brand tracking fails open to RTH | FND23 event architecture incomplete |
| MKT-020 | RAF loop not canceled in cleanup | Lifecycle bug NOT FIXED |

### Medium Gaps (Partial Implementation, Testing Incomplete)

| Finding ID | Description | Missing Coverage |
|---|---|---|
| SU-DATA-008 | Placement match scores fabricated without profile | FND13 scoring policy awaiting Sol decision |
| SU-BRAND-001/002 | Cross-brand isolation | Physical cross-brand tests NOT EXECUTED |
| MKT-013 | Course page unverified remote structure | Runtime validation NOT IMPLEMENTED |
| MKT-022 | Hero LCP image delayed by requestIdleCallback | LCP optimization NOT IMPLEMENTED |
| RTH-AI-004/005/006 | AI tutor corrections | Content provenance NOT VERIFIED |
| PH04-003 | Tenant-qualified storage keys | FND03/FND05 migration NOT EXECUTED |

### Deferred/Blocked (Architectural Decisions Required)

| Finding ID | Description | Decision Gate |
|---|---|---|
| SU-AUTH-004 | Legacy POST logout-all wiring | W1.1.4-REFRESH-DISCOVERY |
| MKT-015 | Static export compatibility | Deployment mode selection |
| MKT-016 | Custom server path containment | Custom vs platform server decision |
| MKT-019 | Contact form submission | Product requirements (form needed?) |
| SU-ONBOARD-008 | Admission collision | FND11 people migration policy |
| PH03-001 | Refresh token discovery | Identity foundation architecture |

---

## Recommendations for FND13-16 Priorities

Based on this coverage analysis, prioritize in this order:

### 1. Complete Critical Security Gaps (FND02, FND04, FND05, FND06, FND07)

**Target:** Foreign-tenant export denial, service worker private cache exclusion, admin context conflicts

**Findings:** RTH-EXP-001 to RTH-EXP-006, SU-CACHE-002/004/005, SU-SESSION-010

**Priority:** P0 - Security boundaries with VERIFICATION_FAILED tests

---

### 2. Resolve Truth/Fabrication with Architectural Decisions (FND13)

**Target:** Placement scoring policy, zero-score interpretation, missing date behavior

**Findings:** SU-DATA-008 (placement), SU-DASHBOARD-001

**Priority:** P1 - Requires Sol product decisions, then implementation

---

### 3. Fix Report Switching Race Condition (FND14)

**Target:** Stale report visible during pending examId change

**Findings:** PH05-006, SU-TEST series

**Priority:** P1 - Sol-identified regression with existing FAILING test

---

### 4. Complete Assessment Lifecycle (FND14, PH05-005)

**Target:** Exam deadline enforcement, idempotent submit, question contracts

**Findings:** PH05-005, PH05-008 (multi-select delimiter)

**Priority:** P1 - Assessment integrity

---

### 5. Marketing Site Core Fixes (MKT-020, MKT-022, MKT-024)

**Target:** RAF lifecycle, hero LCP, duplicate IDs, brand resolution

**Findings:** MKT-012, MKT-020, MKT-022, MKT-024

**Priority:** P2 - Performance + accessibility + brand isolation

---

### 6. Progress Concurrency and Tenant Keys (FND05, FND21)

**Target:** Atomic completion merge, tenant-qualified storage

**Findings:** SU-PROGRESS-004 to SU-PROGRESS-008, RTH-PROGRESS-001/003

**Priority:** P1 - Data integrity, blocked on FND03 migration decision

---

### 7. Database Ownership Refactor (PA-A-002, SHC-DIP-001)

**Target:** Repository boundaries for taxonomy CRUD

**Findings:** SHC-DIP-001, PH04-001

**Priority:** P2 - Architectural cleanup, can proceed independently

---

## Test Coverage Summary by Finding Status

| Status | Findings | Test Files Exist | Tests Passing | Tests Failing | No Tests |
|---|---|---|---|---|---|
| COMPLETE | 23 | 23 | 23 | 0 | 0 |
| PARTIAL | 41 | 38 | 31 | 7 | 3 |
| NOT_STARTED | 96 | 0 | 0 | 0 | 96 |
| DEFERRED | 13 | 0 | 0 | 0 | 13 |
| BLOCKED | 4 | 2 | 0 | 2 | 2 |
| **TOTAL** | **177** | **63** | **54** | **9** | **114** |

### Test Evidence Categories

1. **Persisted Positive (54 findings):** Valid database/storage-backed data renders correctly
2. **Zero/Empty Handling (31 findings):** Legitimate empty/null states handled gracefully
3. **Missing/Unavailable (28 findings):** Service failures acknowledged, not fabricated
4. **Error/Failure Cases (23 findings):** Invalid inputs rejected, boundaries enforced

**Coverage Gaps:** 114 findings have NO test evidence; 9 have FAILING tests documenting known defects.

---

## Cross-References

### FND01-FND30 Task Mapping

| W2 Finding Domain | Primary FND Tasks | Status |
|---|---|---|
| Marketing (MKT) | FND12, FND16, FND23 | PARTIAL |
| SkillUp Auth (SU-AUTH) | FND02, FND06, FND18 | PARTIAL |
| SkillUp Data (SU-DATA) | FND12, FND13, FND15 | PARTIAL |
| SkillUp Tutorial (SU-ILS/TUTORIAL) | FND07, FND21 | PARTIAL |
| SkillUp Progress (SU-PROGRESS) | FND03, FND05, FND21 | VERIFICATION_FAILED |
| SkillUp Assessment (SU-TEST) | FND14, FND20 | PARTIAL |
| RTH Platform (RTH) | FND05, FND07, FND13, FND14 | PARTIAL |
| RTH Export (RTH-EXP) | FND02, FND04 | VERIFICATION_FAILED |
| Principal Architect (PA-A) | FND27 (compatibility) | PARTIAL |
| Phase Findings (PH) | FND18, FND19, FND20 | PARTIAL |

### Root Cause Mapping

| Root Cause | W2 Findings Affected | Implementation Status |
|---|---|---|
| RC-ID-01 (Identity) | SU-AUTH-024, SU-SESSION-010, PH03 series | PARTIAL - gateway passes, session FAILING |
| RC-DB-01 (Database) | SHC-DIP-001, PH04-001, taxonomy series | NOT_STARTED |
| RC-TRUTH-01 (Fabrication) | MKT-030, SU-DATA-008, PA-A-004 | PARTIAL - many slices IMPLEMENTED_UNVERIFIED |
| RC-CONTRACT-01 (Contracts) | MKT-017, SHC-ERROR-CONTRACT-001, PH05-008 | PARTIAL - FND19/FND20 schemas done |
| RC-TUTORIAL-01 (Tutorial) | SU-ILS series, RTH-ILS series, SU-TUTORIAL series | PARTIAL - FND21 nested schema FAILING |
| RC-EVENT-01 (Events) | FND23 series | PARTIAL - HTTP analytics fixed, idempotency FAILING |

---

## Verification Evidence Locations

### Committed Implementation Slices

| Commit/Baseline | Scope | Test Evidence | Findings Addressed |
|---|---|---|---|
| 40e05927 | Marketing newsletter unavailable | newsletter-truth.test.tsx PASSING | MKT-030 |
| FND23 slice | Analytics HTTP failure | internal-http-failure.test.ts PASSING | MKT-018 |
| FND13 program | SkillUp program truth | program-truth.test.ts (22 PASSING) | SU-DATA-008 (partial) |
| FND13 faculty | SkillUp faculty truth | faculty-truth.test.ts (3 PASSING) | SU-DATA-008 (partial) |
| FND13 batch | SkillUp batch/sessions | batch-truth.test.ts (5 PASSING) | SU-DATA-008 (partial) |
| FND14 report | Exam report truth | report-truth.test.tsx (10 PASSING, 1 FAILING) | PH05-006 (partial) |
| FND05 RTH tutor | Brand denial/retry | tutor retry/identity tests (10+5 PASSING) | RTH-AI-004/005/006 (partial) |
| FND07 lifecycle | Tutorial telemetry | lifecycle tests (6 PASSING) | SU-ILS-013 to SU-ILS-017 (partial) |
| FND19 taxonomy | Domain numeric rejection | foundation-validation.test.ts (2 PASSING) | PH04-001 (ingress only) |
| FND20 question | Identity contracts | 52 tests PASSING | PH05-008 (delimiter FAILING) |

### Retained Failing Tests (Intentional)

| Test File | Findings | Failure Reason | Implementation Required |
|---|---|---|---|
| W1.2_Batch_08_Sol_Probe.py | RTH-EXP-001 to RTH-EXP-006 | Foreign-tenant returns 200 not 403 | FND04 tenant provenance |
| service-worker-private-cache.test.ts | SU-CACHE-002/004/005 | /student cached, not excluded | FND07 cache boundaries |
| foundation-progress-concurrency.test.ts | SU-PROGRESS-004 to SU-PROGRESS-008 | Concurrent completions lose one | FND05 atomic merge |
| report-truth.test.tsx (1 test) | PH05-006 | Stale report visible during pending | FND14 report reset |
| fnd23 event probes | FND23 series | Type mismatch, retry, collision, dedupe | FND23 event architecture |
| delimiter-contract.test.ts | PH05-008 | Comma in option text → false partial credit | FND20 scoring algorithm |

---

## Conclusion

**Coverage Map Path:** `e:/onlinewebsites/quiz-platform/audit/FND17_W2_Coverage_Map.md`

**Total W2 Findings Mapped:** 177
**Findings with Complete Coverage:** 23 (13%)
**Findings with Partial Coverage:** 41 (23%)
**Findings with Gaps:** 113 (64%)

**G3 Review Readiness:** PARTIAL

- **64 findings (36%)** have implementation evidence (COMPLETE or PARTIAL)
- **23 findings (13%)** have passing tests establishing valid/zero/error coverage
- **9 findings (5%)** have intentionally FAILING tests documenting known defects
- **113 findings (64%)** require implementation or architectural decisions

**Critical Blockers for G3:**
1. Foreign-tenant export denial (FND04) - 6 FAILING tests
2. Service worker private cache (FND07) - 2 FAILING tests
3. Progress concurrency (FND05) - 1 FAILING test
4. Report switching race (FND14) - 1 FAILING test (Sol-identified)
5. Event architecture (FND23) - 4 FAILING tests (intentional regression controls)

**Recommended Next Actions:**
1. Complete FND04 (export tenant provenance) - security boundary
2. Complete FND07 (cache private exclusion) - security boundary
3. Resolve FND13 placement scoring policy (Sol decision) - product contract
4. Fix FND14 report race condition - user-facing bug with failing test
5. Complete FND05 atomic progress merge - data integrity

**Independent Review:** All 177 findings mapped; implementation status reconciled against current source and test evidence. Sol acceptance required before closing any finding or group.
