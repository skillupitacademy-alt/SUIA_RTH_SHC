# Wave 0 Baseline Audit

**Commit**: 6003c76d6210405766fe4802bffd083054d1a141  
**Branch**: m2-project-ai-canonical-wiring  
**Date**: 2026-10-09  
**Status**: Complete

## Executive Summary

The Project AI/LLM service currently operates with **split authentication authority** and **incomplete integration with SHC platform contracts**. The Python FastAPI service implements its own JWT verification layer using a single `JWT_SECRET_KEY` environment variable, while the TypeScript SHC platform uses separate secrets for user (`JWT_SECRET`) and admin (`ADMIN_JWT_SECRET`) tokens with distinct claim structures.

**Critical Authentication Gap**: The Python service validates generic JWT tokens with basic audience and tokenType checks, but **does NOT verify against SHC's actual token issuance secrets** or enforce SHC's identity claim structure (userId, originalUserId, shadowUserId, brand, portalIdentity). The service accepts any JWT signed with `JWT_SECRET_KEY`, creating a **parallel authentication system** rather than consuming SHC's verified tokens.

**Database and Persistence**: The service now has PostgreSQL persistence infrastructure (SQLAlchemy async, Drizzle schema in `packages/db-tutorial/src/schema/project-ai-persistence.ts`) with six tables (`project_ai_workflows`, `project_ai_state_transitions`, `project_ai_contracts`, `project_ai_candidates`, `project_ai_manifests`, `project_ai_approvals`). The startup validation checks table existence and database connectivity but does NOT create tables (schema authority: Drizzle only).

**Workflow Governance**: A canonical 17-state workflow state machine exists (`CanonicalWorkflowState`) with three human approval gates (AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2). Self-approval prevention and hash-bound approval verification are implemented at the domain model level (`ImplementationApproval.verify_not_self_approved()`), with persistence backed by PostgreSQL `ApprovalRepository`.

**Authorization State**: All routes except `/health` require authentication via `Depends(get_current_user)`. No routes currently use role-based dependencies (`require_contract_admin`, `require_contract_reviewer`, `require_contract_viewer` are defined but unused). **Brand/tenant isolation is NOT enforced** — no code checks the `brand` claim or prevents cross-brand resource access.

**Readiness for Wave 1**: The service architecture supports SHC integration, but Wave 1 implementation requires:
1. Align JWT verification to consume SHC's actual token issuance secrets (USER_JWT_SECRET, ADMIN_JWT_SECRET from TypeScript `packages/auth/src/token.service.ts`)
2. Verify SHC identity claims (userId, originalUserId, shadowUserId, brand, portalIdentity)
3. Enforce route-level authorization (use existing RBAC dependencies)
4. Implement brand/tenant boundary enforcement
5. Prevent client-supplied actor identity in approval and workflow operations

---

## P0-1: SHC Authentication Contract

**Status**: Partial — Python JWT verification exists but does NOT verify against SHC token issuance secrets

### SHC Token Issuance (TypeScript Platform)

**Location**: `packages/auth/src/token.service.ts`

**Secrets**:
- `JWT_SECRET` (or `process.env.JWT_SECRET`) → USER_JWT_SECRET (line 88-89)
- `JWT_REFRESH_SECRET` → USER_REFRESH_SECRET (line 92-94)
- `ADMIN_JWT_SECRET` → ADMIN_JWT_SECRET, fallback to JWT_SECRET (line 96-99)

**Token Claims Structure** (lines 45-71):
```typescript
export type TokenPayload = JWTPayload & {
  userId: string;
  originalUserId?: string;
  shadowUserId?: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
  tokenType?: 'user' | 'admin';
  brand?: Brand;
  role?: string;
  platforms?: Array<'realtutorialhub' | 'skillup'>;
  subscriptions?: string[];
  portalIdentity?: 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';
};
```

**Token Generation**:
- `generateAccessToken()` (line 269): Sets `audience`, `tokenType`, `brand`, `originalUserId`, `shadowUserId` (defaulting to `userId` if not provided)
- `signSkillHubCoreAccessToken()` (line 328): Issues SHC tokens with `sub`, `shadowUserId`, `originalUserId`, `brand`, `roles`, `subscriptions`, `platforms`, issuer `skillhubcore.in`

**Identity Assertion** (line 120):
```typescript
private assertIdentityClaims(payload: Partial<TokenPayload>): asserts payload is TokenPayload {
  if (typeof payload.shadowUserId !== 'string' || payload.shadowUserId.trim().length === 0) {
    throw new TokenInvalidError('Missing shadowUserId claim');
  }
  if (typeof payload.originalUserId !== 'string' || payload.originalUserId.trim().length === 0) {
    throw new TokenInvalidError('Missing originalUserId claim');
  }
}
```

**Verification** (line 377):
- `verifyUserAccessToken()`: Validates audience (default: `"user"`), calls `assertIdentityClaims()`, enforces `tokenType === 'user'`

### Project AI Token Verification (Python Service)

