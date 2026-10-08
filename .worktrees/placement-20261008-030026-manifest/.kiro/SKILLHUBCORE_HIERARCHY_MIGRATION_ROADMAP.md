# SkillHubCore Educational Hierarchy Migration Roadmap

## 🎯 **Project Overview**

**Goal**: Migrate the complete educational hierarchy management system from `realtutorialhub-admin` to `skillhubcore-admin` with proper authentication, authorization, and dedicated database.

**Target URL**: https://admin.skillhubcore.in/login

**Timeline**: 4-6 weeks (depending on team size)

---

## 📊 **Current State Analysis**

### What Exists in RealTutorialHub Admin:
- ✅ Complete CRUD for Domains, Subjects, Topics, Subtopics, Skills
- ✅ Hierarchy Factory Wizard (Bulk creation with AI/JSON)
- ✅ Batch operations (Multi-select, bulk delete)
- ✅ Advanced pagination (cursor-based)
- ✅ Search functionality with debouncing
- ✅ Review card components for all entities
- ✅ API endpoints for all operations
- ✅ E2E test coverage

### What Exists in SkillHubCore Admin:
- ✅ Basic Next.js 16.1.6 setup
- ✅ Authentication system (@quiz/auth)
- ✅ Basic admin layout structure
- ✅ Zustand + React Query
- ⚠️ No educational hierarchy management
- ⚠️ No dedicated database package

---

## 🗂️ **Phase 1: Database Setup (Week 1)**

### 1.1 Create SkillHubCore Database Package

**Location**: `packages/db-skillhubcore/`

**Action Items**:

```bash
# Create database package
mkdir -p packages/db-skillhubcore/src/schema
cd packages/db-skillhubcore
```

**Files to Create**:

1. **`package.json`**
```json
{
  "name": "@quiz/db-skillhubcore",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx migrate.ts",
    "db:studio": "drizzle-kit studio",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "pg": "^8.18.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "tsx": "^4.7.0",
    "typescript": "^5.7.2",
    "@types/pg": "^8.10.0"
  }
}
```

2. **`drizzle.config.ts`**
```typescript
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/schema/**/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Uses EXISTING SkillHubCore database on VPS
    url: process.env.SKILLHUBCORE_DATABASE_URL!,
  },
});
```

**IMPORTANT NOTE**: This configuration connects to your **existing SkillHubCore PostgreSQL database on your VPS**. The migration will only ADD new tables - it will NOT create a new database or affect existing tables.
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SKILLHUBCORE_DATABASE_URL!,
  },
});
```

3. **`src/schema/enums.ts`**
```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive", "draft"]);
export const skillCategoryEnum = pgEnum("skill_category", ["technical", "cognitive", "process"]);
export const mappingTypeEnum = pgEnum("mapping_type", ["conceptual", "technical", "practical"]);
export const tutorialSyncStatusEnum = pgEnum("tutorial_sync_status", ["pending", "synced", "failed"]);
```

4. **`src/schema/domain.ts`** (Copy from packages/db/src/schema/domain.ts)
```typescript
// Copy complete domain schema including:
// - domains table
// - subjects table
// - topics table
// - subtopics table
// - skills table
// - topicSkills junction table
// - All relations
```

5. **`src/schema/auth.ts`** (For admin users)
```typescript
// Copy auth schema for admin authentication
// Including users, sessions, roles, etc.
```

6. **`src/index.ts`**
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Connects to EXISTING SkillHubCore database on VPS
const connectionString = process.env.SKILLHUBCORE_DATABASE_URL!;
const pool = new Pool({ 
  connectionString,
  max: 20, // Connection pooling for VPS
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);

// Export all schemas
export * from './schema/enums';
export * from './schema/domain';
export * from './schema/auth';
```

**NOTE**: This connects to your existing PostgreSQL database on VPS, not a cloud service.

### 1.2 Database Environment Setup

**IMPORTANT**: Use the **EXISTING SkillHubCore database** connection string. We will NOT create a new database - only add new tables to the existing database.

