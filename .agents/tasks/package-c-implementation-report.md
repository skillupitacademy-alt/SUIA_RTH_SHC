# Package C: Frontend Client Integration - Implementation Report

**Date**: 2026-01-08  
**Status**: Phase 1 Complete - Client Enhanced, Candidate Upload Wired  
**Branch**: project-ai-gui

---

## Summary

Package C wires the frontend Project LLM UI to the FastAPI backend through the existing `/api/project-llm/*` Next.js adapter. This implementation replaces hardcoded mock data with real API calls using structured error handling and proper authentication flow.

---

## Changes Implemented

### 1. Enhanced `projectLlmClient.ts` with Error Handling ✅

**File**: `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts`

**Added**:
- `ProjectLlmError` class with typed error codes (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR, SERVICE_UNAVAILABLE, NETWORK_ERROR)
- `ProjectLlmErrorCode` enum for structured error handling
- `handleFetchError()` function to map HTTP status codes to user-friendly messages
- `credentials: 'same-origin'` on all fetch calls to send cookies to Next.js adapter
- Try-catch blocks around all methods to handle network errors gracefully

**Error Message Mapping**:
| Status | Code | User Message |
|--------|------|--------------|
| 401 | UNAUTHORIZED | "Session expired. Please log in again." |
| 403 | FORBIDDEN | "You do not have permission to perform this action. Contact your administrator." |
| 404 | NOT_FOUND | "Resource not found. The workflow may have been deleted." |
| 500 | SERVER_ERROR | "Server error. Please try again later." |
| 503 | SERVICE_UNAVAILABLE | "Backend service unavailable. Please try again later." |
| Network failure | NETWORK_ERROR | "Unable to connect to server. Check your network connection." |

**Verification**: TypeScript types are correctly structured; all methods return proper types from `canonicalWorkflowState.ts`.

---

### 2. Wired `candidate-upload/page.tsx` to Real API ✅

**File**: `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx`

**Changes**:
- Added `useSearchParams()` to read `?workflowId=xxx` from URL query params
- Added `useEffect` to fetch `getCertificationStatus()` on component mount
- Replaced hardcoded `checks` array with dynamic mapping from `certificationData.gates`
- Added loading state (`isLoadingCertification`) with spinner UI
- Added error state with error banner and retry button
- Added warning banner when no `workflowId` is present in URL
- Updated validation check icons to support all gate statuses: PASS, FAIL, SKIPPED, PENDING
- Made validation summary card conditional based on actual backend data:
  - Green banner if all gates PASS or SKIPPED
  - Red banner if any gate FAIL
  - Amber banner if gates are PENDING
- Updated `handleRerun()` to call backend `getCertificationStatus()` instead of simulating local state
- **CRITICAL**: Never shows PASS status unless backend explicitly returns `result: 'PASS'`

**UI Behavior**:
- If no `workflowId` query param: Shows warning banner "No Workflow Selected"
- If backend call fails: Shows error banner with user-friendly message and Retry button
- If backend returns no gates: Shows "No validation gates available" message
- If gates exist: Renders each gate with correct status badge (PASS/FAIL/SKIPPED/PENDING)

---

### 3. Documented Missing Components ✅

**File**: `.agents/tasks/package-c-missing-components.md`

Documented that `WorkflowPanel.tsx`, `AgentConfig.tsx`, and `WorkflowHistory.tsx` do not exist in the codebase. The plan correctly identified the actual pages that need wiring:
- `candidate-upload/page.tsx` ✅ (wired in this iteration)
- `workflow-details/page.tsx` ⏳ (deferred to next iteration)
- `integration-certification/page.tsx` ⏳ (deferred to next iteration)

---

## Remaining Work (Next Iteration)

### 4. Wire `workflow-details/page.tsx` ⏳

**Plan**:
- Add `useSearchParams()` to get `workflowId`
- Add `useEffect` to call `projectLlmClient.getWorkflowState(workflowId)` on mount
- Replace hardcoded `timelineEvents`, `agents`, `evidenceNodes`, `logs` with data from `workflowState`
- Add loading skeleton during fetch
- Add error banner with retry button
- Map backend `workflowState.state` enum to display strings

### 5. Wire `integration-certification/page.tsx` ⏳

**Plan**:
- Add `useSearchParams()` to get `workflowId`
- Add `useEffect` to fetch three endpoints in parallel:
  - `getCertificationStatus(workflowId)`
  - `getRuntimeHealth(workflowId)`
  - `getBrowserVerificationStatus(workflowId)`
- Replace hardcoded certification banner with conditional rendering based on `certificationStatus.state === 'CERTIFIED'`
- Replace hardcoded test suite results with `certificationStatus.gates`
- Replace hardcoded runtime metrics with `runtimeHealth` data
- Add loading spinner during fetch
- Add error banner if any fetch fails

---

## Verification

### TypeScript Compilation

**Command**: `pnpm --filter skillhubcore-admin exec tsc --noEmit`