**Location**: `services/project-ai/app/auth/jwt.py`

**Secret**: `JWT_SECRET_KEY` environment variable (lines 66-82 in `config.py`)

**Token Decoding** (lines 46-122):
```python
def decode_access_token(token: str) -> dict:
    # Decode with HS256, no audience verification during decode
    payload = jwt.decode(token, config["secret_key"], algorithms=[config["algorithm"]])
    
    # Validate audience == "user"
    if payload.get("aud") != "user":
        raise HTTPException(401, "Invalid token audience")
    
    # Validate tokenType == "user"
    if payload.get("tokenType") != "user":
        raise HTTPException(401, "Invalid token type")
    
    # Validate required identity claims
    required_claims = ["userId", "originalUserId", "shadowUserId"]
    for claim in required_claims:
        if not isinstance(payload.get(claim), str) or not payload.get(claim).strip():
            raise HTTPException(401, f"Missing or invalid {claim} claim")
    
    return payload
```

**Identity Extraction** (lines 15-51 in `dependencies.py`):
```python
def get_current_user(authorization: str = Header(...)) -> dict:
    # Extract Bearer token
    payload = decode_access_token(token)
    
    return {
        "user_id": payload.get("sub"),
        "roles": payload.get("roles", [])
    }
```

### Gaps

| Priority | Finding | File Reference | Severity |
|----------|---------|----------------|----------|
| **P0** | **Python JWT verification uses independent secret `JWT_SECRET_KEY`, NOT SHC's `JWT_SECRET` or `ADMIN_JWT_SECRET`** | `app/auth/config.py:23`, `packages/auth/src/token.service.ts:88-99` | **CRITICAL** — Creates parallel authentication system; Python service accepts tokens SHC never issued |
| **P0** | **No verification that token was issued by SHC** — Missing issuer (`iss`) claim check for `"skillhubcore.in"` | `app/auth/jwt.py:63-122` | **HIGH** — Cannot distinguish SHC tokens from tokens issued by other systems |
| **P0** | **Identity extraction incomplete** — `get_current_user()` extracts `sub` and `roles` but DOES NOT extract `userId`, `originalUserId`, `shadowUserId`, `brand`, `portalIdentity` | `app/auth/dependencies.py:34-40` | **HIGH** — Downstream code cannot enforce tenant boundaries or audit actor identity |
| P1 | No environment variable documentation for JWT secrets — `.env.example` does not exist in `services/project-ai/` | `services/project-ai/.env.example` (missing) | MEDIUM — Deployment teams do not know which secrets to configure |
| P1 | RBAC role dependencies defined but unused — `require_contract_admin`, `require_contract_reviewer`, `require_contract_viewer` exist but no routes use them | `app/auth/dependencies.py:54-106` | MEDIUM — Role enforcement not applied |
| P1 | No admin token support — Python service rejects `tokenType: 'admin'` and `aud: 'admin'` | `app/auth/jwt.py:98-101` | MEDIUM — Admin operations cannot authenticate |

### Acceptance Tests for Wave 1 Fixes

1. **Token Verification Against SHC Secrets**: Create test tokens using SHC TypeScript `TokenService.generateAccessToken()`, verify Python service accepts them using SHC's `JWT_SECRET`
2. **Identity Claim Extraction**: Verify `get_current_user()` returns `userId`, `originalUserId`, `shadowUserId`, `brand`, `portalIdentity` from SHC token
3. **Token Rejection**: Verify Python service rejects tokens signed with wrong secret
4. **Issuer Validation**: Verify Python service accepts tokens with `iss: "skillhubcore.in"` and rejects others
5. **Admin Token Support**: Verify Python service accepts `tokenType: 'admin'` tokens signed with `ADMIN_JWT_SECRET`

---

## P0-2: Project AI Route Security

**Route Inventory**: All routes in `services/project-ai/app/api/routes/`

