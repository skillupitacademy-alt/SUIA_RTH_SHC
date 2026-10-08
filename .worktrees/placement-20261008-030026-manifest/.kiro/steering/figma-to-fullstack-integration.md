---
title: Figma to Fullstack Integration Guide
description: Complete workflow for integrating Figma-generated UI/UX into the multi-brand architecture with automatic backend implementation
inclusion: manual
keywords: figma, ui, ux, design, integration, frontend, backend, fullstack, new page, new feature
---

# Figma to Fullstack Integration Guide

This guide provides step-by-step instructions for integrating Figma-generated UI/UX into the multi-brand architecture and implementing the complete fullstack feature.

---

## 🎯 WORKFLOW OVERVIEW

```
User Requirements → AI Generates Figma PRD → User Uses Figma AI → 
User Pastes Generated Code → AI Implements Backend Logic → Complete Feature
```

---

## PHASE 1: Generate Figma-Ready PRD

When the user provides a feature request, convert it into a structured PRD that Figma AI tools can understand.

### Template for Figma PRD

```markdown
# [Feature Name] - UI/UX Specification

## Brand Context
- **Brand**: [RTH | SkillUp]
- **Domain**: [user.realtutorialhub.com | user.skillupitacademy.com]
- **Portal Identity**: user
- **Primary Color**: [#FF4B91 for RTH | #0EA5E9 for SkillUp]
- **Secondary Color**: [#FF2D55 for RTH | #0284C7 for SkillUp]

## Page Details
- **Route**: /[route-name]
- **Auth Required**: [Yes | No]
- **Layout**: [Authenticated layout with sidebar | Public layout | etc.]
- **Responsive**: Mobile-first, tablet, desktop

## Components Needed
1. **[Component Name]**
   - Purpose: [What it does]
   - Props: [What data it needs]
   - Actions: [What user can do]

2. **[Component Name]**
   - Purpose: [What it does]
   - Props: [What data it needs]
   - Actions: [What user can do]

## Data Requirements
- **User Data**: name, email, avatar, role
- **Feature Data**: [List specific data needed]
- **Actions**: [List user actions: create, update, delete, etc.]

## API Endpoints Needed
- `GET /api/[resource]` - Fetch data
- `POST /api/[resource]` - Create data
- `PUT /api/[resource]/:id` - Update data
- `DELETE /api/[resource]/:id` - Delete data

## Design Guidelines
- Use brand colors from tailwind.config.ts
- Follow existing component patterns in packages/ui
- Ensure accessibility (ARIA labels, keyboard navigation)
- Loading states for all async operations
- Error states with user-friendly messages
```

### Action: Generate PRD

When user says "create new page" or "add feature", ask:
1. What is the feature name?
2. Which brand? (RTH or SkillUp)
3. What should users be able to do?
4. What data does it need?

Then generate the PRD above and present it to the user.

---

## PHASE 2: Guide User Through Figma AI

After generating the PRD, provide these instructions to the user:

```
📋 Next Steps for Figma AI:

1. Copy the PRD above
2. Go to one of these Figma AI tools:
   - v0.dev (Vercel) - https://v0.dev
   - Anima (Figma plugin)
   - Builder.io
   
3. Paste the PRD and generate the UI
4. Export the generated code (React/Next.js)
5. Come back and paste the code here

I'll help you integrate it into the project.
```

---

## PHASE 3: Integrate Figma-Generated Code

When user pastes Figma-generated code, follow this integration pattern:

### Step 1: Identify Target Location

**For RTH pages**:
```
apps/realtutorialhub-quiz/src/app/(authenticated)/[feature-name]/page.tsx
```

**For SkillUp pages**:
```
apps/skillup-web/src/app/(authenticated)/[feature-name]/page.tsx
```

### Step 2: Extract Components

From the Figma-generated code, identify reusable components and create:

```
apps/[brand-app]/src/components/[feature-name]/
├── [Component1].tsx
├── [Component2].tsx
├── [Component3].tsx
└── index.ts
```

### Step 3: Brand-Aware Component Pattern

Transform Figma-generated components to be brand-aware:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@quiz/api-client';

// Set brand context
const BRAND = 'realtutorialhub'; // or 'skillup'
apiClient.client.setBrand(BRAND);
apiClient.client.setPortalIdentity('user');

export function ComponentName() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feature', 'data'],
    queryFn: () => apiClient.feature.getData(),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="container mx-auto p-6">
      {/* Figma-generated JSX here */}
      {/* Replace hardcoded colors with Tailwind classes */}
      {/* bg-[#FF4B91] → bg-primary */}
      {/* text-[#FF4B91] → text-primary */}
    </div>
  );
}
```

### Step 4: Replace Hardcoded Values

Transform Figma code:
- ❌ `style={{ backgroundColor: '#FF4B91' }}`
- ✅ `className="bg-primary"`

- ❌ `<div>John Doe</div>`
- ✅ `<div>{data.user.name}</div>`

- ❌ `onClick={() => alert('clicked')}`
- ✅ `onClick={handleAction}`

### Step 5: Create Page File

```typescript
// apps/realtutorialhub-quiz/src/app/(authenticated)/[feature]/page.tsx
import { Component1 } from '@/components/[feature]/Component1';
import { Component2 } from '@/components/[feature]/Component2';