**Add to `.env.local`**:
```bash
# Use EXISTING SkillHubCore Database (same DB, new tables only)
SKILLHUBCORE_DATABASE_URL=postgresql://existing_user:password@your_vps_ip:5432/existing_skillhubcore_db
```

**Database Setup**:
- ✅ Use existing PostgreSQL database on your VPS
- ✅ Add 6 new tables (domains, subjects, topics, subtopics, skills, topic_skills)
- ✅ Tables will coexist with existing SkillHubCore tables
- ❌ Do NOT create a new database

### 1.3 Run Migrations

```bash
cd packages/db-skillhubcore
pnpm install
pnpm db:generate
pnpm db:migrate
```

---

## 🔐 **Phase 2: Authentication & Authorization Setup (Week 1-2)**

### 2.1 Update SkillHubCore Admin Auth Configuration


**File**: `apps/skillhubcore-admin/src/app/(public)/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.auth.login({
        email,
        password,
        portal: 'skillhubcore-admin'
      });

      if (response.user && response.expiresAt) {
        login(response.user, response.expiresAt);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials or unauthorized access');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Login UI implementation
  );
}
```

### 2.2 Create Auth Store


**File**: `apps/skillhubcore-admin/src/store/auth-store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  login: (user: User, expiresAt: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      expiresAt: null,
      isAuthenticated: false,
      login: (user, expiresAt) => 
        set({ user, expiresAt, isAuthenticated: true }),
      logout: () => 
        set({ user: null, expiresAt: null, isAuthenticated: false }),
    }),
    {
      name: 'skillhubcore-admin-auth',
    }
  )
);
```

### 2.3 Create Admin Guard Component

**File**: `apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 📦 **Phase 3: Component Migration (Week 2-3)**

### 3.1 Copy Core Type Definitions

**Files to Copy**:

```bash
# From realtutorialhub-admin to skillhubcore-admin
cp apps/realtutorialhub-admin/src/types/domain.ts apps/skillhubcore-admin/src/types/
cp apps/realtutorialhub-admin/src/types/review.ts apps/skillhubcore-admin/src/types/
cp apps/realtutorialhub-admin/src/types/factory.ts apps/skillhubcore-admin/src/types/
```

### 3.2 Copy Question Management Components

**Directory Structure**:
```
apps/skillhubcore-admin/src/components/
├── questions/
│   ├── DomainTable.tsx
│   ├── DomainReviewCard.tsx
│   ├── SubjectTable.tsx
│   ├── SubjectReviewCard.tsx
│   ├── TopicTable.tsx
│   ├── TopicReviewCard.tsx
│   ├── SubtopicTable.tsx
│   ├── SubtopicReviewCard.tsx
│   ├── SkillTable.tsx
│   └── SkillReviewCard.tsx
```

**Command**:
```bash
cp -r apps/realtutorialhub-admin/src/components/questions/* \
       apps/skillhubcore-admin/src/components/questions/
```

### 3.3 Copy Factory Wizard

```bash
cp -r apps/realtutorialhub-admin/src/components/content/HierarchyFactoryWizard.tsx \
       apps/skillhubcore-admin/src/components/content/
```

### 3.4 Copy Supporting Components

```bash
# Entry/Selection Fields
cp -r apps/realtutorialhub-admin/src/components/entry/* \
       apps/skillhubcore-admin/src/components/entry/

# Layout components
cp apps/realtutorialhub-admin/src/components/layout/ErrorBanner.tsx \
   apps/skillhubcore-admin/src/components/layout/

# UI components
cp -r apps/realtutorialhub-admin/src/components/ui/* \
       apps/skillhubcore-admin/src/components/ui/
```

### 3.5 Copy Hooks

```bash
cp apps/realtutorialhub-admin/src/hooks/useAdminHierarchy.ts \
   apps/skillhubcore-admin/src/hooks/
```

---

## 🛣️ **Phase 4: Routing Setup (Week 3)**

### 4.1 Create Questions Page

**File**: `apps/skillhubcore-admin/src/app/(admin)/questions/page.tsx`

```typescript
'use client';

import { PageTitle } from '@quiz/ui';
import { Award, BookOpen, Database, GitBranch, Hash, Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { DomainTable } from '@/components/questions/DomainTable';
import { SubjectTable } from '@/components/questions/SubjectTable';
import { TopicTable } from '@/components/questions/TopicTable';
import { SubtopicTable } from '@/components/questions/SubtopicTable';
import { SkillTable } from '@/components/questions/SkillTable';

export default function QuestionsPage() {
  const [activeTab, setActiveTab] = useState<'domains' | 'subjects' | 'topics' | 'subtopics' | 'skills'>('domains');

  return (
    <div className="space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database size={20} className="text-[#FF4B91]" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">
              Educational Hierarchy
            </span>
          </div>
          <PageTitle text="Content Management" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Domains • Subjects • Topics • Skills
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'domains' 
              ? 'bg-[#1A1A1A] text-white shadow-lg' 
              : 'bg-white text-muted-foreground hover:bg-gray-50'
          }`}
        >
          <Layers size={14} /> Domains
        </button>
        {/* Add other tabs: Subjects, Topics, Subtopics, Skills */}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'domains' && <DomainTable />}
        {activeTab === 'subjects' && <SubjectTable />}
        {activeTab === 'topics' && <TopicTable />}
        {activeTab === 'subtopics' && <SubtopicTable />}
        {activeTab === 'skills' && <SkillTable />}
      </div>
    </div>
  );
}
```

### 4.2 Update Admin Layout

**File**: `apps/skillhubcore-admin/src/app/(admin)/layout.tsx`

```typescript
import { AdminGuard } from '@/components/auth/AdminGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AuthenticatedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AdminGuard>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminGuard>
  );
}
```

---

## 🔌 **Phase 5: API Integration (Week 3-4)**


### 5.1 Create API Routes

**Directory Structure**:
```
apps/skillhubcore-admin/src/app/api/
├── admin/
│   ├── domains/
│   │   └── route.ts
│   ├── subjects/
│   │   └── route.ts
│   ├── topics/
│   │   └── route.ts
│   ├── subtopics/
│   │   └── route.ts
│   ├── skills/
│   │   └── route.ts
│   └── atomic-seed/
│       └── route.ts
```

**Example: Domains API Route**

**File**: `apps/skillhubcore-admin/src/app/api/admin/domains/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@quiz/db-skillhubcore';
import { domains } from '@quiz/db-skillhubcore/schema/domain';
import { eq, ilike } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-helpers';

