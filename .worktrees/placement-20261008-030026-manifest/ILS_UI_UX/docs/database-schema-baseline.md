# Database Schema Baseline Report for Project LLM Phase 1

# Database Schema Baseline Report for Project LLM Phase 1

## Executive Summary

The `packages/db-tutorial` database uses **Drizzle ORM** with **PostgreSQL**, following a mature, well-established architecture. The investigation reveals **53 schema files** with comprehensive patterns for foreign keys, JSONB storage, enums, indexes, audit trails, and brand partitioning. **NO existing Project LLM tables found** - this is greenfield territory within an established infrastructure.

---

## 1. DRIZZLE ORM ARCHITECTURE

### 1.1 Configuration
**File:** `packages/db-tutorial/drizzle.config.ts`

```typescript
defineConfig({
  schema: './src/schema/*.ts',        // Auto-discovers all schema files
  out: './migrations',                // Migration output directory
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL_TUTORIAL ?? process.env.DATABASE_URL_TUTORIAL
  }
})
```

**Key Patterns:**
- **Glob-based schema discovery**: All files in `src/schema/*.ts` are automatically included
- **Dual connection strings**: `DATABASE_DIRECT_URL_TUTORIAL` (direct, max 5 connections) vs `DATABASE_URL_TUTORIAL` (pooled, max 15 connections)
- **Environment-first configuration**: Checks `.env.local` and `.env` in workspace and root

### 1.2 Database Connection
**File:** `packages/db-tutorial/src/db.ts`

```typescript
// Connection pools with timeout configuration
const pool = new Pool({
  connectionString,
  max: isDirect ? 5 : 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  statement_timeout: 30_000,
  query_timeout: 30_000,
})

// Three export patterns
export const db = getTutorialDb('primary')      // Pooled connection
export const dbDirect = getTutorialDb('direct')  // Direct connection
export const dbHttp = getTutorialHttpDb()        // HTTP-based (Neon serverless)
```

**Connection Strategy:**
- Pooled for normal operations (15 connections)
- Direct for migrations/admin tasks (5 connections)
- HTTP for serverless edge functions
- Test mode: Returns mock DB if no connection string

---

## 2. TABLE DEFINITION PATTERNS

### 2.1 Standard Table Structure

**Example from `tutorial-projects.ts`:**

```typescript
export const tutorialProjects = pgTable('tutorial_projects', {
  // PRIMARY KEY: Always UUID with defaultRandom()
  id: uuid('id').primaryKey().defaultRandom(),
  
  // FOREIGN KEYS: Explicit references with onDelete behavior
  parentId: uuid('parent_id').notNull(),
  badgeId: uuid('badge_id'),  // Nullable FK
  
  // ENUMS: Imported from enums.ts
  scope: tutorialProjectScopeEnum('scope').notNull(),
  level: tutorialProjectLevelEnum('level').notNull(),
  
  // TEXT FIELDS: text() for unbounded, varchar() for length limits
  title: text('title').notNull(),
  description: text('description'),  // Nullable
  
  // JSONB: Typed with $type<>(), always with defaults
  subtopicsCovered: jsonb('subtopics_covered')
    .$type<string[]>()
    .notNull()
    .default([]),
  
  // INTEGERS: For counts, IDs, scores
  estimatedHours: integer('estimated_hours'),
  version: integer('version').notNull().default(1),
  
  // BOOLEANS: Always with defaults
  isPublished: boolean('is_published').notNull().default(false),
  
  // TIMESTAMPS: Standard audit trail
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),  // Soft delete
}, (table) => ({
  // INDEXES: Composite for query patterns
  idxTutorialProjectsScope: index('idx_tutorial_projects_scope')
    .on(table.scope, table.level),
}))
```

