# 🔐 AUTHENTICATION - BRAND-AGNOSTIC IMPLEMENTATION
## Aligned with SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md

> **Date**: April 13, 2026  
> **Reference**: SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md  
> **Pattern**: Option 2 + Option 3 + Option 4

---

## 🎯 CORE PRINCIPLE

Authentication and authorization must follow the **same brand-agnostic pattern** as the UI:

- ✅ **One shared auth implementation** for both brands
- ✅ **One shared auth data model** (token payload)
- ✅ **One shared API boundary** (TokenService)
- ❌ **No brand-specific auth logic** in shared components
- ❌ **No hardcoded brand values** in auth code

**Brand variation allowed only through**:
- `brandConfig.ts` injection
- Route-specific data passed as props
- Token claims (brand, platforms)

---

## 📊 CURRENT AUTH ARCHITECTURE ALIGNMENT

### ✅ **What Already Follows the Pattern**

#### **1. Shared TokenService (`@quiz/auth`)**
```typescript
// packages/auth/src/token.service.ts
export class TokenService {
  // ✅ One implementation for all brands
  async generateAccessToken(payload: TokenPayload): Promise<string>
  async verifyUserAccessToken(token: string): Promise<UserTokenPayload>
  async signSkillHubCoreAccessToken(...): Promise<string>
}
```

**Alignment**: ✅ Option 2 (Brand-agnostic architecture)
- One shared implementation
- No brand-specific branching
- Brand identity comes from token payload

#### **2. Shared Auth UI (`src/share-branding/AuthPage.tsx`)**
```typescript
// src/share-branding/AuthPage.tsx
export function AuthPage({ config }: { config: BrandConfig }) {
  // ✅ Uses brand config for colors, labels
  // ✅ No hardcoded brand values
  // ✅ Same layout for both brands
}
```

**Alignment**: ✅ Option 2 (Brand-agnostic architecture)
- One shared UI component
- Brand identity from `brandConfig.ts`
- No brand-specific branching

#### **3. Consistent Proxy Middleware**
```typescript
// All apps: apps/*/src/proxy.ts
export async function proxy(request: NextRequest) {
  // ✅ Same pattern across all apps
  // ✅ No brand-specific logic
  // ✅ Brand determined from hostname/token
}
```

**Alignment**: ✅ Option 2 (Brand-agnostic architecture)
- One shared pattern
- Brand-agnostic implementation

### ❌ **What Needs Alignment**

#### **1. Auth Routes in Individual Apps**

**Current**:
```
apps/api-server/src/app/api/auth/login/route.ts  ❌ Brand-specific
apps/api-server/src/app/api/auth/register/route.ts  ❌ Brand-specific
```

**Should Be**:
```
services/skillhubcore-service/src/modules/auth/auth.routes.ts  ✅ Shared
```

**Issue**: Auth logic duplicated per app, not centralized

#### **2. Brand Resolution Logic**

**Current**:
```typescript
// Scattered across apps
const brand = resolveRequestBrand(req.nextUrl.hostname);
```

**Should Be**:
```typescript
// Centralized in SkillHubCore
const brand = BrandResolver.fromHostname(hostname);
```

**Issue**: Brand resolution not centralized

---

## 🏗️ BRAND-AGNOSTIC AUTH ARCHITECTURE

### **Pattern: Option 2 + Option 3 + Option 4**

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION 2: BRAND-AGNOSTIC                     │
│                                                                 │
│  One shared auth implementation for both brands                 │
│  No brand-specific branching in shared auth code                │
│  Brand identity from brandConfig.ts + token claims              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION 3: SHARED DATA MODEL                  │
│                                                                 │
│  AuthViewData (UI model)                                        │
│  ├─ user: { id, name, email, roles }                            │
│  ├─ brand: { name, primaryColor, logo }                         │
│  ├─ platforms: ['realtutorialhub', 'skillup']                   │
│  ├─ subscriptions: ['free', 'premium']                          │
│  └─ session: { expiresAt, issuedAt }                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION 4: API BOUNDARY                       │
│                                                                 │
│  Raw API: TokenPayload (from JWT)                               │
│  Mapper: mapTokenToAuthViewData(payload)                        │
│  Loader: loadAuthData(request)                                  │
│  UI: Receives prepared AuthViewData                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION PATTERN

