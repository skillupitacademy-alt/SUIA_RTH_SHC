# Walkthrough: Session Exam Protection & Redirect Fallback

**Date**: 2026-02-07  
**Phase**: Phase 11A - Session Reliability (P0)  
**Status**: ✅ Complete

---

## 🎯 Objective

Prevent session expiry during active exams to avoid data loss and eliminate infinite loading states during authentication failure.

---

## 📦 Changes Made

### **File 1**: `apps/web-app/src/hooks/useSessionManager.ts`

- **Idle Timeout Skip**: Modified the idle check loop to skip redirection when the user is on an active exam route (`/exam/*` or `/quiz/active-session`).
- **Heartbeat Continuation**: Heartbeat requests now fire every 1 minute during active exams, regardless of whether the user has performed any recent UI activity.
- **Route Tracking**: Integrated `usePathname()` to ensure the session manager stays in sync with navigation.

### **File 2**: `packages/api-client/src/core/fetch-client.ts`

- **401/403 Redirect Fallback**: Enhanced the API client to catch unauthorized/forbidden responses and force a redirect to the login page.
- **Fail-Safe Guard**: Implemented `window.__authRedirecting` as a global flag to prevent multiple API failures from triggering simultaneous redirects.
- **Return URL Persistence**: The redirect includes the current URL in the `redirect` query parameter, allowing users to return exactly where they were after re-logging.

---

## ✅ Verification Results

### **Build & Type-Check**
- ✅ `pnpm build`: **Exit Code 0**
- ✅ `npx tsc --noEmit`: **Exit Code 0**

### **Functional Tests**
1. **Idle Simulation**: Navigated to an active exam and waited beyond the 5-minute timeout threshold.
   - **Result**: Heartbeat continued, and no redirection occurred.
2. **Auth Failure Recovery**: Manually triggered a 401 error.
   - **Result**: App immediately redirected to the login page with a `reason=session_expired` banner. No infinite loader detected.

---

## 📝 Notes
- Phase 2 (My Exams UX) will now proceed with a stable session foundation.
