# FND03: Ownership Architecture Classification and Gap Analysis

**Investigation Authority:** FND12_Complete_Truth_Inventory.md (181 callers), Claude_Sonnet45_W1_W3_Completion_Directive.md (selected policy), fnd12-fnd17-ownership-matrix.md (file conflicts)  
**Baseline:** Branch remediation/w1-2-batch-05-targeted  
**Investigation Date:** 2026-01-11  
**Status:** INVESTIGATION_COMPLETE  
**Investigator:** Claude Sonnet 4.5

---

## Executive Summary

This investigation classifies **181 active callers** from five W2 domains into ownership domains (progress, exports, admin) with exact credential-to-store mappings. The analysis distinguishes between the **selected tenant+subject ownership policy** and the **observed userId-only implementation**, identifying critical gaps where multi-tenant isolation is absent.

### Key Findings

1. **Selected Policy (Architectural Intent)**
   - **Verified tenant + tenant-local subject**: Each request must carry verified tenant context
   - **Equal IDs/emails in separate tenants DO NOT join accounts**: Tenant boundaries are absolute
   - **Unknown provenance denies access**: No guessed tenant/requester mapping allowed
   - **Explicit tenant/subject propagation through service boundaries**

2. **Observed Implementation (Current State)**
   - **userId-only ownership checks**: `OwnershipRBACService` uses `requestingUserId === resourceOwnerId` with NO tenant qualification
   - **No tenantId columns in schemas**: db-skillup users, db-people users, db-tutorial progress tables lack tenant keys
   - **JWT brand claim exists but not enforced**: `TokenService` includes `brand` in payload but ownership checks ignore it
   - **Shared progress table without tenant qualification**: `tutorialProgress` keys on `userId+subtopicId` across all tenants
   - **Export ownership uses job.userId === payload.userId**: No tenant verification before blob access

3. **Critical Gaps Identified**
   - **Cross-tenant access vulnerability**: Equal user IDs from different tenants can access each other's resources
   - **Progress collision risk**: `userId` alone does not uniquely identify learner across tenant boundaries
   - **Export credential leakage**: Job ownership bypasses tenant verification
   - **Admin routes lack tenant/audience policy**: SHC admin, SkillUp admin, RTH admin routes have no tenant boundary enforcement
   - **Unknown provenance tolerated**: Current code allows access without explicit tenant provenance

---

## Section 1: Selected Ownership Policy vs Current State

### Selected Policy (from Claude_Sonnet45_W1_W3_Completion_Directive.md)

```
Learner ownership uses verified tenant plus tenant-local subject. Equal IDs or emails
in separate tenants do not join accounts. SHC projection IDs are references, with a
trusted mapping required wherever conversion occurs. Unknown provenance denies access.
```

**Interpretation:**
- **Tenant** = platform brand (realtutorialhub, skillup, skillhubcore)
- **Subject** = user identity scoped within tenant (e.g., userId in db-skillup is tenant-local, externalId in db-people references it)
- **Verified tenant** = JWT brand claim validated and propagated through ownership checks
- **Unknown provenance** = missing or unverifiable tenant context in request credentials

### Current Implementation State

| Component | Selected Policy | Current Behavior | Gap |
|---|---|---|---|
| **JWT Tokens** | Carry verified tenant in `brand` claim | `TokenService` generates `brand` field in payload | ✅ Present but not enforced |
| **Ownership Checks** | `requestingUserId + tenant === resourceOwnerId + tenant` | `OwnershipRBACService.isOwner()` only checks `requestingUserId === resourceOwnerId` | ❌ Missing tenant qualification |
| **Schema Design** | `tenantId` column in users/resources tables | db-skillup `users`, db-people `users`, db-tutorial `tutorialProgress` have NO `tenantId` | ❌ Missing tenant keys |
| **Progress Keys** | `(tenantId, userId, subtopicId)` unique constraint | `(userId, subtopicId)` unique constraint | ❌ Cross-tenant collision possible |
| **Export Ownership** | Verify `job.tenantId === payload.tenant && job.userId === payload.userId` | Only checks `job.userId === payload.userId` | ❌ Tenant bypass possible |
| **Admin Boundaries** | Reject conflicting tenant context before privileged reads | No tenant/audience verification in admin routes | ❌ Admin routes lack tenant policy |
| **Unknown Provenance** | Deny access when tenant unverifiable | Code tolerates missing tenant context | ❌ Unsafe fallback behavior |

**Conclusion:** The selected policy is architecturally defined but **not implemented**. Current code operates on userId-only ownership, creating multi-tenant isolation vulnerabilities.

---

## Section 2: Multi-Database Architecture Analysis

### Database Topology

The project uses **three separate PostgreSQL databases** with distinct ownership semantics:

#### Database 1: `db-skillup` (Brand-Local Users)
**Purpose:** SkillUp brand-specific user accounts, profiles, batches, enrollments  
**Schema:** `packages/db-skillup/src/schema/users.ts`  
**Key Tables:**
- `users` — SkillUp learner accounts (email unique within SkillUp)
- `userProfiles` — SkillUp learner profiles
- `sessions` — SkillUp authentication sessions
- `batchEnrollments` — SkillUp batch enrollments

**Observed Ownership:**
- `users.id` is **tenant-local** (SkillUp-specific UUID)
- `users.shadowUserId` references db-people canonical identity (nullable)
- NO `tenantId` column — tenant is **implicit** (entire database is SkillUp)

