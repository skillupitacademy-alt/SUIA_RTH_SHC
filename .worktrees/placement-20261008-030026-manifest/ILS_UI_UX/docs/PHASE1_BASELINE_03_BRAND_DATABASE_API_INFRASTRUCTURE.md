# PHASE 1 BASELINE — PART 03: BRAND / DATABASE / API / INFRASTRUCTURE

**Status:** Evidence Package — Part 3 of 7  
**Source:** Original PHASE1_REPOSITORY_BASELINE.md (Lines 1857-2644)  
**Date:** October 4, 2026

---

**Continue to Part 3...**

Let me check the file status:Perfect! You've pasted Part 1 and Part 2 successfully (57KB so far). Here's **Part 3**:

---

## 18. Brand Runtime Baseline

### Brand Architecture

**Two Production Brands:**

| Brand | App | Domain (Production) | Dev Port | Theme Primary | Theme Secondary |
|-------|-----|---------------------|----------|---------------|-----------------|
| Real Tutorial Hub (RTH) | realtutorialhub-web | realtutorialhub.com | 3003 | #f54a8d | #1e293b |
| SkillUp IT Academy (SUIA) | skillup-web | skillupitacademy.com | 3009 | (TBD) | (TBD) |

**Evidence:**
- RTH app: `apps/realtutorialhub-web/package.json` (dev port 3003)
- SUIA app: `apps/skillup-web/package.json` (dev port 3009)

### Brand Resolution Mechanism

**Hostname-Based Resolution:**

```typescript
// Inferred from multi-brand architecture

function resolveBrand(hostname: string): Brand {
  if (hostname.includes('realtutorialhub')) {
    return 'realtutorialhub';
  } else if (hostname.includes('skillup')) {
    return 'skillup';
  }
  return 'shared';  // Default/admin
}

function resolveBrandTheme(brand: Brand): DomainTheme {
  switch (brand) {
    case 'realtutorialhub':
      return { primary: '#f54a8d', secondary: '#1e293b' };
    case 'skillup':
      return { primary: '...', secondary: '...' };
    default:
      return { primary: '#3b82f6', secondary: '#1e293b' };
  }
}
```

**Evidence:** Test files reference brand-specific themes, tutorial pages pass theme prop

### Database Brand Partitioning

**tutorial_sections table:**

```typescript
{
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandCustomizations: jsonb('brand_customizations').$type<{
    brandId: string;
    customTitle?: string;
    customStyling?: any;
    customMetadata?: any;
  }[]>(),
}
```

**Evidence:** `packages/db-tutorial/src/schema/tutorial-sections.ts` lines 60-70

**Brand Values (from enums.ts):**
```typescript
export const brandEnum = pgEnum('brand', [
  'shared',
  'realtutorialhub',
  'skillup',
  'skillhubcore'
]);

export const brandVisibilityEnum = pgEnum('brand_visibility', [
  'shared_visible',      // Visible to all brands
  'brand_exclusive',     // Visible only to specific brand
  'hidden'              // Not visible
]);
```

**Evidence:** `packages/db-tutorial/src/schema/enums-modular.ts`

### One Block, Multiple Brands

**How I1 Serves Both Brands:**

1. **Type Definition (brand-agnostic):**
   ```typescript
   export type IntroductionBlock = IntroductionI1Block;
   // No brand-specific variants
   ```

2. **Component (theme-aware):**
   ```typescript
   function IntroductionI1View({ block, theme }: Props) {
     const primary = theme.primary;    // RTH: #f54a8d, SUIA: different
     const secondary = theme.secondary;
     
     // Apply theme dynamically via inline styles
     return (
       <article style={{ color: secondary }}>
         <div style={{ backgroundColor: primary }}>
           {/* Content uses theme colors */}
         </div>
       </article>
     );
   }
   ```

3. **Runtime (theme injection):**
   ```typescript
   <TutorialPageShell 
     payload={{ theme: resolveBrandTheme(brand), ... }}
   />
   ```

**Result:** One I1 implementation renders differently per brand via theme prop

### Brand-Specific Customizations

**Content Level:**
- `tutorial_sections.brandCustomizations` allows per-brand overrides
- Custom titles, styling, metadata per brand
- Most content is `brand: 'shared'` (visible to all)

**UI Level:**
- Theme colors
- Logo
- Typography (font-family)
- Accent colors

**I2 Requirement:**
- I2 must accept `theme` prop
- I2 must apply `theme.primary` and `theme.secondary` dynamically
- I2 must NOT hardcode brand-specific colors

