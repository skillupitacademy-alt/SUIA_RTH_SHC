# 🛡️ Admin User Journey
**Path**: `docs/pages/admin/ADMIN_JOURNEY.md`

This document defines the restricted access and governance flows for the Admin Platform.

### Codebase Inventory (Traceability)
**Frontend** (`apps/admin-app/src/app/`)
- `page.tsx`: Main Governance Dashboard.
- `login/page.tsx`: Secure Admin Entry.
- `questions/page.tsx`: Question Bank Management (CRUD).
- `users/page.tsx`: User Management.

**Components** (`apps/admin-app/src/components/`)
- `auth/`: `AdminGuard` (RBAC protection).
- `dashboard/`: `AdminStats`, `SecurityHealthPanel`, `ContentReadinessBoard`.
- `content/`: `ContentManager` (Bulk Operations).
- `entry/`: `QuestionEditor` forms.
- `layout/`: `AdminShell` (Sidebar/Header).

---

## 1. Admin Login (Secure Terminal)
*Source: admin-login.md*

### Purpose
Secure entry point for platform administrators ("Secure Governance Terminal").

### UI Structure
- **Layout**: Split Screen (Branding Left, Form Right).
- **Theme**: Dark Mode, Code/Terminal aesthetic.

### Logic
- **Endpoint**: `POST /api/admin/login` (Admin-Specific Auth).
- **Success**: Redirect to Admin Dashboard.
- **Security**: Rate-limited, distinct from user auth.

### Verification
- [ ] Validates admin credentials.
- [ ] Shows "Restricted Access" warning.

---

## 2. Admin Signup (Restricted)
*Source: admin-signup.md*

### Policy
**STRICTLY DISABLED**. There is no public signup for admins.

### Logic
- Any attempt to access `/signup` on Admin App must redirect to `/login`.
- **Future Scope**: Invitation-based flow only (`/invite/accept?token=...`).

---

## 3. Question Bank Orchestration (Command Center)
*Source: QUESTION_BANK.md*

### Purpose
High-fidelity management of the educational hierarchy and content seeding.

### UI Structure
- **Dashboard**: High-density tables with status indicators.
- **Factory**: Full-screen, single-pane surgical IDE with AI assistance.

### Logic
- **Atomic Upsert**: Partial manifests are upserted into the hierarchy transactionally.
- **Contextual IQ**: AI prompts adapt dynamically to Domain/Subject/Topic contexts.

---

## 4. Blueprint Orchestration (Deterministic Standard)
*Source: ORCHESTRATION_STANDARD.md*

### Purpose
Freezing the delivery of harvested questions for deterministic certification.

### UI Structure
- **Designer**: Dual-Protocol toggle (Static Cert vs. Dynamic Practice).
- **Calibration**: Real-time stats grid (Total/Simple/Inter/Expert).

### Logic
- **Static Lock**: Hard-binds a blueprint to specific `question_ids` from a Factory emission.
- **Existence Enforcement**: Rejects certification creation if the question set is null to prevent student-facing errors.
