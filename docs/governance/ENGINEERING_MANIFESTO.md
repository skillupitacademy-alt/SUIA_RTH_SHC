# 🛡️ The "Absolute Zero" Engineering Manifesto
**Standard**: FAANG SDE-3 / Enterprise Grade  
**Authoritative Source**: `docs/governance/ENGINEERING_MANIFESTO.md`

This document defines the non-negotiable engineering standards for the Quiz Platform. Adherence to these rules is mandatory for all development and AI-led execution.

---

## 1. Type Safety & Runtime Guards
*   **Zero any & Unsafe Casts**: Enforce `eslint no-explicit-any` and the `no-unsafe-*` suite. Use generics for flexible yet typed data structures.
*   **Logical Determinism**: Strictly enforce `@typescript-eslint/strict-boolean-expressions`. No implicit truthiness (e.g., use `if (count > 0)` instead of `if (count)`).
*   **Async Integrity**: Enforce `@typescript-eslint/no-floating-promises`. Every promise must be `awaited`, `.catch()`-ed, or explicitly marked as floating with `void`.
*   **Boundary Validation**: Schema-validate all inbound data (Zod/Valibot) at API edges and form payloads; narrow types immediately after guards.
*   **Explicit Returns**: Require explicit return types on all public functions/hooks; ban implicit `any` in inferred callbacks.
*   **Discriminated Unions**: Replace boolean flags (`isLoading`, `isError`) with tagged unions for robust state machines.

## 2. Testing Strategy
*   **Unit**: 100% coverage on core services/utilities (auth logic, token refresh, job trackers).
*   **Integration**: API contract tests for critical routes (auth, jobs, session refresh) with mocked dependencies.
*   **E2E (Playwright)**: Maintain "Absolute Green" status. Use a `smoke` tag for PRs and a `full` tag for nightly regression.
*   **Flake Control**: Mandatory `data-testid` usage, stable text selection, and retries allowed only on idempotent steps. Record traces on every failure.
*   **Visual/A11y**: Integrated `axe/pa11y` automated passes on key pages; visual snapshots for high-fidelity layouts.

## 3. Accessibility (A11y)
*   **Static Analysis**: Enforce `eslint-plugin-jsx-a11y`.
*   **Keyboard Sovereignty**: Modals, drawers, and lock screens must implement focus traps and restore focus on close.
*   **WCAG Compliance**: Meet AA contrast standards; respect `prefers-reduced-motion` for all premium animations.

## 4. Performance
*   **Budgets & Analytics**: Fail CI if bundle chunks exceed thresholds. Use `webpack-bundle-analyzer` to prevent Bloat.
*   **Image Hygiene**: Mandatory `next/image` with calculated `sizes`; zero unoptimized remote images.
*   **Smart Caching**: Proper `Cache-Control` on API responses; memoize expensive selectors and hooks (`useMemo`, `useCallback`) while strictly following `exhaustive-deps` rules.
*   **Main Thread Protection**: Defer non-critical scripts; absolute ban on `localStorage` access during the render cycle.

## 5. Security
*   **Auth Lifecycle**: Tested refresh rotation; guaranteed hard-wipe of all tokens/stores on logout.
*   **Hardened Headers**: CSP (Report-Only in Audit), HSTS, `XFO=SAMEORIGIN`, and strict Referrer-Policy.
*   **Rate Limiting**: CSRF protection for stateful routes; atomic throttling on auth/generation endpoints.

## 6. Developer Experience & Ops
*   **Git-Flow Discipline**: Pre-commit hooks for linting, type-checking, and formatting on staged files.
*   **CI/CD Gates**: Lint > Typecheck > Unit > Smoke E2E. Nightly full E2E + coverage report.
*   **Structured Observability**: JSON logging in API routes; surface errors to a central tracker; monitor req latency and error rates.
*   **Documentation**: Keep `TASK_HISTORY.md` and walkthroughs 1:1 with implementation. Maintain a surgical "How to Test" README section.
