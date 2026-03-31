# Multi-Brand Authentication Architecture - Requirements

## Overview

Implement a proper multi-brand authentication architecture that maintains brand isolation while enabling shared services (Tutorial Engine, Exam Engine, Placement, etc.) to work across both Real Tutorial Hub and SkillUp IT Academy.

## Business Requirements

### BR-1: Brand Isolation
**As a** platform architect  
**I want** RTH and SkillUp to have completely separate user databases  
**So that** each brand maintains data sovereignty and can scale independently

**Acceptance Criteria:**
- RTH users stored in `rth_prod` database
- SkillUp users stored in `skillup_prod` database
- No direct cross-brand user access
- Each brand has independent authentication

### BR-2: Shared Services Access
**As a** user of either RTH or SkillUp  
**I want** to access shared services (tutorials, exams, placements)  
**So that** I can use all platform features regardless of my brand

**Acceptance Criteria:**
- RTH users can access Tutorial Engine
- SkillUp users can access Tutorial Engine
- Exam results tracked per user regardless of brand
- Placement profiles work for both brands
- User identity maintained across shared services

### BR-3: Consistent Authentication
**As a** developer  
**I want** all portals to use the same authentication mechanism  
**So that** auth behavior is predictable and maintainable

**Acceptance Criteria:**
- Fixed portal identity (not hostname-derived)
- Consistent cookie domain per brand
- Standard JWT structure across all services
- Unified auth error handling

### BR-4: Correct Cookie Domains
**As a** SkillUp user  
**I want** my authentication cookies to work on SkillUp domains  
**So that** I can stay logged in across SkillUp portals

**Acceptance Criteria:**
- RTH cookies use `.realtutorialhub.com` domain
- SkillUp cookies use `.skillupitacademy.com` domain
- Cookies work across all subdomains of same brand
- No cross-brand cookie leakage

## Technical Requirements

### TR-1: Database Architecture

#### TR-1.1: Create RTH Brand Database
**Database Name:** `rth_prod`  
**Purpose:** RTH-specific user accounts and brand data  
**Schema:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  education_level TEXT,
  professional_status TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE -- USER, ADMIN, SUPER_ADMIN
);

-- User roles
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

#### TR-1.2: Create SkillUp Brand Database
**Database Name:** `skillup_prod`  
**Purpose:** SkillUp-specific user accounts and brand data  
**Schema:** Same as `rth_prod` plus:
```sql
-- Faculty table (SkillUp-specific)
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  specialization TEXT[],
  availability_type TEXT NOT NULL, -- fulltime, parttime, contract
  status TEXT NOT NULL, -- active, inactive, on_leave
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Batches table (SkillUp-specific)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mode TEXT NOT NULL, -- online, offline, hybrid
  status TEXT NOT NULL, -- upcoming, active, completed, cancelled
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### TR-1.3: Repurpose people_prod as Identity Bridge
**Purpose:** Unified user identity for shared services  
**Changes:**
```sql
-- Add external_id to link to brand databases
ALTER TABLE users ADD COLUMN external_id TEXT;
ALTER TABLE users ADD COLUMN external_brand TEXT; -- 'rth' or 'skillup'
CREATE UNIQUE INDEX idx_users_external ON users(external_id, external_brand);

