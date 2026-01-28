# 🧩 Core Platform Specification

This document consolidates the execution plans and technical implementations for the Auth, Domain, and Runtime Engine layers.

---

## 1. Auth & Identity System
*Source: AUTH_SYSTEM_EXECUTION.md*

### Objective
Implement a production-grade authentication and authorization system using JWT, Refresh Tokens, and Role-Based Access Control (RBAC).

### Core Security Services (`apps/api-server`)
- **Password Service**: bcrypt hashing and verification logic.
- **Token Service**: JWT sign/verify, expiration logic, and rotation.
- **Auth Service**: Main logic for `signup`, `login`, and `refresh`.
- **Hardening**: Global middleware for JWT verification, Rate limiting, and CSRF protection.

### Database Design
- Tables: `roles`, `user_roles`, `refresh_tokens`.
- Users table extensions: `password_hash`, `email_verified`.

### Service Module Map
Physical location: `apps/api-server/src/modules/auth/`

| File | Responsibilities |
| :--- | :--- |
| **`auth.service.ts`** | Orchestrates Signup, Login, and Refresh flows. |
| **`token.service.ts`** | JWT Signing, Verification, and Rotation. |
| **`password.service.ts`** | Hashing (bcrypt) and Comparison. |
| **`security.service.ts`** | Hardening logic (Rate Limits, IP checks). |


---

## 2. Domain & Content Services
*Source: DOMAIN_SERVICES_EXECUTION.md*

### Objective
Build the CRUD layer for the educational hierarchy to allow for content management and discovery.

### Hierarchy (Public API)
- Services for fetching active `domains`, `subjects`, and `topics`.
- Standalone endpoints for deep-linking.

### Content Management (Admin API)
- **Question Service**:
    - Bulk import support.
    - Manual CRUD.
    - Validation of 13-question topic rule (30/30/40 split).
- **Topic Management**: Full CRUD for educational nodes.

### Metadata
- **Skill Service**: Management of granular skills.
- **Topic Skills**: Many-to-Many mapping.

### Service Module Map
Physical location: `apps/api-server/src/modules/`

| Module | File | Responsibilities |
| :--- | :--- | :--- |
| **Domain** | `domain/domain.service.ts` | CRUD for Domains and Subjects. |
| **Question** | `question/question.service.ts` | Question Bank Import/CRUD. |
| **Selection** | `selection-engine/selection.service.ts` | Blueprint Algorithm. |


---

## 3. Runtime Engines
*Source: EXAM_ENGINE_EXECUTION.md*

### Objective
Implement the "Brains" of the platform: The logic that generates exams, evaluates answers, and calculates mastery.

> **Technical Deep Dive**: See **[SYSTEM_ARCHITECTURE.md](../architecture/SYSTEM_ARCHITECTURE.md#1-runtime-engine-architecture)** for the complete Flow Diagram and Engine definitions.


---

## 4. Email Delivery System
*Source: email-delivery.md*

### Overview
The Quiz Platform uses an abstracted email delivery system to handle transactional emails.

### Providers

#### 1. Mock Provider
- **Env**: `EMAIL_PROVIDER=mock`
- **Behavior**: Logs reset links/tokens to server console.
- **Use Case**: Development, CI.

#### 2. Resend Provider
- **Env**: `EMAIL_PROVIDER=resend`
- **Behavior**: Uses official Resend SDK.
- **Use Case**: Production.

### Security
- **Neutrality**: Failures do not reveal account existence.
- **Redaction**: PII redacted from logs.
- **Expirations**: 30 minutes default.

---

## 5. Enterprise Exam Blueprint Generation
*Source: EXAM_BLUEPRINT_GENERATION.md*

### Trigger Conditions
- **Start Enterprise Test**: User initiates session.
- **Admin Generation**: Explicit request.

### Input Parameters
- `domainId`, `subjectId` (optional), `topicId` (optional).
- `difficultyPreference`: 'mixed' | 'simple' | 'intermediate' | 'expert'.
- `questionCount`: Total questions.

### Difficulty Distribution Rules
#### Option A: Mixed (Enterprise Standard)
- **Simple**: 30%
- **Intermediate**: 30%
- **Expert**: 40% (Safe Remainder)

#### Option B: Specific Difficulty
- 100% allocation to selected tier.

### Selection Rules
1. **No Duplicates**: Unique Question IDs.
2. **Randomized**: Shuffled within buckets.
3. **Deterministic**: Saved as static JSON payload.

### Failure Handling
- **Strict Mode**: If insufficient questions exist, ABORT generation. Do not backfill (violates enterprise promise).

---

## 6. Auth Error & Session Handling
*Source: AUTH_ERROR_AND_SESSION_HANDLING.md*

### Error Categories
- **Network**: Generic banner, allow retry.
- **Invalid Credentials**: "Invalid email or password" (Generic). Clear password.
- **Session Expiry**: Toast/Modal. Redirect to `/login`. Clear storage.

### Browser Navigation Enforcement
- **Back Button**: Listen to `popstate`. Intercept navigation. Show modal: "Warning: Navigation Detected. You will be logged out."
- **Forward**: `AuthGuard` re-validates token on mount. Disable cache.

### Implementation Plan
**See [CURRENT_STATE_REPORT.md](../execution/CURRENT_STATE_REPORT.md#backlog-auth-hardening)** for active roadmap.