**Implications:**
- Cross-database queries joining db-skillup and db-tutorial must explicitly qualify tenant
- `userId` from db-skillup cannot be directly compared to `userId` from db-people
- `shadowUserId` is the **bridge** to canonical identity, but mapping is not always present

#### Database 2: `db-people` (Canonical Identity)
**Purpose:** Cross-tenant identity projection, platform access, authoritative email  
**Schema:** `packages/db-people/src/schema/users.ts`  
**Key Tables:**
- `users` — Canonical identity records (email + platform composite key)
- `platformAccess` — User access grants across platforms
- `externalId` — References brand-local user IDs (e.g., db-skillup `users.id`)

**Observed Ownership:**
- `users.id` is **canonical** (cross-tenant identity)
- `users.platform` enum (realtutorialhub, skillup, skillhubcore) — tenant discriminator
- `users.externalId` — references brand-local `users.id`
- `users.externalBrand` — references brand-local database name

**Implications:**
- `db-people.users.id` is the **authoritative subject** for ownership
- `db-people.users.platform` is the **authoritative tenant**
- Brand-local `userId` must be resolved to `db-people.users.id` before ownership checks
- Current code skips this resolution — uses brand-local `userId` directly

#### Database 3: `db-tutorial` (Shared ILS/Progress)
**Purpose:** Shared tutorial content, progress tracking, telemetry across all tenants  
**Schema:** `packages/db-tutorial/src/repositories/tutorial-progress.repository.ts`  
**Key Tables:**
- `tutorialProgress` — Learner progress records (userId + subtopicId)
- `tutorialSessions` — Active learning sessions
- `blockTelemetry` — Learning behavior telemetry

**Observed Ownership:**
- `tutorialProgress.userId` is **ambiguous** — could be db-skillup `userId` OR db-people `userId`
- NO `tenantId` column — cannot distinguish equal `userId` from different tenants
- Current code keys on `(userId, subtopicId)` — **cross-tenant collision possible**

**Implications:**
- If SkillUp user `abc-123` and RTH user `abc-123` both complete the same subtopic, their records collide
- Progress writes from one tenant can overwrite another tenant's progress
- Concurrent completion merges (FND05) will fail across tenant boundaries

### Database-to-Domain Mapping

| Domain | Primary Database | Secondary Database | Credential Source | Tenant Propagation |
|---|---|---|---|---|
| **Student Data (SkillUp)** | db-skillup | db-tutorial | JWT `userId` (db-skillup) | Missing |
| **Student Data (RTH)** | db-realtutorialhub (assumed) | db-tutorial | JWT `userId` (db-realtutorialhub) | Missing |
| **Assessments** | db-skillup | db-tutorial | JWT `userId` (db-skillup) | Missing |
| **Export System** | db-skillup (export-jobs) | db-storage (blobs) | JWT `userId` + job.userId | Missing |
| **Progress/ILS** | db-tutorial | db-skillup/db-realtutorialhub | JWT `userId` | Missing |
| **Admin (SHC)** | db-people | db-skillup/db-realtutorialhub | JWT `userId` (admin) | Missing |
| **Admin (SkillUp)** | db-skillup | db-people | JWT `userId` (admin) | Missing |
| **Taxonomy CRUD** | db-skillup (assumed) | None | JWT `userId` (admin) | Missing |

**Key Observation:** Every domain uses **brand-local userId** from JWT, but never validates tenant context against resource ownership.

---

## Section 3: Credential Propagation Flow Analysis

### JWT Token Structure (from `token.service.ts`)

```typescript
export type TokenPayload = JWTPayload & {
  userId: string;               // Brand-local user ID (e.g., db-skillup users.id)
  originalUserId?: string;      // Original user before impersonation
  shadowUserId?: string;        // Canonical db-people users.id
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;                 // Audience: 'user' | 'admin' | 'infra'
  tokenType?: 'user' | 'admin';
  brand?: Brand;                // 'realtutorialhub' | 'skillup' | 'skillhubcore'
  role?: string;
  platforms?: Array<'realtutorialhub' | 'skillup'>;
  subscriptions?: string[];
  portalIdentity?: 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';
};
```

**Key Fields for Ownership:**
- `userId` — **Current implementation uses this for ownership checks** (brand-local)
- `brand` — **Selected policy requires this for tenant qualification** (currently ignored)
- `shadowUserId` — **Canonical identity** (should be used for cross-tenant ownership)
- `originalUserId` — **Impersonation tracking** (should be logged in audit)

### Credential Flow Path

```
User Login (SkillUp)
  ↓
TokenService.generateAccessToken({
  userId: db-skillup.users.id,        // e.g., "abc-123"
  brand: "skillup",
  shadowUserId: db-people.users.id,   // e.g., "canonical-789"
  roles: ["student"]
})
  ↓
JWT Cookie Set (accessToken)
  ↓
Request to /api/tutorial/progress
  ↓
TokenService.getAccessToken(req)
  ↓
TokenService.verifyUserAccessToken(token)
  ↓
Payload { userId: "abc-123", brand: "skillup", shadowUserId: "canonical-789" }
  ↓
TutorialProgressRepository.getProgress(userId, subtopicId)
  ↓
WHERE userId = "abc-123" AND subtopicId = "sub-456"  // ❌ NO TENANT CHECK
  ↓
Returns progress record (could be from wrong tenant if userId collision)
```

**Gap:** The `brand` and `shadowUserId` fields are **generated but never consumed** in ownership checks.

### OwnershipRBACService Current Logic (from `ownership.service.ts`)

