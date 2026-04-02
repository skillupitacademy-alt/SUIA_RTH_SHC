# Multi-Brand Authentication Architecture - Current State Analysis

> [!IMPORTANT]
> Historical architecture note: this file contains older hostnames and rollout assumptions.
> Current production truth lives in `.kiro/DEPLOYMENT_STATUS_MATRIX.md`.
> Treat `user.realtutorialhub.com`, `user.skillupitacademy.com`, `tutorial.skillhubcore.in`, `quiz.skillhubcore.in`, and `placement.skillhubcore.in` as the active public host map unless this file explicitly says otherwise.

## Current Subdomain Structure

### Real Tutorial Hub (realtutorialhub.com)
```
quiz.realtutorialhub.com     → apps/realtutorialhub-quiz (Next.js)
admin.realtutorialhub.com    → apps/realtutorialhub-admin (Next.js)
notes.realtutorialhub.com    → apps/realtutorialhub-web (Next.js) [Tutorial Engine]
api.realtutorialhub.com      → API Gateway (Cloudflare Worker)
```

### SkillUp IT Academy (skillupitacademy.com)
```
app.skillupitacademy.com     → apps/skillup-web (Next.js)
admin.skillupitacademy.com   → apps/skillup-admin (Next.js)
faculty.skillupitacademy.com → apps/faculty-app (Next.js)
```

### SkillHub Core (skillhubcore.in)
```
api.skillhubcore.in          → services/skillhubcore-service (Hono)
admin.skillhubcore.in        → apps/skillhubcore-admin (Next.js)
```

## Current Database Architecture

### quiz_platform_prod (Primary Auth DB)
**Used by:** RTH Quiz, RTH Admin, SkillUp Web, SkillUp Admin, Faculty App, API Server
**Tables:**
- `users` - User accounts
- `user_profiles` - User profile data
- `roles` - Role definitions (USER, ADMIN, SUPER_ADMIN)
- `user_roles` - User-role mappings
- `exams`, `questions`, `reports` - Exam engine data
- `domains`, `subjects`, `topics`, `subtopics` - Content hierarchy

### tutorial_prod (Tutorial Engine DB)
**Used by:** Tutorial Service (notes.realtutorialhub.com)
**Tables:**
- `tutorial_content` - Tutorial lessons
- `tutorial_progress` - User progress tracking
- `assignments`, `projects` - Assignment data
- `badges`, `certificates` - Achievements

### people_prod (SkillHub Services DB)
**Used by:** SkillHub Core services
**Tables:**
- `users` - Shadow user accounts
- `platform_access` - Multi-platform access control
- `subscriptions` - Subscription management
- `enquiries`, `admissions` - CRM data
- `batches`, `enrollments` - Batch management
- `faculty` - Faculty management
- `student_placement_profiles` - Placement data

### payment_prod (Payment Service DB)
**Tables:**
- Payment transactions
- Invoices
- Payment methods

### placement_prod (Placement Service DB)
**Tables:**
- Job postings
- Applications
- Interview schedules

## Current Authentication Flow

### RTH User Login (quiz.realtutorialhub.com)
```
1. User submits login form
2. Frontend derives x-portal-identity from hostname → "user"
3. Request sent to api.realtutorialhub.com/auth/login
4. API Gateway routes to EXAM_SERVICE_URL (api-server)
5. API Server queries quiz_platform_prod.users
6. API Server validates password
7. API Server checks user_roles for permissions
8. API Server generates JWT with brand="realtutorialhub"
9. API Server sets httpOnly cookies:
   - accessToken (domain: .realtutorialhub.com)
   - refreshToken (domain: .realtutorialhub.com)
10. Frontend stores user in Zustand store
11. User redirected to /dashboard
```

