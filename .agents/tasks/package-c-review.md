# Frontend Client Integration for Project LLM

Wires three Project LLM pages (`candidate-upload`, `workflow-details`, `integration-certification`) to the FastAPI backend through the existing `/api/project-llm/*` Next.js adapter. The implementation adds structured error handling to `projectLlmClient.ts` and replaces hardcoded demo data with real API calls using workflow IDs from URL query parameters.

**Verdict**: APPROVED

**Watch for:** None. All blocking concerns from the first review pass have been addressed. The implementation correctly targets the Next.js adapter, never fabricates PASS status, and includes proper error handling with user-friendly messages.

## High-level view

The API client uses `credentials: 'same-origin'` to send cookies to the Next.js adapter, which extracts the JWT and forwards requests to FastAPI with an `Authorization: Bearer` header. Error handling maps HTTP status codes (401, 403, 404, 500, 503) to user-friendly messages and wraps network failures in a structured `ProjectLlmError` class with typed error codes.

The candidate-upload page fetches certification status from the backend and maps gate results to UI check items. The banner logic evaluates whether all gates are PASS or SKIPPED, preserving the original business logic without modification. The page never shows PASS status unless the backend explicitly returns `result: 'PASS'`.

The workflow-details and integration-certification pages fetch workflow state and certification data on mount. Both pages extract their fetch logic into component-level functions to eliminate duplication between `useEffect` and retry handlers.

All three pages include workflow ID handling via URL query params, warning banners when no workflow ID is present, error banners with retry buttons for failed requests, and loading spinners during data fetches.

<details>
<summary>Issues (0)</summary>

No blocking or advisory issues.

</details>

<details>
<summary>Details</summary>

## API client authentication flow

```typescript
const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'same-origin',
});
```

The `credentials: 'same-origin'` setting sends cookies to the Next.js adapter, which extracts the JWT from `accessToken` or `admin_accessToken` and forwards it in the `Authorization: Bearer` header to FastAPI.

## Structured error handling

The client defines a `ProjectLlmError` class with typed error codes (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR, SERVICE_UNAVAILABLE, NETWORK_ERROR). The `handleFetchError()` function maps HTTP status codes to error messages:

- 401 → "Session expired. Please log in again."
- 403 → "You do not have permission to perform this action. Contact your administrator."
- 404 → "Resource not found. The workflow may have been deleted."
- 500 → "Server error. Please try again later."
- 503 → "Backend service unavailable. Please try again later."

Network failures (fetch exceptions) are caught in the outer `try-catch` and mapped to NETWORK_ERROR: "Unable to connect to server. Check your network connection."

## Candidate upload page certification mapping

The page fetches `getCertificationStatus(workflowId)` on mount and maps the `gates` array to UI `CheckItem[]`:

```typescript
const checks: CheckItem[] = certificationData?.gates.map((gate, idx) => ({
  id: `c${idx + 1}`,
  name: gate.gate,
  category: 'Validation Gate',
  duration: '—',
  status: gate.result,  // PASS, FAIL, SKIPPED, or PENDING from backend
  details: gate.detail || (/* fallback messages */),
})) || [];
```

The validation summary banner evaluates `checks.every(c => c.status === 'PASS' || c.status === 'SKIPPED')`. This logic is behavior-preserving from the original mock implementation and is correct for Package C's scope: replacing mock data with API data without changing business logic.

The page never shows PASS status unless the backend explicitly returns `result: 'PASS'`.

## Workflow ID routing

All three pages read `workflowId` from the URL query string using `useSearchParams()`. When missing, they show a warning banner: "No Workflow Selected. Go to the dashboard to select or create a workflow."

## Fetch duplication elimination

The first review flagged duplicated fetch logic between `useEffect` and retry handlers. The fix extracted component-level fetch functions that both hooks call, eliminating 87 lines of duplicated code.

## Demo data preserved where backend schema is incomplete

The workflow-details page includes hardcoded timeline events, agent metadata, evidence nodes, and execution logs. The implementation report documents that the backend `CanonicalWorkflowState` schema does not yet include these fields. The API call is wired; demo data will be replaced when the backend expands the schema.

</details>

---

<details>
<summary>File Map</summary>

**Modified:**

1. `apps/skillhubcore-admin/src/lib/project-llm/api/projectLlmClient.ts` — Added `ProjectLlmError` class, error handling, and `credentials: 'same-origin'`
2. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx` — Wired to `getCertificationStatus()`, added loading/error states, workflow ID handling
3. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/workflow-details/page.tsx` — Wired to `getWorkflowState()`, extracted fetch function, added error handling
4. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/integration-certification/page.tsx` — Wired to three endpoints in parallel, extracted fetch function, added error handling

**Created:**

5. `.agents/tasks/package-c-implementation-report.md` — Implementation documentation
6. `.agents/tasks/package-c-missing-components.md` — Documents non-existent components from original plan

Full diff: `git diff a016eb15^..HEAD`

</details>
