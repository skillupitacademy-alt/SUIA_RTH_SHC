# 📋 Unified Task Log

## 🚀 Active Phase: Admin Password Management (Phase 6)

- [x] Implement `apps/admin-app/src/app/forgot-password/page.tsx` <!-- id: 35 -->
- [x] Implement `apps/admin-app/src/app/reset-password/page.tsx` <!-- id: 36 -->
- [x] Update `apps/admin-app/src/app/login/page.tsx` with "Forgot Password?" link <!-- id: 37 -->
- [x] Verify End-to-End Recovery Flow <!-- id: 38 -->

## 🚀 Active Phase: Exam Engine Refinement (Phase 7)

- [x] Implement "Deepest Selection Wins" hierarchical filtering <!-- id: 39 -->
- [x] Resolve API vs SelectionEngine parameter mismatch <!-- id: 40 -->
- [x] Sync `ExamBlueprintService` and `SelectionEngine` logic <!-- id: 41 -->
- [x] Verify Additive Granularity Flow <!-- id: 42 -->

## 🚀 Active Phase: User Management Module (Phase 8)

- [x] Add `is_blocked` column to `users` table <!-- id: 43 -->
- [x] Implement `AdminEngine.toggleBlockStatus` <!-- id: 44 -->
- [x] Update `UserTable` with Block/Unblock actions <!-- id: 45 -->
- [x] Implement Admin Role Management (Edit User Modal) <!-- id: 46 -->
- [x] Verify Profile View (Existing) <!-- id: 47 -->

## 🚀 Active Phase: Session Management (Phase 9)

- [x] Add `last_active_at` to `users` schema <!-- id: 48 -->
- [x] Implement `AuthService.heartbeat` and `TokenService` timeout logic <!-- id: 49 -->
- [x] Implement `AdminEngine` status computation (Online/Idle/Offline) <!-- id: 50 -->
- [x] Update `UserTable` with Real-time Status Indicators <!-- id: 51 -->
- [x] Implement Auto-Logout on Idle (Backend Enforcement) <!-- id: 52 -->

## 🚀 Active Phase: Advanced User Management (Phase 10)
- [x] Backend: Update `AdminEngine.updateUser` to support Password Hashing <!-- id: 53 -->
- [x] Backend: Update `AdminEngine.deleteUser` (Integrity Check/Soft Delete) <!-- id: 54 -->
- [x] Frontend: Add "Change Password" to `EditUserModal` <!-- id: 55 -->
- [x] Frontend: Add "Delete Account" Action (with Confirmation) <!-- id: 56 -->
- [x] Frontend: Add "Deleted Users" Table <!-- id: 57 -->

---

## ✅ Completed Phases

### Phase 9: Session Management
- **Status**: Completed (2026-01-27)
- **Summary**: Implemented Online/Idle/Offline tracking, Heartbeat API, and 5-min Auto-logout enforcement.
- **Cleanup**: Removed temporary migration scripts (`manual-migrate-session.ts`, `count-questions.ts`, etc.).

### Phase 7: Purging Localhost References
- **Status**: Completed (2026-01-27)
- **Summary**: Removed all `localhost` and `127.0.0.1` references from codebase and configuration.
- **Docs**: Updated strictly for production/vercel execution.

### Phase 5: Admin Panel CRUD
- **Status**: Completed (2026-01-26)
- **Summary**: Implemented full CRUD for Domains, Subjects, Topics, Subtopics, Skills, and Users.

---

## 📝 Change Log

### 2026-01-27
- **Docs Consolidation**: Moved `task.md` tracking into `@docs/task.md` per v1.1 Constitution.
- **Production Hardening**: Documentation fully synced with hardened codebase.
