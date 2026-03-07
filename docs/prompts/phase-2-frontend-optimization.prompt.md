# AI Implementation Prompt: Phase 2 — Frontend Optimization (T79–T91)

**Objective**: Optimize both frontend apps for performance, reduce bundle sizes, eliminate re-render waste, and extract shared code into packages.

> [!IMPORTANT]
> Each task below references **exact file paths, component names, and functions** from this codebase. Read each referenced file before implementing.

> [!CAUTION]
> ## 🔒 LOCKED COMPONENTS — DO NOT ALTER
> The **Launch Examination flow** and **Exam UI/UX** are **FROZEN** during all frontend optimization tasks. The following must remain **pixel-identical** — no changes to layout, positioning, labels, look-and-feel, styling, component hierarchy, or visual behavior:
>
> **Locked Files (Exam Interface)**:
> - `apps/web-app/src/components/exam/ExamInterface.tsx` — Main exam shell
> - `apps/web-app/src/components/exam/QuestionView.tsx` — Question display & options
> - `apps/web-app/src/components/exam/HUDHeader.tsx` — Exam header bar
> - `apps/web-app/src/components/exam/HUDControls.tsx` — Navigation controls
> - `apps/web-app/src/components/exam/TacticalMap.tsx` — Sidebar question grid
> - `apps/web-app/src/components/exam/ThemeSwitcher.tsx` — Theme toggle
>
> **Locked Files (Quiz Launch Flow)**:
> - `apps/web-app/src/components/quiz/QuizSelection.tsx` — Multi-step quiz wizard
> - `apps/web-app/src/components/quiz/ExamPreflightDialog.tsx` — Pre-exam confirmation
> - `apps/web-app/src/components/quiz/EnterpriseControls.tsx` — Exam controls
> - `apps/web-app/src/components/quiz/EnterpriseHeader.tsx` — Exam header
> - `apps/web-app/src/components/quiz/EnterpriseQuestionView.tsx` — Question renderer
> - `apps/web-app/src/app/(authenticated)/exam/[examId]/page.tsx` — Exam route page
> - `apps/web-app/src/app/(authenticated)/quiz/` — Quiz route pages
>
> **What this means for each task**:
> - **T79 (Server Components)**: These pages are marked ❌ — do NOT convert
> - **T80 (Dynamic Imports)**: Do NOT dynamic-import any locked component
> - **T83 (React.memo)**: You MAY add `React.memo` wrapping for performance, but the **rendered output, CSS classes, DOM structure, and visual appearance must be identical**
> - **T84 (Zustand Selectors)**: You MAY refine selectors in store slices used by exam components, but the **component behavior and rendering must be identical**
> - **T85 (React Query)**: Do NOT migrate exam API calls — the exam session lifecycle is latency-sensitive and must not change behavior
>
> **Verification**: After ANY optimization that touches exam-adjacent code, visually verify the exam flow end-to-end: Quiz Selection → Preflight Dialog → Exam Interface → Timer → Answer Selection → Submit → Report.

---

## T79: Convert Pages to Server Components

**Goal**: Identify pages that are unnecessarily `'use client'` and convert them to Server Components with client islands.

**Current State**: 14+ pages in `apps/web-app/src/app/` use `'use client'` — many only fetch data and render static content.

### Files to Audit

| Page | Path | Candidate? |
|---|---|---|
| Dashboard Home | `apps/web-app/src/app/(authenticated)/dashboard/page.tsx` | ✅ Yes — data display |
| Reports List | `apps/web-app/src/app/(authenticated)/dashboard/reports/page.tsx` | ✅ Yes — data table |
| My Exams | `apps/web-app/src/app/(authenticated)/dashboard/my-exams/page.tsx` | ✅ Yes — list view |
| Certs | `apps/web-app/src/app/(authenticated)/dashboard/certs/page.tsx` | ✅ Yes — data display |
| Inbox | `apps/web-app/src/app/(authenticated)/dashboard/inbox/page.tsx` | ⚠️ Maybe — check interactivity |
| Settings | `apps/web-app/src/app/(authenticated)/dashboard/settings/page.tsx` | ❌ No — form interactions |
| Insights | `apps/web-app/src/app/(authenticated)/dashboard/insights/page.tsx` | ⚠️ Maybe — check chart interactivity |
| Report Detail | `apps/web-app/src/app/(authenticated)/reports/[id]/page.tsx` | ✅ Yes — read-only display |
| Exam Page | `apps/web-app/src/app/(authenticated)/exam/[examId]/page.tsx` | ❌ No — heavy interactivity (timer, answers) |
| Quiz Selection | `apps/web-app/src/app/(authenticated)/quiz/` | ❌ No — multi-step wizard |