### SkillUp User Login (app.skillupitacademy.com)
```
1. User submits login form
2. Frontend sends fixed x-portal-identity → "user"
3. Request sent to api.realtutorialhub.com/auth/login (WRONG!)
4. API Gateway routes to EXAM_SERVICE_URL (api-server)
5. API Server queries quiz_platform_prod.users
6. API Server validates password
7. API Server generates JWT with brand="skillup"
8. API Server sets httpOnly cookies:
   - accessToken (domain: .realtutorialhub.com) ← WRONG DOMAIN!
   - refreshToken (domain: .realtutorialhub.com) ← WRONG DOMAIN!
9. Cookies don't work on skillupitacademy.com domain
```

## Critical Issues Identified

### Issue 1: Shared Database for Separate Brands
**Problem:** Both RTH and SkillUp use `quiz_platform_prod`
**Impact:** Cannot isolate user data by brand, violates objective of separate databases

### Issue 2: Wrong Cookie Domain for SkillUp
**Problem:** SkillUp apps get cookies for `.realtutorialhub.com`
**Impact:** Cookies don't work, auth fails silently

### Issue 3: No SkillUp API Gateway
**Problem:** SkillUp apps call `api.realtutorialhub.com`
**Impact:** Wrong routing, wrong cookie domain, brand confusion

### Issue 4: SkillHub Services Can't Access Brand Users
**Problem:** SkillHub queries `people_prod`, but users are in `quiz_platform_prod`
**Impact:** Tutorial progress, placements, etc. can't link to actual users

### Issue 5: Hostname-Derived Portal Identity (RTH only)
**Problem:** RTH apps derive portal identity from hostname
**Impact:** Inconsistent auth behavior, harder to debug

## Correct Architecture (Target State)

### Subdomain Strategy

#### Real Tutorial Hub (realtutorialhub.com)
```
quiz.realtutorialhub.com     → RTH Quiz Portal
admin.realtutorialhub.com    → RTH Admin Portal
notes.realtutorialhub.com    → Tutorial Engine (shared service)
api.realtutorialhub.com      → RTH API Gateway
```

#### SkillUp IT Academy (skillupitacademy.com)
```
app.skillupitacademy.com     → SkillUp Student Portal
admin.skillupitacademy.com   → SkillUp Admin Portal
faculty.skillupitacademy.com → SkillUp Faculty Portal
notes.skillupitacademy.com   → Tutorial Engine (shared service)
api.skillupitacademy.com     → SkillUp API Gateway (NEW!)
```

#### SkillHub Core (skillhubcore.in)
```
api.skillhubcore.in          → SkillHub Core API (shared services)
admin.skillhubcore.in        → SkillHub Super Admin Portal
```

### Database Strategy

#### rth_prod (NEW - RTH Brand DB)
**Purpose:** RTH-specific user accounts and brand data
**Tables:**
- `users`, `user_profiles`, `roles`, `user_roles`
- RTH-specific configurations

#### skillup_prod (NEW - SkillUp Brand DB)
**Purpose:** SkillUp-specific user accounts and brand data
**Tables:**
- `users`, `user_profiles`, `roles`, `user_roles`
- SkillUp-specific configurations (batches, faculty, etc.)

#### quiz_platform_prod (REPURPOSED - Shared Exam Engine)
**Purpose:** Shared exam/quiz engine data (brand-agnostic)
**Tables:**
- `exams`, `questions`, `reports`
- `domains`, `subjects`, `topics`, `subtopics`
- `skills`, `blueprints`

#### tutorial_prod (KEEP - Shared Tutorial Engine)
**Purpose:** Shared tutorial content and progress
**Tables:**
- `tutorial_content`, `tutorial_progress`
- `assignments`, `projects`, `badges`

#### people_prod (REPURPOSED - User Identity Bridge)
**Purpose:** Unified user identity for shared services
**Tables:**
- `users` (shadow accounts with external_id)
- `platform_access` (which platforms user can access)
- `subscriptions`, `enquiries`, `admissions`

#### payment_prod (KEEP - Shared Payment Service)
#### placement_prod (KEEP - Shared Placement Service)

