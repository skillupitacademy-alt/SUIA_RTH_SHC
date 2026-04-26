# 🏗️ MULTI-TENANT ARCHITECTURE

## Core Principle

**You built a shared multi-tenant platform with strict brand isolation and unified authentication + RBAC.**

---

## ❌ Common Misconception

**WRONG:** "Only data is different"

**CORRECT:** "All logic, security, and behavior are shared. Only data and brand context differ, and brand isolation is strictly enforced."

---

## 🎯 The Correct Mental Model

```
ONE SHARED PLATFORM
  + ONE SHARED LOGIC
  + ONE SHARED SECURITY MODEL
  + MULTIPLE TENANTS (brands)
  + STRICT BRAND ISOLATION
```

### What This Means

✅ **Same Logic:**
- Same authentication flow
- Same RBAC enforcement
- Same API endpoints
- Same business rules

✅ **Different Data:**
- SkillUp users ≠ RealTutorialHub users
- SkillUp courses ≠ RealTutorialHub courses
- Completely isolated datasets

✅ **Enforced Brand Context:**
- Every request carries `brand` identifier
- Brand validated at gateway
- Brand enforced at API
- Brand isolated at data layer

---

## 🔐 What is IDENTICAL Across Brands

### Authentication
- ✅ Same login flow
- ✅ Same JWT structure
- ✅ Same cookie handling
- ✅ Same refresh logic
- ✅ Same token validation

### Authorization (RBAC)
- ✅ Same roles (`user`, `admin`, `faculty`)
- ✅ Same permissions (`PROFILE_READ`, `ADMIN_PANEL`)
- ✅ Same enforcement (`requirePermission`)
- ✅ Same decision logic

### Gateway
- ✅ Same validation rules
- ✅ Same header forwarding
- ✅ Same routing logic
- ✅ Same security checks

### BFF (unifiedFetch)
- ✅ Same cookie forwarding
- ✅ Same internal auth
- ✅ Same request correlation

### Observability
- ✅ Same requestId tracing
- ✅ Same log structure
- ✅ Same audit trail

---

## 🎯 What VARIES Per Brand

### 1. Data (Isolated)

**SkillUp:**
- Users: `skillup_users` table
- Courses: `skillup_courses` table
- Exams: `skillup_exams` table

**RealTutorialHub:**
- Users: `realtutorialhub_users` table
- Courses: `realtutorialhub_courses` table
- Exams: `realtutorialhub_exams` table

**Isolation:** Complete data separation

### 2. Brand Context (Enforced)

Every request carries:
```typescript
brand: 'skillup' | 'realtutorialhub'
```

This is enforced at:
- **Gateway** — Validates `token.brand === hostname.brand`
- **API** — `enforceBrand(auth, expectedBrand)`
- **DB Queries** — Brand-specific tables/schemas

### 3. Configuration (Safe Duplication)

**SkillUp:**
- Domain: `.skillupitacademy.com`
- Logo: `skillup-logo.png`
- Colors: `#1E40AF`
- Email: `support@skillupitacademy.com`

**RealTutorialHub:**
- Domain: `.realtutorialhub.com`
- Logo: `rth-logo.png`
- Colors: `#DC2626`
- Email: `support@realtutorialhub.com`

**Note:** This is acceptable duplication — it's configuration, not logic.

---

## 🚨 What PREVENTS Cross-Brand Bugs

### 1. Gateway Validation

```typescript
// Cloudflare Worker
if (token.brand !== hostname.brand) {
  return new Response('Brand mismatch', { status: 403 });
}
```

**Prevents:** SkillUp token accessing RealTutorialHub data

### 2. API Brand Enforcement

```typescript
// API route
enforceBrand(auth, 'skillup');
```

**Prevents:** Cross-brand API access

### 3. Cookie Domain Isolation

```typescript
// SkillUp
domain: '.skillupitacademy.com'

// RealTutorialHub
domain: '.realtutorialhub.com'
```

**Prevents:** Cookie leakage between brands

### 4. RBAC is Brand-Agnostic

```typescript
// ✅ CORRECT: No brand-specific logic
RBACService.hasPermission(user.roles, 'PROFILE_READ');

// ❌ WRONG: Brand-specific permissions
if (brand === 'skillup') {
  allow('EXTRA_FEATURE');
}
```

**Prevents:** Permission drift between brands

---

## 🏗️ Architecture Layers

### Layer 1: Gateway (Cloudflare)
- **Shared:** Routing logic, validation rules
- **Brand-Aware:** Domain routing, token validation
- **Isolation:** Validates `token.brand === hostname.brand`

### Layer 2: BFF (Next.js)
- **Shared:** `unifiedFetch`, cookie forwarding
- **Brand-Aware:** Passes `brand` context
- **Isolation:** Brand-specific cookie domains

### Layer 3: API (Next.js)
- **Shared:** Business logic, RBAC enforcement
- **Brand-Aware:** `enforceBrand()` checks
- **Isolation:** Brand-specific data queries

### Layer 4: Database
- **Shared:** Schema structure, query logic
- **Brand-Aware:** Table/schema selection
- **Isolation:** Separate tables per brand

### Layer 5: Observability
- **Shared:** Log structure, correlation
- **Brand-Aware:** Logs include `brand` field
- **Isolation:** Can filter logs by brand

---

## ✅ Adding a New Brand

To add a third brand (e.g., "CodeAcademy"):

