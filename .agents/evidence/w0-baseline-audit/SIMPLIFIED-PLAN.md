# Simplified Project LLM Integration Plan
**Date:** 2026-10-12  
**Approach:** Use existing DB, add new tables with Drizzle, merge all branches

---

## Core Principle: Keep It Simple

✅ **DO:**
- Use existing database (where tutorial blocks already exist)
- Add new Project LLM tables alongside existing tables
- Use Drizzle for schema migrations (it's already in the project)
- Merge all Project LLM branches to main in sequence
- Fix missing columns (`uploader_brand`, `requester_brand`) as part of merge

❌ **DON'T:**
- Create separate test database
- Use Docker for database
- Modify GitHub Actions workflows
- Over-engineer the solution

---

## Current Database Reality

### What Already Exists

**Database:** `tutorial` (or similar - we'll verify)
**Location:** Neon PostgreSQL (production) or local PostgreSQL
**Existing Tables:**
- `users`
- `tutorials`
- `tutorial_blocks`
- `tutorial_pages`
- `tutorial_sessions`
- `brands` (multi-tenant support)
- And more...

**Schema Management:** Drizzle ORM
**Migrations:** `packages/db-tutorial/drizzle/`

### What Project LLM Needs to Add

**New Tables (to be created in SAME database):**

1. **`project_llm_candidates`** - Uploaded block candidates
   ```typescript
   {
     id: uuid
     family: string // "Introduction", "Content", "Definition"
     version: string // "I2", "C1", "D3"
     status: enum // "UPLOADED", "VALIDATED", "APPROVED", "INTEGRATED"
     uploader_brand: string // FK to brands.id ⭐ MISSING
     requester_brand: string // FK to brands.id ⭐ MISSING
     zip_hash: string
     uploaded_at: timestamp
     ...
   }
   ```

2. **`project_llm_workflows`** - Workflow state tracking
   ```typescript
   {
     id: uuid
     candidate_id: uuid // FK to candidates
     status: enum // "DISCOVERING", "VALIDATING", "AWAITING_APPROVAL", etc.
     current_step: string
     created_at: timestamp
     ...
   }
   ```

3. **`project_llm_approvals`** - Human approval records
   ```typescript
   {
     id: uuid
     workflow_id: uuid
     manifest_hash: string
     approved_by: uuid // FK to users
     approved_at: timestamp
     status: enum // "PENDING", "APPROVED", "REJECTED"
     ...
   }
   ```

4. **`project_llm_evidence`** - Evidence trail
   ```typescript
   {
     id: uuid
     workflow_id: uuid
     evidence_type: string
     artifact_hash: string
     created_at: timestamp
     ...
   }
   ```

5. **`project_llm_placements`** - Integration history
   ```typescript
   {
     id: uuid
     candidate_id: uuid
     action: enum // "ADD", "UPDATE", "EXTEND"
     files_modified: jsonb
     commit_sha: string
     placed_at: timestamp
     ...
   }
   ```

**All these tables will live in the SAME database alongside existing tutorial tables.**

---

## Step-by-Step Implementation Plan

### Phase 1: Understand Current Schema (1-2 hours)

#### Task 1.1: Find Current Database Configuration

**Check these files:**
```bash
# Find database config
cat packages/db-tutorial/drizzle.config.ts
cat packages/db-tutorial/.env.example

# Check existing schema
ls packages/db-tutorial/src/schema/
cat packages/db-tutorial/src/schema.ts

# Check existing migrations
ls packages/db-tutorial/drizzle/
```

**Document:**
- Database name
- Connection string format
- Existing tables
- Migration pattern

#### Task 1.2: Identify Schema Files Across Branches

**Check each branch for Project LLM schema:**
```bash
# m2-project-ai-canonical-wiring
git show m2-project-ai-canonical-wiring:services/project-ai/app/models/

# m2-project-ai-foundation  
git show m2-project-ai-foundation:services/project-ai/app/models/

# project-ai-gui
git show project-ai-gui:services/project-ai/app/models/
```

**Find:**
- Where `CandidateModel` is defined
- Where `WorkflowModel` is defined
- Which branch has most complete models
- Where `uploader_brand` and `requester_brand` SHOULD be

---

### Phase 2: Create Unified Schema (1 day)

#### Task 2.1: Consolidate Project LLM Schema

**Create: `packages/db-tutorial/src/schema/project-llm.ts`**

```typescript
import { pgTable, uuid, varchar, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { brands } from './brands'; // Existing brands table

// Enums
export const candidateStatusEnum = pgEnum('candidate_status', [
  'UPLOADED',
  'VALIDATED', 
  'AWAITING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'INTEGRATED'
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'CREATED',
  'DISCOVERING',
  'CONTRACT_READY',
  'VALIDATING',
  'AWAITING_APPROVAL',
  'APPROVED',
  'INTEGRATING',
  'COMPLETED',
  'FAILED'
]);

export const placementActionEnum = pgEnum('placement_action', [
  'ADD',
  'UPDATE',
  'EXTEND',
  'REUSE'
]);

// Tables
export const projectLlmCandidates = pgTable('project_llm_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  family: varchar('family', { length: 50 }).notNull(), // "Introduction", "Content"
  version: varchar('version', { length: 20 }).notNull(), // "I2", "C1"
  status: candidateStatusEnum('status').notNull().default('UPLOADED'),
  
  // 🔥 ADD THESE MISSING COLUMNS
  uploaderBrand: varchar('uploader_brand', { length: 50 })
    .notNull()
    .references(() => brands.id), // FK to existing brands table
  requesterBrand: varchar('requester_brand', { length: 50 })
    .notNull()
    .references(() => brands.id), // FK to existing brands table
  
  zipHash: varchar('zip_hash', { length: 64 }).notNull(),
  zipPath: text('zip_path'),
  uploadedBy: uuid('uploaded_by').notNull(), // FK to users (add if needed)
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  
  metadata: jsonb('metadata'), // Flexible data
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projectLlmWorkflows = pgTable('project_llm_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id')
    .notNull()
    .references(() => projectLlmCandidates.id),
  status: workflowStatusEnum('status').notNull().default('CREATED'),
  currentStep: varchar('current_step', { length: 100 }),
  
  // Contract and evidence
  contractId: varchar('contract_id', { length: 100 }),
  snapshotHash: varchar('snapshot_hash', { length: 64 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projectLlmApprovals = pgTable('project_llm_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectLlmWorkflows.id),
  manifestHash: varchar('manifest_hash', { length: 64 }).notNull(),
  
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  approvedBy: uuid('approved_by'), // FK to users
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const projectLlmPlacements = pgTable('project_llm_placements', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id')
    .notNull()
    .references(() => projectLlmCandidates.id),
  action: placementActionEnum('action').notNull(),
  
  filesModified: jsonb('files_modified').notNull(), // Array of file paths
  commitSha: varchar('commit_sha', { length: 40 }),
  placedBy: uuid('placed_by'), // FK to users
  placedAt: timestamp('placed_at').notNull().defaultNow(),
});

export const projectLlmEvidence = pgTable('project_llm_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => projectLlmWorkflows.id),
  evidenceType: varchar('evidence_type', { length: 50 }).notNull(),
  artifactHash: varchar('artifact_hash', { length: 64 }).notNull(),
  artifactPath: text('artifact_path'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Export types for use in application
export type Candidate = typeof projectLlmCandidates.$inferSelect;
export type NewCandidate = typeof projectLlmCandidates.$inferInsert;

export type Workflow = typeof projectLlmWorkflows.$inferSelect;
export type NewWorkflow = typeof projectLlmWorkflows.$inferInsert;

export type Approval = typeof projectLlmApprovals.$inferSelect;
export type NewApproval = typeof projectLlmApprovals.$inferInsert;

export type Placement = typeof projectLlmPlacements.$inferSelect;
export type NewPlacement = typeof projectLlmPlacements.$inferInsert;

export type Evidence = typeof projectLlmEvidence.$inferSelect;
export type NewEvidence = typeof projectLlmEvidence.$inferInsert;
```

#### Task 2.2: Update Main Schema Export

**Edit: `packages/db-tutorial/src/schema.ts`**

```typescript
// Existing exports
export * from './schema/users';
export * from './schema/tutorials';
export * from './schema/brands';
// ... other existing schemas

// 🔥 ADD THIS
export * from './schema/project-llm';
```

---

### Phase 3: Generate and Apply Migration (2-3 hours)

#### Task 3.1: Generate Migration with Drizzle

```bash
cd packages/db-tutorial

# Generate migration from schema changes
pnpm drizzle-kit generate:pg

# This will create: drizzle/XXXX_add_project_llm_tables.sql
```

**Expected Migration File:**
```sql
-- drizzle/0030_add_project_llm_tables.sql (example number)

-- Create enums
CREATE TYPE candidate_status AS ENUM (
  'UPLOADED', 'VALIDATED', 'AWAITING_APPROVAL', 
  'APPROVED', 'REJECTED', 'INTEGRATED'
);

CREATE TYPE workflow_status AS ENUM (
  'CREATED', 'DISCOVERING', 'CONTRACT_READY',
  'VALIDATING', 'AWAITING_APPROVAL', 'APPROVED',
  'INTEGRATING', 'COMPLETED', 'FAILED'
);

CREATE TYPE placement_action AS ENUM (
  'ADD', 'UPDATE', 'EXTEND', 'REUSE'
);

-- Create tables
CREATE TABLE project_llm_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  status candidate_status NOT NULL DEFAULT 'UPLOADED',
  uploader_brand VARCHAR(50) NOT NULL REFERENCES brands(id),
  requester_brand VARCHAR(50) NOT NULL REFERENCES brands(id),
  zip_hash VARCHAR(64) NOT NULL,
  zip_path TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_llm_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES project_llm_candidates(id),
  status workflow_status NOT NULL DEFAULT 'CREATED',
  current_step VARCHAR(100),
  contract_id VARCHAR(100),
  snapshot_hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_llm_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES project_llm_workflows(id),
  manifest_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_llm_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES project_llm_candidates(id),
  action placement_action NOT NULL,
  files_modified JSONB NOT NULL,
  commit_sha VARCHAR(40),
  placed_by UUID,
  placed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_llm_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES project_llm_workflows(id),
  evidence_type VARCHAR(50) NOT NULL,
  artifact_hash VARCHAR(64) NOT NULL,
  artifact_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_status ON project_llm_candidates(status);
CREATE INDEX idx_candidates_brand ON project_llm_candidates(uploader_brand, requester_brand);
CREATE INDEX idx_workflows_candidate ON project_llm_workflows(candidate_id);
CREATE INDEX idx_workflows_status ON project_llm_workflows(status);
CREATE INDEX idx_approvals_workflow ON project_llm_approvals(workflow_id);
CREATE INDEX idx_placements_candidate ON project_llm_placements(candidate_id);
CREATE INDEX idx_evidence_workflow ON project_llm_evidence(workflow_id);
```

#### Task 3.2: Review Migration Before Running

**Checklist:**
- [ ] All enums defined correctly
- [ ] Foreign keys reference existing tables (brands, users)
- [ ] Indexes created for query performance
- [ ] Column names match TypeScript schema
- [ ] No DROP statements (additive only)

#### Task 3.3: Apply Migration to Existing Database

```bash
# IMPORTANT: This runs against your EXISTING database
# Make sure you have DATABASE_URL set correctly

# Check current connection
echo $DATABASE_URL_TUTORIAL
# or
cat packages/db-tutorial/.env

# Apply migration
pnpm drizzle-kit push:pg

# Verify tables created
pnpm drizzle-kit introspect:pg
```

**Verification Query:**
```sql
-- Run this to confirm tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'project_llm_%';

-- Should return:
-- project_llm_candidates
-- project_llm_workflows
-- project_llm_approvals
-- project_llm_placements
-- project_llm_evidence
```

---

### Phase 4: Update Python Models (2-3 hours)

#### Task 4.1: Update SQLAlchemy Models

**Edit: `services/project-ai/app/models/candidate.py`**

```python
from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from .base import Base

class CandidateModel(Base):
    __tablename__ = 'project_llm_candidates'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family = Column(String(50), nullable=False)
    version = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default='UPLOADED')
    
    # 🔥 ADD THESE MISSING COLUMNS
    uploader_brand = Column(String(50), ForeignKey('brands.id'), nullable=False)
    requester_brand = Column(String(50), ForeignKey('brands.id'), nullable=False)
    
    zip_hash = Column(String(64), nullable=False)
    zip_path = Column(Text)
    uploaded_by = Column(UUID(as_uuid=True), nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    metadata = Column(JSONB)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workflow = relationship("WorkflowModel", back_populates="candidate")
    placements = relationship("PlacementModel", back_populates="candidate")
```

**Similar updates for:**
- `services/project-ai/app/models/workflow.py`
- `services/project-ai/app/models/approval.py`
- `services/project-ai/app/models/placement.py`
- `services/project-ai/app/models/evidence.py`

#### Task 4.2: Update Pydantic Schemas

**Edit: `services/project-ai/app/schemas/candidate.py`**

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class CandidateCreate(BaseModel):
    family: str
    version: str
    uploader_brand: str  # 🔥 REQUIRED
    requester_brand: str  # 🔥 REQUIRED
    zip_hash: str
    zip_path: Optional[str] = None
    uploaded_by: UUID

class CandidateResponse(BaseModel):
    id: UUID
    family: str
    version: str
    status: str
    uploader_brand: str  # 🔥 INCLUDED
    requester_brand: str  # 🔥 INCLUDED
    uploaded_at: datetime
    
    class Config:
        from_attributes = True
```

---

### Phase 5: Merge Branches (3-5 days)

#### Strategy: Sequential Integration

**Order:**
1. main (baseline)
2. **Create migration branch** (from main)
3. Apply schema changes (Phase 2-4 above)
4. Merge m2-project-ai-canonical-wiring
5. Merge m2-project-ai-foundation (unique features only)
6. Merge project-ai-gui
7. Clean up project-llm-e2e-implementation (archive migration-repair)

#### Task 5.1: Create Migration Branch

```bash
git checkout main
git pull origin main

# Create schema migration branch
git checkout -b feature/project-llm-schema
```

#### Task 5.2: Apply Schema Changes

```bash
# Add the new schema file
git add packages/db-tutorial/src/schema/project-llm.ts
git add packages/db-tutorial/src/schema.ts

# Add generated migration
git add packages/db-tutorial/drizzle/

# Commit
git commit -m "feat: add Project LLM database schema

Add new tables to existing database:
- project_llm_candidates (with uploader_brand, requester_brand)
- project_llm_workflows
- project_llm_approvals
- project_llm_placements
- project_llm_evidence

Migration applied to existing database (no separate DB).
Drizzle migration: 0030_add_project_llm_tables.sql

Closes schema issue blocking canonical-wiring merge."

# Push and create PR
git push origin feature/project-llm-schema
```

#### Task 5.3: Merge m2-project-ai-canonical-wiring

```bash
# After schema PR merged to main
git checkout main
git pull origin main

# Create merge branch
git checkout -b merge/canonical-wiring-to-main

# Merge canonical-wiring
git merge m2-project-ai-canonical-wiring

# Resolve conflicts (if any)
# Most conflicts will be in schema files (already fixed)

# Update Python models to use new schema
# (see Phase 4 changes)

# Test
cd services/project-ai
pytest tests/ -v

# If tests pass (should be 160/160 now):
git add .
git commit -m "merge: integrate m2-project-ai-canonical-wiring

Merge most advanced Project LLM branch.
Schema issues resolved with unified schema.
All 160 tests passing.

Branch commits: 256
Key features:
- Contract generation
- Placement planning
- Evidence collection
- Composer integration"

git push origin merge/canonical-wiring-to-main
```

#### Task 5.4: Merge Remaining Branches

**Similar process for:**

**m2-project-ai-foundation:**
```bash
git checkout -b merge/foundation-unique-features
git merge m2-project-ai-foundation
# Keep only unique features not in canonical-wiring
# Resolve conflicts
# Test
git push
```

**project-ai-gui:**
```bash
git checkout -b merge/gui-to-main
git merge project-ai-gui
# Update API calls to match unified backend
# Test UI flows
git push
```

#### Task 5.5: Archive Migration-Repair

```bash
# Don't merge project-llm-e2e-implementation directly
# Instead, cherry-pick useful patterns

git checkout main

# Create documentation branch
git checkout -b docs/migration-repair-archive

# Copy evidence and patterns
cp -r .agents/evidence/runs/migration-repair-* docs/archive/
cp .agents/evidence/migration-repair-assessment.md docs/archive/

# Document lessons learned
cat > docs/archive/MIGRATION-REPAIR-LESSONS.md << 'EOF'
# Migration Repair Workflow - Lessons Learned

## What We Built
- 6-stage evidence-based repair workflow
- Append-only JSONL ledgers
- Gate-based progression
- Forensic investigation methodology

## Reusable Patterns
- Evidence collection with SHA-256 hash chains
- Gate-based workflow progression
- Structured test result capture
- Final status reporting

## Archived Components
- Migration 0012 surgical fix (Drizzle-specific)
- SQL parsing logic
- Duplicate detection queries

## Applied to Project LLM
- Evidence ledger system → Reused
- Gate patterns → Adapted for certification
- Test capture → Standardized
EOF

git add docs/archive/
git commit -m "docs: archive migration-repair evidence and patterns"
git push origin docs/migration-repair-archive
```

---

### Phase 6: Verify Integration (1 day)

#### Task 6.1: Run Full Test Suite

```bash
# TypeScript discovery
cd packages/project-llm-discovery
pnpm test

# Python backend
cd services/project-ai
pytest tests/ -v

# Database migrations (verify idempotent)
cd packages/db-tutorial
pnpm drizzle-kit push:pg --force  # Should show "No changes"

# Integration tests
cd ../..
pnpm test:integration
```

#### Task 6.2: Verify Database State

```sql
-- Connect to your database
psql $DATABASE_URL_TUTORIAL

-- Check Project LLM tables exist
\dt project_llm_*

-- Check schema
\d project_llm_candidates

-- Verify foreign keys work
SELECT 
  c.id,
  c.family,
  c.version,
  c.uploader_brand,
  b1.name as uploader_brand_name,
  c.requester_brand,
  b2.name as requester_brand_name
FROM project_llm_candidates c
LEFT JOIN brands b1 ON c.uploader_brand = b1.id
LEFT JOIN brands b2 ON c.requester_brand = b2.id;
```

#### Task 6.3: Test E2E Workflow

**Manual Test:**
1. Open Project LLM UI
2. Select "Introduction I2" target
3. Upload test candidate ZIP
4. Verify candidate record created with correct brand
5. Verify workflow record created
6. Request approval
7. Verify approval record created
8. (Don't execute placement yet - just test until approval)

**Verify in database:**
```sql
-- Check candidate created
SELECT * FROM project_llm_candidates ORDER BY created_at DESC LIMIT 1;

-- Check workflow created
SELECT * FROM project_llm_workflows ORDER BY created_at DESC LIMIT 1;

-- Check approval created
SELECT * FROM project_llm_approvals ORDER BY created_at DESC LIMIT 1;
```

---

## Summary: What This Plan Does

### ✅ Solves Your Requirements

1. **Use existing database** ✅
   - No Docker
   - No separate test database
   - Adds tables to where tutorial blocks already exist

2. **Use Drizzle** ✅
   - Already in project
   - Simple migration generation
   - Type-safe schema

3. **Merge all branches** ✅
   - Sequential integration
   - Preserve all work
   - Schema issues resolved

4. **Add missing columns** ✅
   - `uploader_brand` and `requester_brand` added
   - Foreign keys to existing `brands` table
   - Fixes the 7 test failures

5. **No GitHub Actions changes** ✅
   - Use existing CI
   - No new workflows needed

### 📊 Estimated Timeline

| Phase | Duration | Can Start |
|-------|----------|-----------|
| Phase 1: Understand Schema | 1-2 hours | Immediately |
| Phase 2: Create Unified Schema | 1 day | After Phase 1 |
| Phase 3: Generate & Apply Migration | 2-3 hours | After Phase 2 |
| Phase 4: Update Python Models | 2-3 hours | Parallel with Phase 3 |
| Phase 5: Merge Branches | 3-5 days | After Phase 3-4 |
| Phase 6: Verify Integration | 1 day | After Phase 5 |

**Total: ~7-10 days** (including testing and verification)

---

## Immediate Next Steps

### TODAY:

**Step 1: Find Current Database Config** (15 minutes)
```bash
cd e:\onlinewebsites\quiz-platform

# Check database configuration
cat packages/db-tutorial/drizzle.config.ts
cat packages/db-tutorial/.env.local
cat packages/db-tutorial/.env

# Check existing schema structure
ls -la packages/db-tutorial/src/schema/
cat packages/db-tutorial/src/schema.ts
```

**Step 2: Review Existing Migrations** (15 minutes)
```bash
# See what migrations already exist
ls -la packages/db-tutorial/drizzle/

# Check latest migration
ls packages/db-tutorial/drizzle/*.sql | tail -1 | xargs cat
```

**Step 3: Find Project LLM Models** (30 minutes)
```bash
# Check canonical-wiring branch
git show m2-project-ai-canonical-wiring:services/project-ai/app/models/candidate.py

# Check foundation branch
git show m2-project-ai-foundation:services/project-ai/app/models/candidate.py

# Find which has most complete implementation
git diff m2-project-ai-canonical-wiring:services/project-ai/app/models/ m2-project-ai-foundation:services/project-ai/app/models/
```

### TOMORROW:

**Step 4: Create Unified Schema** (see Phase 2 above)

**Step 5: Generate Migration** (see Phase 3 above)

**Step 6: Apply to Existing Database** (see Phase 3.3 above)

---

## Questions to Confirm

Before I proceed with creating the schema file, please confirm:

1. **Database Name:** What is your actual database name?
   - `tutorial`?
   - `quiz_platform`?
   - Something else?

2. **Database Location:**
   - Neon PostgreSQL (cloud)?
   - Local PostgreSQL?
   - Connection string format?

3. **Existing `brands` Table:**
   - Confirm this table exists (for foreign keys)
   - Column name is `id`?
   - Data type is `varchar(50)` or `uuid`?

4. **Current Connection:**
   - Can you connect now: `psql $DATABASE_URL_TUTORIAL`?
   - Or need to set up connection first?

5. **Merge Strategy:**
   - Start with schema + canonical-wiring (recommended)?
   - Or different order?

---

## What I Can Do Next

**Option 1: Investigate Current Setup** (Recommended first)
```
I'll check:
- Current database config
- Existing schema structure  
- Which branch has complete models
- Where uploader_brand/requester_brand should be
```

**Option 2: Create Schema File Immediately**
```
If you confirm database details, I'll create:
- packages/db-tutorial/src/schema/project-llm.ts
- Complete with all 5 tables
- Including missing brand columns
```

**Option 3: Full Implementation**
```
I'll execute all 6 phases:
- Create schema
- Generate migration
- Apply to database
- Update Python models
- Merge branches
- Verify integration
```

**Which would you like me to do?**