### **Step 1: Define Shared Auth Data Model**

**File**: `src/share-branding/auth/authViewData.ts` (NEW)

```typescript
/**
 * Option 3: Shared UI-facing auth data model
 * This is what auth UI components receive
 */
export interface AuthViewData {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    avatar?: string;
  };
  brand: {
    name: 'realtutorialhub' | 'skillup';
    displayName: string;
    primaryColor: string;
    logo: string;
  };
  platforms: Array<'realtutorialhub' | 'skillup'>;
  subscriptions: string[];
  session: {
    expiresAt: string;
    issuedAt: string;
    tokenFamily?: string;
  };
}

/**
 * Login form data (UI to API)
 */
export interface LoginFormData {
  email: string;
  password: string;
  platform: 'realtutorialhub' | 'skillup';
}

/**
 * Register form data (UI to API)
 */
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  platform: 'realtutorialhub' | 'skillup';
}
```

**Alignment**: ✅ Option 3 (Shared UI-facing data model)
- UI components don't read raw token payload
- Stable view-model for auth
- Common for both brands

---

### **Step 2: Create API Boundary and Mapper**

**File**: `src/share-branding/auth/authMapper.ts` (NEW)

```typescript
import type { TokenPayload } from '@quiz/auth';
import type { BrandConfig } from '../brandConfig';
import type { AuthViewData } from './authViewData';

/**
 * Option 4: Explicit API boundary and mapping layer
 * Maps raw token payload to UI view-model
 */
export function mapTokenToAuthViewData(
  payload: TokenPayload,
  brandConfig: BrandConfig
): AuthViewData {
  return {
    user: {
      id: payload.shadowUserId ?? payload.userId,
      name: payload.email.split('@')[0], // Fallback if name not in token
      email: payload.email,
      roles: payload.roles ?? [],
      avatar: undefined, // Could be added to token payload
    },
    brand: {
      name: payload.brand as 'realtutorialhub' | 'skillup',
      displayName: brandConfig.displayName,
      primaryColor: brandConfig.primaryColor,
      logo: brandConfig.logo,
    },
    platforms: payload.platforms ?? [payload.brand as 'realtutorialhub' | 'skillup'],
    subscriptions: payload.subscriptions ?? [],
    session: {
      expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
      issuedAt: new Date((payload.iat ?? 0) * 1000).toISOString(),
      tokenFamily: payload.tokenFamily,
    },
  };
}

/**
 * Maps login form data to API request
 */
export function mapLoginFormToApiRequest(formData: LoginFormData) {
  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    platform: formData.platform,
  };
}

/**
 * Maps register form data to API request
 */
export function mapRegisterFormToApiRequest(formData: RegisterFormData) {
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    platform: formData.platform,
  };
}
```

**Alignment**: ✅ Option 4 (Explicit API boundary)
- Raw token payload separated from UI shape
- Mapper converts API to UI model
- UI only receives prepared props

---

### **Step 3: Create Auth Loader**

**File**: `src/share-branding/auth/authLoader.ts` (NEW)