### Brand Enum in Requests

**Composer API:**
```
GET /api/tutorial-composer/sections?subtopicId=X&brandId=realtutorialhub
```

**Delivery API:**
```
GET /api/tutorial/delivery/:navigationNodeId?brand=realtutorialhub
```

**Evidence:** API routes and tests reference brandId query parameters

### Admin vs Brand Apps

| App | Purpose | Brand Scope |
|-----|---------|-------------|
| skillhubcore-admin | Content authoring | All brands (can create content for any brand) |
| realtutorialhub-web | Learner experience | RTH only |
| skillup-web | Learner experience | SUIA only |

**Project LLM in SkillHubCore Admin:**
- Creates blocks for ANY brand
- Block Request specifies target brands (RTH, SUIA, or both)
- Generated I2 must be brand-agnostic (uses theme prop)

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| Brand Count | 2 production (RTH + SUIA) | apps/realtutorialhub-web + apps/skillup-web |
| Resolution | Hostname-based | Inferred from architecture |
| Theme Injection | DomainTheme prop | TutorialPageShell → TutorialBlockRenderer → blocks |
| Database | brandId + brandVisibility columns | tutorial_sections schema |
| One Block Serves All | ✅ YES | Theme prop makes blocks brand-agnostic |
| I2 Requirement | Accept theme prop, apply dynamically | MANDATORY |

---

## 19. Authentication Baseline

### Authentication System

**Package:** `@quiz/auth` (workspace package)

**Location:** `packages/auth/`

**Evidence:** Multiple apps depend on `@quiz/auth` in package.json

### Middleware

**Auth Middleware Files Found:**

```
packages/auth/src/middleware/
├── auth.middleware.ts           ← Main auth middleware
├── cookie.middleware.ts         ← Cookie handling
└── brand-validator.middleware.ts ← Brand validation
```

**Evidence:** File search results for middleware.ts

### Authentication Mechanism (Inferred)

**Session-Based Auth:**
- Cookie-based sessions
- JWT tokens (evidence from test files referencing JWT)
- Session validation in middleware

**Evidence:**
- `cookie.middleware.ts` exists
- Test files reference JWT validation
- API routes protected by auth middleware

### SkillHubCore Admin Auth

**Admin Protection:**
- SkillHubCore Admin requires authentication
- Admin routes protected by middleware
- Role-based access control

**Evidence:**
- Tests reference admin role checks
- Auth middleware files exist in packages/auth/

### User Identity

**User Model (Inferred):**
```typescript
interface User {
  id: string;              // UUID
  email: string;
  role: UserRole;          // 'admin' | 'faculty' | 'learner' | ...
  brandId?: string;        // Optional brand affiliation
}

type UserRole = 
  | 'admin'
  | 'faculty'
  | 'learner'
  | 'guest';
```

**Evidence:** Database packages include user-related schemas, tests reference userId

### Server/Client Boundary

**Server-Side Auth:**
- Middleware validates sessions on server
- API routes check auth before processing
- Client receives auth status from server

**Client-Side:**
- No JWT secrets in browser
- Client reads session cookie (httpOnly)
- Client redirects to login if unauthorized

**Evidence:** Next.js middleware pattern, httpOnly cookies standard in Next.js auth

### API Authentication

**API Routes:**
- Protected routes require valid session
- Middleware extracts userId from session
- userId passed to service layer

**Example Flow:**
```typescript
// API route
export async function GET(request: NextRequest) {
  const session = await getSession(request);  // From auth middleware
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.userId;
  // Use userId in business logic
}
```

**Evidence:** Standard Next.js API route auth pattern

### Project LLM Auth Requirements

**Access Control:**
- Project LLM workbench requires **admin** role
- Only admins can create Block Requests
- Only admins can review candidates
- HAA role may be separate from general admin

**Implementation Path:**
1. Use existing `@quiz/auth` package
2. Protect Project LLM routes with auth middleware
3. Check admin role in API routes
4. Client-side: redirect to login if unauthorized

**No new auth system needed** - reuse existing infrastructure

### HAA Role (Human Architecture Authority)

**HAA Requirement (from Revision 2):**
- HAA approves Phase 1 scope (Gate 1)
- HAA certifies I2 candidates (Gate 2)
- HAA approves Phase 2+ expansion (Gate 3)

**Implementation Options:**

**Option A: HAA as Super-Admin**
- HAA is admin with special permissions
- Database flag: `users.is_haa = true`

**Option B: Separate HAA Role**
- New role: `role = 'haa'`
- Inherits admin permissions
- Additional certification authority