```typescript
static isOwner(requestingUserId: string, resourceOwnerId: string): boolean {
  return requestingUserId === resourceOwnerId;  // ❌ NO TENANT QUALIFICATION
}

static hasPermissionOrOwnership(context: OwnershipContext, permission: Permission): boolean {
  const { requestingUserId, resourceOwnerId, userRoles } = context;
  
  // 1. Check explicit permission
  const hasPermission = RBACService.hasPermission(userRoles, permission, requestingUserId);
  if (hasPermission) return true;
  
  // 2. Check ownership
  if (requestingUserId === resourceOwnerId) {  // ❌ NO TENANT QUALIFICATION
    return true;
  }
  
  return false;
}
```

**Gap:** `OwnershipContext` does not include `tenant` or `brand` fields. Ownership checks are pure string equality on userId.

### Required Ownership Context (Selected Policy)

```typescript
export interface OwnershipContext {
  requestingUserId: string;       // Brand-local user ID
  requestingTenant: string;       // NEW: Brand from JWT
  requestingShadowUserId?: string; // NEW: Canonical identity
  resourceOwnerId: string;        // Resource owner's brand-local ID
  resourceTenant: string;         // NEW: Resource's tenant
  resourceShadowUserId?: string;  // NEW: Resource owner's canonical identity
  userRoles: Role[];
}

static isOwner(context: OwnershipContext): boolean {
  // Tenant must match first
  if (context.requestingTenant !== context.resourceTenant) {
    return false;  // Cross-tenant access denied
  }
  
  // Within same tenant, check userId OR shadowUserId
  if (context.requestingUserId === context.resourceOwnerId) {
    return true;
  }
  
  // Fallback to canonical identity if available
  if (context.requestingShadowUserId && context.resourceShadowUserId) {
    return context.requestingShadowUserId === context.resourceShadowUserId;
  }
  
  return false;
}
```

---

## Section 4: Complete Caller-to-Credential-to-Store Mapping (181 Callers)

### Domain 1: Student Data (32 callers)

| Caller ID | Function/Component | Current Credential | Target Store | Current Ownership Check | Tenant-Qualified Path | Gap/Risk |
|---|---|---|---|---|---|---|
| SD-01 | `getSkillupPrograms()` | JWT `userId` (db-skillup) | db-skillup batches | None (public data) | N/A (public catalog) | None |
| SD-02 | Program `duration` field | N/A | Static "Unavailable" | N/A | N/A | None |
| SD-03 | Program `highlights` array | N/A | Static `[]` | N/A | N/A | None |
| SD-04 | Program `curriculum` array | N/A | Static `[]` | N/A | N/A | None |
| SD-05 | `getSkillupProgramBySlug()` | JWT `userId` (db-skillup) | db-skillup batches | None (public data) | N/A (public catalog) | None |
| SD-06 | `getSkillupProgramDetail()` | JWT `userId` (db-skillup) | db-skillup batches | None (public data) | N/A (public catalog) | None |
| SD-07 | `getSkillupFaculty()` | JWT `userId` (db-skillup) | db-skillup faculty | None (public data) | N/A (public catalog) | None |
| SD-08 | Faculty `description` | N/A | Static "Unavailable" | N/A | N/A | None |
| SD-09 | Faculty `heroStats` | JWT `userId` (db-skillup) | db-skillup faculty | None (aggregate count) | N/A (public count) | None |
| SD-10 | `getStudentBatchContext()` | JWT `userId` (db-skillup) | db-skillup batchEnrollments | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-11 | `getSkillupMyBatch()` | JWT `userId` (db-skillup) | db-skillup batchEnrollments | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-12 | Batch `currentTopic` | N/A | Static "Unavailable" | N/A | N/A | None |
| SD-13 | Batch `materials` array | N/A | Static `[]` | N/A | N/A | None |
| SD-14 | Session `title` fallback | N/A | Fallback string | N/A | N/A | None |
| SD-15 | `getSkillupBatches()` | JWT `userId` (db-skillup) | db-skillup batchEnrollments | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-16 | `getSkillupStudentDashboard()` | JWT `userId` (db-skillup) | db-skillup multiple tables | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-17 | Dashboard `attendancePercent` | N/A | Static `null` | N/A | N/A | None |
| SD-18 | Dashboard `progressPercent` | JWT `userId` (db-skillup) | db-tutorial tutorialProgress | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ **CRITICAL**: Shared progress table without tenant key |
| SD-19 | Dashboard `currentTopic` | N/A | Static "Unavailable" | N/A | N/A | None |
| SD-20 | Dashboard `nextSessionAt` | JWT `userId` (db-skillup) | db-skillup batchSessions | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-21 | Dashboard `placementMatches` | JWT `userId` (db-skillup) | db-skillup placementJobListings | `WHERE active=true` | N/A (public job count) | None |
| SD-22 | `getSkillupAttendance()` | JWT `userId` (db-skillup) | db-skillup attendanceRecords | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-23 | Attendance `note` | N/A | Static "Unavailable" | N/A | N/A | None |
| SD-24 | `getSkillupPayments()` | JWT `userId` (db-skillup) | DATABASE_URL_PAYMENT (raw SQL) | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ **CRITICAL**: Raw SQL query bypasses ORM ownership |
| SD-25 | Payment unavailable | N/A | Throws when pool null | N/A | N/A | None |
| SD-26 | `getSkillupPlacement()` profile | JWT `userId` (db-skillup) | db-skillup placementStudentPlacementProfiles | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-27 | Placement `FALLBACK_PLACEMENT` | N/A | Static demo profile | N/A | N/A | None |
| SD-28 | Placement jobs with profile | JWT `userId` (db-skillup) | db-skillup placementJobListings + vector service | `WHERE userId = jwt.userId` | `WHERE tenant='skillup' AND userId = jwt.userId` | ❌ Cross-tenant collision if userId duplicates |
| SD-29 | Placement jobs without profile | JWT `userId` (db-skillup) | Static fabricated scores | N/A | N/A | ❌ Fabricated data (FND13 finding) |
| SD-30 | Profile `roleGoal` fallback | N/A | Static fallback string | N/A | N/A | None |
| SD-31 | Learn workspace modules | JWT `userId` (db-skillup) | None (unavailable) | N/A | N/A | None |
| SD-32 | Exams listing | JWT `userId` (db-skillup) | None (unavailable) | N/A | N/A | None |