```typescript
import { TokenService } from '@quiz/auth';
import type { NextRequest } from 'next/server';
import { getBrandConfig } from '../brandConfig';
import { mapTokenToAuthViewData } from './authMapper';
import type { AuthViewData } from './authViewData';

/**
 * Option 4: Route/server loader owns data acquisition
 * Loads auth data and maps to UI view-model
 */
export async function loadAuthData(request: NextRequest): Promise<AuthViewData | null> {
  // 1. Get token from cookie
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return null;

  try {
    // 2. Verify token
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });

    // 3. Get brand config
    const hostname = request.nextUrl.hostname;
    const brandConfig = getBrandConfig(hostname);

    // 4. Map to UI view-model
    return mapTokenToAuthViewData(payload, brandConfig);
  } catch (error) {
    console.error('[AUTH_LOADER] Failed to load auth data:', error);
    return null;
  }
}

/**
 * Loads auth data for admin scope
 */
export async function loadAdminAuthData(request: NextRequest): Promise<AuthViewData | null> {
  const token = request.cookies.get('admin_accessToken')?.value;
  if (!token) return null;

  try {
    const payload = await TokenService.verifyAdminAccessToken(token, { audience: 'admin' });
    const hostname = request.nextUrl.hostname;
    const brandConfig = getBrandConfig(hostname);
    return mapTokenToAuthViewData(payload, brandConfig);
  } catch (error) {
    console.error('[ADMIN_AUTH_LOADER] Failed to load auth data:', error);
    return null;
  }
}
```

**Alignment**: ✅ Option 4 (Route-level loaders)
- Loader owns data acquisition
- Shared UI only receives prepared props
- No raw API parsing in UI

---

### **Step 4: Update Shared Auth UI**

**File**: `src/share-branding/AuthPage.tsx` (UPDATE)

```typescript
import type { BrandConfig } from './brandConfig';
import type { AuthViewData, LoginFormData } from './auth/authViewData';

interface AuthPageProps {
  config: BrandConfig;
  mode: 'login' | 'register';
  onSubmit: (data: LoginFormData) => Promise<void>;
  error?: string;
}

/**
 * Option 2: Brand-agnostic shared UI
 * Receives brand config and prepared data
 */
export function AuthPage({ config, mode, onSubmit, error }: AuthPageProps) {
  // ✅ Uses config for brand identity
  // ✅ No hardcoded brand values
  // ✅ No brand-specific branching
  
  return (
    <div className="auth-page">
      <div className="auth-brand-section" style={{ backgroundColor: config.primaryColor }}>
        <img src={config.logo} alt={config.displayName} />
        <h1>{config.displayName}</h1>
        <p>{config.tagline}</p>
      </div>
      
      <div className="auth-form-section">
        <h2>{mode === 'login' ? 'Welcome back' : 'Get started'}</h2>
        <AuthForm mode={mode} onSubmit={onSubmit} error={error} />
      </div>
    </div>
  );
}
```

**Alignment**: ✅ Option 2 (Brand-agnostic architecture)
- One shared UI for both brands
- Brand identity from config
- No brand-specific branching

---

### **Step 5: Keep Route Files Thin**

**File**: `apps/realtutorialhub-web/src/app/login/page.tsx` (UPDATE)

```typescript
import { getBrandConfig } from '@/share-branding/brandConfig';
import { AuthPage } from '@/share-branding/AuthPage';
import { mapLoginFormToApiRequest } from '@/share-branding/auth/authMapper';
import type { LoginFormData } from '@/share-branding/auth/authViewData';

/**
 * Thin route consumer
 * Only: select brand config, handle form submission, render shared UI
 */
export default function LoginPage() {
  const brandConfig = getBrandConfig('realtutorialhub.com');

  async function handleLogin(formData: LoginFormData) {
    const apiRequest = mapLoginFormToApiRequest(formData);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequest),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // Redirect to dashboard
    window.location.href = '/dashboard';
  }

  return (
    <AuthPage
      config={brandConfig}
      mode="login"
      onSubmit={handleLogin}
    />
  );
}
```

**File**: `apps/skillup-web/src/app/login/page.tsx` (UPDATE)

```typescript
import { getBrandConfig } from '@/share-branding/brandConfig';
import { AuthPage } from '@/share-branding/AuthPage';
import { mapLoginFormToApiRequest } from '@/share-branding/auth/authMapper';
import type { LoginFormData } from '@/share-branding/auth/authViewData';

/**
 * Thin route consumer
 * Same pattern as RTH, different brand config
 */
export default function LoginPage() {
  const brandConfig = getBrandConfig('skillupitacademy.com');

  async function handleLogin(formData: LoginFormData) {
    const apiRequest = mapLoginFormToApiRequest(formData);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequest),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    window.location.href = '/student'; // SkillUp dashboard
  }

  return (
    <AuthPage
      config={brandConfig}
      mode="login"
      onSubmit={handleLogin}
    />
  );
}
```

