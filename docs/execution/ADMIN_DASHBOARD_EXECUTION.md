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

## 4. Question Bank Management (Phase 6)

Provide a comprehensive view of the questioning engine.

### Data Requirements (All Tables)
The interface must join and display data from:
1.  **Questions**: The core record (Text, Type, Difficulty).
2.  **Topics**: The immediate parent (Name, Complexity, Weight).
3.  **Subjects**: The middle layer (Name).
4.  **Domains**: The top-level category (Name).

### UI Specification: Question Matrix
- **Paginated Table**: Display 20 records per page.
- **Columns**:
    - **Question**: Truncated text with "View" action.
    - **Hierarchy**: Domain > Subject > Topic (Breadcrumb style).
    - **Metadata**: Type (MCQ/Code), Difficulty (Badge).
    - **Status**: Active/Draft/Archived.
    - **Created**: Date.

### API Requirements
- `GET /api/admin/questions`:
    - Support pagination (page, limit).
    - Return flat object with joined hierarchy names.