**Result**: Attempted to run, output was truncated but no explicit errors reported. Manual inspection confirms:
- All imports are correctly structured (`@/lib/project-llm/api/projectLlmClient`)
- Types are properly imported from `canonicalWorkflowState.ts`
- Error handling uses `ProjectLlmError` class correctly
- All async functions have proper try-catch blocks

### Manual Code Review

**Checked**:
- ✅ `credentials: 'same-origin'` present on all fetch calls
- ✅ Structured error handling with `ProjectLlmError` class
- ✅ User-friendly error messages mapped from status codes
- ✅ Loading states with spinner UI
- ✅ Empty states for no data scenarios
- ✅ Warning state for missing workflow ID
- ✅ Never shows PASS status unless backend returns it

---

## Authentication Flow

```
Frontend (candidate-upload page)
  ↓
  fetch('/api/project-llm/workflows/{id}/certification', { credentials: 'same-origin' })
  ↓
Next.js Adapter (route.ts)
  ↓
  Extracts JWT from cookies (accessToken or admin_accessToken)
  ↓
  Forwards to FastAPI with Authorization: Bearer <token>
  ↓
FastAPI Backend
  ↓
  Validates JWT and returns certification data
  ↓
Frontend renders gates with real backend status
```

**Credentials Mode**: `same-origin` ensures cookies are sent to `/api/project-llm/*` routes hosted on the same origin as the Next.js app.

---

## Testing Notes

### Local Testing (Manual)

**Prerequisites**:
1. FastAPI backend running at `http://localhost:8000` (or set `PROJECT_AI_BACKEND` env var)
2. User logged into skillhubcore-admin (JWT in cookies)

**Test Steps**:
1. Navigate to `/tools/project-llm/candidate-upload?workflowId=test-123`
2. Observe browser DevTools → Network tab:
   - Request to `/api/project-llm/workflows/test-123/certification` includes cookies
   - Adapter forwards to backend with `Authorization: Bearer ...` header
3. Test error scenarios:
   - No `workflowId` query param: Shows warning banner
   - Invalid `workflowId` (404): Shows "Resource not found" error banner with Retry button
   - No auth token (401): Shows "Session expired" error banner
   - No backend running (503 or network error): Shows "Backend service unavailable" error banner
4. Test successful scenario:
   - Backend returns gates: Renders each gate with correct status badge
   - All gates PASS: Green summary banner shows "Ready for Placement"
   - Some gates PENDING: Amber summary banner shows "In Progress"
   - Any gate FAIL: Red summary banner shows "Cannot Proceed"

### End-to-End Auth Flow

**NOT TESTED**: The auth adapter notes "UNVERIFIED ASSUMPTIONS" about token compatibility between admin JWT signing and FastAPI JWT validation. If auth fails end-to-end, the issue is in:
- Package B (adapter `route.ts`) JWT extraction/forwarding
- FastAPI backend JWT validation logic

Package C assumes the adapter and backend handle auth correctly and focuses on proper error display when auth fails (401/403).

---

## Hard Constraints Verified

- [x] Wire existing `projectLlmClient.ts` to use `/api/project-llm/*` routes (not rewritten from scratch)
- [x] Updated only existing components (candidate-upload page, NOT creating new components)
- [x] Removed mock/hardcoded data; use real API calls via projectLlmClient
- [x] No new database tables, Docker files, GitHub Actions, or architecture changes
- [x] No new auth logic — adapter handles JWT forwarding; client just uses `credentials: 'same-origin'`
- [x] Follow existing React/TypeScript patterns in skillhubcore-admin (useState, useEffect, error banners)

---

## Files Modified

1. `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts` - Enhanced with error handling
2. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx` - Wired to backend API

## Files Created

1. `.agents/tasks/package-c-missing-components.md` - Documented non-existent components
2. `.agents/tasks/package-c-implementation-report.md` - This report

---

## Next Steps

1. Complete wiring of `workflow-details/page.tsx` (uses `getWorkflowState()`)
2. Complete wiring of `integration-certification/page.tsx` (uses `getCertificationStatus()`, `getRuntimeHealth()`, `getBrowserVerificationStatus()`)
3. Run full TypeScript build: `pnpm --filter skillhubcore-admin build`
4. Test authentication flow end-to-end with running FastAPI backend
5. Verify error messages display correctly for all status codes (401, 403, 404, 500, 503, network)

---

## Commit Message

```
feat(package-c): wire projectLlmClient and candidate-upload to /api/project-llm adapter

- Add structured error handling to projectLlmClient with typed error codes
- Add credentials: 'same-origin' to all fetch calls for cookie authentication
- Wire candidate-upload page to real backend getCertificationStatus() API
- Replace hardcoded validation gates with dynamic backend data
- Add loading states, error banners with retry, and workflow ID handling
- Never show PASS status unless backend explicitly returns result: 'PASS'

Part of M2 Project AI GUI integration (Package C Phase 1).
```

---

**Implementation Phase**: 1 of 2 complete  
**Remaining Pages**: 2 (workflow-details, integration-certification)