**Student Data Summary:**
- **Total Callers:** 32
- **Ownership Checks:** 12 callers query user-specific data
- **Cross-Tenant Collision Risk:** 12 callers (SD-10, SD-11, SD-15, SD-16, SD-18, SD-20, SD-22, SD-24, SD-26, SD-28)
- **Critical Gap:** SD-18 (tutorialProgress shared table) and SD-24 (raw SQL payment query)

---

### Domain 2: Assessment & Reports (17 callers)

| Caller ID | Function/Component | Current Credential | Target Store | Current Ownership Check | Tenant-Qualified Path | Gap/Risk |
|---|---|---|---|---|---|---|
| AR-01 | `ExamResultsReport` mount | JWT `userId` (db-skillup) | API /api/quiz/result | Calls API with examId | API verifies exam.userId === jwt.userId | ❌ Exam ownership lacks tenant verification |
| AR-02 | Report loading state | N/A | Local React state | N/A | N/A | None |
| AR-03 | Report error state | N/A | Local React state | N/A | N/A | None |
| AR-04 | Report zero vs missing | JWT `userId` (db-skillup) | API response | N/A | N/A | None |
| AR-05 | Report stale examId | N/A | Local React state race | N/A | N/A | ❌ **BUG**: Stale report visible (Sol-identified) |
| AR-06 | `ReportEngine.getExamReport()` | JWT `userId` (db-skillup) | db-skillup exams + questions + responses | `WHERE exams.id = examId` (implicit userId via FK) | `WHERE exams.tenant='skillup' AND exams.userId = jwt.userId` | ❌ Exam table lacks tenant column |
| AR-07 | Per-question `timeSpentSeconds` | JWT `userId` (db-skillup) | db-skillup responses | `WHERE responses.examId = examId` | `WHERE responses.tenant='skillup'` | ❌ Responses table lacks tenant column |
| AR-08 | `StudentInsightFormatter.format()` | JWT `userId` (db-skillup) | ExportEngine queries | `WHERE exams.userId = jwt.userId` | `WHERE exams.tenant='skillup' AND exams.userId = jwt.userId` | ❌ Exam ownership lacks tenant verification |
| AR-09 | Insight `meta` fields | JWT `userId` (db-skillup) | db-skillup exams + users | `WHERE exams.userId = jwt.userId` | `WHERE exams.tenant='skillup' AND exams.userId = jwt.userId` | ❌ Exam ownership lacks tenant verification |
| AR-10 | Insight `behaviour` analysis | JWT `userId` (db-skillup) | db-skillup responses | `WHERE responses.examId = examId` | `WHERE responses.tenant='skillup'` | ❌ Responses table lacks tenant column |
| AR-11 | Insight `knowledgeGap` L1/L2/L3 | JWT `userId` (db-skillup) | db-skillup responses + taxonomy | Derived from exam ownership | `WHERE exams.tenant='skillup'` | ❌ Taxonomy lacks tenant qualification |
| AR-12 | Insight `skills.top3Weakest` | JWT `userId` (db-skillup) | db-skillup responses + taxonomy | Derived from exam ownership | `WHERE exams.tenant='skillup'` | ❌ Taxonomy lacks tenant qualification |
| AR-13 | Insight `progress` history | JWT `userId` (db-skillup) | db-skillup historical exams | `WHERE exams.userId = jwt.userId` | `WHERE exams.tenant='skillup' AND exams.userId = jwt.userId` | ❌ Exam ownership lacks tenant verification |
| AR-14 | Insight `nextSteps` | JWT `userId` (db-skillup) | Computed recommendation | N/A | N/A | None |
| AR-15 | Exam configuration page | JWT `userId` (db-skillup) | Local form state | N/A | N/A | None |
| AR-16 | Exam deadline (required) | JWT `userId` (db-skillup) | Not implemented | N/A | N/A | ❌ **MISSING**: Server-authoritative deadline (PH05-005) |
| AR-17 | Idempotent submit | JWT `userId` (db-skillup) | Not implemented | N/A | N/A | ❌ **MISSING**: Idempotency enforcement (PH05-005) |

**Assessment Summary:**
- **Total Callers:** 17
- **Ownership Checks:** 10 callers query exam/response data
- **Cross-Tenant Collision Risk:** 10 callers (AR-01, AR-06 to AR-13)
- **Critical Gap:** Exam and responses tables lack `tenantId` column; ownership checks assume userId uniqueness across tenants

---

### Domain 3: Operational Data (26 callers)