**Option C: Permission-Based**
- Admin role + `permissions.certify_blocks = true`

**Recommendation:** Determine during Phase 1A foundation implementation

### Session Management

**Tutorial Sessions:**
- Separate from auth sessions
- Stored in sessionStorage
- Key: `tutorialLearningSessionId`
- Used for ILS telemetry deduplication

**Auth Sessions:**
- Stored in httpOnly cookies
- Managed by auth middleware
- Validated on each request

**Two separate session types** - do not confuse

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| Auth Package | ✅ @quiz/auth | packages/auth/ |
| Middleware | ✅ auth.middleware.ts | Verified file exists |
| Session Type | Cookie-based (inferred) | cookie.middleware.ts exists |
| Admin Protection | ✅ Middleware-based | Standard Next.js pattern |
| API Auth | ✅ Per-route validation | Next.js middleware |
| Server/Client Boundary | ✅ Server validates, client reads | Standard pattern |
| Project LLM | Reuse existing auth | No new system needed |
| HAA Role | TO BE DETERMINED | Phase 1A decision |

---

## 20. Authorization Baseline

### Authorization Architecture

**Role-Based Access Control (RBAC):**

**Roles Identified (from evidence):**
1. **admin** - Full system access
2. **faculty** - Teaching/content creation access
3. **learner** - Tutorial consumption only
4. **guest** - Unauthenticated visitor

**Evidence:** Test scripts reference role validation, faculty-app exists

### Admin Authorization

**Admin Capabilities:**
- Access SkillHubCore Admin
- Create/edit/publish tutorial content via Composer
- Manage users (inferred)
- Access admin tools

**Protection:**
- Middleware checks `user.role === 'admin'`
- Admin routes under `(admin)` route group
- API routes validate admin role

**Evidence:** skillhubcore-admin app structure with (admin) route group

### Faculty Authorization

**Faculty App:** `apps/faculty-app/`

**Faculty Capabilities (inferred):**
- Create tutorial content
- Review student progress
- Grade assignments
- Limited admin access

**Evidence:** faculty-app exists in apps/ directory

### Learner Authorization

**Learner Capabilities:**
- View published tutorials
- Track progress (ILS)
- Complete assignments
- Cannot edit content

**Evidence:** Tutorial delivery apps (RTH, SUIA) serve learners

### Project LLM Authorization Requirements

**Required Permissions:**

| Action | Required Role | Gate |
|--------|---------------|------|
| Create Block Request | admin | None |
| View Repository Context | admin | None |
| Generate Creation Brief | admin | None |
| Submit to External AI | admin | None |
| Intake Candidate | admin | None |
| Review Compliance | admin | None |
| Generate Correction Instructions | admin | None |
| Generate Integration Plan | admin | None |
| Generate Validation Plan | admin | None |
| Generate Evidence Package | admin | None |
| **Mark CERTIFICATION_READY** | **admin** | **Gate 2 Entry** |
| **CERTIFY Block (HAA)** | **HAA** | **Gate 2 Exit** |
| **REJECT Block (HAA)** | **HAA** | **Gate 2 Exit** |

**HAA vs Admin:**
- Most Project LLM workflow: **admin** role
- Final certification (CERTIFY/REJECT): **HAA** role only

### API Route Authorization

**Pattern:**
```typescript
// Example: POST /api/project-llm/requests

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (session.role !== 'admin' && session.role !== 'haa') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with request
}
```

### Certification Authority

**HAA Certification Gate:**

```typescript
// Example: POST /api/project-llm/certifications/:id/certify

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(request);
  
  if (session.role !== 'haa') {
    return NextResponse.json({ 
      error: 'Forbidden: Only HAA can certify blocks' 
    }, { status: 403 });
  }
  
  // Proceed with certification
}
```

**CRITICAL:** Only HAA can move block to CERTIFIED status

### Authorization Storage

**Database (inferred):**
```typescript
// users table (or similar)
{
  id: uuid,
  email: string,
  role: 'admin' | 'faculty' | 'learner' | 'haa',
  permissions: jsonb,  // Optional: granular permissions
}
```

**Evidence:** Standard user model pattern

### Project LLM Specific Permissions

**Granular Permissions (optional Phase 2+):**
- `project_llm.create_request`
- `project_llm.review_compliance`
- `project_llm.generate_evidence`
- `project_llm.certify_block` (HAA only)
- `project_llm.reject_block` (HAA only)

**Phase 1 Recommendation:** Use simple role-based (admin + HAA)