| Method | Path | Auth Dependency | Authorization | Brand Isolation | Notes |
|--------|------|-----------------|---------------|-----------------|-------|
| GET | `/health` | **NONE** | Public | N/A | Unauthenticated health check |
| GET | `/` (root) | `get_current_user` | Authenticated | ❌ No | Returns service info |
| **Snapshot** |
| GET | `/snapshot` | `get_current_user` | Authenticated | ❌ No | Returns TypeScript snapshot |
| GET | `/snapshot/metadata` | `get_current_user` | Authenticated | ❌ No | Returns snapshot metadata |
| **Evidence** |
| GET | `/evidence/{evidence_id}` | `get_current_user` | Authenticated | ❌ No | Returns evidence by ID |
| GET | `/evidence` | `get_current_user` | Authenticated | ❌ No | Lists all evidence |
| **Tasks** |
| POST | `/tasks/plan` | `get_current_user` | Authenticated | ❌ No | Creates planning task |
| GET | `/tasks/{task_id}` | `get_current_user` | Authenticated | ❌ No | Gets task status |
| POST | `/tasks/{task_id}/approve` | `get_current_user` | Authenticated | ❌ No | Approves task |
| POST | `/tasks/{task_id}/reject` | `get_current_user` | Authenticated | ❌ No | Rejects task |
| **Governance** |
| POST | `/approvals/submit` | `get_current_user` | Authenticated | ❌ No | Submits approval request |
| GET | `/approvals/pending` | `get_current_user` | Authenticated | ❌ No | Lists pending approvals |
| GET | `/approvals/{approval_id}` | `get_current_user` | Authenticated | ❌ No | Gets approval status |
| POST | `/approvals/{approval_id}/approve` | `get_current_user` | Authenticated | ❌ No | **Self-approval prevented (domain)** |
| POST | `/approvals/{approval_id}/reject` | `get_current_user` | Authenticated | ❌ No | Rejects approval |
| POST | `/approvals/workflows/{workflow_id}/approve-placement` | `get_current_user` | Authenticated | ❌ No | Approves placement |
| GET | `/approvals/workflows/{workflow_id}/implementation-approval` | `get_current_user` | Authenticated | ❌ No | Gets impl approval |
| **Agents** |
| GET | `/agents` | `get_current_user` | Authenticated | ❌ No | Lists agents |
| GET | `/agents/{agent_type}` | `get_current_user` | Authenticated | ❌ No | Gets agent definition |
| **Candidates** |
| POST | `/candidates/upload` | `get_current_user` | Authenticated | ❌ No | **Client provides `uploaded_by`** (spoofing risk) |
| POST | `/candidates/{candidate_id}/classify` | `get_current_user` | Authenticated | ❌ No | Classifies candidate |
| POST | `/candidates/{candidate_id}/compare` | `get_current_user` | Authenticated | ❌ No | Compares candidate |
| POST | `/candidates/{candidate_id}/manifest` | `get_current_user` | Authenticated | ❌ No | Generates manifest |
| GET | `/candidates/{candidate_id}/manifest` | `get_current_user` | Authenticated | ❌ No | Gets manifest |
| GET | `/candidates` | `get_current_user` | Authenticated | ❌ No | Lists candidates |
| POST | `/candidates/{candidate_id}/execute` | `get_current_user` | Authenticated | ❌ No | Executes placement |
| **Workflows** |
| POST | `/workflows` | `get_current_user` | Authenticated | ❌ No | Creates workflow |
| GET | `/workflows/{workflow_id}` | `get_current_user` | Authenticated | ❌ No | Gets workflow |
| POST | `/workflows/{workflow_id}/transition` | `get_current_user` | Authenticated | ❌ No | Transitions workflow state |
| GET | `/workflows/{workflow_id}/history` | `get_current_user` | Authenticated | ❌ No | Gets state history |
| POST | `/workflows/{workflow_id}/artifacts` | `get_current_user` | Authenticated | ❌ No | Binds artifact |
| GET | `/workflows` | `get_current_user` | Authenticated | ❌ No | Lists workflows |
| POST | `/workflows/{workflow_id}/placement` | `get_current_user` | Authenticated | ❌ No | Creates placement |
| POST | `/workflows/{workflow_id}/placement/override` | `get_current_user` | Authenticated | ❌ No | Overrides placement |
| GET | `/workflows/{workflow_id}/placement/conflicts` | `get_current_user` | Authenticated | ❌ No | Lists conflicts |
| POST | `/workflows/{workflow_id}/approve-final` | `get_current_user` | Authenticated | ❌ No | Final approval |
| **Contracts** |
| POST | `/workflows/{workflow_id}/engineering-contract` | `get_current_user` | Authenticated | ❌ No | Creates contract |
| GET | `/workflows/{workflow_id}/engineering-contract` | `get_current_user` | Authenticated | ❌ No | Gets contract |
| **Creation (Legacy)** |
| POST | `/creation/workflows` | **NONE** | ❌ **HTTP 405** | N/A | Deprecated (Wave 0) |
| GET | `/creation/workflows/{workflow_id}` | **NONE** | ❌ **HTTP 405** | N/A | Deprecated (Wave 0) |
| POST | `/creation/workflows/{workflow_id}/validate` | **NONE** | ❌ **HTTP 405** | N/A | Deprecated (Wave 0) |
| POST | `/creation/workflows/{workflow_id}/certify` | **NONE** | ❌ **HTTP 405** | N/A | Deprecated (Wave 0) |

**Unprotected Routes**: 1 (`/health` — intentional for monitoring)

**Deprecated Routes**: 4 (all `/creation/*` routes return HTTP 405 with migration guidance)

### Authorization Gaps

