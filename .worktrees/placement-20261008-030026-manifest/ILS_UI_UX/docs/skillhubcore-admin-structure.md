# SkillHubCore Admin Application Structure Investigation

**Investigation Date**: 2025-01-04  
**Target**: `apps/skillhubcore-admin/`  
**Purpose**: Map complete architecture for Project LLM Phase 1 workbench placement

---

## Executive Summary

SkillHubCore Admin is a Next.js 16 App Router application (port 3007) providing administrative control over the educational platform ecosystem. The application uses a three-tier layout architecture with authenticated routes, integrated admin shell (left/right sidebars, header), and direct database access patterns alongside proxy-based API routes.

**Recommended Project LLM Placement**: `apps/skillhubcore-admin/src/app/(admin)/project-llm/`

---

## Application Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, React 19.2.4)
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5+
- **State Management**: Zustand 5.0.10 (with shallow selectors)
- **Data Fetching**: TanStack Query 5.90.21
- **Database**: Drizzle ORM 0.45.1 (PostgreSQL via `@quiz/db`, `@quiz/db-tutorial`)
- **Validation**: Zod 3.24.1
- **Styling**: TailwindCSS 3.4.1 + CSS variables
- **Icons**: Lucide React 0.563.0
- **UI Components**: Radix UI primitives (@radix-ui/react-alert-dialog)
- **Fonts**: Inter (body), Outfit (headings)

### Build Configuration
```json
{
  "dev": "next dev -p 3007",
  "build": "next build",
  "test": "vitest run",
  "type-check": "tsc --noEmit"
}
```

---

## Route Structure

### Layout Hierarchy

```
src/app/
├── layout.tsx                    # Root layout (fonts, metadata)
├── (public)/                     # Public routes (login, etc.)
├── (authenticated)/              # Base authenticated routes
└── (admin)/                      # ⭐ Admin-only routes (AdminGuard protected)
    ├── layout.tsx                # AdminGuard + ClientShell wrapper
    ├── ClientShell.tsx           # Shell with sidebars + header
    ├── ShellContext.tsx          # React Context for shell state
    ├── components/               # Shell components (Header, LeftSidebar, RightSidebar)
    ├── dashboard/page.tsx        # Admin dashboard
    ├── audit/page.tsx
    ├── certificate-generator/page.tsx
    ├── certificate-preview/page.tsx
    ├── content-generation/
    │   └── layman-architecture/page.tsx
    ├── events/page.tsx
    ├── marketing/page.tsx
    ├── metrics/page.tsx
    ├── subscriptions/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── tools/                    # AI Content Workspace
    │   ├── tutorial-block-composer/page.tsx
    │   ├── tutorial-left-sidebar/page.tsx
    │   └── tutorial-page-content/page.tsx
    └── users/
        ├── page.tsx
        └── [userId]/page.tsx
```

### Existing Admin Features

**Governance & Core**
- Educational Hierarchy (`/questions`)
- Constitutional Center
- Prompt Governance
- Architecture Governance
- Brand & Deployment
- System Settings
- Audit & Compliance

**Engines (Core Services)**
- Tutorial Engine
- Exam Engine
- Placement Engine
- Faculty Engine
- Internship Engine

**Content Intelligence**
- Import Content
- Content Analysis
- Block Suggestions
- Presentation Ideas
- Review & Approve
- Quality Check

**AI Content Workspace** (Tutorial Engine Suite)
- Tutorial Block Composer (`/tools/tutorial-block-composer`)
- Tutorial Left Sidebar (`/tools/tutorial-left-sidebar`)
- Tutorial Page Content (`/tools/tutorial-page-content`)

**Certificates**
- Certificate Generator
- Certificate Preview

**Users & Subscriptions**
- User Management (`/users`)
- Subscription Management (`/subscriptions`)

---

## Authentication & Authorization

### Authentication Guard

**File**: `src/components/auth/AdminGuard.tsx`

**Pattern**:
- Client-side guard using `useAuthStore` (Zustand)
- Session revalidation via `/api/admin/auth/me`
- Role check: `isAdminEquivalentRole()` (admin, super_admin, infrastructure)
- Redirect to `/login` if unauthorized
- Loading spinner during session check
- Circuit breaker for 401/403 responses
- Lock protocol support for re-authentication

**Auth Store**: `src/store/auth-store.ts` (uses `createAuthStore` from `@quiz/ui`)