### 2.2 Core Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| **Primary Key** | `id: uuid('id').primaryKey().defaultRandom()` | All tables |
| **Foreign Keys** | Explicit `.references()` with cascade rules | `tutorial-sections.ts` |
| **Enums** | `pgEnum()` definitions in `enums.ts` or `enums-modular.ts` | 30+ enums |
| **JSONB** | `.$type<TypeScript>()` with defaults | `content`, `metadata` |
| **Timestamps** | `createdAt`, `updatedAt`, `deletedAt` | 95% of tables |
| **Soft Delete** | `deletedAt IS NULL` in unique indexes | Everywhere |
| **Versioning** | `version: integer` for optimistic locking | Core tables |
| **Naming** | snake_case in DB, camelCase in TypeScript | All files |

---

## 3. FOREIGN KEY CONVENTIONS

### 3.1 Explicit References with Cascade Rules

**Example from `tutorial-sections.ts`:**

```typescript
export const tutorialSections = pgTable('tutorial_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // CASCADE DELETE: Child dies with parent
  subtopicId: uuid('subtopic_id')
    .notNull()
    .references(() => tutorialSubtopics.id, { onDelete: 'cascade' }),
  
  // SET NULL: Preserve child, nullify reference
  promptTemplateId: uuid('prompt_template_id')
    .references(() => promptTemplates.id, { onDelete: 'set null' }),
  
  // RESTRICT: Prevent parent deletion if children exist
  educationalArchitectureId: uuid('educational_architecture_id')
    .references(() => educationalArchitectures.id, { onDelete: 'restrict' }),
})
```

### 3.2 Cascade Strategies Observed

| Strategy | Usage | Rationale |
|----------|-------|-----------|
| **cascade** | Parent-child ownership | Quiz answers → Sections, Submissions → Projects |
| **set null** | Optional dependencies | Templates, Architectures (preserve data) |
| **restrict** | Integrity enforcement | Prevent deleting active references |
| **No action** | External references | User IDs (managed by auth system) |

### 3.3 External ID Pattern

**File:** `tutorial-domains.ts`

```typescript
export const tutorialDomains = pgTable('tutorial_domains', {
  id: uuid('id').primaryKey().defaultRandom(),        // Internal ID
  externalId: uuid('external_id').notNull(),          // Main DB ID
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  // ...
}, (table) => ({
  uqExternalId: uniqueIndex('uq_tutorial_domains_external_id')
    .on(table.externalId),
}))
```

**Pattern Used For:**
- Cross-database references (main DB ↔ tutorial DB)
- Preserves referential integrity across databases
- Repository layer handles ID resolution

---

## 4. JSONB USAGE PATTERNS

### 4.1 Structured Content Storage

**Example from `tutorial-sections.ts`:**

```typescript
import type { TutorialDocument } from '@quiz/types';

export const tutorialSections = pgTable('tutorial_sections', {
  // Full document content as JSONB
  content: jsonb('content').$type<TutorialDocument>().notNull(),
  
  // Typed arrays
  brandCustomizations: jsonb('brand_customizations').$type<{
    brandId: string;
    customTitle?: string;
    customStyling?: any;
    customMetadata?: any;
  }[]>(),
  
  // Complex objects
  qualityScore: integer('quality_score'),
  hallucinationScore: integer('hallucination_score'),
})
```

### 4.2 Common JSONB Use Cases

| Use Case | Type | Example Table |
|----------|------|---------------|
| **Document content** | `TutorialDocument` | `tutorial_sections.content` |
| **Metadata** | `Record<string, unknown>` | `user_interactions` |
| **Array fields** | `string[]`, `object[]` | `completed_blocks`, `sections_generated` |
| **Execution results** | `{ success, output, error }` | `code_interactions.execution_result` |
| **Audit trails** | `{ before, after, diff }` | `layman_audit_logs` |
| **Flexible config** | `Record<string, any>` | `brand_customizations` |

### 4.3 JSONB Defaults

**Always provide defaults for JSONB arrays:**

```typescript
// ✅ CORRECT
completedBlocks: jsonb('completed_blocks')
  .$type<string[]>()
  .notNull()
  .default([]),

// ❌ AVOID
completedBlocks: jsonb('completed_blocks').$type<string[]>().notNull(),
```

---

## 5. ENUM PATTERNS

### 5.1 Enum Definition Locations

**Two enum files:**