-- platform_access already exists - use as-is
-- This controls which platforms a shadow user can access
```

### TR-2: Subdomain Architecture

#### TR-2.1: RTH Brand Subdomains (Authentication & Brand Identity)
```
user.realtutorialhub.com     → NEW: RTH User Portal (replaces quiz.realtutorialhub.com)
admin.realtutorialhub.com    → RTH Admin Portal
api.realtutorialhub.com      → RTH API Gateway (auth only)
```

#### TR-2.2: SkillUp Brand Subdomains (Authentication & Brand Identity)
```
user.skillupitacademy.com    → NEW: SkillUp User Portal (replaces app.skillupitacademy.com)
admin.skillupitacademy.com   → SkillUp Admin Portal
faculty.skillupitacademy.com → SkillUp Faculty Portal
api.skillupitacademy.com     → NEW: SkillUp API Gateway (auth only)
```

#### TR-2.3: SkillHub Shared Services (Used by Both Brands)
```
quiz.skillhubcore.in         → NEW: Shared Quiz/Exam Engine
tutorial.skillhubcore.in     → NEW: Shared Tutorial Engine
placement.skillhubcore.in    → NEW: Shared Placement Service
api.skillhubcore.in          → SkillHub Core API (shared services backend)
admin.skillhubcore.in        → SkillHub Super Admin Portal
```

**Architecture Rationale:**
- **Brand domains** (realtutorialhub.com, skillupitacademy.com) = User authentication, brand identity, landing pages
- **SkillHub domain** (skillhubcore.in) = Shared functional services used by both brands
- **Cookie strategy**: Users authenticate on brand domain, then access shared services with cross-domain auth
- **Clear separation**: Brand-specific vs shared functionality

### TR-3: API Gateway Architecture

#### TR-3.1: RTH API Gateway (Authentication Only)
**Location:** `services/api-gateway-rth`  
**Domain:** `api.realtutorialhub.com`  
**Cloudflare Zone:** `realtutorialhub.com`  
**Purpose:** Handle RTH user authentication and route to shared services  
**Environment Variables:**
```toml
RTH_AUTH_SERVICE_URL = "https://rth-auth-service.run.app"
SKILLHUB_API_URL = "https://api.skillhubcore.in"
COOKIE_DOMAIN = ".realtutorialhub.com"
BRAND = "realtutorialhub"
```

**Routing Rules:**
```typescript
// Auth routes - handled by RTH Auth Service
{ prefix: '/auth', upstreamKey: 'RTH_AUTH_SERVICE_URL' }

// All other routes - proxy to SkillHub with brand context
{ prefix: '/*', upstreamKey: 'SKILLHUB_API_URL', headers: { 'x-brand': 'realtutorialhub' } }
```

#### TR-3.2: SkillUp API Gateway (Authentication Only)
**Location:** `services/api-gateway-skillup`  
**Domain:** `api.skillupitacademy.com`  
**Cloudflare Zone:** `skillupitacademy.com`  
**Purpose:** Handle SkillUp user authentication and route to shared services  
**Environment Variables:**
```toml
SKILLUP_AUTH_SERVICE_URL = "https://skillup-auth-service.run.app"
SKILLHUB_API_URL = "https://api.skillhubcore.in"
COOKIE_DOMAIN = ".skillupitacademy.com"
BRAND = "skillup"
```

**Routing Rules:**
```typescript
// Auth routes - handled by SkillUp Auth Service
{ prefix: '/auth', upstreamKey: 'SKILLUP_AUTH_SERVICE_URL' }

// All other routes - proxy to SkillHub with brand context
{ prefix: '/*', upstreamKey: 'SKILLHUB_API_URL', headers: { 'x-brand': 'skillup' } }
```

#### TR-3.3: SkillHub API Gateway (Shared Services)
**Location:** `services/api-gateway-skillhub`  
**Domain:** `api.skillhubcore.in`  
**Cloudflare Zone:** `skillhubcore.in`  
**Purpose:** Route requests to shared services (quiz, tutorial, placement)  
**Environment Variables:**
```toml
QUIZ_SERVICE_URL = "https://quiz-service.run.app"
TUTORIAL_SERVICE_URL = "https://tutorial-service.run.app"
PLACEMENT_SERVICE_URL = "https://placement-service.run.app"
PAYMENT_SERVICE_URL = "https://payment-service.run.app"
```

**Routing Rules:**
```typescript
// Shared service routes
{ prefix: '/quiz', upstreamKey: 'QUIZ_SERVICE_URL' }
{ prefix: '/exam', upstreamKey: 'QUIZ_SERVICE_URL' }
{ prefix: '/tutorial', upstreamKey: 'TUTORIAL_SERVICE_URL' }
{ prefix: '/placement', upstreamKey: 'PLACEMENT_SERVICE_URL' }
{ prefix: '/payment', upstreamKey: 'PAYMENT_SERVICE_URL' }
```

### TR-4: Authentication Service Architecture

#### TR-4.1: RTH Auth Service
**Location:** `services/rth-auth-service` (extract from api-server)  
**Database:** `rth_prod`  
**Responsibilities:**
- User registration for RTH
- User login for RTH
- Password reset for RTH
- JWT generation with brand="realtutorialhub"
- Cookie management for `.realtutorialhub.com`
- User sync to `people_prod`

**Key Classes:**
```typescript
// services/rth-auth-service/src/services/RthAuthService.ts
class RthAuthService {
  constructor(
    private rthDb: RthDatabase,
    private peopleDb: PeopleDatabase,
    private identityBridge: UserIdentityBridgeService
  ) {}