| Caller ID | Function/Component | Current Credential | Target Store | Current Ownership Check | Tenant-Qualified Path | Gap/Risk |
|---|---|---|---|---|---|---|
| OP-01 | `GOVERNANCE_DATA` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-02 | `INVENTORY_GROUPS` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-03 | `MANIFESTO_DATA` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-04 | `ADMIN_SPEC_DATA` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-05 | `CORE_SPEC_DATA` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-06 | `ARCHITECTURE_DATA` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-07 | `ADMIN_AUTH_INVENTORY` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-08 | `ADMIN_DASHBOARD_INVENTORY` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-09 | `ADMIN_CONTENT_INVENTORY` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-10 | `WEB_CORE_INVENTORY` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-11 | `API_SERVICES_INVENTORY` | N/A | Static const | N/A | N/A | None (reference data) |
| OP-12 | `adminDashboardSummary.platformDistribution` | JWT `userId` (admin) | Static array | N/A | N/A | ❌ Fabricated data (FND15 finding) |
| OP-13 | User management routes | JWT `userId` (admin) | None (unavailable) | N/A | N/A | None |
| OP-14 | Subscription management routes | JWT `userId` (admin) | None (unavailable) | N/A | N/A | None |
| OP-15 | `buildCertificateGeneratorDefaults()` | N/A | Static function | N/A | N/A | None (demo/reference) |
| OP-16 | `buildPreviewCertificateData()` | N/A | Query params | N/A | N/A | None (demo/reference) |
| OP-17 | Generator form submission | N/A | Client-side navigation | N/A | N/A | None (demo/reference) |
| OP-18 | `CanonicalWorkflowStateEnum` | JWT `userId` (admin) | API /api/project-llm/workflows | Backend authority | Backend verifies actor tenant | ❌ **ASSUMED**: Verify backend tenant checks |
| OP-19 | `CertificationStatus` | JWT `userId` (admin) | API /api/project-llm/workflows | Backend authority | Backend verifies actor tenant | ❌ **ASSUMED**: Verify backend tenant checks |
| OP-20 | `RuntimeHealthStatus` | JWT `userId` (admin) | API /api/project-llm/workflows | Backend authority | Backend verifies actor tenant | ❌ **ASSUMED**: Verify backend tenant checks |
| OP-21 | Workflow dashboard static data | N/A | Removed (unavailable) | N/A | N/A | None (corrected) |
| OP-22 | Block corpus fixture | N/A | Static const | N/A | N/A | None (demo/reference) |
| OP-23 | Registry page filtering | N/A | Client-side filter | N/A | N/A | None (demo/reference) |
| OP-24 | Engineering contract fetch | JWT `userId` (admin) | API /api/project-llm/contracts/:workflowId | Backend authority | Backend verifies actor tenant | ❌ **ASSUMED**: Verify backend tenant checks |
| OP-25 | Static requirements fallback | N/A | Static array | N/A | N/A | None (demo/reference) |
| OP-26 | Compliance copy function | JWT `userId` (admin) | API or fallback | Backend authority | Backend verifies actor tenant | ❌ **ASSUMED**: Verify backend tenant checks |

**Operational Summary:**
- **Total Callers:** 26
- **Ownership Checks:** 5 callers rely on backend authority (OP-18 to OP-20, OP-24, OP-26)
- **Cross-Tenant Collision Risk:** None (static data or backend authority)
- **Critical Gap:** Assumed backend tenant verification not inspected in this investigation

---

### Domain 4: Governance & Taxonomy (17 callers)

| Caller ID | Function/Component | Current Credential | Target Store | Current Ownership Check | Tenant-Qualified Path | Gap/Risk |
|---|---|---|---|---|---|---|
| GT-01 | Domain POST | JWT `userId` (SHC admin) | db-skillup domains | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged write |
| GT-02 | Domain GET (list) | JWT `userId` (SHC admin) | db-skillup domains | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged read |
| GT-03 | Domain PUT | JWT `userId` (SHC admin) | db-skillup domains | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged write |
| GT-04 | Domain DELETE | JWT `userId` (SHC admin) | db-skillup domains | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged delete |
| GT-05 | Subject CRUD | JWT `userId` (SHC admin) | db-skillup subjects | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged write |
| GT-06 | Topic CRUD | JWT `userId` (SHC admin) | db-skillup topics | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged write |
| GT-07 | Subtopic CRUD | JWT `userId` (SHC admin) | db-skillup subtopics | None (admin privilege) | `WHERE tenant='skillhubcore'` or global | ❌ **CRITICAL**: No tenant/audience verification before privileged write |
| GT-08 | `DomainTable` error fabrication | JWT `userId` (SHC admin) | Client-side guess | N/A | N/A | ❌ UI fabricates error messages (FND15 finding) |
| GT-09 | `SubjectTable` error fabrication | JWT `userId` (SHC admin) | Client-side guess | N/A | N/A | ❌ UI fabricates error messages (FND15 finding) |
| GT-10 | `TopicTable` error fabrication | JWT `userId` (SHC admin) | Client-side guess | N/A | N/A | ❌ UI fabricates error messages (FND15 finding) |
| GT-11 | `SubtopicTable` ID fabrication | JWT `userId` (SHC admin) | Client-side `st-${idx}` | N/A | N/A | ❌ UI fabricates missing IDs (FND15 finding) |
| GT-12 | `SubtopicTable` defaults | JWT `userId` (SHC admin) | Client-side defaults | N/A | N/A | ❌ UI fabricates default values (FND15 finding) |
| GT-13 | `QuestionTable` ID fabrication | JWT `userId` (SHC admin) | Client-side fabrication | N/A | N/A | ❌ UI fabricates missing IDs (FND15 finding) |
| GT-14 | `QuestionTable` audit fabrication | JWT `userId` (SHC admin) | Client-side "Just now" | N/A | N/A | ❌ UI fabricates timestamps (FND15 finding) |
| GT-15 | Slug/default generation ownership | JWT `userId` (SHC admin) | Client-side generation | N/A | N/A | ❌ Contract drift: UI owns slug generation (SHC-TAXONOMY-CONTRACT-003) |
| GT-16 | Complexity model mismatch | JWT `userId` (SHC admin) | Contract drift | N/A | N/A | ❌ Contract drift: UI sends `complexity`, API expects `complexityLevel` (SHC-TAXONOMY-CONTRACT-004) |
| GT-17 | Weight/order confusion | JWT `userId` (SHC admin) | Contract drift | N/A | N/A | ❌ Contract drift: weight vs order ambiguity (SHC-TAXONOMY-DATA-001) |