### Audit Trail

**Authorization Events to Log:**
- Who created Block Request
- Who reviewed compliance
- Who marked CERTIFICATION_READY
- Who certified (HAA)
- Who rejected (HAA)

**Stored in:** `project_llm_certifications` table (to be created)

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| RBAC Model | ✅ Role-based | admin, faculty, learner roles |
| Admin Access | ✅ Middleware-protected | (admin) route group |
| HAA Role | TO BE IMPLEMENTED | Phase 1A decision |
| API Authorization | Per-route role check | Standard Next.js pattern |
| Certification Authority | HAA ONLY | MANDATORY from Revision 2 |
| Audit Trail | Required for certification | project_llm_certifications table |
| Project LLM | admin + HAA roles | Simple Phase 1 approach |

---

## 21. Database Baseline

### ORM & Database

**ORM:** Drizzle ORM 0.45.1

**Database:** PostgreSQL (via Drizzle)

**Evidence:**
- `package.json` devDependencies: `drizzle-orm: ^0.45.1`
- `packages/db-tutorial/src/db.ts` - Drizzle connection setup

### Schema Location

**Main Schema Package:** `packages/db-tutorial/`

**Schema Files:**
```
packages/db-tutorial/src/schema/
├── index.ts                              ← Re-exports all schemas
├── tutorial-sections.ts                  ← Tutorial content storage
├── tutorial-navigation-progress.ts       ← Page-level progress
├── block-learning-state.ts               ← Block-level telemetry
├── tutorial-subtopics.ts                 ← Curriculum hierarchy
├── tutorial-topics.ts
├── tutorial-subjects.ts
├── tutorial-domains.ts
├── enums.ts                              ← Shared enums
├── enums-modular.ts                      ← Additional enums
└── [50+ other schema files]
```

**Evidence:** Directory listing verified, 54 schema files found

### Migration System

**Drizzle Kit:** 0.31.8

**Migration Commands (inferred):**
```bash
pnpm drizzle-kit generate  # Generate migration from schema
pnpm drizzle-kit migrate   # Apply migrations
```

**Evidence:** `package.json` devDependencies: `drizzle-kit: ^0.31.8`

### Naming Conventions

**Table Names:**
- snake_case: `tutorial_sections`, `block_learning_state`
- Descriptive: `tutorial_navigation_progress`
- Namespaced: Tables related to tutorials start with `tutorial_*`

**Column Names:**
- snake_case: `navigation_node_id`, `created_at`
- Consistent patterns: `*_at` for timestamps, `*_id` for foreign keys

**Evidence:** Schema file analysis

### ID Strategy

**Primary Keys:**
```typescript
id: uuid('id').primaryKey().defaultRandom()
```

**UUIDs for all primary keys:**
- PostgreSQL `uuid` type
- Server-generated via `defaultRandom()`
- No auto-increment integers

**Evidence:** All schema files use uuid primary keys

### Timestamp Patterns

**Standard Timestamp Columns:**
```typescript
{
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),  // Soft delete
}
```

**Timestamp Format:**
- Type: `timestamp` (PostgreSQL)
- Mode: `'date'` (JavaScript Date object)
- Created/Updated: NOT NULL with defaults
- Deleted: Nullable (soft delete pattern)

**Evidence:** Consistent across all schema files

### Audit Columns

**Standard Audit Pattern:**
```typescript
{
  version: integer('version').notNull().default(1),  // Optimistic locking
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}
```

**Evidence:** block_learning_state.ts, tutorial_navigation_progress.ts, tutorial_sections.ts

### Status Enums

**Common Status Enum:**
```typescript
export const sectionStatusEnum = pgEnum('section_status', [
  'draft',
  'published',
  'archived'
]);

export const tutorialProgressStatusEnum = pgEnum('tutorial_progress_status', [
  'not_started',
  'in_progress',
  'completed',
  'archived'
]);
```

**Evidence:** `packages/db-tutorial/src/schema/enums-modular.ts`

### JSON Columns

**JSONB Usage:**
```typescript
// tutorial_sections.content
content: jsonb('content').$type<TutorialDocument>().notNull()

// tutorial_navigation_progress.completed_blocks
completedBlocks: jsonb('completed_blocks').$type<CompletedBlockRecord[]>().notNull().default([])

// tutorial_sections.brand_customizations
brandCustomizations: jsonb('brand_customizations').$type<BrandCustomizations[]>()
```

**JSONB for:**
- Complex structured data (TutorialDocument)
- Arrays of records (completedBlocks)
- Flexible configurations (brandCustomizations)