  async login(email: string, password: string, ip: string): Promise<AuthResult> {
    // 1. Query rth_prod.users
    const user = await this.rthDb.users.findByEmail(email);
    
    // 2. Validate password
    const isValid = await this.validatePassword(password, user.passwordHash);
    
    // 3. Sync to people_prod
    const shadowUserId = await this.identityBridge.syncUser({
      externalId: user.id,
      externalBrand: 'rth',
      email: user.email,
      platform: 'realtutorialhub'
    });
    
    // 4. Generate JWT
    const accessToken = await this.generateAccessToken({
      userId: user.id,
      shadowUserId,
      email: user.email,
      brand: 'realtutorialhub',
      roles: user.roles
    });
    
    // 5. Return tokens
    return { user, accessToken, refreshToken, shadowUserId };
  }
}
```

#### TR-4.2: SkillUp Auth Service
**Location:** `services/skillup-auth-service` (new service)  
**Database:** `skillup_prod`  
**Responsibilities:** Same as RTH Auth Service but for SkillUp brand

**Key Classes:**
```typescript
// services/skillup-auth-service/src/services/SkillUpAuthService.ts
class SkillUpAuthService {
  constructor(
    private skillupDb: SkillUpDatabase,
    private peopleDb: PeopleDatabase,
    private identityBridge: UserIdentityBridgeService
  ) {}

  async login(email: string, password: string, ip: string): Promise<AuthResult> {
    // Same flow as RTH but queries skillup_prod
    const user = await this.skillupDb.users.findByEmail(email);
    
    const shadowUserId = await this.identityBridge.syncUser({
      externalId: user.id,
      externalBrand: 'skillup',
      email: user.email,
      platform: 'skillup'
    });
    
    const accessToken = await this.generateAccessToken({
      userId: user.id,
      shadowUserId,
      email: user.email,
      brand: 'skillup',
      roles: user.roles
    });
    
    return { user, accessToken, refreshToken, shadowUserId };
  }
}
```

### TR-5: User Identity Bridge Service

#### TR-5.1: Identity Bridge Implementation
**Location:** `packages/identity-bridge/src/UserIdentityBridgeService.ts`  
**Purpose:** Sync brand users to people_prod for shared services

**Key Classes:**
```typescript
interface SyncUserInput {
  externalId: string;        // User ID from brand database
  externalBrand: 'rth' | 'skillup';
  email: string;
  platform: 'realtutorialhub' | 'skillup';
}

interface SyncUserResult {
  shadowUserId: string;      // User ID in people_prod
  created: boolean;          // Whether user was newly created
}

class UserIdentityBridgeService {
  constructor(private peopleDb: PeopleDatabase) {}

  async syncUser(input: SyncUserInput): Promise<SyncUserResult> {
    // 1. Check if shadow user exists
    const existing = await this.peopleDb.users.findByExternalId(
      input.externalId,
      input.externalBrand
    );

    if (existing) {
      // 2. Update existing shadow user
      await this.peopleDb.users.update(existing.id, {
        email: input.email,
        updatedAt: new Date()
      });

      return {
        shadowUserId: existing.id,
        created: false
      };
    }

    // 3. Create new shadow user
    const shadowUser = await this.peopleDb.users.create({
      externalId: input.externalId,
      externalBrand: input.externalBrand,
      email: input.email,
      platform: input.platform,
      role: 'student' // Default role
    });

    // 4. Grant platform access
    await this.peopleDb.platformAccess.grant({
      userId: shadowUser.id,
      platform: input.platform
    });

    return {
      shadowUserId: shadowUser.id,
      created: true
    };
  }