1. **`enums.ts`** - Legacy/stable enums (15 enums)
2. **`enums-modular.ts`** - Phase 1 modular system enums (10 enums)

### 5.2 Enum Definition Pattern

```typescript
// File: enums-modular.ts
export const sectionStatusEnum = pgEnum('section_status', [
  'draft',
  'generating',
  'validating',
  'pending_review',
  'in_review',
  'changes_requested',
  'approved',
  'deploying',
  'deployed',
  'archived',
])

export const brandEnum = pgEnum('brand', [
  'realtutorialhub',
  'skillup',
  'skillhubcore',
  'shared',
])
```

### 5.3 Enum Usage in Tables

```typescript
import { sectionStatusEnum, brandEnum } from './enums-modular'

export const tutorialSections = pgTable('tutorial_sections', {
  status: sectionStatusEnum('status').notNull().default('draft'),
  brandId: brandEnum('brand_id').notNull().default('shared'),
})
```

### 5.4 Key Enums for Project LLM Reference

| Enum | Values | Use Case |
|------|--------|----------|
| `jobStatusEnum` | pending, running, validating, completed, failed, retrying | Async jobs |
| `reviewStatusEnum` | pending_review, in_review, approved, rejected, changes_requested | Review workflow |
| `priorityLevelEnum` | low, normal, high, urgent | Task prioritization |
| `brandEnum` | realtutorialhub, skillup, skillhubcore, shared | Multi-brand |

---

## 6. INDEX PATTERNS

### 6.1 Single Column Indexes

```typescript
// Query by user ID
idxQuizAnswersUser: index('idx_quiz_answers_user').on(table.userId)

// Query by status
idxReviewQueueStatus: index('idx_review_queue_status').on(table.status)
```

### 6.2 Composite Indexes (Query Optimization)

```typescript
// Multi-column queries
idxTutorialV2Delivery: index('idx_tutorial_v2_delivery')
  .on(table.subtopicId, table.navigationNodeId, table.brandId, table.status)

// Time-series queries
idxNavigationProgressLastViewed: index('idx_navigation_progress_last_viewed')
  .on(table.userId, table.lastViewedAt)
```

### 6.3 Unique Indexes with Soft Delete

```typescript
import { sql } from 'drizzle-orm'

// Partial unique index - only enforces on active records
uqTutorialV2IdentityActive: uniqueIndex('uq_tutorial_v2_identity_active')
  .on(table.subtopicId, table.navigationNodeId, table.brandId)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Critical Pattern:** All unique constraints use partial indexes excluding soft-deleted records.

### 6.4 GIN Indexes for JSONB

```typescript
// Full-text search on JSONB content
idxTutorialContentContentGin: index('idx_tutorial_content_content_gin')
  .using('gin', table.content)
```

### 6.5 Index Naming Convention

| Pattern | Example | Usage |
|---------|---------|-------|
| `idx_{table}_{column}` | `idx_quiz_answers_user` | Single column |
| `idx_{table}_{purpose}` | `idx_tutorial_v2_delivery` | Composite/purpose |
| `uq_{table}_{constraint}` | `uq_tutorial_v2_identity_active` | Unique constraint |

---

## 7. TIMESTAMP & AUDIT PATTERNS

### 7.1 Standard Audit Trail

```typescript
// Every table should have these three
createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
deletedAt: timestamp('deleted_at', { mode: 'date' })  // Soft delete
```

### 7.2 Domain-Specific Timestamps

```typescript
// Lifecycle events
submittedAt: timestamp('submitted_at', { mode: 'date' })
gradedAt: timestamp('graded_at', { mode: 'date' })
approvedAt: timestamp('approved_at', { mode: 'date' })
publishedAt: timestamp('published_at', { mode: 'date' })

// Session tracking
firstViewedAt: timestamp('first_viewed_at', { mode: 'date' })
lastViewedAt: timestamp('last_viewed_at', { mode: 'date' })
completedAt: timestamp('completed_at', { mode: 'date' })