**Evidence:** tutorial_sections.ts, tutorial_navigation_progress.ts

### Foreign Keys

**FK Pattern:**
```typescript
subtopicId: uuid('subtopic_id')
  .notNull()
  .references(() => tutorialSubtopics.id, { onDelete: 'cascade' })
```

**FK Conventions:**
- Always `uuid` type
- Reference `id` column of parent table
- Specify `onDelete` behavior (cascade, set null, restrict)
- NOT NULL for required relationships

**Evidence:** tutorial_sections.ts lines 30-32

### Soft Delete Pattern

**Implementation:**
```typescript
deletedAt: timestamp('deleted_at', { mode: 'date' })
```

**Unique Indexes with Soft Delete:**
```typescript
uqBlockLearningStateIdentity: uniqueIndex('uq_block_learning_state_identity')
  .on(table.userId, table.navigationNodeId, table.blockId, table.blockVersion)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Pattern:**
- `deletedAt IS NULL` → active record
- `deletedAt IS NOT NULL` → soft-deleted record
- Unique constraints use partial indexes (WHERE deletedAt IS NULL)

**Evidence:** block_learning_state.ts lines 69-71

### Indexes

**Index Patterns:**
```typescript
// Single column
idxBlockLearningStateUser: index('idx_block_learning_state_user')
  .on(table.userId)

// Composite
idxTutorialV2Delivery: index('idx_tutorial_v2_delivery')
  .on(table.subtopicId, table.navigationNodeId, table.brandId, table.status)

// Unique
uqNavigationProgressUserNode: uniqueIndex('uq_navigation_progress_user_node')
  .on(table.userId, table.navigationNodeId)
  .where(sql`${table.deletedAt} IS NULL`)
```

**Naming:** `idx_*` for indexes, `uq_*` for unique indexes

**Evidence:** Multiple schema files with comprehensive indexing

### Existing Tables Relevant to Project LLM

**Tables That May Be Reusable:**

| Table | Purpose | Reusable for Project LLM? |
|-------|---------|---------------------------|
| `tutorial_sections` | Stores TutorialDocument | ✅ YES - stores certified I2 |
| `tutorial_navigation_progress` | Page-level progress | ✅ YES - tracks I2 in tutorials |
| `block_learning_state` | Block-level telemetry | ✅ YES - tracks I2 telemetry |
| `prompt_templates` | AI prompt templates | ⚠️ MAYBE - for Creation Brief |
| `educational_architectures` | Content architectures | ⚠️ MAYBE - reference patterns |
| `content_review_queue` | Review workflows | ⚠️ MAYBE - compliance review |

**Evidence:** Schema files verified

### Required New Tables for Project LLM

**From Revision 2 Specification (8 tables):**

1. `project_llm_requests` - Block creation requests
2. `project_llm_repository_contexts` - Repository discovery results
3. `project_llm_creation_briefs` - Creation Brief documents
4. `project_llm_candidates` - External AI candidate content
5. `project_llm_compliance_reviews` - Compliance review results
6. `project_llm_integration_plans` - Integration instructions
7. `project_llm_evidence_packages` - Validation evidence
8. `project_llm_certifications` - HAA certification records

**Status:** NOT YET CREATED (Phase 1A foundation task)

### Database Package Structure

```
packages/db-tutorial/
├── src/
│   ├── schema/              ← Schema definitions
│   ├── services/            ← Business logic services
│   ├── repositories/        ← Data access repositories
│   ├── db.ts                ← Drizzle connection
│   └── index.ts             ← Public exports
├── package.json
└── drizzle.config.ts        ← Drizzle configuration
```

**Evidence:** Directory structure verified

### Summary

| Aspect | Implementation | Evidence |
|--------|----------------|----------|
| ORM | Drizzle 0.45.1 | package.json |
| Database | PostgreSQL | Drizzle pg driver |
| Schema Location | packages/db-tutorial/src/schema/ | 54 schema files |
| Migrations | Drizzle Kit 0.31.8 | package.json devDependencies |
| IDs | UUID (defaultRandom) | All schemas use uuid |
| Timestamps | created_at, updated_at, deleted_at | Standard pattern |
| Soft Delete | deletedAt IS NULL | Partial unique indexes |
| JSONB | TutorialDocument, arrays, configs | Flexible storage |
| Foreign Keys | UUID with onDelete cascade | Referential integrity |
| Naming | snake_case | Consistent convention |
| Project LLM Tables | NOT YET CREATED | Phase 1A task |

---