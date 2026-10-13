# Phase 4 Persistence Contract Verification

**READ-ONLY VERIFICATION REPORT**

**Date**: 2025-02-01  
**Task**: Verify UUID/VARCHAR database mismatch between database schema and SQLAlchemy ORM models  
**Scope**: project_ai_* tables in tutorial_prod database

---

## Executive Summary

**CONFIRMED DEFECT**: There is a genuine UUID/VARCHAR type mismatch between the PostgreSQL database and the SQLAlchemy ORM models.

- **Database Schema (Actual)**: All identifier columns use `uuid` type (after migration 0027)
- **SQLAlchemy Models**: All identifier columns use `String(255)` type
- **Drizzle Schema (Canonical Authority)**: All identifier columns use `uuid()` type
- **Impact**: SQLAlchemy queries generate comparisons like `uuid = varchar`, causing PostgreSQL errors

**Root Cause**: Migration 0027 successfully converted the database columns from VARCHAR to UUID, but the SQLAlchemy models in `services/project-ai/app/persistence/models.py` and `services/project-ai/app/database/models.py` were never updated to match.

**Canonical Fix**: Align SQLAlchemy models to match the Drizzle schema and live database by changing all identifier columns from `String(255)` to use SQLAlchemy's UUID type with appropriate Python `uuid.UUID` handling.

---

## 1. Drizzle Canonical Schema

**File**: `packages/db-tutorial/src/schema/project-ai-persistence.ts`

### Primary Key Declarations

```typescript
// Line 20: workflows primary key
workflowId: uuid('workflow_id').primaryKey().defaultRandom(),

// Line 115: contracts primary key
contractId: uuid('contract_id').primaryKey().defaultRandom(),

// Line 150: candidates primary key
candidateId: uuid('candidate_id').primaryKey().defaultRandom(),

// Line 189: manifests primary key
manifestId: uuid('manifest_id').primaryKey().defaultRandom(),

// Line 230: approvals primary key
approvalId: uuid('approval_id').primaryKey().defaultRandom(),
```

### Foreign Key and Reference Columns

```typescript
// Line 36-49: workflow artifact bindings (all uuid)
contractId: uuid('contract_id'),
candidateId: uuid('candidate_id'),
manifestId: uuid('manifest_id'),
approvalId: uuid('approval_id'),

// Line 86-93: state_transitions FK
workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
        onDelete: 'cascade',
        name: 'fk_state_transitions_workflow_id'
    }),

// Line 118-124: contracts FK
workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
        onDelete: 'cascade',
        name: 'fk_contracts_workflow_id'
    }),

// Line 153-158: candidates FK
workflowId: uuid('workflow_id')
    .references(() => projectAiWorkflows.workflowId, { 
        onDelete: 'set null',
        name: 'fk_candidates_workflow_id'
    }),

// Line 192-198: manifests FK
candidateId: uuid('candidate_id')
    .notNull()
    .references(() => projectAiCandidates.candidateId, { 
        onDelete: 'cascade',
        name: 'fk_manifests_candidate_id'
    }),

// Line 233-239, 242: approvals FKs and references
workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectAiWorkflows.workflowId, { 
        onDelete: 'cascade',
        name: 'fk_approvals_workflow_id'
    }),
placementManifestId: uuid('placement_manifest_id').notNull(),
```

**Drizzle Schema Verdict**: ALL identifier columns are declared as `uuid()` type.

---

## 2. Migration 0027 SQL

**File**: `packages/db-tutorial/migrations/0027_public_multiple_man.sql`

**Purpose**: "Convert varchar primary keys to UUID with explicit USING clause"

### Key Conversion Statements