// Job lifecycle
startedAt: timestamp('started_at', { mode: 'date' })
completedAt: timestamp('completed_at', { mode: 'date' })
estimatedCompletionAt: timestamp('estimated_completion_at', { mode: 'date' })
```

### 7.3 Comprehensive Audit Tables

**Example from `layman-audit-logs.ts`:**

```typescript
export const laymanAuditLogs = pgTable('layman_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Entity tracking
  sectionId: uuid('section_id'),
  promptId: uuid('prompt_id'),
  
  // Action details
  action: laymanAuditActionEnum('action').notNull(),
  actionCategory: varchar('action_category', { length: 50 }).notNull(),
  
  // Actor information
  userId: uuid('user_id').notNull(),
  userRole: varchar('user_role', { length: 50 }),
  
  // Change tracking
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  diff: jsonb('diff'),
  
  // Metadata
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Result
  success: varchar('success', { length: 20 }).notNull().default('success'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})
```

**Audit Log Pattern:**
- Before/after state snapshots
- Actor tracking (user, role, IP, user agent)
- Metadata for context
- Success/failure tracking
- Comprehensive indexing

---

## 8. MIGRATION WORKFLOW

### 8.1 Migration File Naming

**Pattern:** `NNNN_descriptive_name.sql`

```
0000_t1_foundation.sql              # Foundation
0013_colorful_wong.sql               # Drizzle auto-names
0022_broken_supernaut.sql            # (random Marvel names)
0025_quiet_tenebrous.sql             # Latest
```

### 8.2 Migration Journal

**File:** `migrations/meta/_journal.json`

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1774000000000,
      "tag": "0000_t1_foundation",
      "breakpoints": true
    }
  ]
}
```

### 8.3 Enum Migration Pattern

**Safe enum additions:**

```sql
-- File: 0013_colorful_wong.sql
ALTER TYPE "public"."brand" ADD VALUE 'skillhubcore' BEFORE 'shared';
```

**Note:** PostgreSQL doesn't support removing enum values - requires table recreation.

### 8.4 Migration Commands

```json
{
  "db:generate": "drizzle-kit generate",    // Generate from schema
  "db:migrate": "drizzle-kit migrate",      // Apply migrations
  "db:studio": "drizzle-kit studio"         // Visual DB explorer
}
```

### 8.5 Table Creation Pattern

```sql
CREATE TABLE IF NOT EXISTS "tutorial_navigation_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  -- ... columns ...
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes created separately
CREATE UNIQUE INDEX "uq_navigation_progress_user_node" 
  ON "tutorial_navigation_progress" 
  USING btree ("user_id","navigation_node_id") 
  WHERE "tutorial_navigation_progress"."deleted_at" IS NULL;

CREATE INDEX "idx_navigation_progress_user" 
  ON "tutorial_navigation_progress" 
  USING btree ("user_id");
```

---

## 9. BRAND PARTITIONING ARCHITECTURE

### 9.1 Multi-Brand Support

**From `enums-modular.ts`:**

```typescript
export const brandEnum = pgEnum('brand', [
  'realtutorialhub',
  'skillup',
  'skillhubcore',  // Central Content Factory
  'shared',         // Shared/universal content
])

export const brandVisibilityEnum = pgEnum('brand_visibility', [
  'brand_exclusive',   // Only visible to specific brand
  'shared_visible',    // Visible across brands
  'white_label',       // Customizable per brand
])
```

### 9.2 Brand Fields in Tables

```typescript
export const tutorialSections = pgTable('tutorial_sections', {
  // Brand identity
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility')
    .notNull()
    .default('shared_visible'),
  
  // Brand-specific customizations
  brandCustomizations: jsonb('brand_customizations').$type<{
    brandId: string;
    customTitle?: string;
    customStyling?: any;
    customMetadata?: any;
  }[]>(),
})
```

### 9.3 Brand-Aware Queries

**From `tutorial-section.repository.ts`:**

