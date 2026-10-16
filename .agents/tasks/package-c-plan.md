# Package C: Frontend Client Integration - Implementation Plan

**Current HEAD**: ad4c76d165ff42175f3d8b6dc0fc64e91ef7641b (Package A2 complete)  
**Workspace**: e:\onlinewebsites\quiz-platform

---

## Investigation Summary

### Current State Analysis

**1. Auth Adapter (`route.ts`)**
- ✅ EXISTS: `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts`
- Already proxies GET, POST, PUT, DELETE to FastAPI backend
- Extracts JWT from cookies (`accessToken` or `admin_accessToken`)
- Forwards as `Authorization: Bearer <token>`
- Returns 401 if no token found
- Returns 503 on backend network errors
- Base URL: `process.env.PROJECT_AI_BACKEND || 'http://localhost:8000'`

**2. Frontend Client (`projectLlmClient.ts`)**
- ✅ EXISTS: `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`
- Base URL: `/api/project-llm` (hardcoded, points to Next.js adapter)
- Methods defined: `getWorkflowState`, `uploadCandidate`, `approveImplementation`, `getCertificationStatus`, `triggerRuntimeVerification`, `getRuntimeHealth`, `getBrowserVerificationStatus`
- Uses native `fetch` API
- **Current error handling**: Basic `throw new Error(...)` with status text
- **Missing**: Credentials mode, structured error types, loading states, retry logic

**3. Components**
- ❌ `WorkflowPanel.tsx` - DOES NOT EXIST (mentioned in original prompt but not found in codebase)
- ❌ `AgentConfig.tsx` - DOES NOT EXIST
- ❌ `WorkflowHistory.tsx` - DOES NOT EXIST

**Components that DO exist and use hardcoded/mock data:**
- ✅ `candidate-upload/page.tsx` - Uses hardcoded validation results, never calls backend
- ✅ `workflow-details/page.tsx` - Uses hardcoded timeline/logs
- ✅ `integration-certification/page.tsx` - Uses hardcoded certification data
- ✅ `context/ProjectLlmContext.tsx` - Only stores UI state (familyName, targetVersion), never fetches from backend

**4. TypeScript Types**
- ✅ EXISTS: `src/lib/project-llm/types/canonicalWorkflowState.ts`
- Defines all backend types: `CanonicalWorkflowState`, `CertificationStatus`, `RuntimeHealthStatus`, etc.
- Already matches FastAPI backend schema

**5. Build Configuration**
- Root build: `cross-env NODE_OPTIONS=--max-old-space-size=8192 turbo run build --concurrency=2`
- Root test: `cross-env NODE_OPTIONS=--max-old-space-size=6144 turbo run test --concurrency=4`
- App-level type check: `npm run type-check --workspace=@quiz/skillhubcore-admin`
- App-level test: `npm run test --workspace=@quiz/skillhubcore-admin`
- Uses Next.js 16.1.6, React 19.2.4, Vitest for tests

**6. React Patterns Observed**
- Uses `'use client'` for client components
- useState hooks for local state
- Context API (ProjectLlmContext) for shared workflow state
- No existing error boundary pattern
- No existing loading state pattern with Suspense
- Direct fetch calls (no React Query/SWR)

---

## Design Decisions

### Decision 1: Error Handling Strategy
**Rationale**: The auth adapter returns 401 (no token), 503 (backend down), or passes through FastAPI status codes (403 forbidden, 500 server error). The client must distinguish these and provide user-actionable messages.

**Approach**: Create a structured error type and centralized error handler in the client.
- 401 → "Session expired. Please log in again." (do NOT auto-redirect; let component decide)
- 403 → "You do not have permission to perform this action. Contact your administrator."
- 404 → "Resource not found. The workflow may have been deleted."
- 500/503 → "Server error. Please try again later."
- Network error (fetch throws) → "Unable to connect to server. Check your network connection."

### Decision 2: Client Enhancements
**Rationale**: The existing client methods lack credentials mode and structured error handling. Browser fetch requires `credentials: 'same-origin'` to send cookies to Next.js adapter.

**Approach**: 
- Add `credentials: 'same-origin'` to all fetch calls
- Wrap all methods with try/catch and structured error creation
- Return typed errors with `{ ok: false, error: { code, message } }` pattern OR throw typed errors (throwing is simpler for initial integration)

### Decision 3: Component Integration Scope
**Rationale**: WorkflowPanel, AgentConfig, WorkflowHistory do not exist. The user likely meant the existing pages that show hardcoded data.

**Approach**: Wire the 3 pages that currently show mock data:
1. **`candidate-upload/page.tsx`** - Call `uploadCandidate` when files dropped, show real validation from `getCertificationStatus`
2. **`workflow-details/page.tsx`** - Call `getWorkflowState` to load timeline/logs
3. **`integration-certification/page.tsx`** - Call `getCertificationStatus`, `getRuntimeHealth`, `getBrowserVerificationStatus`

The main dashboard (`page.tsx`) can remain as-is for now (shows recent candidates list but has no workflow ID to query).

