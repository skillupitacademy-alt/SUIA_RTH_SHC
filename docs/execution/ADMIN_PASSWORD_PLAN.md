# 🏗️ Spec: Admin Password Recovery Flow

**Author**: Antigravity
**Status**: APPROVED (Pending Implementation)
**Date**: 2026-01-27

## 🎯 Goal
Implement a secure, production-ready password recovery system specifically for the Admin App (Governance Terminal).

## 🛠️ Proposed Changes

### 1. Admin App UI
- [NEW] `@docs/pages/admin/forgot-password.md` (Contract)
- [NEW] `apps/admin-app/src/app/forgot-password/page.tsx`: Step 1 - Request reset link.
- [NEW] `apps/admin-app/src/app/reset-password/page.tsx`: Step 2 - Set new password using token.
- [MODIFY] `apps/admin-app/src/app/login/page.tsx`: Add link to `/forgot-password`.

### 2. API Integration
- Uses existing `AuthService.forgotPassword` and `AuthService.resetPassword`.
- **Note**: Ensure `APP_BASE_URL` in `api-server` correctly points to `https://quiz.realtutorialhub.com` (which is shared but handled via `getAdminUrl` for specific redirects if needed).

## ✅ Verification
1. Initiate forgot password from Admin Login.
2. Check email (Resend) or logs for reset link.
3. Link should point to `https://quiz.realtutorialhub.com/api/admin/...` or directly to Admin App via dynamic resolution.
   > [!IMPORTANT]
   > The reset link must lead back to the Admin App's reset page, not the Web App.

---

## 📝 Change Log
### 2026-01-27
- Initial Spec created under `@docs/execution/` per v1.1 Constitution.