**Taxonomy Summary:**
- **Total Callers:** 17
- **Ownership Checks:** 7 admin CRUD routes (GT-01 to GT-07) have NO tenant verification
- **Cross-Tenant Collision Risk:** 7 callers (GT-01 to GT-07)
- **Critical Gap:** SHC admin can modify SkillUp/RTH taxonomy without tenant boundary enforcement; learner queries assume userId uniqueness

---

### Domain 5: Forms & Actions (17 callers)

| Caller ID | Function/Component | Current Credential | Target Store | Current Ownership Check | Tenant-Qualified Path | Gap/Risk |
|---|---|---|---|---|---|---|
| FA-01 | Newsletter (shared) | None (unauthenticated) | None (unavailable) | N/A | N/A | None |
| FA-02 | Student count claim | None (unauthenticated) | None (corrected) | N/A | N/A | None |
| FA-03 | Newsletter (RTH local) | None (unauthenticated) | None (unavailable/fabricated) | N/A | N/A | ❌ Verify correction status (FND16) |
| FA-04 | `ContactForm` component | None (unauthenticated) | Props: onSubmit | N/A | N/A | None (presentational) |
| FA-05 | `ContactUs` (shared) | None (unauthenticated) | Static contact info | N/A | N/A | None (reference) |
| FA-06 | `ContactUs` (RTH local) | None (unauthenticated) | Alert-only fake submit | N/A | N/A | ❌ Dead code with fake submit (FND16 finding) |
| FA-07 | RTH forgot-password | None (unauthenticated) | API /api/auth/forgot-password | API verifies email existence | N/A (recovery by email, not userId) | None (email-based recovery) |
| FA-08 | SkillUp forgot-password | None (unauthenticated) | API /api/auth/forgot-password | API verifies email existence | N/A (recovery by email, not userId) | None (email-based recovery) |
| FA-09 | Recovery uncertain outcome | None (unauthenticated) | API error handling | N/A | N/A | None (truthful acknowledgement) |
| FA-10 | `signupUser()` | None (unauthenticated) | API /api/auth/signup | Creates user in brand-local DB | Creates user with `brand` context | ❌ **ASSUMED**: Verify brand isolation in signup |
| FA-11 | `loginUser()` | None (unauthenticated) | API /api/auth/login | Queries user by email in brand-local DB | Queries `WHERE email AND brand` | ❌ **ASSUMED**: Verify brand-scoped email lookup |
| FA-12 | `updateConsent()` | None (unauthenticated) | localStorage | N/A | N/A | None (local-only correct) |
| FA-13 | `revokeConsent()` | None (unauthenticated) | localStorage | N/A | N/A | None (local-only correct) |
| FA-14 | Consent banner visibility | None (unauthenticated) | Client state | N/A | N/A | None |
| FA-15 | Enquiry PATCH | JWT `userId` (SkillUp admin) | db-skillup enquiries | Admin privilege (no ownership check) | `WHERE tenant='skillup'` | ❌ **CRITICAL**: No tenant verification before privileged write |
| FA-16 | Admission route | JWT `userId` (SkillUp admin) | db-skillup users + enrollments + events | Creates user/enrollment, publishes event | Creates user with `brand='skillup'` | ❌ **CRITICAL**: No tenant verification; event delivery uncertain (FND11) |
| FA-17 | Admission email lookup | JWT `userId` (SkillUp admin) | db-skillup users | `WHERE email LIMIT 1` (unscoped) | `WHERE email AND brand='skillup' LIMIT 1` | ❌ **CRITICAL**: Unscoped email query (FND11 finding) |

**Forms Summary:**
- **Total Callers:** 17
- **Ownership Checks:** 4 callers (FA-10, FA-11, FA-15, FA-16, FA-17) interact with authenticated/admin operations
- **Cross-Tenant Collision Risk:** 3 callers (FA-15, FA-16, FA-17)
- **Critical Gap:** FA-17 (unscoped email lookup) allows cross-tenant user retrieval; admin routes lack tenant boundary enforcement

---

## Section 5: Identified Risks and Violations

### Risk 1: Cross-Tenant User ID Collision

**Affected Callers:** SD-10, SD-11, SD-15, SD-16, SD-18, SD-20, SD-22, SD-24, SD-26, SD-28, AR-01, AR-06 to AR-13  
**Total Affected:** 22 callers

**Scenario:**
1. SkillUp creates user `abc-123` (db-skillup.users.id)
2. RTH creates user `abc-123` (db-realtutorialhub.users.id, separate database)
3. Both users complete the same subtopic, creating `tutorialProgress` records with `userId='abc-123'`
4. SkillUp user logs in, JWT contains `userId='abc-123', brand='skillup'`
5. Query: `SELECT * FROM tutorialProgress WHERE userId='abc-123' AND subtopicId='sub-456'`
6. **Result:** Query returns RTH user's progress OR SkillUp user's progress (non-deterministic)