### Decision 4: Loading & Error States
**Rationale**: Components currently show instant results. Real API calls need loading spinners and error messages.

**Approach**: 
- Add `isLoading`, `error` state to each component
- Show loading spinner during fetch
- Show error banner on failure with retry button
- Store successful data in component state

### Decision 5: Context Enhancement
**Rationale**: `ProjectLlmContext` only stores user input (familyName, version). Backend workflow state lives in FastAPI. The context should remain lightweight UI state; workflow data fetched per-page.

**Approach**: Do NOT modify context to store backend workflow state. Each page fetches what it needs using the client.

---

## Implementation Plan

### ✅ 1. Enhance projectLlmClient.ts with Error Handling & Credentials

**What**: Add structured error handling, credentials mode, and typed error responses to all client methods.

**Files**:
- `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`

**Changes**:
- Create `ProjectLlmError` class extending Error with `statusCode` and `code` properties
- Create `handleFetchError` helper that inspects response status and throws structured `ProjectLlmError`
- Add `credentials: 'same-origin'` to all fetch calls
- Wrap all fetch calls with try/catch to handle network errors
- Map status codes: 401 → `UNAUTHORIZED`, 403 → `FORBIDDEN`, 404 → `NOT_FOUND`, 500/503 → `SERVER_ERROR`, network → `NETWORK_ERROR`

**Verify**: 
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
```
Expected: No TypeScript errors in projectLlmClient.ts or types.

---

### ✅ 2. Wire candidate-upload/page.tsx to Real API

**What**: Replace hardcoded validation results with real backend calls. Show loading/error states.

**Files**:
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx`

**Changes**:
- Add state: `isUploading`, `uploadError`, `validationData`, `isLoadingValidation`
- Implement file upload handler that calls `projectLlmClient.uploadCandidate(workflowId, files)`
- On upload success, call `projectLlmClient.getCertificationStatus(workflowId)` to get real gate results
- Replace hardcoded `checks` array with `validationData?.gates` mapping
- Show loading spinner during upload/validation
- Show error banner if upload fails with retry button
- Never show PASS status unless backend returns `result: 'PASS'`

**Assumptions**:
- Workflow ID comes from URL query param `?workflowId=...` or context (add fallback: generate temp ID or show "No workflow selected" message)
- File upload uses FormData (already implemented correctly in existing client method)

**Verify**:
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
npm run test --workspace=@quiz/skillhubcore-admin
```
Expected: Type checks pass, existing tests pass (if any).

---

### ✅ 3. Wire workflow-details/page.tsx to Real API

**What**: Replace hardcoded timeline/logs/agents with real workflow state from backend.

**Files**:
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx`

**Changes**:
- Add state: `isLoading`, `fetchError`, `workflowState`
- Add `useEffect` that calls `projectLlmClient.getWorkflowState(workflowId)` on mount
- Replace hardcoded `timelineEvents`, `agents`, `evidenceNodes`, `logs` with data from `workflowState`
- Show loading skeleton during initial fetch
- Show error banner if fetch fails with retry button
- Map backend `workflowState.state` enum to display strings

**Assumptions**:
- Workflow ID comes from URL query param `?workflowId=...`
- Backend returns nested structure with timeline events, agent metadata (if not, show "No data available" message)

**Verify**:
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
```
Expected: Type checks pass.

---

### ✅ 4. Wire integration-certification/page.tsx to Real API

**What**: Replace hardcoded certification data with real backend calls.

**Files**:
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/integration-certification/page.tsx`

**Changes**:
- Add state: `isLoading`, `fetchError`, `certificationStatus`, `runtimeHealth`, `browserVerification`
- Add `useEffect` that fetches all three in parallel:
  - `projectLlmClient.getCertificationStatus(workflowId)`
  - `projectLlmClient.getRuntimeHealth(workflowId)`
  - `projectLlmClient.getBrowserVerificationStatus(workflowId)`
- Replace hardcoded certification banner with conditional rendering based on `certificationStatus.state === 'CERTIFIED'`
- Replace hardcoded test suite results with `certificationStatus.gates`
- Replace hardcoded runtime metrics with `runtimeHealth` data
- Show loading spinner during fetch
- Show error banner if any fetch fails

**Assumptions**:
- Workflow ID comes from URL query param `?workflowId=...`
- Backend may return 404 for workflows that don't exist yet (show "Workflow not found" message)

**Verify**:
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
```
Expected: Type checks pass.

---

### ✅ 5. Add Workflow ID Routing Strategy

**What**: Pages need a workflow ID to query backend. Add URL query param handling.

**Files**:
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx`
- `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/integration-certification/page.tsx`

**Changes**:
- Use Next.js `useSearchParams()` hook to read `?workflowId=...` from URL
- If no workflowId, show warning banner: "No workflow selected. Go to dashboard to select a workflow."
- Pass workflowId to all API client calls

**Assumptions**:
- Dashboard or creation flow will navigate to these pages with `?workflowId=xxx` in URL
- For now, pages gracefully degrade if no workflowId present

