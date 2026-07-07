# SkillHubCore Educational Hierarchy - Quick Start Guide

## 🎯 Objective
Migrate educational hierarchy management from `realtutorialhub-admin` to `skillhubcore-admin` accessible at https://admin.skillhubcore.in/login

## 🏃 Quick Start (30 Minutes)

### Step 1: Run Setup Script (5 min)

```bash
cd D:\onlinewebsites\quiz-platform
chmod +x scripts/setup-skillhubcore-migration.sh
./scripts/setup-skillhubcore-migration.sh
```

This automatically copies all necessary files from realtutorialhub-admin to skillhubcore-admin.

### Step 2: Database Setup (10 min)

**IMPORTANT**: We will use the **EXISTING SkillHubCore database**. No new database will be created. We'll only add new tables to the existing database.

1. **Create database package.json**:

```bash
cd packages/db-skillhubcore
cat > package.json << 'EOF'
{
  "name": "@quiz/db-skillhubcore",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx migrate.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "pg": "^8.18.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "tsx": "^4.7.0",
    "typescript": "^5.7.2"
  }
}
EOF
```

2. **Add EXISTING database URL to .env.local**:

```bash
# Use your existing SkillHubCore database connection string
echo "SKILLHUBCORE_DATABASE_URL=postgresql://existing_user:password@your_vps_ip:5432/existing_skillhubcore_db" >> .env.local
```

**Note**: This should be the same database that SkillHubCore is already using. We'll just add the hierarchy tables to it.

3. **Install and migrate**:

```bash
pnpm install
pnpm --filter @quiz/db-skillhubcore db:generate
pnpm --filter @quiz/db-skillhubcore db:migrate
```

### Step 3: Update Dependencies (5 min)

**Add to `apps/skillhubcore-admin/package.json`**:

```json
{
  "dependencies": {
    "@quiz/db-skillhubcore": "workspace:*",
    "@radix-ui/react-alert-dialog": "^1.1.15"
  }
}
```

**Run**:
```bash
pnpm install
```

### Step 4: Create Questions Page (5 min)

Create `apps/skillhubcore-admin/src/app/(admin)/questions/page.tsx` - see roadmap for complete code.

### Step 5: Test Locally (5 min)

```bash
pnpm --filter @quiz/skillhubcore-admin dev
```

Visit: http://localhost:3007/questions

---

## 📦 What Gets Migrated

### ✅ Components (12 files)
- DomainTable, SubjectTable, TopicTable, SubtopicTable, SkillTable
- Corresponding ReviewCard components
- HierarchyFactoryWizard
- Supporting UI components

### ✅ Database Tables (6 tables)
- domains
- subjects
- topics
- subtopics
- skills
- topic_skills (junction table)

### ✅ Features
- Full CRUD operations
- Batch operations (multi-select, bulk delete)
- Search with debouncing
- Cursor-based pagination
- Factory wizard (AI/JSON bulk import)
- Hierarchical validation

---

## 🗂️ Project Structure After Migration

```
D:\onlinewebsites\quiz-platform\
├── packages/
│   └── db-skillhubcore/          ← NEW DATABASE PACKAGE
│       ├── src/schema/
│       │   ├── domain.ts
│       │   ├── auth.ts
│       │   └── enums.ts
│       └── drizzle.config.ts
│
└── apps/
    └── skillhubcore-admin/       ← UPDATED ADMIN APP
        └── src/
            ├── app/
            │   ├── (admin)/
            │   │   └── questions/
            │   │       └── page.tsx      ← Main entry point
            │   └── api/admin/
            │       ├── domains/route.ts
            │       ├── subjects/route.ts
            │       ├── topics/route.ts
            │       ├── subtopics/route.ts
            │       └── skills/route.ts
            ├── components/
            │   ├── questions/            ← 10 components
            │   ├── content/
            │   ├── entry/
            │   ├── layout/
            │   └── ui/
            ├── hooks/
            │   └── useAdminHierarchy.ts
            └── types/
                ├── domain.ts
                ├── review.ts
                └── factory.ts
```

---

## 🔑 Critical Files to Create

### 1. Database Index File
**`packages/db-skillhubcore/src/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.SKILLHUBCORE_DATABASE_URL! 
});
export const db = drizzle(pool);

export * from './schema/domain';
export * from './schema/auth';
export * from './schema/enums';
```

### 2. Auth Store
**`apps/skillhubcore-admin/src/store/auth-store.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  login: (user: any, expiresAt: string) => void;
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
    { name: 'skillhubcore-admin-auth' }
  )
);
```

### 3. Admin Guard
**`apps/skillhubcore-admin/src/components/auth/AdminGuard.tsx`**

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Database connection works
- [ ] Domains CRUD operations
- [ ] Subjects CRUD operations
- [ ] Topics CRUD operations
- [ ] Subtopics CRUD operations
- [ ] Skills CRUD operations
- [ ] Batch delete works
- [ ] Search functionality
- [ ] Pagination works
- [ ] Factory wizard opens

### Production Testing
- [ ] HTTPS enforced
- [ ] Authentication working
- [ ] Session management
- [ ] All API routes respond
- [ ] Error handling works

---

## 🚨 Troubleshooting

### Issue: "Cannot find module @quiz/db-skillhubcore"
**Solution**: 
```bash
pnpm install
pnpm --filter @quiz/db-skillhubcore build
```

### Issue: "Database connection failed"
**Solution**: Check `.env.local` for correct `SKILLHUBCORE_DATABASE_URL`

### Issue: "Components not rendering"
**Solution**: Verify all component files copied correctly:
```bash
ls -la apps/skillhubcore-admin/src/components/questions/
```

### Issue: "Type errors in components"
**Solution**: Ensure all type files are copied:
```bash
ls -la apps/skillhubcore-admin/src/types/
```

---

## 📚 Full Documentation

For complete details, see:
- **Full Roadmap**: `SKILLHUBCORE_HIERARCHY_MIGRATION_ROADMAP.md`
- **API Documentation**: Coming soon
- **User Guide**: Coming soon

---

## 🎯 Success Criteria

✅ All components render without errors  
✅ Database operations work correctly  
✅ Authentication protects routes  
✅ Pagination navigates properly  
✅ Search filters results  
✅ Batch operations execute  
✅ Factory wizard functions  

---

## 📞 Need Help?

- Check the full roadmap: `SKILLHUBCORE_HIERARCHY_MIGRATION_ROADMAP.md`
- Review existing code: `apps/realtutorialhub-admin/`
- Contact: tech-lead@skillhubcore.in

---

**Estimated Total Time**: 2-4 hours for basic setup  
**Estimated Total Project**: 4-6 weeks for full migration  
**Start Date**: Today  
**Target Launch**: 6 weeks from start
