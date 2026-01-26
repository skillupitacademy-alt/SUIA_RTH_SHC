# Scalable Admin Governance Terminal

Implement extreme scalability for session monitoring and reorganize the UI for a focused governance experience.

### 1. Backend: Optimized Session Tracking
- [ ] Update `AdminEngine.getLiveSessions(page, limit)`:
    - Implement keyset or offset-based pagination at the database level.
    - Add total count for pagination metadata.
- [ ] Update API route: `GET /api/admin/sessions/live?page=1&limit=10`.

### 2. Frontend: Horizontal Header & Reorganized Sidebar
- [ ] **AdminShell**:
    - Move "ADMIN CORE" logo to the header (left of Super Admin).
    - Label sidebar as "Platform Control".
    - Update sidebar items to match the provided image styles (vibrant pink active state).
- [ ] **Governance Terminal**:
    - Expand to use 100% of available viewport width.
- [ ] **LiveSessionsList**:
    - Implement pagination controls.
    - Set default page size to 10.

### 3. Future Enhancements
- [ ] Live WebSocket updates for session events.
- [ ] Content readiness indicators.
- [ ] Security audit log streaming.

## 🧪 Verification Checkpoints
- [ ] Success: Logging in a new user immediately shows them in the Admin Dashboard.
- [ ] Success: Revoking a session in Admin UI logs the user out on their end.