| Priority | Finding | File Reference | Severity |
|----------|---------|----------------|----------|
| **P0** | **No brand/tenant isolation** — No routes check `brand` claim; users from brand A can access brand B resources | All route files | **CRITICAL** — Cross-tenant data leakage |
| **P0** | **Client-supplied actor identity** — `/candidates/upload` accepts `uploaded_by` from request body instead of extracting from token | `app/api/routes/candidate.py:194-198` | **CRITICAL** — Identity spoofing; user can claim to be another user |
| **P0** | **Approval `decidedBy` from request** — `/approvals/{approval_id}/approve` accepts `decidedBy` from request instead of token | `app/api/routes/governance.py:146-148` | **CRITICAL** — Approval forgery; user can claim approval from another user |
| P0 | **Workflow `requester_id` from request** — POST `/workflows` accepts `requester_id` from request instead of token | `app/api/routes/workflows.py:130-132` | HIGH — Workflow ownership forgery |
| P1 | **No role-based authorization** — RBAC dependencies defined but unused; all authenticated users have same permissions | `app/auth/dependencies.py:54-106`, all route files | MEDIUM — No separation of duties between viewers, reviewers, admins |
| P1 | **Root endpoint authenticated but returns public info** — GET `/` requires auth but only returns service metadata | `app/main.py:115-131` | LOW — Unnecessary authentication requirement |

### Security Implementation Notes

**Self-Approval Prevention**: Implemented in domain model (`app/models/implementation_approval.py:106-126`):
```python
def verify_not_self_approved(self, workflow_requester: str) -> bool:
    """Verify approval was not self-approved (workflow requester != approver)."""
    if not self.workflow_requester or not self.approved_by:
        return False
    return self.workflow_requester.strip() != self.approved_by.strip()
```

**Used in**: `app/orchestration/canonical_workflow.py:558-566` (blocking transition to IMPLEMENTING state if self-approved)

**Limitation**: This relies on correct `workflow_requester` and `approved_by` being set, but these come from request bodies, not verified token claims (see P0 gaps above).

---

## P0-3: Canonical Workflow Governance

**Status**: Complete — 17-state canonical workflow with hash-bound approvals and self-approval prevention

### State Machine

**Location**: `app/orchestration/canonical_workflow.py`

**States** (lines 30-263):

| State | Description | Next States | Gate Type | File:Line |
|-------|-------------|-------------|-----------|-----------|
| REQUESTED | User initiates workflow | DISCOVERY | None | canonical_workflow.py:32 |
| DISCOVERY | Repository evidence gathering | BRIEF_READY, REJECTED | Automated | canonical_workflow.py:45 |
| BRIEF_READY | Compliance brief generated | AWAITING_GATE_1 | None | canonical_workflow.py:63 |
| **AWAITING_GATE_1** | **GUI prototype approval** | GUI_APPROVED, REJECTED | **HUMAN_GATE_1** | canonical_workflow.py:78 |
| GUI_APPROVED | Gate 1 passed | CANDIDATE_REQUESTED | None | canonical_workflow.py:93 |
| CANDIDATE_REQUESTED | Awaiting candidate upload | CANDIDATE_RECEIVED | None | canonical_workflow.py:106 |
| CANDIDATE_RECEIVED | Candidate uploaded | CANDIDATE_AUDIT | None | canonical_workflow.py:119 |
| CANDIDATE_AUDIT | Running compliance gates | PLACEMENT, REJECTED | Automated | canonical_workflow.py:132 |
| PLACEMENT | Placement engine matching | INTEGRATION_PLANNED, REJECTED | Automated | canonical_workflow.py:149 |
| INTEGRATION_PLANNED | Manifest generated | AWAITING_IMPLEMENTATION_APPROVAL | None | canonical_workflow.py:162 |
| **AWAITING_IMPLEMENTATION_APPROVAL** | **Placement approval** | IMPLEMENTING, REJECTED | **HUMAN_GATE_2** | canonical_workflow.py:178 |
| IMPLEMENTING | Executing placement | IMPLEMENTED, REJECTED | Automated | canonical_workflow.py:196 |
| IMPLEMENTED | Files written and committed | VERIFYING | None | canonical_workflow.py:211 |
| VERIFYING | Runtime/browser verification | CERTIFICATION_READY, REJECTED | Automated | canonical_workflow.py:223 |
| CERTIFICATION_READY | All gates passed | AWAITING_GATE_2 | None | canonical_workflow.py:239 |
| **AWAITING_GATE_2** | **Final HAA certification** | CERTIFIED, REJECTED | **HUMAN_GATE_3** | canonical_workflow.py:253 |
| CERTIFIED | HAA certified (terminal) | — | None | canonical_workflow.py:268 |
| REJECTED | Rejected at any gate (terminal) | — | None | canonical_workflow.py:278 |

**Transition Validation**: `is_valid_transition()` (line 309) — checks `VALID_TRANSITIONS` dict (lines 293-307)

**Gate Detection**: `is_gate_state()` (line 322) — returns True for AWAITING_GATE_1, AWAITING_IMPLEMENTATION_APPROVAL, AWAITING_GATE_2

**Terminal Detection**: `is_terminal_state()` (line 339) — returns True for CERTIFIED, REJECTED

### Approval Security

**Implementation Approval Model** (lines 341-632):
```python
async def can_transition_to_implementing_async(
    workflow_id: str,
    approval_repo: ApprovalRepository,
    requester_id: str,
    candidate_sha256: str,
    manifest_id: str,
    manifest_sha256: str
) -> tuple[bool, str]:
```