export default function FeaturePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Feature Title</h1>
      <Component1 />
      <Component2 />
    </div>
  );
}
```

---

## PHASE 4: Implement BFF Layer (API Server)

After integrating UI, automatically create the BFF layer.

### Step 1: Create Route Handler

```typescript
// apps/api-server/src/app/api/[resource]/route.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { resolveRequestBrand } from '@/lib/request-brand';
import { withAuth } from '@/middleware/auth';
import { container } from '@/modules/core/container';
import { [Resource]Service } from '@/modules/[resource]/[resource].service';

async function handler(req: NextRequest) {
  const brand = resolveRequestBrand(req.nextUrl.hostname) ?? 'realtutorialhub';
  const userId = req.headers.get('x-user-id');

  const service = container.get([Resource]Service);
  
  // GET
  if (req.method === 'GET') {
    const data = await service.getData(userId, brand);
    return ApiResponse.success(data);
  }
  
  // POST
  if (req.method === 'POST') {
    const body = await req.json();
    const result = await service.createData(userId, body, brand);
    return ApiResponse.success(result, 201);
  }
  
  return ApiResponse.error('Method not allowed', 405);
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
```

### Step 2: Create BFF Service

```typescript
// apps/api-server/src/modules/[resource]/[resource].service.ts
import type { RequestBrand } from '@/lib/request-brand';
import { SkillHubCoreClient } from '@/lib/skillhubcore-client';

export class [Resource]Service {
  constructor(
    private skillhubClient = new SkillHubCoreClient()
  ) {}

  async getData(userId: string, brand: RequestBrand) {
    // Call backend and aggregate data
    const [data1, data2] = await Promise.all([
      this.skillhubClient.get(`/[resource]/${userId}/data1`, { brand }),
      this.skillhubClient.get(`/[resource]/${userId}/data2`, { brand }),
    ]);

    return {
      ...data1,
      ...data2,
      brand,
    };
  }

  async createData(userId: string, input: any, brand: RequestBrand) {
    return this.skillhubClient.post(`/[resource]`, {
      ...input,
      userId,
      brand,
    });
  }
}
```

---

## PHASE 5: Implement Backend API (SkillHubCore)

### Step 1: Create Backend Routes

```typescript
// services/skillhubcore-service/src/modules/[resource]/[resource].routes.ts
import { Hono } from 'hono';
import { requireAuth, requirePlatform } from '@/middleware/verify-jwt';
import { [Resource]Service } from './[resource].service';

export const create[Resource]Routes = () => {
  const app = new Hono();
  const service = new [Resource]Service();

  app.get('/[resource]/:userId/data1', 
    requireAuth, 
    requirePlatform('realtutorialhub'), // or 'skillup'
    async (c) => {
      const userId = c.req.param('userId');
      const authUser = c.get('authUser');

      if (authUser.id !== userId) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      const data = await service.getData1(userId);
      return c.json({ data });
    }
  );

  app.post('/[resource]', requireAuth, async (c) => {
    const body = await c.req.json();
    const authUser = c.get('authUser');
    
    const result = await service.createData({
      ...body,
      userId: authUser.id,
    });
    
    return c.json({ result }, 201);
  });

  return app;
};
```

### Step 2: Create Backend Service

```typescript
// services/skillhubcore-service/src/modules/[resource]/[resource].service.ts
import { db } from '@quiz/db-people';
import { [table] } from '@quiz/db-people';
import { eq, desc } from 'drizzle-orm';

export class [Resource]Service {
  async getData1(userId: string) {
    return db
      .select()
      .from([table])
      .where(eq([table].userId, userId))
      .orderBy(desc([table].createdAt));
  }

  async createData(input: any) {
    const [result] = await db
      .insert([table])
      .values(input)
      .returning();
    
    return result;
  }
}
```

---

## PHASE 6: Wire Up API Client

### Step 1: Extend API Client

```typescript
// packages/api-client/src/modules/[resource].client.ts
import type { BrowserAuthFetchProvider } from '../providers/browser-auth-fetch.provider';

export class [Resource]Client {
  constructor(private provider: BrowserAuthFetchProvider) {}

  async getData() {
    return this.provider.get<DataType>('/[resource]/data');
  }

  async createData(input: CreateInput) {
    return this.provider.post('/[resource]', input);
  }

  async updateData(id: string, input: UpdateInput) {
    return this.provider.put(`/[resource]/${id}`, input);
  }

  async deleteData(id: string) {
    return this.provider.delete(`/[resource]/${id}`);
  }
}
```

### Step 2: Register in API Client

```typescript
// packages/api-client/src/index.ts
import { [Resource]Client } from './modules/[resource].client';

export class ApiClient {
  public readonly auth: AuthClient;
  public readonly user: UserClient;
  public readonly [resource]: [Resource]Client; // Add this
  public readonly client: BrowserAuthFetchProvider;

  constructor(baseUrl?: string) {
    this.client = new BrowserAuthFetchProvider(baseUrl);
    this.auth = new AuthClient(this.client);
    this.user = new UserClient(this.client);
    this.[resource] = new [Resource]Client(this.client); // Add this
  }
}
```

---

## PHASE 7: Brand-Specific Considerations

### RTH Brand
- Primary Color: `#FF4B91`
- Tailwind: `bg-primary`, `text-primary`
- Domain: `user.realtutorialhub.com`
- App: `apps/realtutorialhub-quiz`

### SkillUp Brand
- Primary Color: `#0EA5E9`
- Tailwind: `bg-primary`, `text-primary`
- Domain: `user.skillupitacademy.com`
- App: `apps/skillup-web`

### Shared Components
If component is identical for both brands, put in:
```
packages/ui/src/[component-name].tsx
```

Then import in both apps.

---

## PHASE 8: Testing Checklist

After implementation, verify:

### Frontend
- [ ] Page renders correctly
- [ ] Brand colors applied correctly
- [ ] Loading states work
- [ ] Error states work
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessibility (keyboard navigation, ARIA labels)

### BFF Layer
- [ ] Route handler exists
- [ ] Authentication middleware applied
- [ ] Brand resolution works
- [ ] Service aggregates data correctly

### Backend API
- [ ] Routes exist in SkillHubCore
- [ ] requireAuth middleware applied
- [ ] requirePlatform applied for brand-specific routes
- [ ] Database queries work
- [ ] Error handling works

### API Client
- [ ] Client methods exist
- [ ] TypeScript types defined
- [ ] Registered in main ApiClient

### Integration
- [ ] Frontend calls API client
- [ ] API client calls BFF
- [ ] BFF calls backend
- [ ] Data flows correctly
- [ ] Errors propagate correctly

---

## COMPLETE EXAMPLE: Dashboard Feature

### User Request
"Create a dashboard page for RTH that shows user stats, recent activities, and quick actions"

### AI Response - Step 1: Generate PRD

```markdown
# Dashboard - UI/UX Specification

## Brand Context
- Brand: RTH
- Domain: user.realtutorialhub.com
- Portal Identity: user
- Primary Color: #FF4B91

## Page Details
- Route: /dashboard
- Auth Required: Yes
- Layout: Authenticated layout with sidebar

## Components Needed
1. StatsCards - Shows active courses, completed courses, average progress
2. RecentActivity - Shows last 5 activities
3. QuickActions - Shows common actions (enroll, view courses, etc.)

## Data Requirements
- User profile: name, email, avatar
- Enrollment stats: activeCourses, completedCourses, averageProgress
- Recent activities: last 5 activities with timestamps

## API Endpoints Needed
- GET /api/user/stats
- GET /api/user/activities?limit=5
```

### User Action
User pastes Figma-generated code

### AI Response - Step 2: Integrate Code

Create files:
1. `apps/realtutorialhub-quiz/src/app/(authenticated)/dashboard/page.tsx`
2. `apps/realtutorialhub-quiz/src/components/dashboard/StatsCards.tsx`
3. `apps/realtutorialhub-quiz/src/components/dashboard/RecentActivity.tsx`
4. `apps/realtutorialhub-quiz/src/components/dashboard/QuickActions.tsx`

### AI Response - Step 3: Implement Backend

Create files:
1. `apps/api-server/src/app/api/user/stats/route.ts`
2. `apps/api-server/src/modules/user/user-stats.service.ts`
3. `services/skillhubcore-service/src/modules/user/user.routes.ts` (extend)
4. `packages/api-client/src/modules/user.client.ts` (extend)

---

## CRITICAL RULES

1. **Never skip phases** - Always go Frontend → BFF → Backend → API Client
2. **Always apply brand awareness** - Every layer must know the brand
3. **Always apply authentication** - Use `withAuth`, `requireAuth`, `requirePlatform`
4. **Always use TypeScript** - Define types for all data structures
5. **Always handle errors** - Loading states, error states, empty states
6. **Always test integration** - Verify data flows from frontend to backend

---

## QUICK REFERENCE

### File Locations
- Frontend Pages: `apps/[brand]/src/app/(authenticated)/[feature]/page.tsx`
- Frontend Components: `apps/[brand]/src/components/[feature]/`
- BFF Routes: `apps/api-server/src/app/api/[resource]/route.ts`
- BFF Services: `apps/api-server/src/modules/[resource]/[resource].service.ts`
- Backend Routes: `services/skillhubcore-service/src/modules/[resource]/[resource].routes.ts`
- Backend Services: `services/skillhubcore-service/src/modules/[resource]/[resource].service.ts`
- API Client: `packages/api-client/src/modules/[resource].client.ts`

### Brand Colors
- RTH: `#FF4B91` → `bg-primary`, `text-primary`
- SkillUp: `#0EA5E9` → `bg-primary`, `text-primary`

### Authentication
- Frontend: `apiClient.client.setPortalIdentity('user')`
- BFF: `withAuth(handler)`
- Backend: `requireAuth`, `requirePlatform('realtutorialhub')`

---

This guide ensures consistent, brand-aware, fully-integrated features from Figma design to production deployment.
