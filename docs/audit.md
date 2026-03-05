# Admin Audit Trail
*Phase G6: Accountability & Compliance*

## 📜 Architectural Objective
To create a complete, immutable record of every administrative action performed on the platform — tracking WHO did WHAT, WHEN, and the BEFORE/AFTER values — for accountability, compliance, and debugging.

---

## 🏗️ 1. Audit Log Schema

### A. Database Table
```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES users(id),
  actor_email   TEXT NOT NULL,
  action        TEXT NOT NULL,          -- e.g., 'question.update', 'user.delete', 'blueprint.create'
  entity_type   TEXT NOT NULL,          -- e.g., 'question', 'exam_blueprint', 'user'
  entity_id     UUID,                   -- ID of the affected record
  before_data   JSONB,                  -- Snapshot of record BEFORE change (null for creates)
  after_data    JSONB,                  -- Snapshot of record AFTER change (null for deletes)
  ip_address    TEXT,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',     -- Additional context (route, request_id, etc.)
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### B. Drizzle Schema
- **Action**: Define `auditLogs` table in `packages/db/src/schema/`.
- **Relations**: Link to `users` table for actor details.

---

## 🔧 2. Audit Service

### A. Core Service
```typescript
class AuditService {
  static async log(params: {
    actorId: string;
    actorEmail: string;
    action: string;
    entityType: string;
    entityId?: string;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
    request?: Request;
  }): Promise<void>
  
  static async query(filters: AuditQueryFilters): Promise<AuditLog[]>
}
```

### B. Automatic Capture
- **Strategy**: Wrap `AdminEngine` methods with audit logging.
- **Before/After**: Fetch the record BEFORE mutation, perform mutation, then log both snapshots.
- **Non-Blocking**: Audit writes should NOT block the admin operation. Use `Promise.allSettled` or fire-and-forget.

---

## 📋 3. Actions to Audit

| Entity | Actions | Priority |
|---|---|---|
| **Questions** | create, update, delete, bulk_import | 🔴 High |
| **Exam Blueprints** | create, update, delete, activate, deactivate | 🔴 High |
| **Users** | create, update, delete, role_change, password_reset | 🔴 High |
| **Subjects/Topics** | create, update, delete, reorder | 🟠 Medium |
| **Domains** | create, update, delete | 🟠 Medium |
| **System Config** | env_change, feature_flag_toggle, safe_mode_toggle | 🔴 High |
| **Reports** | regenerate, force_delete | 🟡 Low |

---

## 🖥️ 4. Admin UI

### A. Audit Log Viewer
- **Location**: New tab in admin dashboard: "Activity Log" / "Audit Trail".
- **Features**:
  - Filterable by: actor, action, entity type, date range
  - Searchable by entity ID
  - Expandable rows showing before/after JSON diff
  - Export to CSV

### B. Entity History
- **Action**: On every entity detail page (question editor, user profile), add a "History" tab showing all changes to that specific entity.

---

## 🛡️ 5. Security & Retention

### A. Immutability
- **Rule**: Audit logs are **append-only**. No admin can edit or delete audit records.
- **Implementation**: Remove `DELETE` and `UPDATE` permissions on the `audit_logs` table at the database level.

### B. Retention
- **Active**: Keep 2 years of audit logs in the primary database.
- **Archive**: After 2 years, export to cold storage (S3/GCS) and remove from primary DB.

---

## 🛡️ Implementation Checklist
- [ ] Create `audit_logs` table (Drizzle migration)
- [ ] Build `AuditService` with `log()` and `query()` methods
- [ ] Integrate audit logging into `AdminEngine` mutation methods
- [ ] Capture before/after data snapshots for updates
- [ ] Build Audit Log Viewer page in admin-app
- [ ] Add entity-level History tab to entity detail pages
- [ ] Add CSV export for audit logs
- [ ] Implement 2-year retention policy
- [ ] Add indexes for performant querying
- [ ] Write unit tests for AuditService

---

## 📈 Impact
An audit trail is **legally required** for many educational certification platforms (ISO 27001, SOC 2). It also protects against "who deleted that question?" disputes and provides a forensic trail for debugging production issues.

*Document Version: 1.0*
