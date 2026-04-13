# Onboarding To Dashboard Shared UI Audit

Date: 2026-04-13

Scope:
- Guide: [SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md](/d:/onlinewebsites/quiz-platform/docs/completeproject/SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md)
- Live flow audited: `http://localhost:3003/onboarding` -> `http://localhost:3003/dashboard`
- Brand routes reviewed:
  - [apps/realtutorialhub-web/src/app/onboarding/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/onboarding/page.tsx:1)
  - [apps/skillup-web/src/app/onboarding/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/onboarding/page.tsx:1)
  - [apps/realtutorialhub-web/src/app/dashboard/page.tsx](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/dashboard/page.tsx:1)
  - [apps/skillup-web/src/app/dashboard/page.tsx](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/dashboard/page.tsx:1)

## Live Audit Result

The journey is reachable end to end.

- `/onboarding` renders.
- Onboarding persistence is wired through `POST /api/onboarding/session`.
- `/dashboard` renders with the shared dashboard UI after onboarding completion.

The implementation is only partially aligned with the guide.

- Option 2 is mostly in place for onboarding and dashboard.
- Option 3 and Option 4 now exist structurally for onboarding.
- The dashboard still behaves like a demo page and does not meaningfully consume onboarding output.
- Some shared UI still bypasses the page view-model or hardcodes brand/legal values outside `brandConfig.ts`.

## Findings

### 1. Critical: dashboard ignores onboarding state in its rendered view-model

The onboarding flow now persists a cookie-backed session and redirects to `/dashboard`, but the dashboard does not project that state into the UI the user sees.

Evidence:
- [src/share-branding/OnboardingEngine/components/OnboardingPage.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/OnboardingEngine/components/OnboardingPage.tsx:23)
- [src/share-branding/OnboardingEngine/components/OnboardingPage.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/OnboardingEngine/components/OnboardingPage.tsx:67)
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:286)
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:437)

Verified behavior:
- Posting a completed onboarding session for `Priya Sharma` stores the `shared-onboarding-session` cookie.
- The dashboard HTML still renders static dashboard identity and activity data such as `Alex K.` and `Scheduled Live Mentorship`.
- The onboarding session is attached to the API-shaped object but not mapped into the displayed dashboard view data.

Why this fails the guide:
- The journey is not functionally connected.
- Route/server data exists, but the shared UI does not receive a dashboard model derived from actual user/session state.

Required implementation:
- Map onboarding/session state into `DashboardViewData`.
- Replace demo user identity, hero state, recommendations, and activity with loader-driven data.
- Ensure dashboard output changes when onboarding inputs change.

### 2. High: dashboard still uses hardcoded demo content instead of a real UI-facing data boundary

The dashboard mapper has a valid API-shape-to-UI-shape transform, but the loader still manufactures mostly fixed sample data inline.

Evidence:
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:294)
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:300)
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:364)

Examples:
- Search placeholder is hardcoded to `Search courses, topics, or mentors...`
- Membership is hardcoded to `Alex K.`, `Premium`, `AK`
- Activity includes `Scheduled Live Mentorship`
- Recommendation, synchronization, competency, and certification content are fixed demo values

Why this fails the guide:
- The API boundary exists only nominally if the loader creates fake transport data inline instead of loading real route/session/backend data.
- Shared UI is still coupled to placeholder content rather than a meaningful page contract.

Required implementation:
- Replace `buildDashboardApiResponse(...)` demo data with route-owned data acquisition.
- Keep the mapper, but map from a real raw source.
- Move all brand-varying wording into config or mapped route data.

### 3. High: dashboard shared UI still bypasses the page view-model for key displayed text

The guide requires shared UI to receive prepared props. The dashboard page header currently reads greeting/subtext directly from `brandConfig.ts` instead of using the passed dashboard view-model.

Evidence:
- [src/share-branding/DashboardPage.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/DashboardPage.tsx:44)
- [src/share-branding/DashboardPage.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/DashboardPage.tsx:47)
- [src/share-branding/dashboardPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/dashboardPageData.ts:292)

Why this matters:
- It weakens the page-specific UI model contract.
- It makes the dashboard title/subtitle impossible to vary via mapped route data without editing shared UI.
- It keeps brand config as a second data source for page content.

Required implementation:
- Render the page header from `DashboardViewData.header` or a dedicated page-level section in `DashboardViewData`.
- Reserve `brandConfig.ts` for brand tokens and identity, not page-instance content.

### 4. High: onboarding footer/legal copy is still hardcoded outside `brandConfig.ts`

The guide says brand identity values should come from `brandConfig.ts`, but onboarding builds its footer legal text inline and uses a mismatched year/copy pattern.

Evidence:
- [src/share-branding/onboardingPageData.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/onboardingPageData.ts:316)
- [src/share-branding/brandConfig.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts:97)
- [src/share-branding/brandConfig.ts](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts:141)

Current behavior:
- Onboarding footer uses `${brand.name} © 2024 • Privacy Policy • Terms`
- Brand config already defines `footerCopyright` for both brands with 2026 values

Why this fails the guide:
- Shared onboarding UI is sourcing legal/brand copy from page data generation instead of the brand config source of truth.

Required implementation:
- Source onboarding footer/legal content from `brandConfig.ts` or from a dedicated mapped page field populated from config.
- Remove the inline year/legal string from `buildOnboardingApiResponse(...)`.

### 5. Medium: onboarding welcome illustrations still hardcode brand-colored values in shared UI

The onboarding welcome step still embeds fixed orange/yellow values directly in shared SVG artwork.

Evidence:
- [src/share-branding/OnboardingEngine/components/WelcomeStep.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/OnboardingEngine/components/WelcomeStep.tsx:58)
- [src/share-branding/OnboardingEngine/components/WelcomeStep.tsx](/d:/onlinewebsites/quiz-platform/src/share-branding/OnboardingEngine/components/WelcomeStep.tsx:63)

Examples:
- `#ea580c`
- `#fbbf24`

Why this matters:
- The shared onboarding visual language is not fully brand-agnostic.
- SkillUp and RealTutorialHub share the same hardcoded accent treatment even though brand tokens already exist.

Required implementation:
- Replace fixed illustration fills/strokes with brand tokens.
- If multiple accents are needed, add explicit config tokens instead of embedding raw values in shared UI.

## What Already Aligns

- Both brands use the same onboarding and dashboard shared page implementations.
- Brand routes are thin consumers that inject config and load data.
- Onboarding now has:
  - `OnboardingViewData`
  - `OnboardingApiResponse`
  - `mapOnboardingApiToViewData(...)`
  - `loadOnboardingData(...)`
- Onboarding persistence exists through the shared cookie contract and per-app API routes.
- `accentBackground` is now defined on `BrandConfig`, so that earlier gap is resolved.

## Required Implementation Checklist

1. Make dashboard user-visible content derive from actual session/onboarding/backend data.
2. Remove remaining dashboard demo placeholders from `buildDashboardApiResponse(...)`.
3. Stop reading dashboard heading/subheading directly from `brandConfig.ts` inside shared UI.
4. Move onboarding legal/footer copy to `brandConfig.ts` or a config-backed mapped field.
5. Replace hardcoded welcome-step illustration colors with shared brand tokens.

## Implementation Priority

P0:
- Connect onboarding output to dashboard view data
- Replace dashboard demo identity/activity/recommendation content

P1:
- Eliminate dashboard content bypasses around `brandConfig.ts`
- Move onboarding legal/footer copy to config-backed data

P2:
- Clean up remaining fixed illustration colors in shared onboarding UI