```typescript
async getTutorialByPageIdentity(
  subtopicId: string,
  navigationNodeId: string,
  brandId: string = 'shared'
) {
  return db.select()
    .from(tutorialSections)
    .where(and(
      eq(tutorialSections.subtopicId, subtopicId),
      eq(tutorialSections.navigationNodeId, navigationNodeId),
      or(
        eq(tutorialSections.brandId, brandId),
        eq(tutorialSections.brandId, 'shared')  // Fallback
      ),
      isNull(tutorialSections.deletedAt)
    ))
}
```

---

## 10. RECOMMENDED SCHEMA FILE LOCATION

### 10.1 Directory Structure

```
packages/db-tutorial/
├── src/
│   ├── schema/
│   │   ├── index.ts                          # Schema registry
│   │   ├── enums.ts                          # Legacy enums
│   │   ├── enums-modular.ts                  # Modern enums
│   │   ├── tutorial-sections.ts              # Example table
│   │   └── project-llm-*.ts                  # ← NEW: Project LLM schemas
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   └── project-llm-*.repository.ts       # ← NEW: Repositories
│   └── db.ts
├── migrations/
│   ├── 0025_quiet_tenebrous.sql
│   └── 0026_add_project_llm_tables.sql       # ← NEW: Migration
└── drizzle.config.ts
```

### 10.2 Naming Convention for Project LLM

**Schema Files (8 tables):**

```
src/schema/
├── project-llm-requests.ts           # project_llm_requests
├── project-llm-repository-contexts.ts # repository_contexts
├── project-llm-creation-briefs.ts    # creation_briefs
├── project-llm-candidates.ts         # candidates
├── project-llm-compliance-reviews.ts # compliance_reviews
├── project-llm-integration-plans.ts  # integration_plans
├── project-llm-evidence-packages.ts  # evidence_packages
└── project-llm-certifications.ts     # certifications
```

### 10.3 Schema Index Registration

**Add to `src/schema/index.ts`:**

```typescript
// ===== PROJECT LLM PHASE 1 =====
export * from './project-llm-requests';
export * from './project-llm-repository-contexts';
export * from './project-llm-creation-briefs';
export * from './project-llm-candidates';
export * from './project-llm-compliance-reviews';
export * from './project-llm-integration-plans';
export * from './project-llm-evidence-packages';
export * from './project-llm-certifications';

// Import and add to schema object
import * as projectLlmRequestsModule from './project-llm-requests';
// ... other imports ...

export const schema = {
  ...existingSchemas,
  
  // Project LLM Phase 1
  ...projectLlmRequestsModule,
  // ... other modules ...
}
```

---

## 11. REPOSITORY LAYER PATTERNS

### 11.1 Base Repository

**File:** `src/repositories/base.repository.ts`

```typescript
export abstract class TutorialRepositoryBase {
  constructor(protected dbInstance: typeof db = db) {}
  
  // Allow transaction usage
  abstract withDb(dbClient: TutorialDbClientLike): this;
  
  // Query timeout wrappers
  protected runRead<T>(queryPromise: Promise<T>, description: string): Promise<T> {
    return withTimeout(queryPromise, STANDARD_QUERY_TIMEOUT, description);
  }
  
  protected runReport<T>(queryPromise: Promise<T>, description: string): Promise<T> {
    return withTimeout(queryPromise, REPORT_QUERY_TIMEOUT, description);
  }
}
```

### 11.2 Repository Pattern

```typescript
export class ProjectLlmRequestRepository extends TutorialRepositoryBase {
  withDb(dbClient: TutorialDbClientLike): this {
    return new ProjectLlmRequestRepository(dbClient as typeof db) as this;
  }
  
  async getRequestById(id: string): Promise<ProjectLlmRequest | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(projectLlmRequests)
        .where(and(
          eq(projectLlmRequests.id, id),
          isNull(projectLlmRequests.deletedAt)
        ))
        .limit(1),
      'ProjectLlmRequestRepository.getRequestById'
    );
    return rows[0];
  }
  
  async createRequest(data: NewProjectLlmRequest): Promise<ProjectLlmRequest> {
    const rows = await this.runRead(
      this.dbInstance
        .insert(projectLlmRequests)
        .values(data)
        .returning(),
      'ProjectLlmRequestRepository.createRequest'
    );
    return rows[0];
  }
}
```

