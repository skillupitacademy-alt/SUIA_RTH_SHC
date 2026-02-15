# Admin Session Resilience & Security Guidelines

## 1. Overview
The Admin App employs a "Defense-in-Depth" architecture to balance high security with user productivity. This document outlines the technical implementation of session locking, background resilience, and automated data purging.

## 2. The "Patience Protocol" (Session Locking)
### The Problem
Automated background tasks (Heartbeats, Session Revalidation) periodically hit the API. If a session expires while the user is away and the screen is locked, these 401/403 errors would traditionally trigger a hard redirect to `/login`. This destroys the user's React state and local drafts.

### The Solution: Lock-Aware Circuit Breaker
The `AdminGuard` implements a "Patience Protocol" that checks the `isLocked` state of the application:
- **Locked State:** If a 401 error is detected via the global `auth:unauthorized` event while the terminal is locked, the redirect is suppressed (`e.preventDefault()`).
- **Heartbeat Pause:** The `usePresenceHeartbeat` hook automatically stops all pings while `isLocked` is true, reducing the frequency of background errors.
- **Unlock Sync:** Upon successful password verification, the `AdminLockScreen` performs a full session sync (`getAdminSession`) to refresh local expiry timestamps before unlocking the UI.

## 3. Inactivity Rings
| Ring | Trigger | Action | Impact |
| :--- | :--- | :--- | :--- |
| **Ring 1: Warning** | 3m Idle | `ZConfirmationDialog` | Alert user before locking. |
| **Ring 2: Lock** | 5m Idle | `AdminLockScreen` (Overlay) | UI hidden; background pings paused; state preserved. |
| **Ring 3: Logout** | 60m Idle | `logout()` + Redirect | Hard session termination; storage purge. |

## 4. Security "Shredder" (Data Purge)
To prevent "Tomorrow's Hacker" from accessing stale drafts in `localStorage`:
- **Trigger:** Any transition where `isAuthenticated` becomes `false` (Manual logout, Session timeout, or Token revocation).
- **Action:** Surgical removal of sensitive keys:
  ```typescript
  localStorage.removeItem('quiz-factory-storage-v1');
  ```
- **Scope:** This ensures that even if a machine is stolen, the local drafts are cleared as soon as the session expires.

## 5. Implementation Checklist for New Pages
When building new admin features, ensure:
1.  **State Management:** Use `Zustand` with persistence only for data that *must* survive a refresh.
2.  **Sensitive Data:** If a page handles highly sensitive data, add its storage key to the "Shredder" list in `AdminGuard.tsx`.
3.  **Background Tasks:** Any custom polling hooks should check `isLocked` from `useAuthStore` to avoid background 401s.