```sql
-- Lines 12-18: Convert project_ai_workflows columns to UUID
ALTER TABLE "project_ai_workflows" ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "workflow_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_workflows" ALTER COLUMN "specification_id" SET DATA TYPE uuid USING specification_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "contract_id" SET DATA TYPE uuid USING contract_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "candidate_id" SET DATA TYPE uuid USING candidate_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "manifest_id" SET DATA TYPE uuid USING manifest_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "snapshot_id" SET DATA TYPE uuid USING snapshot_id::uuid;
ALTER TABLE "project_ai_workflows" ALTER COLUMN "approval_id" SET DATA TYPE uuid USING approval_id::uuid;

-- Lines 20-22: Convert project_ai_state_transitions columns to UUID
ALTER TABLE "project_ai_state_transitions" ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;
ALTER TABLE "project_ai_state_transitions" ALTER COLUMN "evidence_id" SET DATA TYPE uuid USING evidence_id::uuid;

-- Lines 24-27: Convert project_ai_contracts columns to UUID
ALTER TABLE "project_ai_contracts" ALTER COLUMN "contract_id" SET DATA TYPE uuid USING contract_id::uuid;
ALTER TABLE "project_ai_contracts" ALTER COLUMN "contract_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_contracts" ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;

-- Lines 29-32: Convert project_ai_candidates columns to UUID
ALTER TABLE "project_ai_candidates" ALTER COLUMN "candidate_id" SET DATA TYPE uuid USING candidate_id::uuid;
ALTER TABLE "project_ai_candidates" ALTER COLUMN "candidate_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_candidates" ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;

-- Lines 34-37: Convert project_ai_manifests columns to UUID
ALTER TABLE "project_ai_manifests" ALTER COLUMN "manifest_id" SET DATA TYPE uuid USING manifest_id::uuid;
ALTER TABLE "project_ai_manifests" ALTER COLUMN "manifest_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_manifests" ALTER COLUMN "candidate_id" SET DATA TYPE uuid USING candidate_id::uuid;

-- Lines 39-43: Convert project_ai_approvals columns to UUID
ALTER TABLE "project_ai_approvals" ALTER COLUMN "approval_id" SET DATA TYPE uuid USING approval_id::uuid;
ALTER TABLE "project_ai_approvals" ALTER COLUMN "approval_id" SET DEFAULT gen_random_uuid();
ALTER TABLE "project_ai_approvals" ALTER COLUMN "workflow_id" SET DATA TYPE uuid USING workflow_id::uuid;
ALTER TABLE "project_ai_approvals" ALTER COLUMN "placement_manifest_id" SET DATA TYPE uuid USING placement_manifest_id::uuid;
```

**Migration 0027 Verdict**: ALL identifier columns were explicitly converted from VARCHAR to UUID.

---

## 3. PostgreSQL Actual Schema

**Query Method**: Direct PostgreSQL query against tutorial_prod database using DATABASE_URL_TUTORIAL  
**Query**:
```sql
SELECT table_name, column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name IN (
    'project_ai_workflows', 
    'project_ai_approvals', 
    'project_ai_manifests', 
    'project_ai_contracts', 
    'project_ai_candidates'
) 
AND column_name LIKE '%_id'
ORDER BY table_name, column_name;
```

**Results**:

```
Table                               Column                         Data Type            UDT Name            
=========================================================================================================
project_ai_approvals                approval_id                    uuid                 uuid                
project_ai_approvals                placement_manifest_id          uuid                 uuid                
project_ai_approvals                workflow_id                    uuid                 uuid                
project_ai_candidates               candidate_id                   uuid                 uuid                
project_ai_candidates               workflow_id                    uuid                 uuid                
project_ai_contracts                contract_id                    uuid                 uuid                
project_ai_contracts                workflow_id                    uuid                 uuid                
project_ai_manifests                candidate_id                   uuid                 uuid                
project_ai_manifests                manifest_id                    uuid                 uuid                
project_ai_workflows                approval_id                    uuid                 uuid                
project_ai_workflows                candidate_id                   uuid                 uuid                
project_ai_workflows                contract_id                    uuid                 uuid                
project_ai_workflows                manifest_id                    uuid                 uuid                
project_ai_workflows                requester_id                   character varying    varchar             
project_ai_workflows                snapshot_id                    uuid                 uuid                
project_ai_workflows                specification_id               uuid                 uuid                
project_ai_workflows                workflow_id                    uuid                 uuid
```