### 11.3 Transaction Support

```typescript
// Transaction usage
await db.transaction(async (tx) => {
  const repo = new ProjectLlmRequestRepository().withDb(tx);
  await repo.createRequest(data);
  // ... other operations ...
});
```

---

## 12. TYPE INFERENCE PATTERNS

### 12.1 Export Types from Schema

```typescript
// At end of every schema file
export type ProjectLlmRequest = typeof projectLlmRequests.$inferSelect;
export type NewProjectLlmRequest = typeof projectLlmRequests.$inferInsert;
```

### 12.2 Usage in Application Code

```typescript
import type { ProjectLlmRequest, NewProjectLlmRequest } from '@quiz/db-tutorial';

const createRequest = async (data: NewProjectLlmRequest): Promise<ProjectLlmRequest> => {
  // TypeScript validates the structure
}
```

---

## 13. RECOMMENDATIONS FOR PROJECT LLM PHASE 1

### 13.1 Table Design Checklist

✅ **Primary Key:** `id: uuid('id').primaryKey().defaultRandom()`

✅ **Foreign Keys:** Use explicit `.references()` with appropriate cascade rules
- CASCADE for owned children (e.g., compliance_reviews → candidates)
- SET NULL for optional references (e.g., assigned_reviewer_id)
- RESTRICT for critical dependencies

✅ **Timestamps:** Include `createdAt`, `updatedAt`, `deletedAt` on ALL tables

✅ **Versioning:** Add `version: integer().notNull().default(1)` for optimistic locking

✅ **Enums:** Define status/type enums in `enums-modular.ts` or new `project-llm-enums.ts`

✅ **JSONB Fields:** Always provide `.$type<>()` and `.default()` for arrays

✅ **Indexes:**
- Single: userId, status, timestamps
- Composite: (userId, status), (requestId, status)
- Unique: Use partial indexes with `WHERE deleted_at IS NULL`

✅ **Brand Partitioning:** Include `brandId` if content is brand-specific

✅ **Soft Delete:** Always use `deletedAt` with partial unique indexes

### 13.2 Enum Recommendations

**Create:** `src/schema/project-llm-enums.ts`

```typescript
export const projectLlmRequestStatusEnum = pgEnum('project_llm_request_status', [
  'pending',
  'context_gathering',
  'brief_creation',
  'candidate_generation',
  'compliance_review',
  'integration_planning',
  'certification',
  'completed',
  'failed',
  'cancelled'
]);

export const projectLlmCandidateStatusEnum = pgEnum('project_llm_candidate_status', [
  'draft',
  'under_review',
  'approved',
  'rejected',
  'integrated'
]);

export const projectLlmComplianceStatusEnum = pgEnum('project_llm_compliance_status', [
  'pending',
  'in_review',
  'passed',
  'failed',
  'needs_revision'
]);
```

### 13.3 Example Table Template

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projectLlmRequestStatusEnum } from './project-llm-enums';
import { brandEnum } from './enums-modular';

export const projectLlmRequests = pgTable('project_llm_requests', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Identity
  userId: uuid('user_id').notNull(),
  brandId: brandEnum('brand_id').notNull().default('shared'),
  
  // Request details
  projectName: text('project_name').notNull(),
  description: text('description').notNull(),
  status: projectLlmRequestStatusEnum('status').notNull().default('pending'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  
  // Versioning
  version: integer('version').notNull().default(1),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxRequestUser: index('idx_project_llm_requests_user').on(table.userId),
  idxRequestStatus: index('idx_project_llm_requests_status').on(table.status),
  idxRequestBrand: index('idx_project_llm_requests_brand').on(table.brandId),
}));

export type ProjectLlmRequest = typeof projectLlmRequests.$inferSelect;
export type NewProjectLlmRequest = typeof projectLlmRequests.$inferInsert;
```

### 13.4 Migration Generation Workflow

```bash
# 1. Create schema files in src/schema/
# 2. Register in src/schema/index.ts
# 3. Generate migration
npm run db:generate