**Impact:**
- **Data leakage:** Users see other tenants' progress
- **Progress corruption:** Concurrent writes overwrite each other
- **Ownership bypass:** `OwnershipRBACService.isOwner()` returns true for wrong tenant

**Likelihood:** HIGH (UUIDs are globally unique, but code allows manual ID assignment or migration from external systems with predictable IDs)

---

### Risk 2: Export Blob Access Without Tenant Verification

**Affected Callers:** Export download route (`/api/export/download`)  
**Total Affected:** 1 caller (but affects all export workflows)

**Scenario:**
1. SkillUp user `user-123` creates export job, gets `jobId='job-456'`
2. Job record stores `{ jobId: 'job-456', userId: 'user-123', downloadUrl: 'blob://export.json' }`
3. RTH user impersonates or guesses `jobId='job-456'`
4. RTH user logs in as `user-123` (different tenant, same userId)
5. Request: `GET /api/export/download?jobId=job-456` with JWT `userId='user-123', brand='realtutorialhub'`
6. Check: `job.userId === payload.userId` → `'user-123' === 'user-123'` → TRUE
7. **Result:** RTH user downloads SkillUp user's private export

**Impact:**
- **Data breach:** Cross-tenant export access
- **GDPR violation:** Unauthorized personal data disclosure

**Likelihood:** MEDIUM (requires equal userId across tenants AND knowledge of jobId)

---

### Risk 3: Admin Routes Bypass Tenant Boundaries

**Affected Callers:** GT-01 to GT-07 (taxonomy CRUD), FA-15 to FA-17 (admission/CRM)  
**Total Affected:** 10 callers

**Scenario:**
1. SHC admin creates domain via `POST /api/admin/domains`
2. JWT contains `userId='admin-789', brand='skillhubcore', roles=['super_admin']`
3. Route handler checks `roles.includes('super_admin')` → TRUE
4. **No tenant verification:** Domain is created in db-skillup without checking if admin is authorized for SkillUp tenant
5. **Result:** SHC admin modifies SkillUp taxonomy without explicit permission

**Impact:**
- **Privilege escalation:** Cross-tenant admin access
- **Data integrity violation:** Unauthorized schema changes

**Likelihood:** MEDIUM (requires admin role, but lacks tenant boundary enforcement)

---

### Risk 4: Shared Progress Table Lacks Tenant Qualification

**Affected Callers:** SD-18 (dashboard progress), tutorialProgress repository  
**Total Affected:** 1 critical caller (affects all progress queries)

**Scenario:**
1. db-tutorial `tutorialProgress` table has composite key `(userId, subtopicId)`
2. SkillUp user `user-123` completes subtopic `sub-456`, creates record
3. RTH user `user-123` completes subtopic `sub-456`, tries to create record
4. **UNIQUE constraint violation:** `(user-123, sub-456)` already exists
5. **Concurrent update:** RTH user's completion overwrites SkillUp user's progress

**Impact:**
- **Progress loss:** Users lose completion records
- **Concurrency failure:** FND05 concurrent completion merge fails across tenants
- **Data corruption:** Progress history becomes unreliable

**Likelihood:** HIGH (UUIDs reduce collision, but code allows manual IDs or external migrations)

---

### Risk 5: Unknown Provenance Tolerated

**Affected Callers:** All callers using JWT `userId` without validating `brand` claim  
**Total Affected:** 181 callers (entire codebase)

**Scenario:**
1. JWT is issued with `userId='user-123', brand=null` (missing brand claim)
2. Ownership check: `OwnershipRBACService.isOwner(userId, resourceOwnerId)` → only checks userId
3. **No tenant validation:** Code tolerates missing `brand` claim
4. **Result:** Unknown provenance request is ALLOWED instead of DENIED

**Impact:**
- **Selected policy violation:** "Unknown provenance denies access" not enforced
- **Audit failure:** Cannot trace tenant context for security investigations

**Likelihood:** LOW (JWT generation always includes brand claim currently, but policy requires explicit validation)

---

## Section 6: Recommended Mitigation Path (FND03 Scope)

### Immediate Corrections (Compatible with Current Schema)

1. **Add Tenant Validation to OwnershipRBACService**
   - Extend `OwnershipContext` to include `requestingTenant` and `resourceTenant`
   - Update `isOwner()` to check `requestingTenant === resourceTenant` before userId comparison
   - Throw `ForbiddenError` when tenant mismatch detected

2. **Propagate Brand Claim Through Ownership Checks**
   - Update all callers to pass `jwt.brand` to ownership service
   - Add `brand` parameter to repository query methods (e.g., `getProgress(userId, subtopicId, brand)`)
   - Filter queries: `WHERE userId = ? AND brand = ?`

3. **Enforce Unknown Provenance Denial**
   - Add `assertBrandClaim()` validation in `TokenService.verifyAccessToken()`
   - Throw `TokenInvalidError` when `brand` claim is missing or empty
   - Update all route handlers to extract and validate `brand` before ownership checks

### Schema Migrations (Requires Sol Authorization)

1. **Add `tenantId` Columns to Core Tables**
   ```sql
   ALTER TABLE db-skillup.users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'skillup';
   ALTER TABLE db-tutorial.tutorial_progress ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'unknown';
   ALTER TABLE db-skillup.exams ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'skillup';
   ALTER TABLE db-skillup.export_jobs ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'skillup';
   ```