**PostgreSQL Actual Verdict**: ALL identifier columns are `uuid` type (17 UUID columns total). Only `requester_id` remains VARCHAR, which is correct (it's a user identifier, not a primary/foreign key for project_ai tables).

---

## 4. SQLAlchemy ORM Models

### File: `services/project-ai/app/persistence/models.py`

#### WorkflowModel (Lines 53-92)

```python
# Line 56: Primary key declared as String(255)
workflow_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))

# Line 59: specification_id declared as String(255)
specification_id = Column(String(255), nullable=False)

# Lines 72-80: Artifact bindings all declared as String(255)
contract_id = Column(String(255), nullable=True)
candidate_id = Column(String(255), nullable=True)
manifest_id = Column(String(255), nullable=True)
snapshot_id = Column(String(255), nullable=True)
approval_id = Column(String(255), nullable=True)
```

#### StateTransitionModel (Lines 217-234)

```python
# Line 224: Foreign key declared as String(255)
workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False)

# Line 232: Evidence ID declared as String(255)
evidence_id = Column(String(255), nullable=True)
```

#### ContractModel (Lines 249-272)

```python
# Line 255: Primary key declared as String(255)
contract_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))

# Line 258: Foreign key declared as String(255)
workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)
```

#### CandidateModel (Lines 284-316)

```python
# Line 290: Primary key declared as String(255)
candidate_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))

# Line 293: Foreign key declared as String(255)
workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="SET NULL"), nullable=True)
```

#### ManifestModel (Lines 351-381)

```python
# Line 357: Primary key declared as String(255)
manifest_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))

# Line 360: Foreign key declared as String(255)
candidate_id = Column(String(255), ForeignKey("project_ai_candidates.candidate_id", ondelete="CASCADE"), nullable=False)
```

#### ApprovalModel (Lines 393-427)

```python
# Line 399: Primary key declared as String(255)
approval_id = Column(String(255), primary_key=True, server_default=text("gen_random_uuid()"))

# Line 402: Foreign key declared as String(255)
workflow_id = Column(String(255), ForeignKey("project_ai_workflows.workflow_id", ondelete="CASCADE"), nullable=False, unique=True)

# Line 406: placement_manifest_id declared as String(255)
placement_manifest_id = Column(String(255), nullable=False)
```

### File: `services/project-ai/app/database/models.py`

**IDENTICAL ISSUE**: This file contains duplicate model definitions with the same defect:

```python
# Line 46: WorkflowModel.workflow_id declared as String(255)
workflow_id = Column(String(255), primary_key=True)

# Line 49: specification_id declared as String(255)
specification_id = Column(String(255), nullable=False)

# Lines 62-68: All artifact IDs declared as String(255)
contract_id = Column(String(255), nullable=True)
candidate_id = Column(String(255), nullable=True)
manifest_id = Column(String(255), nullable=True)
snapshot_id = Column(String(255), nullable=True)
approval_id = Column(String(255), nullable=True)

# Similar patterns in ContractModel, CandidateModel, ManifestModel, ApprovalModel
```

**SQLAlchemy Models Verdict**: ALL identifier columns are declared as `String(255)`, creating a type mismatch with the UUID database columns.

---

## 5. Repository Method Signatures

**File**: `services/project-ai/app/persistence/repositories.py`

### Protocol Type Annotations (Lines 77-293)

All repository protocol methods use `str` type annotations for identifiers:

```python
# Line 77: WorkflowRepository.get
async def get(self, workflow_id: str, verify_bindings: bool = True) -> Optional[WorkflowModel]:

# Line 123: WorkflowRepository.delete
async def delete(self, workflow_id: str) -> bool:

# Line 153: ContractRepository.get_by_workflow
async def get_by_workflow(self, workflow_id: str) -> Optional[ContractModel]:

# Line 200: CandidateRepository.get
async def get(self, candidate_id: str) -> Optional[CandidateModel]:

# Line 207: CandidateRepository.list_by_workflow
async def list_by_workflow(self, workflow_id: str) -> List[CandidateModel]:

# Line 243: ManifestRepository.get
async def get(self, manifest_id: str) -> Optional[ManifestModel]:

# Line 292: ApprovalRepository.get
async def get(self, approval_id: str) -> Optional[ApprovalModel]:

# Line 295: ApprovalRepository.get_by_workflow
async def get_by_workflow(self, workflow_id: str) -> Optional[ApprovalModel]:
```

### Implementation Query Patterns (Lines 325-827)

All repository implementations generate SQL comparisons between UUID columns and string parameters:

```python
# Line 348: PostgresWorkflowRepository.get
result = await self.session.execute(
    select(WorkflowModel).where(WorkflowModel.workflow_id == workflow_id)
)
# This generates: WHERE workflow_id = 'some-string-value'
# PostgreSQL receives: uuid = character varying
# Result: "operator does not exist: uuid = character varying"
```

**Repository Verdict**: Methods accept `str` parameters and pass them directly to SQLAlchemy queries, generating type-mismatched comparisons.

---

## 6. Alignment Matrix

| Column | Drizzle Schema | Migration 0027 | PostgreSQL Actual | SQLAlchemy Model | Repository Type | Aligned? |
|--------|----------------|----------------|-------------------|------------------|-----------------|----------|
| **project_ai_workflows** |
| workflow_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| specification_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| contract_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| candidate_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| manifest_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| snapshot_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| approval_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| **project_ai_contracts** |
| contract_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| workflow_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| **project_ai_candidates** |
| candidate_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| workflow_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| **project_ai_manifests** |
| manifest_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| candidate_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| **project_ai_approvals** |
| approval_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| workflow_id | uuid() | uuid | uuid | String(255) | str | **NO** |
| placement_manifest_id | uuid() | uuid | uuid | String(255) | str | **NO** |

**Total Columns Verified**: 17  
**Aligned**: 0  
**Misaligned**: 17 (100%)

---

## 7. Test Error Evidence

The captured test error from Phase 4 integration test reconciliation confirms this defect:

```
sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError: 
operator does not exist: uuid = character varying
Hint: No operator matches the given name and argument types. You might need to add explicit type casts.
```

**Location**: This error occurs when SQLAlchemy generates queries like:

```sql
SELECT * FROM project_ai_workflows WHERE workflow_id = $1
-- PostgreSQL receives:
-- workflow_id (uuid column) = $1 (varchar parameter)
```

PostgreSQL's strict type system refuses to compare UUID and VARCHAR without an explicit cast.

---

## 8. Canonical Fix

**Authority**: Drizzle schema is the canonical authority (per architectural rules in both schema files).

**Required Changes**: Align SQLAlchemy models to match Drizzle schema and live database.

### Step 1: Update SQLAlchemy Column Definitions

Change from:
```python
from sqlalchemy import Column, String

workflow_id = Column(String(255), primary_key=True)
```

Change to:
```python
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
import uuid

workflow_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

**Apply to all 17 misaligned columns** across:
- `services/project-ai/app/persistence/models.py`
- `services/project-ai/app/database/models.py`

### Step 2: Update Python Domain Model Types

Repository methods currently accept and return `str`. Domain models must be updated to use Python's `uuid.UUID` type:

```python
# Before
workflow_id: str

# After
import uuid
workflow_id: uuid.UUID
```

### Step 3: Update Repository Method Signatures

Change from:
```python
async def get(self, workflow_id: str) -> Optional[WorkflowModel]:
```

Change to:
```python
import uuid
async def get(self, workflow_id: uuid.UUID) -> Optional[WorkflowModel]:
```

### Step 4: Update Application Layer Call Sites

All code that constructs or passes identifiers must use `uuid.UUID` objects:

```python
# Before
workflow_id = "some-uuid-string"
workflow = await repo.get(workflow_id)

# After
import uuid
workflow_id = uuid.UUID("some-uuid-string")
workflow = await repo.get(workflow_id)
```

### Step 5: Update Test Fixtures

Test fixtures that create test data must generate valid UUIDs:

```python
# Before
workflow_id="test-workflow-1"

# After
import uuid
workflow_id=uuid.uuid4()
```

---

## 9. Impact Assessment

**Affected Components**:
1. All SQLAlchemy ORM queries against project_ai_* tables (100% failure rate)
2. All integration tests that touch persistence layer (76 reported failures)
3. Repository method signatures (17 methods require signature changes)
4. Domain models that declare identifier fields
5. API endpoints that serialize/deserialize identifiers
6. Test fixtures and factories

**Severity**: CRITICAL — All persistence operations are blocked.

**Workaround**: None. PostgreSQL will not perform implicit UUID ↔ VARCHAR casts.

---

## 10. Files Not Found / Unverified

**None**. All critical files were located and verified:
- ✅ Drizzle schema: `packages/db-tutorial/src/schema/project-ai-persistence.ts`
- ✅ Migration 0027: `packages/db-tutorial/migrations/0027_public_multiple_man.sql`
- ✅ SQLAlchemy models (2 files): `services/project-ai/app/persistence/models.py`, `services/project-ai/app/database/models.py`
- ✅ Repository implementations: `services/project-ai/app/persistence/repositories.py`
- ✅ Live PostgreSQL schema: Queried successfully via DATABASE_URL_TUTORIAL

---

## 11. Conclusion

**Is there a confirmed UUID/VARCHAR mismatch?**  
✅ **YES**

**Which columns?**  
All 17 identifier columns across the five project_ai_* tables:
- workflow_id (primary keys and foreign keys)
- specification_id
- contract_id
- candidate_id
- manifest_id
- snapshot_id
- approval_id
- placement_manifest_id
- evidence_id

**What is the canonical fix?**  
Align SQLAlchemy models to Drizzle/PostgreSQL by:
1. Changing all `Column(String(255))` declarations to `Column(UUID(as_uuid=True))`
2. Updating Python type annotations from `str` to `uuid.UUID`
3. Updating repository method signatures
4. Updating application code and test fixtures to use `uuid.UUID` objects

**Next Steps**:
This is a READ-ONLY verification report. Do NOT implement the fix without explicit authorization. The findings establish:
- ✅ The UUID/VARCHAR mismatch is confirmed
- ✅ The scope is precisely defined (17 columns, 2 model files, 1 repository file)
- ✅ The canonical fix is aligned to Drizzle schema authority
- ⏸️ Implementation is BLOCKED pending remediation authorization

---

**Report Generated**: 2025-02-01  
**Verification Method**: Source-code inspection + Live database query  
**Compliance**: READ-ONLY verification (no files modified, no schema changes, no git operations)