**Alignment**: ✅ Thin route files
- Only select brand config
- Only handle form submission
- Only render shared UI
- No UI implementation
- No duplicated layout

---

## 🔐 BRAND-AGNOSTIC TOKEN STRUCTURE

### **Current Token Payload**

```typescript
export type TokenPayload = JWTPayload & {
  userId: string;
  originalUserId?: string;
  shadowUserId?: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
  tokenType?: 'user' | 'admin';
  brand?: string;  // ✅ Brand identity in token
  role?: string;
  platforms?: Array<'realtutorialhub' | 'skillup'>;  // ✅ Multi-brand support
  subscriptions?: string[];
  portalIdentity?: 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';
};
```

**Alignment**: ✅ Brand-agnostic
- Brand identity in token claims
- Multi-brand support via `platforms` array
- No hardcoded brand values

### **Brand Resolution**

**File**: `packages/auth/src/brand-resolver.ts` (NEW)

```typescript
/**
 * Brand-agnostic brand resolution
 * Centralizes brand detection logic
 */
export class BrandResolver {
  private static readonly HOSTNAME_MAP: Record<string, 'realtutorialhub' | 'skillup'> = {
    'realtutorialhub.com': 'realtutorialhub',
    'notes.realtutorialhub.com': 'realtutorialhub',
    'quiz.realtutorialhub.com': 'realtutorialhub',
    'admin.realtutorialhub.com': 'realtutorialhub',
    'skillupitacademy.com': 'skillup',
    'app.skillupitacademy.com': 'skillup',
    'admin.skillupitacademy.com': 'skillup',
    'localhost:3003': 'realtutorialhub',
    'localhost:3004': 'skillup',
  };

  static fromHostname(hostname: string): 'realtutorialhub' | 'skillup' {
    return this.HOSTNAME_MAP[hostname] ?? 'realtutorialhub';
  }

  static fromToken(payload: TokenPayload): 'realtutorialhub' | 'skillup' {
    return (payload.brand as 'realtutorialhub' | 'skillup') ?? 'realtutorialhub';
  }

  static fromRequest(request: NextRequest): 'realtutorialhub' | 'skillup' {
    return this.fromHostname(request.nextUrl.hostname);
  }
}
```

**Usage**:
```typescript
// In SkillHubCore auth service
const brand = BrandResolver.fromHostname(request.hostname);

// In proxy middleware
const brand = BrandResolver.fromRequest(request);

// From token
const brand = BrandResolver.fromToken(payload);
```

**Alignment**: ✅ Centralized brand resolution
- One source of truth
- No scattered brand detection
- Easy to maintain

---

## 📊 BRAND-AGNOSTIC AUTH COMPONENTS

### **Component Hierarchy**

```
src/share-branding/
├── auth/
│   ├── authViewData.ts          ✅ Option 3: Shared data model
│   ├── authMapper.ts            ✅ Option 4: API boundary
│   ├── authLoader.ts            ✅ Option 4: Data loader
│   └── components/
│       ├── AuthPage.tsx         ✅ Option 2: Shared UI
│       ├── LoginForm.tsx        ✅ Option 2: Shared UI
│       ├── RegisterForm.tsx     ✅ Option 2: Shared UI
│       └── AuthGuard.tsx        ✅ Option 2: Shared UI
├── brandConfig.ts               ✅ Brand identity source
└── ...

packages/auth/
├── src/
│   ├── token.service.ts         ✅ Shared token service
│   ├── brand-resolver.ts        ✅ Centralized brand resolution
│   └── index.ts
└── ...

apps/realtutorialhub-web/
└── src/app/login/page.tsx       ✅ Thin route consumer

apps/skillup-web/
└── src/app/login/page.tsx       ✅ Thin route consumer
```