  async getShadowUserId(externalId: string, externalBrand: 'rth' | 'skillup'): Promise<string | null> {
    const user = await this.peopleDb.users.findByExternalId(externalId, externalBrand);
    return user?.id ?? null;
  }
}
```

### TR-6: Frontend Authentication Updates

#### TR-6.1: Brand Portal Authentication Flow
**RTH User Portal** (`user.realtutorialhub.com`):
```typescript
// apps/realtutorialhub-user/src/app/(public)/login/page.tsx
const portalIdentity = 'user';
const brand = 'realtutorialhub';
const apiBase = 'https://api.realtutorialhub.com';

// After successful login:
// 1. Cookies set for .realtutorialhub.com
// 2. Redirect to quiz.skillhubcore.in with auth token
// 3. SkillHub validates token and creates session
```

**SkillUp User Portal** (`user.skillupitacademy.com`):
```typescript
// apps/skillup-user/src/app/(public)/login/page.tsx
const portalIdentity = 'user';
const brand = 'skillup';
const apiBase = 'https://api.skillupitacademy.com';

// After successful login:
// 1. Cookies set for .skillupitacademy.com
// 2. Redirect to quiz.skillhubcore.in with auth token
// 3. SkillHub validates token and creates session
```

#### TR-6.2: Cross-Domain Authentication Strategy
**Challenge:** Cookies from `.realtutorialhub.com` won't work on `quiz.skillhubcore.in`

**Solution: Token-Based Cross-Domain Auth**
```typescript
// Step 1: User logs in on brand domain
// user.realtutorialhub.com/login
const loginResponse = await fetch('https://api.realtutorialhub.com/auth/login', {
  method: 'POST',
  credentials: 'include', // Sets cookies for .realtutorialhub.com
  body: JSON.stringify({ email, password })
});

const { accessToken, user } = await loginResponse.json();

// Step 2: Redirect to SkillHub with token
window.location.href = `https://quiz.skillhubcore.in/auth/callback?token=${accessToken}&brand=realtutorialhub`;

// Step 3: SkillHub validates token and creates session
// quiz.skillhubcore.in/auth/callback
const tokenValidation = await fetch('https://api.skillhubcore.in/auth/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-brand': brand
  }
});

// Step 4: SkillHub sets its own cookies
// Cookies set for .skillhubcore.in
// User can now access quiz, tutorial, placement on skillhubcore.in
```

#### TR-6.3: Shared Service Access Pattern
**All SkillHub services** (quiz, tutorial, placement) use same auth:
```typescript
// quiz.skillhubcore.in, tutorial.skillhubcore.in, placement.skillhubcore.in
// All share cookies from .skillhubcore.in domain

// API calls include brand context
fetch('https://api.skillhubcore.in/quiz/start', {
  method: 'POST',
  credentials: 'include', // Sends .skillhubcore.in cookies
  headers: {
    'x-brand': 'realtutorialhub' // or 'skillup'
  }
});
```

#### TR-6.4: Remove Hostname-Derived Portal Identity
**Files to Update:**
- `apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx` → Rename to `apps/realtutorialhub-user`
- `apps/realtutorialhub-admin/src/app/(public)/login/page.tsx` → Keep as-is
- `apps/skillup-web` → Rename to `apps/skillup-user`

**Change:**
```typescript
// BEFORE (hostname-derived)
function getPortalIdentityFromHostname(hostname: string): 'admin' | 'user' {
  const normalized = hostname.trim().toLowerCase();
  return normalized.startsWith('admin.') ? 'admin' : 'user';
}
const portalIdentity = getPortalIdentityFromHostname(window.location.hostname);

