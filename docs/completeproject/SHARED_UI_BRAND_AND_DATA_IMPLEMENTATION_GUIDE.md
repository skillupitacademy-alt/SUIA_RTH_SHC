# Shared UI Brand And Data Implementation Guide

## Purpose

This document defines how **Option 2**, **Option 3**, and **Option 4** must be applied across shared UI in this monorepo for:

- `http://localhost:3003/login`
- `http://localhost:3004/login`
- `http://localhost:3003/dashboard`
- `http://localhost:3004/dashboard`
- `http://localhost:3003/launch-exam`
- `http://localhost:3004/launch-exam`
- `http://localhost:3003/tutorial`
- `http://localhost:3004/tutorial`
- `http://localhost:3003/exam`
- `http://localhost:3004/exam`

This guide is also the standard for **all future shared UI/UX** created for both brands.

## Reference Documents

This guide is based on:

- [`BRAND_AGNOSTIC_ARCHITECTURE.md`](/d:/onlinewebsites/quiz-platform/docs/completeproject/BRAND_AGNOSTIC_ARCHITECTURE.md)
- [`START_LEARNING_GATEWAY_PRD.md`](/d:/onlinewebsites/quiz-platform/docs/completeproject/START_LEARNING_GATEWAY_PRD.md)

These two documents remain the governing references. This file explains how to operationalize them in implementation.

## Option Definitions

### Option 2
Brand-agnostic architecture cleanup.

Meaning:

- One shared UI implementation for both brands
- Thin app route consumers only
- No brand-specific branching inside shared UI
- All brand identity values come from [`brandConfig.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts)

### Option 3
Shared UI-facing data model refactor.

Meaning:

- UI components do not read raw API payloads directly
- A stable UI view-model is defined for each page or feature
- That UI model is common for both brands
- Only the displayed data differs per route, user, exam, session, or product flow

### Option 4
Explicit API boundary and mapping layer.

Meaning:

- API shape and UI shape are separated
- Raw API response is mapped into the shared UI model
- Route-level loaders or server functions own data acquisition
- Shared UI only receives prepared props

## Core Principle

For both brands, there must be:

- **one shared UI/UX layout**
- **one shared UI-facing data model**
- **one shared API-to-UI mapping boundary**

There must not be:

- one component for RealTutorialHub and another for SkillUp for the same page layout
- duplicated UI trees just because branding differs
- raw API payload parsing spread inside leaf components

Brand variation is allowed only through:

- `config` or `brand` injection from [`brandConfig.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts)
- route-specific data passed as props
- page-specific API responses mapped into the same UI model contract

## Current Route Mapping

### Login

- RealTutorialHub route:
  - [`apps/realtutorialhub-web/src/app/login/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/login/page.tsx)
- SkillUp route:
  - [`apps/skillup-web/src/app/login/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/login/page.tsx)
- Shared UI:
  - [`src/share-branding/AuthPage.tsx`](/d:/onlinewebsites/quiz-platform/src/share-branding/AuthPage.tsx)
- Pattern:
  - Props-based shared UI

### Dashboard

- RealTutorialHub route:
  - [`apps/realtutorialhub-web/src/app/dashboard/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/dashboard/page.tsx)
- SkillUp route:
  - [`apps/skillup-web/src/app/dashboard/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/dashboard/page.tsx)
- Shared UI:
  - [`src/share-branding/DashboardPage.tsx`](/d:/onlinewebsites/quiz-platform/src/share-branding/DashboardPage.tsx)
- Pattern:
  - Shared page plus brand context inside the shared layout

### Launch Exam

- RealTutorialHub route:
  - [`apps/realtutorialhub-web/src/app/launch-exam/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/launch-exam/page.tsx)
- SkillUp route:
  - [`apps/skillup-web/src/app/launch-exam/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/launch-exam/page.tsx)
- Shared UI:
  - [`src/share-branding/ExamLaunchPage.tsx`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamLaunchPage.tsx)
