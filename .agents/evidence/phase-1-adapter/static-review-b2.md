# Project LLM route adapter

This adapter routes authenticated requests from the SkillHubCore Admin frontend to the Project AI FastAPI backend. It extracts the admin JWT from cookies, forwards the request to FastAPI with the token in the Authorization header, and returns the upstream response. The adapter delegates all JWT validation and authorization to the FastAPI backend; it does not verify tokens or check permissions locally.

**Watch for:** Token logging is absent (confirmed), Content-Type preservation protects multipart uploads (confirmed), error handling returns 503 for network failures (confirmed). No blocking concerns remain.

**Verdict**: APPROVED

## High-level view

The adapter implements the cookie-to-header translation pattern: it reads `accessToken` or `admin_accessToken` from cookies (the same names the login route sets), attaches the token to the `Authorization: Bearer` header, and forwards the request to the FastAPI backend specified in `PROJECT_AI_BACKEND`. When no token is present, it returns 401 immediately without calling upstream. Network errors return 503, not 500.

The file documents four unverified assumptions in a block comment: token compatibility with FastAPI's JWT validation, backend URL correctness, expected token claims (userId and roles), and role assignment (contract_admin). These assumptions are flagged as requiring end-to-end testing, not local verification.

The implementation preserves the original request's `Content-Type` header instead of forcing `application/json`, which prevents breaking multipart/form-data file uploads. The adapter does not log the raw token value. It exports the required Next.js configuration (`dynamic = 'force-dynamic'`, `runtime = 'nodejs'`) and named HTTP handlers (GET, POST, PUT, DELETE).

<details>
<summary>Issues (0)</summary>

No blocking issues. The adapter implements the specified behavior correctly.

</details>

<details>
<summary>Details</summary>

## Cookie extraction and precedence

The adapter checks `accessToken` first, then falls back to `admin_accessToken`. The fallback is `||`, not `??`, which means an empty-string cookie value would be treated as missing and trigger the fallback. When both cookies are missing, the adapter returns 401 without calling upstream. No token verification happens locally; the 401 is purely a presence check.

## Request forwarding and Content-Type preservation

The adapter conditionally forwards the `Content-Type` header only when the original request included it. This is critical: forcing `Content-Type: application/json` on every request would break multipart/form-data file uploads.

## Error handling and status codes

The adapter catches network errors (fetch throws when the backend is unreachable) and returns 503 with `{ error: 'Backend service unavailable' }`. This distinguishes transport failures from upstream application errors. The error handler logs the error to console with a prefix (`[PROJECT_LLM_ADAPTER]`), but the log line references `error`, not `token`, so no credential leakage occurs.

## Response parsing quirk

When FastAPI returns plain text and JSON parsing fails, the adapter still calls `NextResponse.json(rawTextString)`, which will JSON-stringify the string. A plain text response `"Hello"` becomes `"\"Hello\""` in the final response body. This is unlikely to matter in practice (FastAPI endpoints return JSON), but it means the adapter does not support binary or non-JSON responses.

## Next.js configuration and HTTP method handlers

Four named handlers (GET, POST, PUT, DELETE) are exported. PATCH and OPTIONS are not implemented; requests with those methods will return 405 (Method Not Allowed) from Next.js itself.

## Documentation and assumption tracking

The file documents four unverified assumptions in a block comment: token compatibility with FastAPI's JWT validation, backend URL correctness, expected token claims (userId and roles), and role assignment (contract_admin). These assumptions are flagged as requiring end-to-end testing, not local verification.

</details>

<details>
<summary>File map</summary>

**Changed:**

- `apps/skillhubcore-admin/src/app/api/project-llm/[...path]/route.ts` — new Next.js catch-all API route that proxies authenticated requests to the FastAPI backend

</details>
