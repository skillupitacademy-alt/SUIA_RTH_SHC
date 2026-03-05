# Implementation Plan: Phase 1 - Task 2 (Package-Level Vitest Configuration)

This task configures individual test environments for each workspace package, ensuring appropriate tools (like JSDOM for frontends) are available.

## Proposed Changes

### [Component: 3 Apps (API, Web, Admin)]
#### [NEW] [vitest.config.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/vitest.config.ts)
- **Environment**: `node`.
- **Mocks**: Setup global mocks for `db`, `Redis`, and `Email`.
- **Aliases**: `@/*` -> `./src/*`.

#### [NEW] [vitest.config.ts](file:///d:/onlinewebsites/quiz-platform/apps/web-app/vitest.config.ts)
#### [NEW] [vitest.config.ts](file:///d:/onlinewebsites/quiz-platform/apps/admin-app/vitest.config.ts)
- **Environment**: `jsdom`.
- **Setup**: Integrate React Testing Library and `jest-dom`.
- **Aliases**: `@/*` -> `./src/*`.

### [Component: 2 Packages (DB, API-Client)]
#### [NEW] [vitest.config.ts](file:///d:/onlinewebsites/quiz-platform/packages/db/vitest.config.ts)
#### [NEW] [vitest.config.ts](file:///d:/onlinewebsites/quiz-platform/packages/api-client/vitest.config.ts)
- **Environment**: `node`.

### [Component: All 5 Workspaces]
#### [MODIFY] [package.json](file:///d:/onlinewebsites/quiz-platform/apps/api-server/package.json) (and others)
- Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to each workspace.

## Coverage Thresholds
All packages will share a unified coverage target:
- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

## Verification Plan
### Automated Tests
- Run `pnpm test` from the root to verify that Vitest executes tests in all 5 sub-projects.
- Verify coverage report generation in each package's `coverage/` directory.