### Authorization Helpers

**File**: `src/lib/auth-helpers.ts`

**Key Functions**:
```typescript
authenticateRequest(request: NextRequest): Promise<AuthContext | AuthError>
requireAdminRole(user: AuthenticatedUser): AuthError | null
requirePermission(user: AuthenticatedUser, permission: Permission, action?: string): AuthError | null
requireTutorialCreatePermission(user: AuthenticatedUser): AuthError | null
requireTutorialEditPermission(user: AuthenticatedUser): AuthError | null
requireTutorialDeletePermission(user: AuthenticatedUser): AuthError | null
requireTutorialPublishPermission(user: AuthenticatedUser): AuthError | null
requireSubtopicAccess(user: AuthenticatedUser, subtopicId: string): AuthError | null
requireBrandAccess(user: AuthenticatedUser, brandId: string): AuthError | null
```

**Token Verification**:
- Extracts tokens from `accessToken` or `admin_accessToken` cookies
- Uses `TokenService.verifyAdminAccessToken()` from `@quiz/auth`
- Supports `shc-admin` and `admin` audiences
- RBAC integration via `RBACService` and `PERMISSIONS` from `@quiz/auth/rbac`

**Usage Pattern** (API routes):
```typescript
const authResult = await authenticateRequest(request);
if ('type' in authResult) {
  return createAuthErrorResponse(authResult);
}
const { user } = authResult;

const authError = requireTutorialEditPermission(user);
if (authError) {
  return createAuthErrorResponse(authError);
}
```

---

## API Route Patterns

### Two API Architectures

**1. Proxy-Based Routes** (legacy, most routes)
- **Pattern**: Forward to upstream gateway service
- **Helper**: `proxyUpstreamRequest()` from `@/share-branding/auth`
- **Example**: `/api/admin/blueprints`, `/api/factory/save`
- **Auth**: Handled by upstream gateway

**2. Direct Database Routes** (new pattern, Tutorial Composer)
- **Pattern**: Direct DB access via Drizzle ORM
- **Auth**: Local authentication via `auth-helpers.ts`
- **Example**: `/api/tutorial-composer/sections`, `/api/admin/domains`
- **Services**: `tutorialComposerService`, `contentAnalysisService` from `@quiz/db-tutorial`

### API Route Examples

#### Educational Hierarchy CRUD

**File**: `src/app/api/admin/domains/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const results = await db
    .select()
    .from(domains)
    .where(search ? ilike(domains.name, `%${search}%`) : undefined)
    .orderBy(desc(domains.createdAt))
    .limit(limit + 1);
    
  return NextResponse.json({ data, nextCursor, hasMore });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const { name, description, category } = await request.json();
  
  const [newDomain] = await db
    .insert(domains)
    .values({ name, description, category, status: 'active' })
    .returning();
    
  return NextResponse.json(newDomain, { status: 201 });
}
```

**Pattern Observed**:
- Direct Drizzle queries
- Cursor-based pagination (`nextCursor`, `hasMore`)
- Search with `ilike()` for case-insensitive search
- Batch operations via `inArray()`
- Error handling with try/catch, console.error, 500 responses

#### Tutorial Composer Pattern

**File**: `src/app/api/tutorial-composer/sections/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Step 1: Authenticate
  const authResult = await authenticateRequest(request);
  if ('type' in authResult) return createAuthErrorResponse(authResult);
  const { user } = authResult;

  // Step 2: Check permissions
  const permError = requireTutorialCreatePermission(user);
  if (permError) return createAuthErrorResponse(permError);

  // Step 3: Validate brand access
  const brandError = requireBrandAccess(user, brandId);
  if (brandError) return createAuthErrorResponse(brandError);

  // Step 4: Validate subtopic access
  const subtopicError = requireSubtopicAccess(user, subtopicId);
  if (subtopicError) return createAuthErrorResponse(subtopicError);

  // Step 5: Validate request body (Zod schema)
  const validation = CreateTutorialSectionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors
    }, { status: 400 });
  }

  // Step 6: Business logic via service
  const context: TutorialComposerServiceContext = { userId: user.userId };
  const result = await tutorialComposerService.createSection(data, context);

  return NextResponse.json(result, { status: 201 });
}
```