**Authorization Gates** (lines 351-360):
1. ImplementationApproval must exist (database lookup via `ApprovalRepository`)
2. Approval status must be APPROVED
3. Candidate hash must match (`approval.verify_candidate_hash(candidate_sha256)`)
4. Manifest ID must match
5. Manifest hash must match (`approval.verify_manifest_hash(manifest_sha256)`)
6. Not self-approved (`approval.verify_not_self_approved(requester_id)`)

**Self-Approval Prevention** (line 585):
```python
if not approval.verify_not_self_approved(requester_id):
    return (False, f"Self-approval detected or workflow requester missing: approver '{approval.approved_by}'")
```

### Evidence Binding

**Hash Verification** (lines 558-576):
- Candidate hash verification prevents uploading candidate A, getting approval, then executing with candidate B
- Manifest hash verification prevents modifying placement after approval
- All hashes computed server-side (SHA-256)

**Approval Persistence**: PostgreSQL table `project_ai_approvals` (Drizzle schema at `packages/db-tutorial/src/schema/project-ai-persistence.ts:215-238`)

**Audit Trail**: State transitions persisted to `project_ai_state_transitions` table (lines 78-101 in Drizzle schema)

### Legacy Paths

**Creation Mode Bypass** (RETIRED in M2.9 Wave 0):
- **Location**: `app/api/routes/creation.py`
- **Status**: All endpoints return **HTTP 405** (lines 24-113)
- **Reason**: CreationMode allowed workflow bypass (I2_ONLY, MIX_AND_MATCH), violating architectural requirement that all candidates follow same lifecycle

**Legacy In-Memory Stores** (documented as transition placeholders):
- `app/api/routes/governance.py:44`: `_approvals` dict (manifest approvals, Wave 2 legacy)
- `app/api/routes/contract.py:118-122`: `contracts_store`, `workflows_store` (Wave 3 replacement planned)

**Finding**: No active bypass paths exist. Legacy routes are properly disabled.

---

## P1-4: Database and Migration Authority

**Status**: Complete — PostgreSQL persistence with Drizzle migration authority established

### Schema Parity

**Drizzle Schema** (TypeScript): `packages/db-tutorial/src/schema/project-ai-persistence.ts`

**Tables** (lines 19-238):
1. `project_ai_workflows` (line 22)
2. `project_ai_state_transitions` (line 78)
3. `project_ai_contracts` (line 112)
4. `project_ai_candidates` (line 148)
5. `project_ai_manifests` (line 180)
6. `project_ai_approvals` (line 215)

**Python ORM Models** (SQLAlchemy): `services/project-ai/app/persistence/models.py`

**Mapping** (lines 37-89):
1. `WorkflowModel` → `project_ai_workflows`
2. `StateTransitionModel` → `project_ai_state_transitions`
3. `ContractModel` → `project_ai_contracts`
4. `CandidateModel` → `project_ai_candidates`
5. `ManifestModel` → `project_ai_manifests`
6. `ApprovalModel` → `project_ai_approvals`

**Column Comparison** (WorkflowModel example):

| Column (Drizzle) | Column (SQLAlchemy) | Type Match | Notes |
|------------------|---------------------|------------|-------|
| `workflow_id` | `workflow_id` | ✅ uuid/String(255) | Primary key |
| `specification_id` | `specification_id` | ✅ uuid/String(255) | |
| `target_family` | `target_family` | ✅ varchar(100)/String(100) | |
| `target_version` | `target_version` | ✅ varchar(100)/String(100) | |
| `requester_id` | `requester_id` | ✅ varchar(255)/String(255) | |
| `current_state` | `current_state` | ✅ varchar(100)/String(100) | |
| `created_at` | `created_at` | ✅ timestamp/DateTime | |
| `updated_at` | `updated_at` | ✅ timestamp/DateTime | |
| `contract_id` | `contract_id` | ✅ uuid/String(255) | Nullable |
| `contract_sha256` | `contract_sha256` | ✅ varchar(64)/String(64) | SHA-256 hash |
| `candidate_id` | `candidate_id` | ✅ uuid/String(255) | Nullable |
| `candidate_sha256` | `candidate_sha256` | ✅ varchar(64)/String(64) | SHA-256 hash |
| `manifest_id` | `manifest_id` | ✅ uuid/String(255) | Nullable |
| `manifest_sha256` | `manifest_sha256` | ✅ varchar(64)/String(64) | SHA-256 hash |
| `snapshot_id` | `snapshot_id` | ✅ uuid/String(255) | Nullable |
| `snapshot_sha256` | `snapshot_sha256` | ✅ varchar(64)/String(64) | SHA-256 hash |
| `approval_id` | `approval_id` | ✅ uuid/String(255) | Nullable |
| `gate_results` | `gate_results` | ✅ jsonb/JSON | |
| `evidence_ids` | `evidence_ids` | ✅ jsonb/JSON | |
| `final_status` | `final_status` | ✅ varchar(50)/String(50) | Nullable |
| `version` | `version` | ✅ integer/Integer | Optimistic locking |
| `idempotency_key` | `idempotency_key` | ✅ varchar(255)/String(255) | Unique constraint |