---

## ✅ ALIGNMENT CHECKLIST

### **Option 2: Brand-Agnostic Architecture**

- [x] One shared TokenService for both brands
- [x] One shared AuthPage UI for both brands
- [x] One shared proxy middleware pattern
- [x] No brand-specific branching in shared auth code
- [x] Brand identity from `brandConfig.ts`
- [x] Brand identity from token claims
- [ ] Centralized brand resolution (BrandResolver)
- [ ] Auth routes moved to SkillHubCore

### **Option 3: Shared UI-Facing Data Model**

- [ ] AuthViewData defined
- [ ] LoginFormData defined
- [ ] RegisterFormData defined
- [ ] UI components receive prepared data
- [ ] No raw token payload in UI

### **Option 4: Explicit API Boundary**

- [ ] authMapper.ts created
- [ ] mapTokenToAuthViewData() implemented
- [ ] mapLoginFormToApiRequest() implemented
- [ ] authLoader.ts created
- [ ] loadAuthData() implemented
- [ ] Route files use loaders

### **Thin Route Files**

- [x] Login routes are thin
- [x] Register routes are thin
- [ ] Dashboard routes are thin
- [ ] All routes use shared UI
- [ ] No duplicated layout trees

---

## 🚀 IMPLEMENTATION PLAN

### **Phase 1: Create Shared Auth Data Model (1 day)**

1. Create `src/share-branding/auth/authViewData.ts`
2. Define `AuthViewData`, `LoginFormData`, `RegisterFormData`
3. Document the data model

### **Phase 2: Create API Boundary (1 day)**

1. Create `src/share-branding/auth/authMapper.ts`
2. Implement `mapTokenToAuthViewData()`
3. Implement `mapLoginFormToApiRequest()`
4. Implement `mapRegisterFormToApiRequest()`

### **Phase 3: Create Auth Loader (1 day)**

1. Create `src/share-branding/auth/authLoader.ts`
2. Implement `loadAuthData()`
3. Implement `loadAdminAuthData()`

### **Phase 4: Create Brand Resolver (1 day)**

1. Create `packages/auth/src/brand-resolver.ts`
2. Implement `BrandResolver` class
3. Update all brand resolution to use BrandResolver

### **Phase 5: Update Route Files (2 days)**

1. Update all login routes to use loaders
2. Update all register routes to use loaders
3. Update all dashboard routes to use loaders
4. Ensure all routes are thin

### **Phase 6: Move Auth to SkillHubCore (3 days)**

1. Move login route to SkillHubCore
2. Move register route to SkillHubCore
3. Move refresh route to SkillHubCore
4. Update all apps to call SkillHubCore

---

## 📋 DELIVERABLES

For auth to be fully aligned with the brand-agnostic pattern:

1. ✅ Shared TokenService (`@quiz/auth`)
2. ✅ Shared AuthPage UI (`src/share-branding/AuthPage.tsx`)
3. [ ] Shared auth data model (`authViewData.ts`)
4. [ ] API boundary mapper (`authMapper.ts`)
5. [ ] Auth loader (`authLoader.ts`)
6. [ ] Brand resolver (`brand-resolver.ts`)
7. [ ] Thin route consumers in both apps
8. [ ] Auth routes in SkillHubCore
9. [ ] Documentation updated

---

## 🎯 FINAL RULE

For authentication and authorization:

- **Auth implementation should be one** (SkillHubCore)
- **Auth data model should be one** (AuthViewData)
- **API boundary pattern should be one** (authMapper + authLoader)

Only the following should vary:

- Brand config (colors, labels, logos)
- Route metadata (redirect URLs)
- Actual user data (name, email, roles)

**This is the approved architecture standard for auth.**

---

**Document Version**: 1.0  
**Last Updated**: April 13, 2026  
**Alignment**: SHARED_UI_BRAND_AND_DATA_IMPLEMENTATION_GUIDE.md