**Pattern Summary**:
1. Authenticate request
2. Check RBAC permissions
3. Validate resource access (brand/subtopic)
4. Validate request body with Zod
5. Call service layer
6. Return structured response

---

## Database Integration

### Database Packages

**Primary Database**: `@quiz/db` (main educational hierarchy)
- Tables: `domains`, `subjects`, `topics`, `subtopics`, `skills`, `questions`
- Import: `import { getDb, domains, subjects } from '@quiz/db'`

**Tutorial Database**: `@quiz/db-tutorial`
- Tables: `tutorialSections`, `tutorialSubtopics`, `tutorialSidebarTreesV2`
- Services: `tutorialComposerService`, `contentAnalysisService`, `blockSuggestionService`, `presentationIdeasService`, `tutorialImportService`
- Import: `import { db, tutorialSections, buildTutorialDocument } from '@quiz/db-tutorial'`

### Database Query Patterns

**Drizzle ORM Usage**:
```typescript
import { getDb, domains } from '@quiz/db';
import { eq, ilike, desc, inArray, and } from 'drizzle-orm';

const db = getDb();

// SELECT with WHERE
const results = await db
  .select()
  .from(domains)
  .where(and(
    ilike(domains.name, `%${search}%`),
    eq(domains.status, 'active')
  ))
  .orderBy(desc(domains.createdAt))
  .limit(20);

// INSERT
const [newDomain] = await db
  .insert(domains)
  .values({ name, description, category })
  .returning();

// UPDATE
const [updated] = await db
  .update(domains)
  .set({ name, updatedAt: new Date() })
  .where(eq(domains.id, id))
  .returning();

// DELETE (soft delete pattern available)
await db
  .delete(domains)
  .where(eq(domains.id, id));

// Batch DELETE
await db
  .delete(domains)
  .where(inArray(domains.id, idsArray));
```

---

## Component Organization

### Directory Structure

```
src/
├── components/
│   ├── auth/
│   │   └── AdminGuard.tsx        # Authentication wrapper
│   ├── content/                  # Content-specific components
│   ├── entry/                    # Form entry components
│   │   └── SelectionFields.tsx   # SelectField component
│   ├── factory/                  # Question factory components
│   │   ├── blueprint/
│   │   │   ├── ContextSelector.tsx
│   │   │   ├── DistributionMatrix.tsx
│   │   │   └── SourceEditor.tsx
│   │   ├── ingest/
│   │   │   └── JsonIngestBox.tsx
│   │   └── review/
│   │       ├── QuestionCard.tsx
│   │       └── ReviewConsole.tsx
│   ├── layout/                   # Layout components
│   ├── questions/                # Question-related components
│   └── ui/                       # Shared UI primitives
│       ├── alert-dialog.tsx
│       └── ZTooltip.tsx
├── hooks/
│   ├── useAdminHierarchy.ts      # Domain/Subject/Topic/Subtopic hooks
│   ├── useFocusTrap.ts
│   ├── useJobTracker.ts
│   ├── usePresenceHeartbeat.ts
│   └── useStrictNavigation.ts
├── lib/
│   ├── auth-helpers.ts           # Authentication utilities
│   ├── cache-invalidation.ts
│   ├── skillhubcore-admin-data.ts # Mock data
│   └── utils.ts
├── store/
│   ├── auth-store.ts             # Zustand auth store
│   ├── job-store.ts
│   └── tutorial-factory-store.ts
├── types/
│   └── domain.ts                 # Domain types
└── utils/
    └── clientLogger.ts           # Client-side logging
```

### Key Components

#### Shell Components

**ClientShell** (`src/app/(admin)/ClientShell.tsx`)
- Main shell container with left sidebar, header, right sidebar
- Uses `ShellContext` for state management
- Manages sidebar visibility, header title/subtitle, right sidebar content/width
- Sets portal identity: `apiClient.client.setPortalIdentity('admin')`

**ShellContext** (`src/app/(admin)/ShellContext.tsx`)
```typescript
{
  isRightSidebarOpen: boolean,
  toggleRightSidebar: () => void,
  setIsRightSidebarOpen: (open: boolean) => void,
  headerTitle: string,
  setHeaderTitle: (title: string) => void,
  headerSubtitle: string,
  setHeaderSubtitle: (subtitle: string) => void,
  rightSidebarContent: React.ReactNode,
  setRightSidebarContent: (content: React.ReactNode) => void,
  rightSidebarWidth: string,
  setRightSidebarWidth: (width: string) => void
}
```