// GET /api/admin/domains
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    let query = db.select().from(domains);

    if (search) {
      query = query.where(ilike(domains.name, `%${search}%`));
    }

    const results = await query.limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data,
      nextCursor,
      total: data.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST /api/admin/domains
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const [newDomain] = await db.insert(domains).values(body).returning();

    return NextResponse.json(newDomain, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/domains/[id]
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    
    const id = req.nextUrl.pathname.split('/').pop();
    const body = await req.json();

    const [updated] = await db
      .update(domains)
      .set(body)
      .where(eq(domains.id, id!))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/domains/[id]
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    
    const id = req.nextUrl.pathname.split('/').pop();

    await db.delete(domains).where(eq(domains.id, id!));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
```

### 5.2 Create Auth Helper

**File**: `apps/skillhubcore-admin/src/lib/auth-helpers.ts`

```typescript
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function requireAdmin(req: NextRequest) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session-token');

  if (!sessionToken) {
    throw new Error('Unauthorized');
  }

  // Validate session and check admin role
  // Implementation depends on your auth system
  
  return true;
}
```

### 5.3 Update API Client

**File**: `packages/api-client/src/admin-client.ts`

Add SkillHubCore endpoints:

```typescript
export const adminClient = {
  // Domains
  getDomains: async (cursor?, limit?, search?) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    return fetch(`/api/admin/domains?${params}`).then(r => r.json());
  },
  
  createDomain: async (data) => {
    return fetch('/api/admin/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  
  updateDomain: async (id, data) => {
    return fetch(`/api/admin/domains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  
  deleteDomain: async (id) => {
    return fetch(`/api/admin/domains/${id}`, {
      method: 'DELETE',
    }).then(r => r.json());
  },
  
  batchDeleteDomains: async (ids) => {
    return fetch('/api/admin/domains/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).then(r => r.json());
  },
  
  // Similar methods for subjects, topics, subtopics, skills
  // ...
};
```

---

## 🎨 **Phase 6: UI/UX Customization (Week 4)**

### 6.1 Update Branding


**File**: `apps/skillhubcore-admin/src/app/globals.css`

Update colors and branding:

```css
:root {
  /* SkillHubCore Theme */
  --primary: 280 65% 60%; /* Purple for SkillHubCore */
  --primary-foreground: 0 0% 100%;

  --secondary: 220 70% 50%; /* Blue accent */
  --secondary-foreground: 0 0% 100%;

  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  --muted: 210 40% 96%;
  --muted-foreground: 215 18% 30%;

  --accent: 280 65% 60%;
  --accent-foreground: 0 0% 100%;

  --border: 214 28% 80%;
  --input: 214 28% 80%;
  --ring: 280 65% 60%;

  --radius: 0.5rem;
}
```

### 6.2 Create Admin Sidebar

**File**: `apps/skillhubcore-admin/src/components/layout/AdminLayout.tsx`

```typescript
'use client';

import { Database, LayoutDashboard, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Content Management', href: '/questions', icon: Database },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-muted/10 overflow-hidden font-sans relative">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background flex flex-col shadow-xl fixed inset-y-0 left-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="font-bold text-lg tracking-tight">SkillHubCore Admin</span>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-semibold text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col h-full ml-64">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8">
          <h1 className="text-xl font-bold">SkillHubCore Admin Portal</h1>
          <div className="flex items-center gap-4">
            {/* User menu, notifications, etc. */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 🧪 **Phase 7: Testing (Week 5)**

### 7.1 E2E Tests

**File**: `apps/skillhubcore-admin/tests/e2e/hierarchy-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Educational Hierarchy Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('https://admin.skillhubcore.in/login');
    await page.fill('input[name="email"]', 'admin@skillhubcore.in');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create a new domain', async ({ page }) => {
    await page.goto('https://admin.skillhubcore.in/questions');
    
    // Click Domains tab
    await page.click('text=Domains');
    
    // Click Add Domain button
    await page.click('text=Add Domain');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test Domain');
    await page.fill('textarea[name="description"]', 'Test Description');
    
    // Submit
    await page.click('button:has-text("Save")');
    
    // Verify
    await expect(page.locator('text=Test Domain')).toBeVisible();
  });

  test('should perform bulk operations', async ({ page }) => {
    await page.goto('https://admin.skillhubcore.in/questions');
    
    // Select multiple domains
    await page.click('input[type="checkbox"]:first');
    await page.click('input[type="checkbox"]:nth-child(2)');
    
    // Verify floating command bar appears
    await expect(page.locator('text=Delete Selection')).toBeVisible();
  });

  test('should search and filter domains', async ({ page }) => {
    await page.goto('https://admin.skillhubcore.in/questions');
    
    // Type in search
    await page.fill('input[placeholder*="Search"]', 'Test');
    
    // Wait for debounce
    await page.waitForTimeout(600);
    
    // Verify filtered results
    await expect(page.locator('text=Test Domain')).toBeVisible();
  });
});
```

### 7.2 Unit Tests

**File**: `apps/skillhubcore-admin/src/components/questions/__tests__/DomainTable.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainTable } from '../DomainTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('DomainTable', () => {
  it('should render domain list', async () => {
    render(<DomainTable />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText(/Loading Domains/i)).not.toBeInTheDocument();
    });
  });

  it('should handle domain creation', async () => {
    render(<DomainTable />, { wrapper });
    
    const addButton = screen.getByText(/Add Domain/i);
    await userEvent.click(addButton);
    
    expect(screen.getByText(/New Domain/i)).toBeInTheDocument();
  });
});
```

---

## 🚀 **Phase 8: Deployment (Week 6)**

### 8.1 Environment Configuration

**Production Environment Variables**:

```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://admin.skillhubcore.in
SKILLHUBCORE_DATABASE_URL=postgresql://prod_user:prod_pass@prod_host/skillhubcore_db
SESSION_SECRET=your-production-secret
NEXTAUTH_URL=https://admin.skillhubcore.in
NEXTAUTH_SECRET=your-nextauth-secret
```

### 8.2 Build Configuration

**File**: `apps/skillhubcore-admin/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['admin.skillhubcore.in'],
    },
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
```

### 8.3 VPS Deployment Configuration

**IMPORTANT**: We're deploying to VPS (Virtual Private Server), NOT Vercel.

**File**: `apps/skillhubcore-admin/ecosystem.config.js` (for PM2 on VPS)

```javascript
module.exports = {
  apps: [{
    name: 'skillhubcore-admin',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3007',
    cwd: '/var/www/skillhubcore-admin',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3007,
    },
    error_file: '/var/log/pm2/skillhubcore-admin-error.log',
    out_file: '/var/log/pm2/skillhubcore-admin-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
```

**Nginx Configuration** (Reverse Proxy):

**File**: `/etc/nginx/sites-available/admin.skillhubcore.in`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name admin.skillhubcore.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.skillhubcore.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.skillhubcore.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.skillhubcore.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Next.js app on port 3007
    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3007;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**VPS Deployment Steps**:

1. **SSH into your VPS**:
```bash
ssh user@your-vps-ip
```

2. **Install dependencies** (if not already installed):
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2 (process manager)
npm install -g pm2

# Nginx (if not installed)
sudo apt-get install nginx
```

3. **Clone and build**:
```bash
cd /var/www
git clone <your-repo> skillhubcore-admin
cd skillhubcore-admin

# Install dependencies
pnpm install

# Build the application
pnpm --filter @quiz/skillhubcore-admin build
```

4. **Set up environment variables**:
```bash
cd apps/skillhubcore-admin
cp .env.example .env.production
# Edit .env.production with production values
nano .env.production
```

5. **Start with PM2**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Configure Nginx**:
```bash
sudo ln -s /etc/nginx/sites-available/admin.skillhubcore.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7. **Set up SSL with Let's Encrypt**:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.skillhubcore.in
```


```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3007

ENV PORT 3007

CMD ["node", "server.js"]
```

### 8.4 CI/CD Pipeline for VPS

**File**: `.github/workflows/deploy-skillhubcore-admin-vps.yml`

```yaml
name: Deploy SkillHubCore Admin to VPS

on:
  push:
    branches:
      - main
    paths:
      - 'apps/skillhubcore-admin/**'
      - 'packages/db-skillhubcore/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: corepack enable pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run database migrations
        run: pnpm --filter @quiz/db-skillhubcore db:migrate
        env:
          SKILLHUBCORE_DATABASE_URL: ${{ secrets.SKILLHUBCORE_DATABASE_URL }}
      
      - name: Build
        run: pnpm --filter @quiz/skillhubcore-admin build
      
      - name: Run tests
        run: pnpm --filter @quiz/skillhubcore-admin test
      
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/skillhubcore-admin
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm --filter @quiz/db-skillhubcore db:migrate
            pnpm --filter @quiz/skillhubcore-admin build
            pm2 restart skillhubcore-admin
```

**Required GitHub Secrets**:
- `VPS_HOST`: Your VPS IP address
- `VPS_USERNAME`: SSH username
- `VPS_SSH_KEY`: SSH private key
- `SKILLHUBCORE_DATABASE_URL`: Database connection string

---

## 📝 **Phase 9: Documentation (Week 6)**

### 9.1 API Documentation

Create comprehensive API documentation for all endpoints.

**File**: `docs/SKILLHUBCORE_API.md`

### 9.2 User Guide

Create admin user guide with screenshots and workflows.

**File**: `docs/SKILLHUBCORE_ADMIN_GUIDE.md`

### 9.3 Developer Guide


Create setup instructions for new developers.

**File**: `docs/SKILLHUBCORE_DEVELOPER_SETUP.md`

---

## 📋 **Complete File Migration Checklist**

### Database Package Files
```
packages/db-skillhubcore/
├── src/
│   ├── schema/
│   │   ├── enums.ts ✓
│   │   ├── domain.ts ✓
│   │   ├── auth.ts ✓
│   │   └── relations.ts ✓
│   └── index.ts ✓
├── drizzle/
├── drizzle.config.ts ✓
├── migrate.ts ✓
├── package.json ✓
└── tsconfig.json ✓
```

### Component Files
```
apps/skillhubcore-admin/src/components/
├── questions/
│   ├── DomainTable.tsx ✓
│   ├── DomainReviewCard.tsx ✓
│   ├── SubjectTable.tsx ✓
│   ├── SubjectReviewCard.tsx ✓
│   ├── TopicTable.tsx ✓
│   ├── TopicReviewCard.tsx ✓
│   ├── SubtopicTable.tsx ✓
│   ├── SubtopicReviewCard.tsx ✓
│   ├── SkillTable.tsx ✓
│   └── SkillReviewCard.tsx ✓
├── content/
│   ├── HierarchyFactoryWizard.tsx ✓
│   └── BlueprintFactoryWizard.tsx ✓
├── entry/
│   └── SelectionFields.tsx ✓
├── layout/
│   ├── AdminLayout.tsx ✓
│   └── ErrorBanner.tsx ✓
├── auth/
│   ├── AdminGuard.tsx ✓
│   └── SessionWatcher.tsx ✓
└── ui/
    ├── ZConfirmationDialog.tsx ✓
    ├── ZTooltip.tsx ✓
    └── alert-dialog.tsx ✓
```

### Type Definitions
```
apps/skillhubcore-admin/src/types/
├── domain.ts ✓
├── review.ts ✓
└── factory.ts ✓
```

### Hooks
```
apps/skillhubcore-admin/src/hooks/
├── useAdminHierarchy.ts ✓
└── useStrictNavigation.ts ✓
```

### API Routes
```
apps/skillhubcore-admin/src/app/api/admin/
├── domains/
│   └── route.ts ✓
├── subjects/
│   └── route.ts ✓
├── topics/
│   └── route.ts ✓
├── subtopics/
│   └── route.ts ✓
├── skills/
│   └── route.ts ✓
└── atomic-seed/
    └── route.ts ✓
```

### Page Routes
```
apps/skillhubcore-admin/src/app/
├── (admin)/
│   ├── questions/
│   │   └── page.tsx ✓
│   ├── dashboard/
│   │   └── page.tsx ✓
│   └── layout.tsx ✓
└── (public)/
    └── login/
        └── page.tsx ✓
```

---

## 🔧 **Configuration Updates Required**

### 1. Update package.json Dependencies

**File**: `apps/skillhubcore-admin/package.json`

Add:
```json
{
  "dependencies": {
    "@quiz/db-skillhubcore": "workspace:*",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1"
  }
}
```

### 2. Update Root Workspace

**File**: `package.json` (root)

Add to workspaces:
```json
{
  "workspaces": [
    "packages/db-skillhubcore"
  ]
}
```

### 3. Update Turbo Configuration

**File**: `turbo.json`

Add pipeline:
```json
{
  "pipeline": {
    "@quiz/db-skillhubcore#db:migrate": {
      "cache": false
    },
    "@quiz/skillhubcore-admin#build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

---

## 🛡️ **Security Considerations**

### 1. Authentication Middleware

**File**: `apps/skillhubcore-admin/src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session-token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Allow auth pages and API routes
  if (isAuthPage || isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 2. RBAC Implementation

**File**: `apps/skillhubcore-admin/src/lib/rbac.ts`

```typescript
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
} as const;

export const PERMISSIONS = {
  DOMAIN_CREATE: 'domain:create',
  DOMAIN_READ: 'domain:read',
  DOMAIN_UPDATE: 'domain:update',
  DOMAIN_DELETE: 'domain:delete',
  // ... more permissions
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.DOMAIN_CREATE,
    PERMISSIONS.DOMAIN_READ,
    PERMISSIONS.DOMAIN_UPDATE,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.DOMAIN_READ,
  ],
};

export function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}
```

### 3. Rate Limiting

**File**: `apps/skillhubcore-admin/src/lib/rate-limit.ts`

```typescript
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimit(
  identifier: string,
  limit: number = 100
): boolean {
  const count = (rateLimitCache.get(identifier) as number) || 0;
  
  if (count >= limit) {
    return false;
  }
  
  rateLimitCache.set(identifier, count + 1);
  return true;
}
```

---

## 📊 **Database Migration Scripts**

### Initial Setup Script

**File**: `scripts/setup-skillhubcore-db.ts`

```typescript
import { db } from '@quiz/db-skillhubcore';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  console.log('Setting up SkillHubCore database...');

  // Create extensions
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  // Run migrations
  console.log('Running migrations...');
  // Migration logic here
  
  // Seed initial data
  console.log('Seeding initial data...');
  await seedInitialData();
  
  console.log('Database setup complete!');
}

async function seedInitialData() {
  // Seed admin user
  // Seed default roles
  // Seed sample domains (optional)
}

setupDatabase().catch(console.error);
```

### Data Migration Script (from RealTutorialHub)

**File**: `scripts/migrate-rth-to-skillhubcore.ts`

```typescript
import { db as rthDb } from '@quiz/db';
import { db as skillhubDb } from '@quiz/db-skillhubcore';
import { domains, subjects, topics, subtopics, skills } from '@quiz/db-skillhubcore';

async function migrateData() {
  console.log('Starting data migration...');

  // Migrate domains
  const rthDomains = await rthDb.select().from(domains);
  for (const domain of rthDomains) {
    await skillhubDb.insert(domains).values({
      ...domain,
      id: undefined, // Generate new IDs
    });
  }

  // Migrate subjects, topics, subtopics, skills
  // ... similar logic

  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

---

## 🧪 **Testing Strategy**

### Test Coverage Goals
- ✓ Unit Tests: 80%+ coverage
- ✓ Integration Tests: All API endpoints
- ✓ E2E Tests: Critical user flows
- ✓ Performance Tests: Load testing

### Key Test Scenarios

1. **Authentication Flow**
   - Login with valid credentials
   - Login with invalid credentials
   - Session expiry handling
   - Logout functionality

2. **CRUD Operations**
   - Create domain/subject/topic/subtopic/skill
   - Read with pagination
   - Update existing records
   - Delete with cascade handling

3. **Batch Operations**
   - Multi-select functionality
   - Bulk delete
   - Bulk status change

4. **Factory Wizard**
   - Manual entry mode
   - Bulk JSON import
   - AI prompt generation
   - Error handling

5. **Search & Filter**
   - Search with debouncing
   - Filter by status
   - Filter by parent entity

6. **Performance**
   - Load time < 2s
   - API response < 500ms
   - Pagination efficiency

---

## 📈 **Monitoring & Observability**

### 1. Application Monitoring

**File**: `apps/skillhubcore-admin/src/lib/monitoring.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Track with your analytics service
  console.log('Event:', eventName, properties);
}
```

### 2. Database Query Logging

**File**: `packages/db-skillhubcore/src/logger.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(pool, {
  logger: {
    logQuery: (query, params) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Query:', query);
        console.log('Params:', params);
      }
    },
  },
});
```

### 3. Performance Metrics

Track:
- Page load times
- API response times
- Database query times
- Error rates
- User activity

---

## 🚨 **Common Issues & Solutions**

### Issue 1: Database Connection Failed

**Solution**:
```bash
# Check connection string
echo $SKILLHUBCORE_DATABASE_URL