### Implementation Steps

1. **For each ✅ page**, remove `'use client'` directive
2. **Move data fetching** from `useEffect` + `useState` to `async function` at the component level
3. **Extract interactive elements** into small `'use client'` island components:
   - Create `apps/web-app/src/components/islands/` directory
   - Example: `RefreshButton.tsx`, `FilterDropdown.tsx`, `PaginationControls.tsx`
4. **Pass server-fetched data as props** to client islands
5. Convert 4–5 pages as examples, document which pages cannot convert and why

---

## T80: Add Dynamic Imports for Heavy Components

**Goal**: Code-split heavy components using `next/dynamic` to reduce initial bundle size.

### Admin App — Dashboard Panels (HIGHEST IMPACT)

The admin dashboard at `apps/admin-app/src/app/(authenticated)/page.tsx` renders **16 heavy panels synchronously**:

| Component | Path | Size |
|---|---|---|
| `ContentReadinessBoard` | `apps/admin-app/src/components/dashboard/ContentReadinessBoard.tsx` | 24KB |
| `PerformanceAnalyticsBoard` | `apps/admin-app/src/components/dashboard/PerformanceAnalyticsBoard.tsx` | 12KB |
| `AdminReportPipelineCard` | `apps/admin-app/src/components/dashboard/AdminReportPipelineCard.tsx` | 13KB |
| `LiveSessionsList` | `apps/admin-app/src/components/dashboard/LiveSessionsList.tsx` | 12KB |
| `ServiceHealth` | `apps/admin-app/src/components/dashboard/ServiceHealth.tsx` | 12KB |
| `ExamActivityBoard` | `apps/admin-app/src/components/dashboard/ExamActivityBoard.tsx` | 7KB |
| `EfficiencyQuadrant` | `apps/admin-app/src/components/dashboard/EfficiencyQuadrant.tsx` | 8KB |
| `SystemAuditTerminal` | `apps/admin-app/src/components/dashboard/SystemAuditTerminal.tsx` | 8KB |
| `UserAnalyticsPanel` | `apps/admin-app/src/components/dashboard/UserAnalyticsPanel.tsx` | 7KB |
| `ControlCenterDeck` | `apps/admin-app/src/components/dashboard/ControlCenterDeck.tsx` | 6KB |
| `SecurityHealthPanel` | `apps/admin-app/src/components/dashboard/SecurityHealthPanel.tsx` | 5KB |
| `BlueprintAuditBoard` | `apps/admin-app/src/components/dashboard/BlueprintAuditBoard.tsx` | 5KB |

### Implementation Steps

1. **In `apps/admin-app/src/app/(authenticated)/page.tsx`**, replace direct imports with dynamic:
   ```
   import dynamic from 'next/dynamic'
   const ContentReadinessBoard = dynamic(
     () => import('@/components/dashboard/ContentReadinessBoard'),
     { loading: () => <ZSkeleton className="h-64" /> }
   )
   ```
2. Apply to **all 16 dashboard panels** above
3. Use `ZSkeleton` from `@quiz/ui` as the loading fallback

### Admin App — Factory Components

| Component | Path |
|---|---|
| Blueprint components | `apps/admin-app/src/components/factory/blueprint/` |
| Ingest components | `apps/admin-app/src/components/factory/ingest/` |
| Review console | `apps/admin-app/src/components/factory/review/` |

4. Dynamic import each factory sub-module

### Web App — Quiz Components

| Component | Path | Size |
|---|---|---|
| `QuizSelection` | `apps/web-app/src/components/quiz/QuizSelection.tsx` | 35KB |
| `ExamPreflightDialog` | `apps/web-app/src/components/quiz/ExamPreflightDialog.tsx` | 9KB |
| `TutorInsightsPanel` | `apps/web-app/src/components/quiz/TutorInsightsPanel.tsx` | 6KB |