// AFTER (fixed)
const portalIdentity = 'user'; // or 'admin' for admin app
const brand = 'realtutorialhub'; // or 'skillup'
```

### TR-7: Shared Services Updates

#### TR-7.1: SkillHub Token Validation Service
**Location:** `services/skillhub-auth-validator`  
**Purpose:** Validate brand tokens and create SkillHub sessions  
**Responsibilities:**
- Validate JWT tokens from RTH or SkillUp
- Extract user identity and brand
- Sync user to people_prod if needed
- Create SkillHub session cookies for .skillhubcore.in

**Key Classes:**
```typescript
// services/skillhub-auth-validator/src/SkillHubAuthValidator.ts
class SkillHubAuthValidator {
  constructor(
    private peopleDb: PeopleDatabase,
    private identityBridge: UserIdentityBridgeService
  ) {}

  async validateBrandToken(token: string, brand: 'realtutorialhub' | 'skillup'): Promise<ValidationResult> {
    // 1. Verify JWT signature (use brand-specific public key)
    const payload = await this.verifyJWT(token, brand);
    
    // 2. Extract user info
    const { userId, shadowUserId, email, roles } = payload;
    
    // 3. Ensure shadow user exists in people_prod
    if (!shadowUserId) {
      const synced = await this.identityBridge.syncUser({
        externalId: userId,
        externalBrand: brand === 'realtutorialhub' ? 'rth' : 'skillup',
        email,
        platform: brand === 'realtutorialhub' ? 'realtutorialhub' : 'skillup'
      });
      shadowUserId = synced.shadowUserId;
    }
    
    // 4. Generate SkillHub session token
    const skillhubToken = await this.generateSkillHubToken({
      shadowUserId,
      brand,
      originalUserId: userId,
      roles
    });
    
    return {
      valid: true,
      shadowUserId,
      brand,
      skillhubToken
    };
  }
}
```

#### TR-7.2: Quiz Service (quiz.skillhubcore.in)
**Location:** `apps/skillhub-quiz` (new Next.js app)  
**Purpose:** Shared quiz/exam interface for both brands  
**Database:** `quiz_platform_prod` (repurposed as shared exam data)  
**Authentication:**
- Accepts SkillHub session cookies from .skillhubcore.in
- Reads x-brand header to customize UI/branding
- Uses shadow user ID for all database operations

**Implementation:**
```typescript
// apps/skillhub-quiz/src/middleware/auth.ts
export async function extractUserContext(req: NextRequest): Promise<UserContext> {
  const skillhubToken = req.cookies.get('skillhub_accessToken')?.value;
  const brand = req.headers.get('x-brand') || 'realtutorialhub';

  if (!skillhubToken) {
    throw new Error('Not authenticated');
  }

  const payload = await verifySkillHubToken(skillhubToken);

  return {
    shadowUserId: payload.shadowUserId,  // Use for all DB operations
    brand: payload.brand,                 // Use for UI customization
    originalUserId: payload.originalUserId,
    roles: payload.roles
  };
}