**Usage Pattern** (in page components):
```typescript
const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);

useEffect(() => {
  setHeaderTitle('Page Title');
  setHeaderSubtitle('Page subtitle or description');
  return () => {
    setHeaderTitle('');
    setHeaderSubtitle('');
  };
}, [setHeaderTitle, setHeaderSubtitle]);
```

#### LeftSidebar Navigation

**File**: `src/app/(admin)/components/LeftSidebar.tsx`

**Current Navigation Structure**:
```typescript
- Dashboard
- Governance & Core
  - Educational Hierarchy (/questions)
  - Constitutional Center
  - Prompt Governance
  - Architecture Governance
  - Brand & Deployment
  - System Settings
  - Audit & Compliance
- Engines (Core Services)
  - Tutorial Engine
  - Exam Engine
  - Placement Engine
  - Faculty Engine
  - Internship Engine
- Content Intelligence
  - Import Content
  - Content Analysis
  - Block Suggestions
  - Presentation Ideas
  - Review & Approve
  - Quality Check
- Content Generation
  - Overview
  - Notes Generation
  - Technical Generation
- AI Content Workspace
  - Tutorial Block Composer
  - Tutorial Left Sidebar
  - Tutorial Page Content
- Certificates
  - Certificate Generator
  - Certificate Preview
```

**Recommended Placement for Project LLM**:
- Add new section "Project LLM" or "AI Development Tools" after "AI Content Workspace"
- Or add as item under "AI Content Workspace" section

---

## Form Patterns & Validation

### Validation Strategy

**Zod Schema Validation**:
- Used extensively in API routes for request validation
- Example: `src/app/api/tutorial-left-sidebar/sidebar-schema.ts`

```typescript
import { z } from 'zod';

export const authoringNodeSchema: z.ZodType<AuthoringNavigationNode> = z.lazy(() => z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  type: z.enum(['group', 'page']),
  description: z.string().trim().min(1).optional(),
  icon: z.string().optional(),
  expanded: z.boolean().optional(),
  children: z.array(authoringNodeSchema).optional(),
}));

export const saveSchema = z.object({
  brandId: tutorialSidebarBrandIdSchema,
  domainId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  activeSubtopicId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published']),
  tree: authoringTreeSchema,
  sourceFormat: z.enum(['json', 'markdown']),
  sourceContent: z.string(),
});
```

**Validation Pattern in API Routes**:
```typescript
const parsed = saveSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: parsed.error.flatten() },
    { status: 400 }
  );
}
const validData = parsed.data;
```

### Form Components

#### ContextSelector Component

**File**: `src/components/factory/blueprint/ContextSelector.tsx`

**Purpose**: Cascading selection for Domain → Subject → Topic → Subtopic

**Features**:
- Uses `useAdminHierarchy` hooks
- Cascading dropdowns (each depends on previous selection)
- Loading states
- Disabled states for dependent fields
- Active field highlighting
- Validation feedback

**Usage**:
```typescript
<ContextSelector
  selections={{ domainId, subjectId, topicId, subtopicId }}
  onChange={(field, value) => {
    // Handle selection change
  }}
/>
```

#### SelectField Component

**File**: `src/components/entry/SelectionFields.tsx`

**Props**:
```typescript
{
  label: string,
  value: string,
  onChange: (id: string) => void,
  options: Array<{ id: string, name: string }>,
  loading: boolean,
  disabled?: boolean,
  placeholder: string,
  active: boolean,
  icon: React.ReactNode,
  hideCreate?: boolean
}
```

---

## State Management

### Zustand Stores

**Auth Store** (`src/store/auth-store.ts`)
```typescript
import { createAuthStore } from '@quiz/ui';

export const useAuthStore = createAuthStore({});
```

**Usage Pattern** (with shallow selectors):
```typescript
import { useShallow } from 'zustand/react/shallow';

const { user, isAuthenticated, login, logout } = useAuthStore(
  useShallow((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    login: s.login,
    logout: s.logout,
  }))
);
```

**Other Stores**:
- `job-store.ts` - Job tracking
- `tutorial-factory-store.ts` - Tutorial factory state

### TanStack Query