5. Dynamic import `QuizSelection` on the quiz route page
6. Dynamic import chart-heavy components in `apps/web-app/src/components/charts/` (7 chart components)

---

## T81: Implement `next/image` for All Images

**Goal**: Replace raw `<img>` tags with `next/image` for WebP conversion, lazy loading, responsive sizing.

### Implementation Steps

1. **Search** for `<img` in all `.tsx` files across both apps
2. **Search** for `backgroundImage` in styles
3. **Replace** each `<img>` with:
   - `import Image from 'next/image'`
   - Add `width`, `height`, `alt` props
   - Use `priority` for above-the-fold images (logo, hero)
   - Use `fill` for background-style images
4. **Update** `apps/web-app/next.config.ts` and `apps/admin-app/next.config.ts`:
   - Add `images.remotePatterns` for external domains (e.g., Unsplash)
   - Add `images.formats: ['image/avif', 'image/webp']`
5. Leave SVG icons as-is (inline SVG or imports — `next/image` doesn't optimize SVGs)

---

## T82: Implement `next/font` for Font Optimization

**Goal**: Use `next/font/google` for zero-layout-shift font loading.

### Implementation Steps

1. **In `apps/web-app/src/app/layout.tsx`**:
   - Import fonts: `import { Inter, Outfit } from 'next/font/google'`
   - Instantiate: `const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })`
   - Apply to `<html>` or `<body>`: `className={`${inter.variable} ${outfit.variable}`}`
2. **In `apps/admin-app/src/app/layout.tsx`**: Same pattern
3. **Update Tailwind configs** in both apps to use CSS variables:
   - `fontFamily: { sans: ['var(--font-inter)', ...], heading: ['var(--font-outfit)', ...] }`
4. **Remove** any `<link>` tags for Google Fonts in layouts
5. **Remove** any `@import url()` for fonts in CSS files (`globals.css`)

---

## T83: Add `React.memo` to Frequently Updating Components

**Goal**: Prevent re-renders in the exam interface caused by the timer ticking every second.

### Target Components (web-app)

| Component | Path | Memoize By |
|---|---|---|
| `QuestionView` | `apps/web-app/src/components/exam/QuestionView.tsx` | `questionId` |
| `TacticalMap` (sidebar) | `apps/web-app/src/components/exam/TacticalMap.tsx` | answer count, flags |
| `HUDControls` (nav) | `apps/web-app/src/components/exam/HUDControls.tsx` | `currentIndex` |
| `HUDHeader` | `apps/web-app/src/components/exam/HUDHeader.tsx` | — |
| `EnterpriseQuestionView` | `apps/web-app/src/components/quiz/EnterpriseQuestionView.tsx` | `questionId` |
| `EnterpriseControls` | `apps/web-app/src/components/quiz/EnterpriseControls.tsx` | `currentIndex` |

### Implementation Steps

1. Wrap each component: `export default React.memo(ComponentName)`
2. Add custom comparator where needed: `React.memo(C, (prev, next) => prev.questionId === next.questionId)`
3. Wrap event handlers with `useCallback` in parent (`ExamInterface.tsx`):
   - `onAnswerSelect`, `onNavigate`, `onFlag` callbacks
4. Add `useMemo` for derived data (filtered lists, calculated stats)
5. In admin app: memoize dashboard panels that auto-refresh

---

## T84: Fix Zustand Selector Patterns

**Goal**: Convert destructured store usage to granular selectors.

### Current Quiz Store Structure

The quiz store at `apps/web-app/src/store/quiz-store.ts` uses slices from `apps/web-app/src/store/quiz/`:

| Slice | File | State Fields |
|---|---|---|
| Timer | `timer.slice.ts` | `timeRemaining`, `isRunning` |
| Session | `session.slice.ts` | `examId`, `questions`, `currentIndex`, `answers` |
| Content | `content.slice.ts` | Content-related state |
| Interaction | `interaction.slice.ts` | UI interaction state |

### Implementation Steps

1. **Search** for all `useQuizStore()` and `useAuthStore()` calls in both apps
2. **Convert** bare `useStore()` to selectors:
   - Before: `const { timeLeft, currentQuestion } = useQuizStore()`
   - After: `const timeLeft = useQuizStore(s => s.timeRemaining)`
3. For multiple fields, use `useShallow`:
   - `import { useShallow } from 'zustand/react/shallow'`
   - `const { currentQuestion, answers } = useQuizStore(useShallow(s => ({ ... })))`
4. For action-only: `const submitAnswer = useQuizStore(s => s.submitAnswer)`
5. Apply to **every** store import across both apps
6. Also fix `apps/web-app/src/store/auth-store.ts` and `apps/admin-app/src/store/auth-store.ts` selectors
7. Also fix `apps/web-app/src/store/dashboard-store.ts` selectors

---

## T85: Add React Query for Server State Management

**Goal**: Replace raw `fetch()` + `useEffect` with TanStack Query for caching, retry, deduplication.

### Implementation Steps

1. **Install** `@tanstack/react-query` and `@tanstack/react-query-devtools` in both apps
2. **Create** `apps/web-app/src/providers/QueryProvider.tsx` — `'use client'` wrapper around `QueryClientProvider`
   - Config: `staleTime: 5min`, `gcTime: 10min`, `retry: 2`, `refetchOnWindowFocus: true`
3. **Add** `QueryProvider` to `apps/web-app/src/app/layout.tsx` (wrap children)
4. Same for admin app

### Custom Hooks to Create

**Web app** — `apps/web-app/src/hooks/queries/`:

| Hook | Type | Data Source |
|---|---|---|
| `useDomains()` | `useQuery` | Domain list (long staleTime) |
| `useSubjects(domainId)` | `useQuery` | Subjects for domain |
| `useExamReport(examId)` | `useQuery` | Report data |
| `useUserProfile()` | `useQuery` | User profile |
| `useStartExam()` | `useMutation` | Start exam action |
| `useSubmitAnswer()` | `useMutation` | Submit answer (optimistic update) |

**Admin app** — `apps/admin-app/src/hooks/queries/`:

| Hook | Type | Data Source |
|---|---|---|
| `useAdminUsers(filters)` | `useQuery` | User list with pagination |
| `useAdminQuestions(filters)` | `useQuery` | Question list with filters |
| `useDashboardMetrics()` | `useQuery` | Auto-refresh every 60s |
| `useCreateQuestion()` | `useMutation` | With cache invalidation |

5. **Integrate** with existing API client from `packages/api-client`
6. **Convert** 3–5 pages as migration examples
7. Add React Query Devtools in development only

---

## T86: Add Router Prefetching

**Goal**: Pre-fetch likely navigation targets for faster page transitions.

### Implementation Steps

1. **Search** for `<a href=` and `window.location` usage — convert to `<Link>` from `next/link`
2. **Add programmatic prefetch** in strategic locations:
   - Dashboard: `router.prefetch('/quiz')` — user likely starts quiz
   - Quiz step 4: prefetch exam page
   - Exam complete: prefetch report page
3. **Add data prefetch** with React Query (T85):
   - On dashboard: `queryClient.prefetchQuery({ queryKey: ['domains'] })`
   - On reports list: prefetch first 3 report details on hover
4. **Add** `<link rel="preconnect">` in root layouts for API and Sentry origins
5. Set `prefetch={false}` on rare navigation links to save bandwidth

---

## T87: Create Shared UI Package (`packages/ui`)

**Goal**: Consolidate duplicated components into the existing `packages/ui` package.

### Current State

`packages/ui/src/` already contains:
- `ZLoader.tsx`, `ZSkeleton.tsx`, `ZPagination.tsx`, `ZErrorBoundary.tsx`
- `SafeHtml.tsx`, `SecurityMuzzle.tsx`, `SelectField.tsx`, `ThemeToggle.tsx`
- `lib/` (utility directory), `index.ts`, `theme-store.ts`

### Components to Migrate

Identify duplicated components shared between:
- `apps/web-app/src/components/ui/` (4 items)
- `apps/admin-app/src/components/ui/` (5 items)

### Implementation Steps

1. **Audit** both `ui/` directories for shared components
2. **Add** shared missing components to `packages/ui/src/`:
   - `Button.tsx` — Button with variants (primary, secondary, danger, ghost)
   - `Input.tsx` — Form input with label, error state
   - `Card.tsx` — Content card wrapper
   - `Badge.tsx` — Status badges
   - `Modal.tsx` — Modal/dialog component
   - `Table.tsx` — Data table base component
3. **Add** shared utilities to `packages/ui/src/lib/`:
   - `cn.ts` — Class name merger (`tailwind-merge` + `clsx`)
   - `format-date.ts` — Date formatting utilities
   - `format-time.ts` — `formatTimeAgo()`, `formatDuration()`
4. **Export** all from `packages/ui/src/index.ts`
5. **Update** both apps to import from `@quiz/ui` instead of local copies
6. Show 3–5 migration examples per app

---

## T88: Deduplicate Tailwind Configuration

**Goal**: Extract shared Tailwind config into a preset in `packages/ui`.

### Implementation Steps

1. **Compare** `apps/web-app/tailwind.config.ts` and `apps/admin-app/tailwind.config.ts`
2. **Create** `packages/ui/tailwind.preset.ts`:
   - Move shared: colors, fonts, spacing, animations, plugins
   - Export as Tailwind preset
3. **Update** both app configs:
   - `import sharedPreset from '@quiz/ui/tailwind-preset'`
   - `presets: [sharedPreset]`
   - Keep `content` paths pointing to app files AND `packages/ui/src/**/*.tsx`
4. Verify no visual regressions

---

## T89: Deduplicate Auth Store

**Goal**: Extract shared auth logic from both apps' `auth-store.ts` into a shared factory.

### Current Files

| App | File | Size |
|---|---|---|
| Web | `apps/web-app/src/store/auth-store.ts` | 1.9KB |
| Admin | `apps/admin-app/src/store/auth-store.ts` | 1.8KB |

### Implementation Steps

1. **Compare** both files to identify shared vs app-specific logic
2. **Create** `packages/api-client/src/stores/createBaseAuthStore.ts`:
   - Shared state: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
   - Shared actions: `login()`, `logout()`, `refreshSession()`, `updateProfile()`
   - Shared logic: localStorage persistence, token hydration
   - Factory options: `storageKey`, `loginEndpoint`, `redirectOnLogout`
3. **Update** `apps/web-app/src/store/auth-store.ts` to extend base with web-specific state (quiz session tracking)
4. **Update** `apps/admin-app/src/store/auth-store.ts` to extend base with admin-specific state (admin scope)
5. Verify both apps work after refactor

---

## T90: Create Shared `useDebounce` Hook

**Goal**: Replace 7+ inline debounce implementations with a shared hook.

### Implementation Steps

1. **Search** for `setTimeout`/`clearTimeout` debounce patterns in both apps
2. **Create** in `packages/ui/src/hooks/`:

| Hook | File | Signature |
|---|---|---|
| `useDebounce` | `use-debounce.ts` | `useDebounce<T>(value: T, delayMs: number): T` |
| `useDebouncedCallback` | `use-debounced-callback.ts` | `useDebouncedCallback(fn, delayMs): { call, cancel, flush }` |
| `useThrottle` | `use-throttle.ts` | `useThrottle<T>(value: T, intervalMs: number): T` |

3. **Export** from `packages/ui/src/hooks/index.ts`
4. **Update** 3–5 admin table components to use shared hook
5. **Write tests** for timing, cleanup, cancel/flush

---

## T91: Add Preconnect Hints for Critical Origins

**Goal**: Add DNS prefetch and preconnect links for faster initial connections.

### Implementation Steps

1. **In `apps/web-app/src/app/layout.tsx`**, add to `<head>`:
   - `<link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />`
   - `<link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />`
   - Sentry, CDN, Unsplash preconnect hints
2. Same for `apps/admin-app/src/app/layout.tsx`
3. **Create** `Preconnect.tsx` server component that reads env vars
4. **Add** `fetchpriority="high"` to hero/logo images
5. Verify `<meta name="viewport">` is set with `viewport-fit=cover`