# Test connection
psql $SKILLHUBCORE_DATABASE_URL -c "SELECT 1"

# Verify SSL settings
# Add ?sslmode=require to connection string if needed
```

### Issue 2: Migration Conflicts

**Solution**:
```bash
# Reset migrations (dev only)
cd packages/db-skillhubcore
rm -rf drizzle/
pnpm db:generate
pnpm db:migrate
```

### Issue 3: Authentication Loop

**Solution**:
- Check cookie settings (httpOnly, secure, sameSite)
- Verify session expiry logic
- Clear browser cookies and retry

### Issue 4: Component Import Errors

**Solution**:
```bash
# Rebuild workspace
pnpm install
pnpm --filter @quiz/skillhubcore-admin build

# Check tsconfig paths
```

---

## 📅 **Implementation Timeline**

### Week 1: Database & Auth Setup
- ✓ Day 1-2: Create db-skillhubcore package
- ✓ Day 3-4: Set up authentication
- ✓ Day 5: Test database connections

### Week 2: Component Migration
- ✓ Day 1-2: Copy type definitions
- ✓ Day 3-4: Copy and adapt components
- ✓ Day 5: Copy hooks and utilities

### Week 3: API & Routing
- ✓ Day 1-3: Create API routes
- ✓ Day 4-5: Set up page routing

### Week 4: UI/UX Customization
- ✓ Day 1-2: Update branding
- ✓ Day 3-4: Create admin layout
- ✓ Day 5: Polish UI components

### Week 5: Testing
- ✓ Day 1-2: Unit tests
- ✓ Day 3-4: E2E tests
- ✓ Day 5: Performance tests

### Week 6: Deployment & Documentation
- ✓ Day 1-2: Deploy to staging
- ✓ Day 3-4: Write documentation
- ✓ Day 5: Deploy to production

---

## ✅ **Pre-Launch Checklist**

### Database
- [ ] Database created and accessible
- [ ] All migrations run successfully
- [ ] Initial seed data loaded
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### Authentication
- [ ] Login/logout working
- [ ] Session management functional
- [ ] RBAC implemented
- [ ] Password reset flow tested
- [ ] Session expiry handling verified

### Features
- [ ] All CRUD operations working
- [ ] Batch operations functional
- [ ] Factory wizard tested
- [ ] Search/filter working
- [ ] Pagination tested

### Performance
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] Caching implemented
- [ ] CDN configured

### Security
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] Input validation implemented
- [ ] SQL injection prevention verified

### Monitoring
- [ ] Error tracking configured
- [ ] Analytics set up
- [ ] Logging implemented
- [ ] Alerts configured
- [ ] Uptime monitoring active

### Documentation
- [ ] API documentation complete
- [ ] User guide written
- [ ] Developer guide available
- [ ] Deployment guide ready
- [ ] Runbook created

---

## 🎯 **Success Metrics**

### Technical Metrics
- 99.9% uptime
- < 2s page load time
- < 500ms API response time
- 80%+ test coverage
- Zero critical security issues

### User Metrics
- < 5 min to complete common tasks
- < 3 clicks for primary actions
- 95%+ success rate for operations
- < 1% error rate

### Business Metrics
- 100% feature parity with RTH admin
- Support for 10,000+ domains
- Handle 1,000 concurrent users
- 24/7 availability

---

## 📞 **Support & Maintenance**

### Support Channels
- Email: admin-support@skillhubcore.in
- Slack: #skillhubcore-admin
- Documentation: docs.skillhubcore.in

### Maintenance Schedule
- Weekly: Security updates
- Monthly: Feature updates
- Quarterly: Major version updates

### Incident Response
1. Detect (monitoring alerts)
2. Assess (severity level)
3. Fix (rollback or hotfix)
4. Communicate (status page)
5. Post-mortem (learn & improve)

---

## 🎉 **Conclusion**

This roadmap provides a comprehensive guide to migrating the educational hierarchy management system from `realtutorialhub-admin` to `skillhubcore-admin`. Follow each phase systematically, test thoroughly, and maintain clear communication with stakeholders throughout the process.

**Key Success Factors**:
1. Maintain feature parity
2. Ensure data integrity
3. Prioritize security
4. Focus on performance
5. Document everything

**Next Steps**:
1. Review and approve roadmap
2. Set up project tracking (Jira/GitHub Projects)
3. Assign team members to phases
4. Begin Phase 1: Database Setup
5. Schedule weekly progress reviews

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-07  
**Maintained By**: Development Team  
**Questions?**: Contact tech-lead@skillhubcore.in