**Parity Assessment**: ✅ **ALIGNED** — Python models match Drizzle schema

### Migration Ownership

**Authority**: **Drizzle ONLY** (documented in `app/persistence/database.py:10` and `app/persistence/models.py:21`)

**Migration Location**: `packages/db-tutorial/drizzle/` (TypeScript Drizzle migrations)

**Python Role**: **READ-ONLY ORM** (documented in `app/persistence/__init__.py:7-9`)

**Schema Mutation Prohibition** (lines 5-9 in `database.py`):
```python
"""
- NO schema mutations in application code (no create_all())
- Schema changes ONLY through Drizzle migrations
- Startup validates connectivity and table existence, does not create tables
"""
```

**Validation on Startup** (lines 117-171 in `database.py`):
```python
async def validate_database_connectivity() -> bool:
    # Test basic connectivity
    # Verify required tables exist
    required_tables = ["project_ai_workflows", ...]
    
    if missing_tables:
        raise RuntimeError(
            f"Required tables not found in database: {', '.join(missing_tables)}. "
            f"Run Drizzle migration: pnpm --filter @quiz/db-tutorial db:migrate"
        )
```

**No Alembic Found**: ❌ No `alembic/` directory in `services/project-ai/` (confirmed via file listing)

### Repository Transaction Patterns

**Location**: `services/project-ai/app/persistence/repositories.py`

**Transaction Management** (documented in `persistence/__init__.py:16-34`):
```python
@app.post("/workflows")
async def create_workflow(
    repo: WorkflowRepository = Depends(get_workflow_repository),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        workflow = WorkflowModel(...)
        result = await repo.upsert(workflow)
        await session.commit()  # REQUIRED: Persist changes
        return result
    except Exception as e:
        await session.rollback()  # Rollback on error
        raise
```

**Key Points**:
- Sessions created with `autocommit=False` (line 93 in `database.py`)
- Repository methods flush but do NOT commit (line 18 in `__init__.py`)
- Route handlers MUST call `await session.commit()` (line 26 in `__init__.py`)

### Test Database Strategy

**Environment Variable**: `DATABASE_URL_TUTORIAL` (lines 10, 37 in `database.py`)

**Connection String**: `postgresql+asyncpg://user:pass@host:port/tutorial_prod`

**Test Strategy**: NOT VERIFIED (no test database configuration found; `.env.example` does not exist)

**Recommendation**: Wave 1 should document test database setup (SQLite in-memory or PostgreSQL test schema)

### Gaps

| Priority | Finding | File Reference | Severity |
|----------|---------|----------------|----------|
| P1 | **No `.env.example`** — Required environment variables not documented | `services/project-ai/.env.example` (missing) | MEDIUM — Deployment teams must guess config |
| P1 | **Test database strategy undocumented** — No guidance on running tests against PostgreSQL vs SQLite | Test configuration files | MEDIUM — Test reliability unclear |
| P1 | **Foreign key cascade behavior unverified** — Drizzle schema defines `onDelete: 'cascade'` but SQLAlchemy models use default | `persistence/models.py`, Drizzle schema | LOW — May cause orphaned records |

---

## P1-5: Deployment Configuration and Evidence

**Status**: Partial — CORS allows all origins; environment variables undocumented; evidence system established

### CORS Configuration

**Location**: `services/project-ai/app/main.py:104-111`

**Current Config**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Finding**: ⚠️ **WILDCARD CORS** — `allow_origins=["*"]` allows any origin; comment acknowledges production restriction needed (line 105)

**Risk**: Medium — Any web application can call Project AI endpoints if it obtains a valid JWT

**Recommendation**: Wave 1 should set explicit origins from environment variable (e.g., `ALLOWED_ORIGINS=https://admin.skillhubcore.in,https://realtutorialhub.com`)

### Required Environment Variables

**Extracted from code**:

| Variable | Purpose | Default | Required | File Reference |
|----------|---------|---------|----------|----------------|
| `JWT_SECRET_KEY` | JWT token signing secret | None | ✅ YES | `app/auth/config.py:23` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` | ❌ No | `app/auth/config.py:38` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `30` | ❌ No | `app/auth/config.py:39` |
| `DATABASE_URL_TUTORIAL` | PostgreSQL connection URL | None | ✅ YES | `app/persistence/database.py:37` |
| `WORKSPACE_ROOT` | Repository workspace path | `E:\onlinewebsites\quiz-platform` | ❌ No | `app/main.py:30-33` |

**Minimum Configuration**:
```bash
JWT_SECRET_KEY="<64-character-random-string>"
DATABASE_URL_TUTORIAL="postgresql://user:pass@localhost:5432/tutorial_prod"
```

**Gap**: No `.env.example` file exists to document these

### CI Status

**GitHub Actions**: ❌ **NOT FOUND** — `.github/workflows/` directory does not exist (confirmed via file search)

**Package.json Test Scripts**: ✅ Found in root `package.json:14-34`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "pr-check:quick": "pnpm typecheck && pnpm test",
}
```