// apps/skillhub-quiz/src/services/ExamService.ts
class ExamService {
  async startExam(shadowUserId: string, blueprintId: string, brand: string) {
    // Use shadowUserId for all database operations
    const exam = await this.db.exams.create({
      userId: shadowUserId,  // ← Shadow user ID from people_prod
      blueprintId,
      brand,                  // Track which brand started the exam
      status: 'in_progress',
      startedAt: new Date()
    });
    
    return exam;
  }
}
```

#### TR-7.3: Tutorial Service (tutorial.skillhubcore.in)
**Location:** `apps/skillhub-tutorial` (new Next.js app)  
**Purpose:** Shared tutorial interface for both brands  
**Database:** `tutorial_prod`  
**Authentication:** Same as Quiz Service

**Implementation:**
```typescript
// apps/skillhub-tutorial/src/services/TutorialProgressService.ts
class TutorialProgressService {
  async saveProgress(shadowUserId: string, contentId: string, progress: number, brand: string) {
    // Use shadowUserId for all database operations
    await this.db.tutorialProgress.upsert({
      userId: shadowUserId,  // ← Shadow user ID from people_prod
      contentId,
      progress,
      brand,                  // Track which brand is using the tutorial
      updatedAt: new Date()
    });
  }
}
```

#### TR-7.4: Placement Service (placement.skillhubcore.in)
**Location:** `apps/skillhub-placement` (new Next.js app)  
**Purpose:** Shared placement interface for both brands  
**Database:** `placement_prod`  
**Authentication:** Same as Quiz Service

#### TR-7.5: Brand-Specific UI Customization
**All SkillHub services must support brand-specific theming:**
```typescript
// apps/skillhub-quiz/src/utils/brandTheme.ts
export function getBrandTheme(brand: 'realtutorialhub' | 'skillup') {
  if (brand === 'realtutorialhub') {
    return {
      primaryColor: '#FF2D55',
      logo: '/logos/rth-logo.svg',
      name: 'Real Tutorial Hub',
      tagline: 'AI-Powered Learning'
    };
  }
  
  return {
    primaryColor: '#4F46E5',
    logo: '/logos/skillup-logo.svg',
    name: 'SkillUp IT Academy',
    tagline: 'Expert-Led Training'
  };
}
```

### TR-8: Migration Requirements

#### TR-8.1: Data Migration Scripts
**Required Scripts:**
1. `scripts/migrate-rth-users.ts` - Migrate RTH users from quiz_platform_prod to rth_prod
2. `scripts/migrate-skillup-users.ts` - Migrate SkillUp users from quiz_platform_prod to skillup_prod
3. `scripts/sync-existing-users-to-people.ts` - Create shadow users in people_prod for all existing users

#### TR-8.2: Migration Validation
- Verify all users migrated successfully
- Verify no data loss
- Verify auth still works for all users
- Verify shared services can access user data

## Correctness Properties

### CP-1: Brand Isolation
**Property:** Users from different brands cannot access each other's data  
**Test:** Attempt to access RTH user data with SkillUp credentials → Should fail

### CP-2: Cookie Domain Correctness
**Property:** Cookies are set for correct domain per brand  
**Test:** Login to RTH → cookies should have domain=.realtutorialhub.com  
**Test:** Login to SkillUp → cookies should have domain=.skillupitacademy.com

### CP-3: Shared Service Access
**Property:** Users from both brands can access shared services  
**Test:** RTH user accesses Tutorial Engine → Should work  
**Test:** SkillUp user accesses Tutorial Engine → Should work  
**Test:** Both users' progress should be tracked separately

### CP-4: Identity Consistency
**Property:** Shadow user ID remains consistent across all shared services  
**Test:** User accesses Tutorial, then Exam, then Placement → Same shadow user ID used

### CP-5: Portal Identity Consistency
**Property:** Portal identity is fixed per app, not derived from hostname  
**Test:** Access RTH quiz from any hostname → portal identity should always be 'user'

## Non-Functional Requirements

### NFR-1: Performance
- User sync to people_prod should complete in < 100ms
- No additional latency for shared service access
- Database queries optimized with proper indexes

### NFR-2: Security
- No cross-brand data leakage
- JWT tokens include brand claim
- Cookies are httpOnly and secure
- CSRF protection enabled

### NFR-3: Maintainability
- Clear separation of brand-specific and shared code
- Consistent auth patterns across all services
- Well-documented identity bridge logic

### NFR-4: Scalability
- Each brand database can scale independently
- Shared services can handle users from multiple brands
- No single point of failure

## Success Criteria

1. ✅ RTH users authenticate against rth_prod database
2. ✅ SkillUp users authenticate against skillup_prod database
3. ✅ RTH cookies work on all .realtutorialhub.com subdomains
4. ✅ SkillUp cookies work on all .skillupitacademy.com subdomains
5. ✅ Both brands can access Tutorial Engine
6. ✅ Both brands can access Exam Engine
7. ✅ Both brands can access Placement Service
8. ✅ User progress tracked correctly per user across brands
9. ✅ No hostname-derived portal identity anywhere
10. ✅ All auth flows use fixed portal identity