**Usage Example** (`src/app/(admin)/marketing/page.tsx`):
```typescript
import { useQuery } from '@tanstack/react-query';

const rthBootstrap = useQuery({
  queryKey: ['marketing-bootstrap', 'realtutorialhub'],
  queryFn: () => fetchJson('/api/marketing/bootstrap/realtutorialhub'),
  staleTime: 60000,
});

if (rthBootstrap.isLoading) return <div>Loading...</div>;
if (rthBootstrap.error) return <div>Error</div>;
const data = rthBootstrap.data;
```

---

## Custom Hooks

### useAdminHierarchy Hooks

**File**: `src/hooks/useAdminHierarchy.ts`

**Available Hooks**:
```typescript
useDomains()
  // Returns: { data: Domain[], loading: boolean, error: string | null, fetch: () => Promise<void>, create: (payload) => Promise<any> }

useSubjects(domainId?: string)
  // Returns: { data: Subject[], loading, error, fetch, create }

useTopics(subjectId?: string)
  // Returns: { data: Topic[], loading, error, fetch, create }

useSubtopics(topicId?: string)
  // Returns: { data: Subtopic[], loading, error, fetch, create }

useTopicSkills(topicId?: string)
  // Returns: { data: Skill[], loading, error, fetch }

useAllSkills()
  // Returns: { data: Skill[], loading, error, fetch }
```

**Usage Pattern**:
```typescript
const domainsHook = useDomains();
const subjectsHook = useSubjects(selectedDomainId);

// Access data
const domains = domainsHook.data ?? [];

// Create new
await domainsHook.create({
  name: 'New Domain',
  description: 'Description',
  category: 'technology'
});
```

**Implementation Details**:
- Uses `apiClient.admin.*` methods
- Automatic fetching on mount and dependency changes
- Loading/error state management
- CRUD operations (create included in some hooks)

---

## Styling & UI

### Tailwind Configuration

**File**: `tailwind.config.ts`

```typescript
import sharedPreset from "@quiz/ui/tailwind.preset";

const config: Config = {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../src/share-branding/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};
```

**Global CSS** (`src/app/globals.css`):
```css
:root {
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-outfit: 'Outfit', system-ui, sans-serif;
  --primary: 337 90% 63%;       /* Pink #e11d48 */
  --secondary: 223 74% 29%;
  --accent: 337 90% 63%;
  --radius: 0.5rem;
}
```

### Design System Patterns