**Python Test Commands** (from `pyproject.toml:18-20`):
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

**Commands**:
- TypeScript: `pnpm pr-check:quick` (typecheck + vitest)
- Python: `pytest` (from `services/project-ai/`)

**Test Evidence**: Found in `.agents/evidence/test-results.jsonl` (JSONL append-only ledger)

### Evidence Binding

**Evidence System**: ✅ **CANONICAL** (established Wave 1D, commit 7af488f9)

**Location**: `.agents/evidence/`

**Files**:
- `evidence.jsonl` — Canonical evidence events with SHA-256 hash chains (R0+)
- `test-results.jsonl` — Test suite results
- `gate-results.jsonl` — Gate decisions (GATE_1, GATE_2)
- `agent-runs.jsonl` — Agent execution records (Wave 3-6 legacy)
- `README.md` — Evidence contract documentation

**Python API** (documented in `.agents/evidence/README.md:39-79`):
```python
from app.evidence import CanonicalEvidenceStore, EvidenceEvent, TestSummary

store = CanonicalEvidenceStore()
event = EvidenceEvent(
    evidence_id="r0-evidence-001",
    workflow_id="r0-remediation",
    agent_id="R0",
    wave="R0",
    repository="quiz-platform",
    branch="m2-project-ai-canonical-wiring",
    base_sha="f589c0b3",
    final_sha="abc1234",
    event_type="wave_completion",
    status="PASS",
    files_changed=["file1.py", "file2.py"],
    tests=TestSummary(passed=10, failed=0, skipped=0)
)
evidence_hash = store.append(event)  # Appends to evidence.jsonl with SHA-256
```

**Hash Chain Verification**: `store.verify_chain(workflow_id)` — detects tampering

**Evidence Reports**: 277 files in `.agents/tasks/` (Wave 0-7 implementation reports, gate verdicts, test execution logs)

**Current HEAD Binding**: Evidence files reference various commits; most recent Wave 7 reports reference commits in `6003c76d` lineage

**Gap**: Evidence files do not automatically reference current HEAD commit — this audit establishes commit `6003c76d6210405766fe4802bffd083054d1a141` as Wave 0 baseline

---

## Consolidated Gap List

| Priority | Area | Finding | File Reference | Severity | Acceptance Test |
|----------|------|---------|----------------|----------|----------------|
| **P0** | **Authentication** | **Python JWT verification uses independent secret `JWT_SECRET_KEY`, NOT SHC's `JWT_SECRET` or `ADMIN_JWT_SECRET`** | `app/auth/config.py:23`, `packages/auth/src/token.service.ts:88-99` | **CRITICAL** | Create test token with SHC TypeScript `TokenService`, verify Python service accepts it |
| **P0** | **Authentication** | **No verification that token was issued by SHC** (missing `iss: "skillhubcore.in"` check) | `app/auth/jwt.py:63-122` | **HIGH** | Verify Python service accepts SHC tokens, rejects tokens without correct issuer |
| **P0** | **Authentication** | **Identity extraction incomplete** — `get_current_user()` extracts `sub` and `roles` but NOT `userId`, `originalUserId`, `shadowUserId`, `brand`, `portalIdentity` | `app/auth/dependencies.py:34-40` | **HIGH** | Verify `get_current_user()` returns all SHC identity claims |
| **P0** | **Authorization** | **No brand/tenant isolation** — No routes check `brand` claim | All route files | **CRITICAL** | Verify user from brand A cannot access brand B workflows/candidates |
| **P0** | **Authorization** | **Client-supplied actor identity** — `/candidates/upload` accepts `uploaded_by` from request body | `app/api/routes/candidate.py:194-198` | **CRITICAL** | Verify `uploaded_by` extracted from token, not request |
| **P0** | **Authorization** | **Approval `decidedBy` from request** — `/approvals/{approval_id}/approve` accepts `decidedBy` from request | `app/api/routes/governance.py:146-148` | **CRITICAL** | Verify `decidedBy` extracted from token, not request |
| P0 | Authorization | **Workflow `requester_id` from request** — POST `/workflows` accepts `requester_id` from request | `app/api/routes/workflows.py:130-132` | HIGH | Verify `requester_id` extracted from token, not request |
| P1 | Authentication | No admin token support — Python service rejects `tokenType: 'admin'` | `app/auth/jwt.py:98-101` | MEDIUM | Verify Python service accepts admin tokens signed with `ADMIN_JWT_SECRET` |
| P1 | Authentication | No environment variable documentation — `.env.example` missing | `services/project-ai/.env.example` (missing) | MEDIUM | Create `.env.example` with `JWT_SECRET_KEY`, `DATABASE_URL_TUTORIAL`, etc. |
| P1 | Authorization | **No role-based authorization** — RBAC dependencies defined but unused | `app/auth/dependencies.py:54-106` | MEDIUM | Apply `require_contract_admin` to privileged routes |
| P1 | Deployment | **CORS wildcard** — `allow_origins=["*"]` in production | `app/main.py:105` | MEDIUM | Set explicit allowed origins from environment variable |
| P1 | Database | **Test database strategy undocumented** | Test configuration | MEDIUM | Document test database setup (SQLite or PostgreSQL test schema) |
| P1 | CI | **No GitHub Actions workflow** | `.github/workflows/` (missing) | LOW | Create CI workflow for `pnpm pr-check:quick` and `pytest` |