# 4. Review generated SQL in migrations/
# 5. Apply migration
npm run db:migrate

# 6. Verify with Drizzle Studio
npm run db:studio
```

### 13.5 Testing Strategy

**Follow existing pattern from `__tests__` directories:**

```
src/
├── repositories/
│   └── __tests__/
│       └── project-llm-request.repository.test.ts
└── schema/
    └── __tests__/
        └── project-llm-requests.test.ts
```

**Test template:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { projectLlmRequests } from '../project-llm-requests';

describe('ProjectLlmRequests Schema', () => {
  it('should create request with all required fields', async () => {
    const request = await db.insert(projectLlmRequests)
      .values({
        userId: '...',
        projectName: 'Test Project',
        description: 'Test',
      })
      .returning();
    
    expect(request[0].id).toBeDefined();
    expect(request[0].status).toBe('pending');
  });
});
```

---

## 14. CRITICAL FINDINGS

### ✅ **Strengths**

1. **Mature Architecture**: 53 schema files, 25+ migrations, comprehensive patterns
2. **Type Safety**: Full TypeScript integration with Drizzle ORM
3. **Soft Delete Everywhere**: Consistent `deletedAt` pattern
4. **Audit Trail**: Comprehensive timestamp and versioning
5. **Multi-Brand Support**: Built-in brand partitioning
6. **JSONB Flexibility**: Extensive use for complex data structures
7. **Index Strategy**: Composite indexes for query optimization
8. **Transaction Support**: Repository pattern with `withDb()`
9. **Query Timeouts**: Built-in timeout protection
10. **Test Infrastructure**: Comprehensive test patterns

### ⚠️ **Considerations**

1. **No Existing Project LLM Tables**: Greenfield implementation required
2. **Enum Migration Complexity**: Cannot remove enum values (PostgreSQL limitation)
3. **JSONB Schema Evolution**: No automatic migration for JSONB structure changes
4. **Cross-Database References**: External ID pattern required for main DB ↔ tutorial DB
5. **Migration Naming**: Auto-generated Marvel names (descriptive manual naming preferred)

---

## 15. NEXT STEPS FOR PROJECT LLM PHASE 1

### Immediate Actions

1. **Create Enum Definitions**
   - File: `src/schema/project-llm-enums.ts`
   - Define all status enums for 8 tables

2. **Create Schema Files** (8 files)
   - `project-llm-requests.ts`
   - `project-llm-repository-contexts.ts`
   - `project-llm-creation-briefs.ts`
   - `project-llm-candidates.ts`
   - `project-llm-compliance-reviews.ts`
   - `project-llm-integration-plans.ts`
   - `project-llm-evidence-packages.ts`
   - `project-llm-certifications.ts`

3. **Register in Schema Index**
   - Update `src/schema/index.ts`
   - Add imports and exports

4. **Generate Migration**
   - Run `npm run db:generate`
   - Review generated SQL

5. **Create Repositories**
   - One repository per table
   - Extend `TutorialRepositoryBase`
   - Include transaction support

6. **Write Tests**
   - Schema validation tests
   - Repository CRUD tests
   - Integration tests

---

## APPENDIX: Key Files Reference

| File | Purpose | Key Content |
|------|---------|-------------|
| `drizzle.config.ts` | Drizzle configuration | Schema glob, output dir, DB URL |
| `src/db.ts` | DB connection | Pool management, timeout config |
| `src/schema/index.ts` | Schema registry | All table exports |
| `src/schema/enums.ts` | Legacy enums | 15 enum definitions |
| `src/schema/enums-modular.ts` | Modern enums | 10 enum definitions |
| `src/repositories/base.repository.ts` | Repository base | Timeout wrappers, transaction support |
| `migrations/meta/_journal.json` | Migration tracking | Applied migrations list |

---

**Report Generated:** Database Schema Investigation
**Investigation Date:** Current session
**Schema Files Analyzed:** 53
**Migration Files Reviewed:** 25+
**Status:** ✅ Comprehensive baseline established for Project LLM Phase 1 implementation