- Pattern:
  - Shared page plus brand context

### Tutorial

- RealTutorialHub route:
  - [`apps/realtutorialhub-web/src/app/tutorial/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/tutorial/page.tsx)
- SkillUp route:
  - [`apps/skillup-web/src/app/tutorial/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/tutorial/page.tsx)
- Shared UI:
  - [`src/share-branding/TutorialEnginePage.tsx`](/d:/onlinewebsites/quiz-platform/src/share-branding/TutorialEnginePage.tsx)
- Pattern:
  - Shared page plus brand context

### Exam

- RealTutorialHub route:
  - [`apps/realtutorialhub-web/src/app/exam/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/realtutorialhub-web/src/app/exam/page.tsx)
- SkillUp route:
  - [`apps/skillup-web/src/app/exam/page.tsx`](/d:/onlinewebsites/quiz-platform/apps/skillup-web/src/app/exam/page.tsx)
- Shared UI:
  - [`src/share-branding/ExamEngine/components/ExamEngine.tsx`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/ExamEngine.tsx)
- Shared UI model:
  - [`src/share-branding/ExamEngine/components/examSession.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSession.ts)
- Shared API mapper:
  - [`src/share-branding/ExamEngine/components/examSessionMapper.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSessionMapper.ts)
- Shared loader stub:
  - [`src/share-branding/ExamEngine/components/examSessionLoader.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSessionLoader.ts)

## What Was Applied To Exam

### Option 2 Applied To Exam

The exam page now follows the brand-agnostic rule set:

- one shared exam UI for both brands
- app routes only inject brand config and load session data
- no shared-component branching based on brand name
- brand identity token `brandMark` was moved into [`brandConfig.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts)

Implementation example:

- shared header uses `brand.brandMark`
- shared components use `brand.primaryColor`, `brand.primaryColorDark`, `brand.secondaryColor`
- RealTutorialHub and SkillUp use the same layout and behavior

### Option 3 Applied To Exam

The exam feature now has a dedicated UI view-model:

- [`ExamSessionData`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSession.ts)

This model is shaped for the UI, not for backend storage or transport.

It centralizes:

- breadcrumb
- student identity
- questions
- answers
- tracker status
- progress counts
- timer label
- overview metadata

### Option 4 Applied To Exam

The exam feature now has an explicit mapping boundary:

- raw API contract:
  - [`ExamApiResponse`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSessionMapper.ts)
- UI contract:
  - [`ExamSessionData`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSession.ts)
- mapper:
  - [`mapExamApiToSessionData(...)`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSessionMapper.ts)
- route/server loader:
  - [`loadExamSessionData()`](/d:/onlinewebsites/quiz-platform/src/share-branding/ExamEngine/components/examSessionLoader.ts)

This is the exact pattern future pages should follow.

## Required Implementation Pattern For Login, Dashboard, Launch Exam, Tutorial, And Future Pages

### Step 1
Define or confirm the shared page layout.

Questions:

- Is the UI/UX layout structurally the same for both brands?
- Are differences only branding, wording, and page data?

If yes:

- build one shared component in `src/share-branding/`

If no:

- do not fork immediately
- first confirm with developer/client/stakeholder whether the difference is:
  - data only
  - copy only
  - branding only
  - actual workflow divergence

Only true workflow divergence justifies separate shared page implementations.

### Step 2
Move all brand-specific identity into `brandConfig.ts`.

Examples:

- labels
- button text
- headline text
- small brand marks
- terminology like `AI Tutor` vs `Live Mentor`
- brand colors

Never hardcode these inside shared page components.

### Step 3
Create a page-specific UI model.

Each page that consumes API/session data should have a dedicated UI-facing type.

Examples:

- `LoginViewData`
- `DashboardViewData`
- `LaunchExamViewData`
- `TutorialViewData`
- `ExamSessionData`

This model must describe exactly what the shared UI needs, no more.

### Step 4
Create a raw API contract and a mapper.

For every page with nontrivial data:

- define an API response type
- define a mapper
- convert API payload into the UI model before render

Recommended naming:

- `XxxApiResponse`
- `mapXxxApiToViewData(...)`

### Step 5
Keep route files thin.

Route files should do only this:

1. select the correct brand config
2. load the route data
3. map raw data to UI view-model
4. render the shared component

They should not:

- implement UI
- contain duplicated layout trees
- parse complex API payloads inline

## Standard Contract Pattern

For future pages, use this boundary:

```ts
// route or server loader
const apiResponse = await fetchSomething();
const viewData = mapSomethingApiToViewData(apiResponse);

return <SharedPage config={brandConfig} data={viewData} />;
```

Shared component contract:

```ts
interface SharedPageProps {
  config: BrandConfig;
  data: XxxViewData;
}
```

This ensures:

- one layout
- one UI contract
- different data per user/route/session
- both brands stay aligned

## UI/UX Rules To Keep For All Shared Pages

These rules are mandatory for both current and future shared pages.

### Brand Rules

- Use one shared layout for both brands when workflow is the same
- Inject all brand identity from config
- Do not branch on `brand.name`
- Do not hardcode brand marks, labels, or colors in shared page logic

### Data Rules

- Do not hardcode live data such as:
  - user name
  - student ID
  - timer
  - progress counts
  - questions
  - answers
  - exam statuses
  - dashboard metrics
  - launch-exam options
  - tutorial progress
- All such data must arrive through props derived from mapped API data

### Accessibility Rules

- Maintain WCAG-oriented contrast for text and controls
- Do not rely on color alone for state
- Ensure status indicators also have labels, borders, or icons
- Use pure white text on deep brand surfaces
- Use dark slate text on light surfaces

### Responsive Breakpoint Rules

Every shared page must qualify across the full Tailwind breakpoint range used by the platform:

- `base` / `0px`: mobile portrait, including narrow 360px-375px devices
- `sm` / `640px`: mobile landscape and small tablets
- `md` / `768px`: tablets and compact laptops
- `lg` / `1024px`: standard desktop
- `xl` / `1280px`: large desktop
- `2xl` / `1536px`: wide desktop

For each breakpoint:

- Parent containers must define stable width, max-width, min-width, padding, gap, and overflow behavior.
- Child components must not touch, crop into, or overflow their parent borders.
- Text must remain readable and must not overlap, clip, wrap awkwardly, or force horizontal page scroll.
- Cards, grids, tables, code blocks, diagrams, charts, sidebars, headers, and footers must reflow intentionally.
- Horizontal scrolling is allowed only inside intentionally scrollable regions such as tables and code blocks, never on the page body.
- Font sizes, line heights, spacing, and icon sizes must be adjusted per breakpoint where needed so the complete page still looks designed, not merely compressed.
- Responsive behavior must preserve the same information architecture for both brands; only visual brand tokens and route data may vary.

### Responsive QA Rules

Before a shared page is approved, run viewport checks for both brand routes at minimum:

- 375px wide mobile
- 640px small tablet
- 768px tablet
- 1024px laptop
- 1280px desktop
- 1536px wide desktop

The QA pass must inspect:

- parent-child boundary issues, including children touching or cropping parent borders
- body-level horizontal overflow
- clipped text, clipped controls, clipped icons, and clipped charts
- inconsistent card heights that break alignment
- tables/code blocks that overflow without their own scroll container
- sticky headers, sidebars, bottom navigation, and page actions at each breakpoint
- both RealTutorialHub and SkillUp routes, because brand token changes can affect contrast and visual balance

### Animation Rules

- No text opacity fade-in as required by the architecture doc
- Prefer transform-based motion
- Keep interaction states readable at first paint

## Developer/Client/Stakeholder Confirmation Checklist

Before implementing Option 3 and Option 4 on any new page, confirm:

### Product Confirmation

- Is the layout shared across both brands?
- Which text varies by brand?
- Which text varies by user/session?
- Which states must exist:
  - loading
  - empty
  - error
  - partial data

### Data Confirmation

- What is the backend payload shape?
- What fields are required for render?
- Which fields are optional?
- Which values are display-ready and which require formatting?
- Which lists need status fields?

### UX Confirmation

- What is the desktop structure?
- What is the mobile structure?
- What changes at `base`, `sm`, `md`, `lg`, `xl`, and `2xl`?
- Which containers own overflow at each breakpoint?
- Which children are allowed to scroll internally?
- Which text, code, tables, charts, or diagrams need breakpoint-specific sizing?
- Which elements are interactive?
- Which states need persistence?
- Which states are derived vs directly supplied by backend?

### Ownership Confirmation

- Who owns the API contract?
- Who approves the UI view-model?
- Who signs off on fallback behavior if API data is incomplete?

## Required Deliverables For Every New Shared Page

For any future page that follows this architecture, implementation is not complete until all of the following exist:

1. shared UI component in `src/share-branding/`
2. route-level thin consumers in both brand apps
3. brand-config-driven identity tokens
4. page-specific UI view-model
5. raw API response type
6. mapping function from API to UI model
7. route/server loader function
8. loading, empty, and error handling decision documented
9. responsive QA evidence for both brand routes across `base`, `sm`, `md`, `lg`, `xl`, and `2xl`

## Recommended Naming Convention

Use this naming pattern consistently:

- `XxxPage.tsx`
- `XxxViewData` or `XxxSessionData`
- `XxxApiResponse`
- `mapXxxApiToViewData(...)`
- `loadXxxData()`

Examples:

- `DashboardViewData`
- `mapDashboardApiToViewData(...)`
- `loadDashboardData()`

- `TutorialViewData`
- `mapTutorialApiToViewData(...)`
- `loadTutorialData()`

- `LaunchExamViewData`
- `mapLaunchExamApiToViewData(...)`
- `loadLaunchExamData()`

## Final Rule

For both brands:

- **UI/UX layout should be one**
- **data model should be one**
- **API boundary pattern should be one**

Only the following should vary:

- brand config
- route metadata
- actual data returned for that route/user/session

That is the approved architecture standard to replicate for all future shared pages.

## Do And Dont

### Do

- Do build one shared UI layout when both brands follow the same workflow
- Do inject all brand identity from [`brandConfig.ts`](/d:/onlinewebsites/quiz-platform/src/share-branding/brandConfig.ts)
- Do create a page-specific UI view-model before wiring the UI
- Do map raw API data into that UI view-model before rendering
- Do keep route `page.tsx` files thin and focused on config selection plus data loading
- Do confirm page-specific data requirements with developer, client, or stakeholder before finalizing the UI model
- Do keep desktop and mobile layouts structurally aligned even when their card count differs
- Do verify every shared page at `base`, `sm`, `md`, `lg`, `xl`, and `2xl` for both brands before approval
- Do ensure parent containers and child components have explicit responsive boundaries for width, spacing, overflow, and text wrapping
- Do follow WCAG-oriented contrast rules on all themed surfaces
- Do provide non-color-only state cues for status, progress, and selection
- Do treat loader functions as the single entry point for future backend wiring

### Dont

- Dont create separate RealTutorialHub and SkillUp UI components for the same page unless the workflow actually differs
- Dont hardcode brand names, marks, labels, colors, or terms inside shared UI logic
- Dont branch on `brand.name` in shared components
- Dont pass raw backend payloads deep into UI components
- Dont parse API response structures inside leaf components
- Dont hardcode live session data such as user names, IDs, counts, timers, questions, options, or statuses inside shared page components
- Dont let route files become UI containers or duplicated implementations
- Dont rely only on color to communicate state
- Dont add page-specific exceptions that bypass the shared mapper and loader pattern
- Dont assume future pages can skip Option 3 or Option 4 just because the first version uses demo data
- Dont approve a shared page if any breakpoint has body-level horizontal overflow, clipped children, border-cropping, unreadable font sizing, or accidental overlap