---

## Recommendations

**Next Wave Priorities** (in dependency order):

### Wave 1: Align Authentication and Authorization

**Goal**: Project AI consumes SHC's verified token contract and enforces route-level permissions

**Implementation**:
1. **Align JWT secrets** (P0):
   - Add `USER_JWT_SECRET` and `ADMIN_JWT_SECRET` environment variables
   - Update `app/auth/config.py` to read both secrets
   - Update `app/auth/jwt.py:decode_access_token()` to:
     - Accept both user and admin tokens
     - Verify with appropriate secret based on `tokenType` claim
     - Validate issuer `iss === "skillhubcore.in"`
   - Test: Create token with SHC TypeScript `TokenService`, verify Python service accepts it

2. **Complete identity extraction** (P0):
   - Update `app/auth/dependencies.py:get_current_user()` to return:
     ```python
     {
         "user_id": payload["userId"],           # Canonical user ID
         "original_user_id": payload["originalUserId"],  # Pre-shadow identity
         "shadow_user_id": payload["shadowUserId"],      # Active identity
         "brand": payload.get("brand"),          # Tenant boundary
         "portal_identity": payload.get("portalIdentity"),  # admin|user|faculty|...
         "roles": payload.get("roles", [])
     }
     ```
   - Test: Verify all claims extracted correctly

3. **Enforce brand boundaries** (P0):
   - Add `@enforce_brand_boundary` decorator or dependency
   - Apply to all routes that access workflow/candidate/approval resources
   - Check resource `brand` matches token `brand` (or user has cross-brand permission)
   - Test: Verify user from brand A cannot access brand B workflow

4. **Prevent identity spoofing** (P0):
   - Update `/candidates/upload`: Extract `uploaded_by` from `user["user_id"]`, not request body
   - Update `/approvals/{id}/approve`: Extract `decidedBy` from `user["user_id"]`, not request body
   - Update `/workflows`: Extract `requester_id` from `user["user_id"]`, not request body
   - Test: Verify requests with forged identity are rejected

5. **Apply RBAC** (P1):
   - Identify privileged routes (e.g., final approval, placement override)
   - Apply `Depends(require_contract_admin)` or `Depends(require_contract_reviewer)`
   - Document role requirements in route docstrings
   - Test: Verify users without required role receive HTTP 403

6. **Create `.env.example`** (P1):
   - Document all required and optional environment variables
   - Include example values and security notes
   - Commit to `services/project-ai/.env.example`

**Exit Gate**: Valid tokens work; invalid tokens, wrong roles, cross-brand access, and spoofed actors are rejected

---

### Wave 2: Document Deployment and Testing

**Goal**: Deployment teams can configure and test Project AI service

**Implementation**:
1. Restrict CORS to explicit origins (environment variable)
2. Document test database setup (SQLite vs PostgreSQL)
3. Create GitHub Actions workflow for CI
4. Update README with deployment instructions

**Exit Gate**: Service can be deployed to staging environment with production-ready configuration

---

### Wave 3: Evidence Binding and Certification

**Goal**: Verify existing evidence reports reference current commit and establish certification baseline

**Implementation**:
1. Audit `.agents/evidence/` and `.agents/tasks/` for commit binding
2. Run full test suite (`pnpm pr-check:quick` and `pytest`)
3. Record results in canonical evidence ledger
4. Update canonical reports with tested commit

**Exit Gate**: Evidence supports readiness claim for current HEAD commit `6003c76d6210405766fe4802bffd083054d1a141`

---

## Appendix: Test Commands

**TypeScript**:
```bash
cd e:\onlinewebsites\quiz-platform
pnpm pr-check:quick  # Typecheck + vitest
```

**Python**:
```bash
cd e:\onlinewebsites\quiz-platform\services\project-ai
pytest  # Run all tests
pytest tests/unit/test_auth_jwt.py  # Run auth unit tests
pytest tests/integration/  # Run integration tests
```

**Database Migration**:
```bash
cd e:\onlinewebsites\quiz-platform
pnpm --filter @quiz/db-tutorial db:migrate
```

**Service Startup**:
```bash
cd e:\onlinewebsites\quiz-platform\services\project-ai
export JWT_SECRET_KEY="<64-char-secret>"
export DATABASE_URL_TUTORIAL="postgresql://user:pass@localhost:5432/tutorial_prod"
python -m app.main
```