**Verify**:
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
```
Expected: Type checks pass.

---

### ✅ 6. Test End-to-End Authentication Flow

**What**: Manually test that cookies flow correctly through the auth adapter.

**Prerequisites**:
- Backend FastAPI running at `http://localhost:8000` (or set `PROJECT_AI_BACKEND` env var)
- User logged into skillhubcore-admin (JWT in cookies)

**Test Steps**:
1. Start Next.js dev server: `npm run dev --workspace=@quiz/skillhubcore-admin`
2. Open browser DevTools → Network tab
3. Navigate to `/tools/project-llm/workflow-details?workflowId=test-123`
4. Observe:
   - Request to `/api/project-llm/workflows/test-123` includes cookies
   - Adapter forwards to `http://localhost:8000/workflows/test-123` with `Authorization: Bearer ...` header
   - Response status: 200 (success), 401 (no token), 403 (unauthorized), or 404 (not found)
5. If 401, verify error message shown in UI: "Session expired"
6. If 403, verify error message: "You do not have permission"
7. If 404, verify error message: "Workflow not found"

**Expected Outcomes**:
- 401 → Error banner with "Session expired" message
- 403 → Error banner with permission message
- 404 → Error banner with "Workflow not found" message
- 200 → Workflow data displayed (or empty state if backend returns no data)
- 503 → Error banner with "Backend service unavailable" message

**Verify**: Manual testing only (no automated test for auth flow yet).

---

### ✅ 7. Final Type Check and Build

**What**: Ensure all TypeScript changes compile and build succeeds.

**Commands**:
```powershell
npm run type-check --workspace=@quiz/skillhubcore-admin
npm run build --workspace=@quiz/skillhubcore-admin
```

**Expected**:
- No TypeScript errors
- Next.js build succeeds
- No runtime errors in build output

---

## Error Handling Reference

| Status Code | Error Code | User Message | Action |
|-------------|-----------|--------------|--------|
| 401 | UNAUTHORIZED | "Session expired. Please log in again." | Show login link |
| 403 | FORBIDDEN | "You do not have permission to perform this action." | Show contact admin message |
| 404 | NOT_FOUND | "Workflow not found." | Show "Go to Dashboard" link |
| 500 | SERVER_ERROR | "Server error. Please try again later." | Show retry button |
| 503 | SERVICE_UNAVAILABLE | "Backend service unavailable. Please try again later." | Show retry button |
| (network) | NETWORK_ERROR | "Unable to connect to server. Check your network connection." | Show retry button |

---

## Components NOT Modified (Future Work)

The following components exist but are NOT modified in Package C because they don't currently show backend workflow data:

- `page.tsx` (dashboard) - shows hardcoded recent candidates list; needs backend endpoint for "list all workflows" (not in scope)
- `create/page.tsx` - workflow creation form; needs backend endpoint for "create workflow" (not in scope)
- `compliance-brief/page.tsx` - shows static compliance cards (not dynamic workflow data)
- `external-ai-handoff/page.tsx` - shows static export UI (not dynamic workflow data)
- `components/ProjectLlmStepper.tsx` - static UI component (no data fetching)
- `components/ProjectLlmContextBanner.tsx` - static UI component (no data fetching)
- `components/CreationBriefPanel.tsx` - static UI component (no data fetching)

---

## Commit Message

```
feat(project-ai): integrate frontend client with FastAPI backend (Package C)

Wire projectLlmClient.ts to existing /api/project-llm/[...path] adapter.
Replace hardcoded data in candidate-upload, workflow-details, and
integration-certification pages with real API calls. Add structured
error handling for 401/403/404/500/503 responses. Add loading states
and error banners with retry. Pass workflow ID via URL query params.

Verifies:
- Authentication flows through Next.js adapter to FastAPI
- Error messages match status codes (401 → login, 403 → permission)
- Loading states shown during fetch
- Components gracefully degrade if no workflow ID present

Part of M2 Project AI GUI integration.
```

---

## Notes

1. **Backend compatibility assumption**: This plan assumes the FastAPI backend implements the endpoints defined in the client (`/workflows/{id}`, `/candidates/upload`, `/approvals/approve`, etc.). If endpoints differ, client methods must be updated to match actual backend routes.

2. **Workflow ID source**: Pages expect `?workflowId=...` in URL. The dashboard or creation flow must navigate with this param. For local testing, manually append `?workflowId=test-123` to URLs.

3. **JWT validation**: The auth adapter notes "UNVERIFIED ASSUMPTIONS" about token compatibility. Package C does NOT verify JWT validity; it assumes the adapter and backend handle this correctly. If auth fails end-to-end, the issue is in Package B (adapter) or backend JWT validation, not Package C.

4. **No database changes**: Package C is frontend-only. No migrations, no schema changes.

5. **No Docker/CI changes**: Package C does not modify Docker Compose, GitHub Actions, or deployment config.

---

**Plan Complete**: 7 items, all frontend TypeScript changes. No backend, database, or infrastructure modifications.