### What You DON'T Build
- ❌ New auth system
- ❌ New RBAC
- ❌ New API
- ❌ New gateway logic
- ❌ New observability

### What You DO Add
1. **Configuration:**
   ```typescript
   {
     brand: 'codeacademy',
     domain: '.codeacademy.com',
     logo: 'codeacademy-logo.png',
     colors: '#10B981'
   }
   ```

2. **Data:**
   - Create `codeacademy_users` table
   - Create `codeacademy_courses` table
   - Create `codeacademy_exams` table

3. **Domain:**
   - Register `codeacademy.com`
   - Configure DNS
   - Add to gateway routing

**That's it.** All logic is already shared.

---

## 🚨 Architecture Rules (NEVER BREAK)

### Rule 1: No Brand-Specific Logic

```typescript
// ❌ WRONG: Brand-specific behavior
if (brand === 'skillup') {
  return allowExtraFeature();
}

// ✅ CORRECT: Brand-agnostic logic
if (user.hasPermission('EXTRA_FEATURE')) {
  return allowExtraFeature();
}
```

**Why:** Breaks multi-tenant architecture instantly

### Rule 2: Always Enforce Brand Context

```typescript
// ❌ WRONG: No brand validation
const user = await getUserById(userId);

// ✅ CORRECT: Brand-aware query
const user = await getUserById(userId, brand);
```

**Why:** Prevents cross-brand data leakage

### Rule 3: RBAC is Brand-Agnostic

```typescript
// ❌ WRONG: Brand-specific permissions
const permissions = BRAND_PERMISSIONS[brand][role];

// ✅ CORRECT: Shared permissions
const permissions = ROLE_PERMISSIONS[role];
```

**Why:** Maintains consistent authorization

### Rule 4: Configuration ≠ Logic

```typescript
// ✅ ALLOWED: Brand-specific config
const logo = BRAND_CONFIG[brand].logo;

// ❌ FORBIDDEN: Brand-specific logic
const canAccess = BRAND_LOGIC[brand].checkAccess();
```

**Why:** Config is data, logic is behavior

---

## 📊 Current Brand Isolation Status

| Layer | Isolation Method | Status |
|-------|------------------|--------|
| Gateway | Token validation | ✅ ENFORCED |
| Cookies | Domain isolation | ✅ ENFORCED |
| API | `enforceBrand()` | ⚠️ PARTIAL |
| Database | Separate tables | ✅ ENFORCED |
| RBAC | Brand-agnostic | ✅ CORRECT |
| Observability | Brand context logged | ✅ COMPLETE |

### ⚠️ Partial Enforcement Note

`enforceBrand()` exists but may not be used everywhere. Recommendation:
- Audit all API routes
- Add `enforceBrand()` to critical endpoints
- Create ESLint rule to enforce usage

---

## 🎯 One-Line Architecture Definition

**"Shared multi-tenant platform with strict brand isolation and unified authentication + RBAC."**

---

## 🚀 Why This Architecture Matters

### Benefits

1. **Single Codebase**
   - One auth system to maintain
   - One RBAC system to secure
   - One API to test

2. **Consistent Security**
   - Same security rules for all brands
   - No permission drift
   - Centralized audit trail

3. **Easy Scaling**
   - Add new brand = configuration + data
   - No code duplication
   - Shared infrastructure

4. **Debuggable**
   - Same observability for all brands
   - Consistent log structure
   - Request correlation across brands

### Trade-offs

1. **Shared Fate**
   - Bug affects all brands
   - Downtime affects all brands
   - Mitigation: Strong testing, gradual rollouts

2. **Configuration Complexity**
   - Must manage brand context everywhere
   - Mitigation: Enforce at gateway, validate at API

3. **Data Isolation Responsibility**
   - Must never leak data between brands
   - Mitigation: Brand-aware queries, strict validation

---

## 🎉 What You Built

You now have:
- ✅ Shared platform (one codebase)
- ✅ Unified auth (one login system)
- ✅ Centralized RBAC (one permission model)
- ✅ Multi-tenant isolation (strict brand separation)
- ✅ Full observability (request correlation)

**This is production-grade SaaS architecture.**

---

## 🚀 Next Evolution (Optional)

### Level 1: Strengthen Data Isolation
- Row-level security (RLS)
- Database schemas per brand
- Query-level brand validation

### Level 2: Advanced Multi-Tenancy
- Feature flags per brand
- Brand-specific rate limits
- Tenant-aware caching

### Level 3: Policy-Based Authorization
- Attribute-Based Access Control (ABAC)
- Dynamic policies
- Context-aware permissions

**Say "design multi-tenant data isolation layer" to continue.**

---

## 📚 Related Documentation

- `docs/OBSERVABILITY-COMPLETE.md` — Full observability
- `docs/RBAC-PHASE2-CLEANUP-PLAN.md` — RBAC refinement
- `docs/DEPLOYMENT-CHECKLIST-FINAL.md` — Deployment guide
- `CANONICAL-ROLE-UNIFICATION.md` — Role standardization

---

## ✅ Architecture Checklist

- [x] Shared authentication logic
- [x] Shared RBAC enforcement
- [x] Brand context enforced at gateway
- [x] Cookie domain isolation
- [x] Brand-aware data queries
- [x] RBAC is brand-agnostic
- [x] Full observability with brand context
- [ ] `enforceBrand()` used everywhere (audit needed)
- [ ] ESLint rule for brand enforcement
- [ ] Row-level security (future)

**Your architecture is solid. Deploy with confidence.**