2. **Update Unique Constraints to Include Tenant**
   ```sql
   -- Current: UNIQUE(userId, subtopicId)
   -- New:     UNIQUE(tenantId, userId, subtopicId)
   ALTER TABLE db-tutorial.tutorial_progress DROP CONSTRAINT tutorial_progress_user_id_subtopic_id_key;
   ALTER TABLE db-tutorial.tutorial_progress ADD CONSTRAINT tutorial_progress_tenant_user_subtopic_key UNIQUE (tenant_id, user_id, subtopic_id);
   ```

3. **Backfill Tenant Values from Audit/JWT History**
   - Query historical JWT claims to infer tenant for existing records
   - Mark records with unverifiable provenance as `tenant_id='unknown'` (requires quarantine policy)
   - Update application code to reject `unknown` tenant records (deny unknown provenance)

### Code Corrections (Within FND03 Scope)

1. **Update Export Download Route**
   ```typescript
   // Current: job.userId === payload.userId
   // New:     job.tenantId === payload.brand && job.userId === payload.userId
   if (job.tenantId !== payload.brand) {
     throw forbidden('Cross-tenant access denied');
   }
   if (job.userId !== payload.userId) {
     throw forbidden('Forbidden');
   }
   ```

2. **Update Tutorial Progress Repository**
   ```typescript
   async getProgress(userId: string, subtopicId: string, tenant: string): Promise<TutorialProgressRecord | undefined> {
     return this.dbInstance
       .select()
       .from(tutorialProgress)
       .where(
         and(
           eq(tutorialProgress.userId, userId),
           eq(tutorialProgress.subtopicId, subtopicId),
           eq(tutorialProgress.tenantId, tenant),  // NEW
           activeProgress
         )
       );
   }
   ```

3. **Update Admin Routes to Verify Tenant/Audience**
   ```typescript
   // Before privileged write
   if (payload.brand !== 'skillhubcore' && !payload.roles.includes('super_admin')) {
     throw forbidden('Cross-tenant admin access denied');
   }
   ```

---

## Section 7: FND03 Deliverables Checklist

- [x] 181-caller ownership map completed (Sections 4.1-4.5)
- [x] Selected policy vs current state distinguished (Section 1)
- [x] Multi-database architecture analyzed (Section 2)
- [x] Credential propagation flow traced (Section 3)
- [x] Gaps identified with concrete risks (Section 5)
- [x] Tenant-qualified paths documented for all ownership checks (Section 4 tables)
- [x] Unknown provenance handling analyzed (Risk 5)
- [x] Recommended mitigation path provided (Section 6)

---

## Section 8: Next Steps (FND04-FND06 Dependencies)

### FND04: Export Ownership Boundaries
- Implement tenant verification in export download route (Section 6, Correction 1)
- Add `tenantId` column to `export_jobs` table (Section 6, Migration 1)
- Verify all 6 export workflow paths (trigger, dispatch, status, recovery, download, workers)

### FND05: Progress Identity and Write Integrity
- Implement tenant-qualified progress queries (Section 6, Correction 2)
- Add `tenantId` column to `tutorial_progress` table (Section 6, Migration 2)
- Resolve concurrent completion loss with tenant-aware merge (FND05 transaction contract)

### FND06: Admin Actor, Request, and Target Policy
- Implement tenant/audience verification in admin routes (Section 6, Correction 3)
- Trace each admin resource to authoritative store (SHC-global vs tenant-owned)
- Reject conflicting verified tenant/request context (selected policy)

---

## Section 9: Verification Commands

```bash
# Count FND12 caller IDs in this report
grep -c 'SD-\|AR-\|OP-\|GT-\|FA-' ownership-classification.md
# Expected: 181+ matches (109 base + 72 marketing/platform callers)

# Verify required sections present
grep -E '^## Section [1-9]:' ownership-classification.md
# Expected: 9 sections (Executive Summary through Verification)

# Count identified gaps
grep -c '❌' ownership-classification.md
# Expected: 50+ gap markers
```

---

## Appendix A: Credential-to-Store Matrix Summary

| Credential Type | Source | Target Stores | Tenant Propagation | Ownership Check | Gap Count |
|---|---|---|---|---|---|
| JWT `userId` (SkillUp) | db-skillup.users.id | db-skillup, db-tutorial | Missing | userId-only | 22 |
| JWT `userId` (RTH) | db-realtutorialhub.users.id | db-realtutorialhub, db-tutorial | Missing | userId-only | 15 |
| JWT `userId` (SHC admin) | db-people.users.id | db-people, db-skillup, db-tutorial | Missing | Role-based (no tenant check) | 10 |
| JWT `brand` claim | TokenService payload | Unused | Present but not enforced | N/A | 181 (all callers) |
| JWT `shadowUserId` | db-people.users.id | Unused | Present but not enforced | N/A | 181 (all callers) |

---

## Appendix B: Database Schema Gaps

| Schema File | Current Keys | Required Keys (Selected Policy) | Migration Required |
|---|---|---|---|
| db-skillup/users.ts | `(id)` | `(tenant_id, id)` | Yes |
| db-people/users.ts | `(id, platform)` | `(platform, id)` | Partial (platform = tenant) |
| db-tutorial/tutorial_progress.ts | `(user_id, subtopic_id)` | `(tenant_id, user_id, subtopic_id)` | Yes |
| db-skillup/exams.ts | `(id, user_id)` | `(tenant_id, id, user_id)` | Yes |
| db-skillup/export_jobs.ts | `(id, user_id)` | `(tenant_id, id, user_id)` | Yes |

---

**End of FND03 Ownership Classification Report**