**Color Palette**:
- Primary: Pink (#e11d48, #FF4B91)
- Secondary: Orange (#f97316)
- Neutral: Slate shades
- Accent: Cyan, Emerald, Indigo, Purple

**Common Classes**:
```css
/* Cards */
.rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl

/* Elevated cards */
.border-t border-white/60 -translate-y-1 hover:-translate-y-3 transition-transform

/* Buttons */
.bg-[#e11d48] hover:bg-[#be123c] text-white px-4 py-2 rounded-lg font-semibold

/* Gradients */
.bg-gradient-to-br from-pink-500 to-orange-500

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
```

**Typography**:
- Font families: Inter (body), Outfit (headings)
- Font sizes: 15px base
- Font weights: 400, 500, 600, 700, 800, 900 (black)
- Uppercase tracking: `tracking-[0.2em]` to `tracking-[0.45em]`

### Shared UI Components

**Available Components**:
- `alert-dialog.tsx` - Radix UI alert dialog wrapper
- `ZTooltip.tsx` - Custom tooltip component

**UI Package**: `@quiz/ui` (imported via `@quiz/ui`)
- Shared components available from monorepo package
- Auth components: `useAuthSync`, `createAuthStore`

---

## Recommended Project LLM Phase 1 Implementation

### Route Placement

**Primary Route**: `apps/skillhubcore-admin/src/app/(admin)/project-llm/`

**File Structure**:
```
src/app/(admin)/project-llm/
├── page.tsx                      # Main workbench dashboard
├── layout.tsx                    # Optional: Project LLM specific layout
├── components/
│   ├── ProjectList.tsx
│   ├── ProjectCard.tsx
│   └── ProjectCreationForm.tsx
└── [projectId]/
    ├── page.tsx                  # Project detail/editor
    └── components/
        ├── CodeEditor.tsx
        ├── FileTree.tsx
        └── ConversationPanel.tsx
```

### API Routes

**Suggested API Structure**:
```
src/app/api/project-llm/
├── projects/
│   ├── route.ts                  # GET (list), POST (create)
│   └── [projectId]/
│       ├── route.ts              # GET (detail), PATCH (update), DELETE (archive)
│       ├── files/
│       │   └── route.ts          # File operations
│       └── conversations/
│           └── route.ts          # Chat/conversation endpoints
└── ai/
    ├── complete/route.ts         # AI completion endpoint
    └── analyze/route.ts          # Code analysis endpoint
```

### Authentication Pattern

```typescript
// src/app/api/project-llm/projects/route.ts
import { authenticateRequest, createAuthErrorResponse, requireAdminRole } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await authenticateRequest(request);
  if ('type' in authResult) {
    return createAuthErrorResponse(authResult);
  }
  const { user } = authResult;

  // Require admin role
  const roleError = requireAdminRole(user);
  if (roleError) {
    return createAuthErrorResponse(roleError);
  }

  // Business logic
  // ...
  
  return NextResponse.json({ projects });
}
```

### Page Component Pattern

```typescript
// src/app/(admin)/project-llm/page.tsx
'use client';

import { useContext, useEffect } from 'react';
import { ShellContext } from '../ShellContext';

export default function ProjectLLMPage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);

  useEffect(() => {
    setHeaderTitle('Project LLM Workbench');
    setHeaderSubtitle('AI-powered development workspace for building applications');
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderTitle, setHeaderSubtitle]);

  return (
    <div className="space-y-8">
      {/* Content */}
    </div>
  );
}
```

### Navigation Integration

**Update**: `src/app/(admin)/components/LeftSidebar.tsx`

```typescript
// Add new section after "AI Content Workspace"
<div>
  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">
    Project LLM
  </h2>
  <nav className="space-y-1">
    <Link
      href="/project-llm"
      className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
        pathname === '/project-llm' 
          ? 'bg-slate-800 text-white font-bold' 
          : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-1 rounded bg-slate-800/50 shrink-0 text-purple-400">
          <Code2 size={14} />
        </div>
        <span className="whitespace-nowrap truncate">Workbench</span>
      </div>
      <ChevronRight size={14} className="text-slate-500 shrink-0" />
    </Link>
  </nav>
</div>
```

### Database Schema Recommendation

**Create new tables** (in `@quiz/db` or new package `@quiz/db-project-llm`):

```typescript
// projects table
{
  id: uuid,
  name: text,
  description: text,
  userId: uuid,  // creator
  status: enum('active', 'archived'),
  metadata: jsonb,  // project settings, tech stack, etc.
  createdAt: timestamp,
  updatedAt: timestamp
}

// project_files table
{
  id: uuid,
  projectId: uuid,
  path: text,
  content: text,
  language: text,
  createdAt: timestamp,
  updatedAt: timestamp
}

// project_conversations table
{
  id: uuid,
  projectId: uuid,
  role: enum('user', 'assistant', 'system'),
  content: text,
  metadata: jsonb,
  createdAt: timestamp
}
```

### State Management

**Create Project LLM Store**:
```typescript
// src/store/project-llm-store.ts
import { create } from 'zustand';

interface ProjectLLMStore {
  activeProjectId: string | null;
  activeFileId: string | null;
  setActiveProject: (id: string) => void;
  setActiveFile: (id: string) => void;
}

export const useProjectLLMStore = create<ProjectLLMStore>((set) => ({
  activeProjectId: null,
  activeFileId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveFile: (id) => set({ activeFileId: id }),
}));
```

---

## Development Workflow

### Local Development

```bash
# Navigate to admin app
cd apps/skillhubcore-admin

# Install dependencies (from monorepo root)
pnpm install

# Run dev server
pnpm dev  # Starts on http://localhost:3007

# Type check
pnpm type-check

# Run tests
pnpm test
```

### Path Aliases

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/share-branding/*": ["../../src/share-branding/*"],
      "@quiz/auth": ["../../packages/auth/src/index.ts"],
      "@quiz/db": ["../../packages/db/src/*"],
      "@quiz/db-tutorial": ["../../packages/db-tutorial/src/index.ts"],
      "@quiz/ui": ["../../packages/ui/src/index.ts"],
      "@quiz/types": ["../../packages/types/src/index.ts"],
      "@quiz/validation": ["../../packages/validation/src/index.ts"],
      "@quiz/api-client": ["../../packages/api-client/src/index.ts"],
      "@quiz/observability": ["../../packages/observability/src/index.ts"]
    }
  }
}
```

### Environment Variables

**Required for Admin**:
- Database connection strings
- JWT secrets (for token verification)
- API gateway URLs (for proxy routes)
- Feature flags (if any)

---

## Key Findings & Recommendations

### ✅ Strengths

1. **Clear separation of concerns**: Proxy vs. direct DB routes
2. **Robust authentication**: Multi-layered auth with RBAC
3. **Type safety**: TypeScript + Zod validation throughout
4. **Consistent patterns**: API routes follow predictable structure
5. **Modern stack**: Next.js 16 App Router, React 19, Drizzle ORM
6. **Reusable components**: Context selector, form fields
7. **Shell architecture**: Consistent layout with sidebars and header

### 🎯 Recommendations for Project LLM

1. **Follow existing patterns**:
   - Use `(admin)/project-llm/` route group
   - Implement authentication via `auth-helpers.ts`
   - Use Zod for validation
   - Follow service layer pattern (create `projectLLMService`)

2. **Database strategy**:
   - Create new package `@quiz/db-project-llm` OR
   - Add tables to existing `@quiz/db` package
   - Use Drizzle ORM for consistency

3. **State management**:
   - Create `project-llm-store.ts` with Zustand
   - Use TanStack Query for API calls
   - Consider real-time updates (WebSocket or polling)

4. **UI consistency**:
   - Use existing design tokens (colors, spacing, typography)
   - Reuse shell context for header/sidebar integration
   - Follow card/elevation patterns for consistency

5. **API route structure**:
   - `/api/project-llm/projects` - CRUD operations
   - `/api/project-llm/projects/[id]/files` - File operations
   - `/api/project-llm/ai/*` - AI-specific endpoints
   - Use direct DB access (not proxy) for full control

6. **Security considerations**:
   - Require admin role for project creation
   - Implement project ownership checks
   - Validate file operations (prevent path traversal)
   - Rate limit AI endpoints

7. **Navigation placement**:
   - Add "Project LLM" section after "AI Content Workspace" in LeftSidebar
   - Icon suggestion: `Code2`, `Terminal`, or `Layers` from lucide-react

### 🚧 Areas to Watch

1. **Performance**: Large project files may need streaming/chunking
2. **Concurrency**: Multiple users editing same project needs conflict resolution
3. **Storage**: Consider external storage (S3) for large files vs. database
4. **AI costs**: Implement usage tracking and rate limiting
5. **Observability**: Add logging via `@quiz/observability` package

---

## File Path Reference

### Critical Files to Study

**Authentication**:
- `src/components/auth/AdminGuard.tsx`
- `src/lib/auth-helpers.ts`
- `src/store/auth-store.ts`

**Shell/Layout**:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/ClientShell.tsx`
- `src/app/(admin)/ShellContext.tsx`
- `src/app/(admin)/components/LeftSidebar.tsx`

**API Patterns**:
- `src/app/api/admin/domains/route.ts` (CRUD example)
- `src/app/api/tutorial-composer/sections/route.ts` (Authenticated service pattern)
- `src/app/api/admin/auth/me/route.ts` (Proxy pattern)

**Form Components**:
- `src/components/factory/blueprint/ContextSelector.tsx`
- `src/components/entry/SelectionFields.tsx`

**Hooks**:
- `src/hooks/useAdminHierarchy.ts`

**Example Pages**:
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/tools/tutorial-block-composer/page.tsx`
- `src/app/(admin)/users/page.tsx`

---

## Conclusion

SkillHubCore Admin provides a solid foundation for Project LLM Phase 1 implementation. The existing patterns for authentication, database access, component composition, and API routes can be directly applied to the workbench feature. The recommended placement at `(admin)/project-llm/` integrates naturally with the existing admin shell while maintaining isolation from other features.

**Next Steps**:
1. Create route structure at `src/app/(admin)/project-llm/`
2. Implement database schema (new package or extend existing)
3. Build API routes following Tutorial Composer pattern
4. Create UI components following existing design system
5. Add navigation entry to LeftSidebar
6. Implement authentication and authorization
7. Add tests (vitest) following existing test patterns

**Estimated Complexity**: Medium - Framework is in place, focus on business logic and AI integration.

---

**Report Generated**: 2025-01-04  
**Investigation Complete** ✅
