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
- **Heartbeat Continuation**: Heartbeat requests now fire every 1 minute during active exams, even if the user is idle (reading).
- **Route Tracking**: Integrated `usePathname()` to ensure the session manager stays in sync with navigation.

### **File 2**: `packages/api-client/src/core/fetch-client.ts`

- **Robust 401/403 Redirect Fallback**: Enhanced the API client to catch both 401 (Unauthorized) and 403 (Forbidden) responses.
- **Fail-Safe Guard**: Implemented `window.__authRedirecting` as a global flag to prevent multiple API failures from triggering simultaneous redirects and to avoid loops on the login page.
- **Return URL Persistence**: The redirect includes the current URL in the `redirect` query parameter, enabling seamless recovery after re-login.

---

## ✅ Verification Results

### **Build & Type-Check**
- ✅ `pnpm build`: **Exit Code 0**
- ✅ `npx tsc --noEmit`: **Exit Code 0**

### **Functional Logic Verification**
1. **Heartbeat persistence**: Confirmed heartbeat logic uses `usePathname()` and runs even if idle during exams.
2. **Redirect Guard**: Confirmed redirect fallback handles 401/403, avoids `/login` loop, and uses a `__authRedirecting` flag.

---

## 📝 Notes
- Phase 2 (My Exams UX) will now proceed with a stable session foundation.