### Authentication Flow (Target)

#### RTH User Login
```
1. User → quiz.realtutorialhub.com/login
2. Frontend sends FIXED x-portal-identity="user", x-brand="realtutorialhub"
3. Request → api.realtutorialhub.com/auth/login
4. RTH API Gateway → RTH Auth Service
5. RTH Auth Service queries rth_prod.users
6. RTH Auth Service validates password
7. RTH Auth Service syncs to people_prod (shadow user)
8. RTH Auth Service generates JWT
9. RTH Auth Service sets cookies (domain: .realtutorialhub.com)
10. User authenticated for RTH brand
```

#### SkillUp User Login
```
1. User → app.skillupitacademy.com/login
2. Frontend sends FIXED x-portal-identity="user", x-brand="skillup"
3. Request → api.skillupitacademy.com/auth/login (NEW GATEWAY!)
4. SkillUp API Gateway → SkillUp Auth Service
5. SkillUp Auth Service queries skillup_prod.users
6. SkillUp Auth Service validates password
7. SkillUp Auth Service syncs to people_prod (shadow user)
8. SkillUp Auth Service generates JWT
9. SkillUp Auth Service sets cookies (domain: .skillupitacademy.com)
10. User authenticated for SkillUp brand
```

#### Shared Service Access (Tutorial Engine)
```
1. RTH user → notes.realtutorialhub.com/tutorial/123
2. Frontend sends request with RTH cookies
3. Request → api.realtutorialhub.com/tutorial/123
4. RTH API Gateway validates RTH JWT
5. RTH API Gateway extracts user_id and brand
6. RTH API Gateway forwards to Tutorial Service with:
   - x-user-id: <rth_user_id>
   - x-brand: "realtutorialhub"
   - x-shadow-user-id: <people_prod_user_id>
7. Tutorial Service queries tutorial_prod using shadow_user_id
8. Tutorial progress saved with shadow_user_id
9. Response returned to user
```

## Migration Strategy

### Phase 1: Create SkillUp Database
- Create `skillup_prod` database
- Migrate SkillUp users from `quiz_platform_prod` to `skillup_prod`
- Update SkillUp apps to use new database

### Phase 2: Create SkillUp API Gateway
- Deploy SkillUp API Gateway at `api.skillupitacademy.com`
- Configure Cloudflare routing
- Update SkillUp apps to call correct gateway

### Phase 3: Implement User Identity Sync
- Create `UserIdentityBridgeService`
- Sync users to `people_prod` on login
- Update shared services to use shadow user IDs

### Phase 4: Standardize Portal Identity
- Remove hostname-derived portal identity from RTH apps
- Use fixed portal identity everywhere
- Update all auth headers consistently

### Phase 5: Migrate Exam Engine to Shared DB
- Move exam/quiz data to brand-agnostic structure
- Update references to use shadow user IDs
- Deprecate brand-specific exam tables

## Recommendation

**DO NOT** use `skillhubcore.in` subdomains for brand-specific services (quiz, notes, placement).

**REASON:**
- `skillhubcore.in` should be for **infrastructure/admin** only
- Brand services should stay on brand domains for:
  - Cookie domain isolation
  - Brand identity
  - SEO and user trust
  - Clear separation of concerns

**CORRECT SUBDOMAIN STRATEGY:**
```
RTH Brand:
  quiz.realtutorialhub.com
  admin.realtutorialhub.com
  notes.realtutorialhub.com
  api.realtutorialhub.com

SkillUp Brand:
  app.skillupitacademy.com
  admin.skillupitacademy.com
  faculty.skillupitacademy.com
  notes.skillupitacademy.com  ← ADD THIS
  api.skillupitacademy.com    ← ADD THIS

SkillHub Infrastructure:
  api.skillhubcore.in         ← Internal services only
  admin.skillhubcore.in       ← Super admin only
```
