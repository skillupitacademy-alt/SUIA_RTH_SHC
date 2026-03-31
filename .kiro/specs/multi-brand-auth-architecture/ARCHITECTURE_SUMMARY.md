# Multi-Brand Authentication Architecture - Summary

## Your Architecture Vision

### Brand Portals (Authentication & Identity)
```
RTH Brand:
  user.realtutorialhub.com     → RTH User Portal (login, profile, dashboard)
  admin.realtutorialhub.com    → RTH Admin Portal
  api.realtutorialhub.com      → RTH Auth API

SkillUp Brand:
  user.skillupitacademy.com    → SkillUp User Portal (login, profile, dashboard)
  admin.skillupitacademy.com   → SkillUp Admin Portal
  faculty.skillupitacademy.com → SkillUp Faculty Portal
  api.skillupitacademy.com     → SkillUp Auth API
```

### Shared Services (Functional Features)
```
SkillHub Core:
  quiz.skillhubcore.in         → Shared Quiz/Exam Engine
  tutorial.skillhubcore.in     → Shared Tutorial Engine
  placement.skillhubcore.in    → Shared Placement Service
  api.skillhubcore.in          → SkillHub Services API
  admin.skillhubcore.in        → SkillHub Super Admin
```

## Why This Architecture Works

### 1. Clear Separation of Concerns
- **Brand domains** = User identity, authentication, brand-specific features
- **SkillHub domain** = Shared functional services used by both brands

### 2. Cookie Domain Strategy
- RTH users get cookies for `.realtutorialhub.com` (works on user.*, admin.*)
- SkillUp users get cookies for `.skillupitacademy.com` (works on user.*, admin.*, faculty.*)
- SkillHub services use cookies for `.skillhubcore.in` (works on quiz.*, tutorial.*, placement.*)

### 3. Cross-Domain Authentication Flow
```
1. User logs in on brand portal (user.realtutorialhub.com)
   ↓
2. Brand API validates credentials against brand database
   ↓
3. Brand API returns JWT token + sets brand cookies
   ↓
4. User redirected to SkillHub service (quiz.skillhubcore.in) with token
   ↓
5. SkillHub validates token, syncs user to people_prod
   ↓
6. SkillHub sets its own cookies for .skillhubcore.in
   ↓
7. User can now access all SkillHub services (quiz, tutorial, placement)
```

### 4. Database Strategy
```
rth_prod          → RTH user accounts
skillup_prod      → SkillUp user accounts
people_prod       → Shadow users (identity bridge for shared services)
quiz_platform_prod → Shared exam/quiz data
tutorial_prod     → Shared tutorial content
placement_prod    → Shared placement data
payment_prod      → Shared payment data
```

## User Journey Examples

### RTH User Journey
```
1. Visit user.realtutorialhub.com
2. Login with RTH credentials
3. See RTH-branded dashboard
4. Click "Take Quiz" → Redirected to quiz.skillhubcore.in
5. Quiz interface shows RTH branding
6. Quiz progress saved with shadow user ID
7. Click "Learn Tutorial" → Redirected to tutorial.skillhubcore.in
8. Tutorial interface shows RTH branding
9. Tutorial progress saved with same shadow user ID
10. All services recognize user as same person
```

### SkillUp User Journey
```
1. Visit user.skillupitacademy.com
2. Login with SkillUp credentials
3. See SkillUp-branded dashboard
4. Click "Take Quiz" → Redirected to quiz.skillhubcore.in
5. Quiz interface shows SkillUp branding
6. Quiz progress saved with shadow user ID
7. Click "Learn Tutorial" → Redirected to tutorial.skillhubcore.in
8. Tutorial interface shows SkillUp branding
9. Tutorial progress saved with same shadow user ID
10. All services recognize user as same person
```

## Technical Implementation

### Authentication Flow (Detailed)

#### Step 1: Brand Login
```typescript
// user.realtutorialhub.com/login
POST https://api.realtutorialhub.com/auth/login
Headers: {
  'x-portal-identity': 'user',
  'x-brand': 'realtutorialhub'
}
Body: { email, password }

Response: {
  user: { id, email, name },
  accessToken: 'jwt-token-here',
  refreshToken: 'refresh-token-here'
}

Cookies Set:
  - accessToken (domain: .realtutorialhub.com)
  - refreshToken (domain: .realtutorialhub.com)
```

#### Step 2: Redirect to SkillHub
```typescript
// user.realtutorialhub.com redirects to:
window.location.href = 'https://quiz.skillhubcore.in/auth/callback?token=jwt-token-here&brand=realtutorialhub';
```

#### Step 3: SkillHub Token Validation
```typescript
// quiz.skillhubcore.in/auth/callback
POST https://api.skillhubcore.in/auth/validate
Headers: {
  'Authorization': 'Bearer jwt-token-here',
  'x-brand': 'realtutorialhub'
}

Response: {
  shadowUserId: 'uuid-in-people-prod',
  skillhubToken: 'skillhub-jwt-token'
}

Cookies Set:
  - skillhub_accessToken (domain: .skillhubcore.in)
  - skillhub_refreshToken (domain: .skillhubcore.in)
```

#### Step 4: Access Shared Services
```typescript
// quiz.skillhubcore.in, tutorial.skillhubcore.in, placement.skillhubcore.in
// All use same .skillhubcore.in cookies

GET https://api.skillhubcore.in/quiz/my-exams
Headers: {
  'x-brand': 'realtutorialhub'
}
Cookies: skillhub_accessToken

// API extracts shadowUserId from token
// Queries quiz_platform_prod with shadowUserId
// Returns user's exams
```

### Brand-Specific UI Customization
```typescript
// All SkillHub services detect brand and customize UI
const brand = getBrandFromToken(); // 'realtutorialhub' or 'skillup'

if (brand === 'realtutorialhub') {
  // Show RTH logo, colors, branding
  primaryColor = '#FF2D55';
  logo = '/logos/rth-logo.svg';
  tagline = 'AI-Powered Learning';
} else {
  // Show SkillUp logo, colors, branding
  primaryColor = '#4F46E5';
  logo = '/logos/skillup-logo.svg';
  tagline = 'Expert-Led Training';
}
```

## Cloudflare Configuration

### RTH Zone (realtutorialhub.com)
```
DNS Records:
  user.realtutorialhub.com     → CNAME to GCP Cloud Run (RTH User Portal)
  admin.realtutorialhub.com    → CNAME to GCP Cloud Run (RTH Admin Portal)
  api.realtutorialhub.com      → CNAME to Cloudflare Worker (RTH Auth Gateway)

Worker Routes:
  api.realtutorialhub.com/*    → RTH Auth Gateway Worker
```

### SkillUp Zone (skillupitacademy.com)
```
DNS Records:
  user.skillupitacademy.com    → CNAME to GCP Cloud Run (SkillUp User Portal)
  admin.skillupitacademy.com   → CNAME to GCP Cloud Run (SkillUp Admin Portal)
  faculty.skillupitacademy.com → CNAME to GCP Cloud Run (SkillUp Faculty Portal)
  api.skillupitacademy.com     → CNAME to Cloudflare Worker (SkillUp Auth Gateway)

Worker Routes:
  api.skillupitacademy.com/*   → SkillUp Auth Gateway Worker
```

### SkillHub Zone (skillhubcore.in)
```
DNS Records:
  quiz.skillhubcore.in         → CNAME to GCP Cloud Run (Quiz Service)
  tutorial.skillhubcore.in     → CNAME to GCP Cloud Run (Tutorial Service)
  placement.skillhubcore.in    → CNAME to GCP Cloud Run (Placement Service)
  api.skillhubcore.in          → CNAME to Cloudflare Worker (SkillHub Gateway)
  admin.skillhubcore.in        → CNAME to GCP Cloud Run (SkillHub Admin)

Worker Routes:
  api.skillhubcore.in/*        → SkillHub Gateway Worker
```

## GCP Cloud Run Services

### Brand-Specific Services
```
rth-user-portal              → user.realtutorialhub.com
rth-admin-portal             → admin.realtutorialhub.com
rth-auth-service             → Internal (called by RTH Gateway)

skillup-user-portal          → user.skillupitacademy.com
skillup-admin-portal         → admin.skillupitacademy.com
skillup-faculty-portal       → faculty.skillupitacademy.com
skillup-auth-service         → Internal (called by SkillUp Gateway)
```

### Shared Services
```
skillhub-quiz-service        → quiz.skillhubcore.in
skillhub-tutorial-service    → tutorial.skillhubcore.in
skillhub-placement-service   → placement.skillhubcore.in
skillhub-auth-validator      → Internal (called by SkillHub Gateway)
skillhub-admin-portal        → admin.skillhubcore.in
```

## Benefits of This Architecture

### ✅ Brand Isolation
- Each brand has its own user database
- Each brand has its own authentication
- Each brand can scale independently

### ✅ Shared Services
- Quiz, Tutorial, Placement work for both brands
- Single codebase for shared features
- Consistent user experience across brands

### ✅ Clear Cookie Domains
- Brand cookies work on brand subdomains
- SkillHub cookies work on SkillHub subdomains
- No cross-domain cookie issues

### ✅ Unified User Identity
- Shadow users in people_prod link brand users
- User progress tracked consistently
- Cross-service user recognition

### ✅ Maintainability
- Clear separation of brand vs shared code
- Easy to add new brands
- Easy to add new shared services

### ✅ SEO & Trust
- Brand-specific domains for user-facing portals
- Shared services on neutral domain
- Clear brand identity

## Migration Path

### Phase 1: Create New Databases
1. Create `rth_prod` database
2. Create `skillup_prod` database
3. Migrate users from `quiz_platform_prod`

### Phase 2: Create Brand Portals
1. Rename `apps/realtutorialhub-quiz` → `apps/realtutorialhub-user`
2. Rename `apps/skillup-web` → `apps/skillup-user`
3. Update to use brand-specific auth APIs

### Phase 3: Create SkillHub Services
1. Create `apps/skillhub-quiz`
2. Create `apps/skillhub-tutorial`
3. Create `apps/skillhub-placement`
4. Implement cross-domain auth

### Phase 4: Deploy & Configure
1. Deploy new services to GCP
2. Configure Cloudflare DNS & Workers
3. Test cross-domain auth flow
4. Migrate users gradually

## Answer to Your Question

**Q: Should RTH users use user.realtutorialhub.com, SkillUp users use user.skillupitacademy.com, and both use quiz.skillhubcore.in, tutorial.skillhubcore.in?**

**A: YES! This is the correct architecture because:**

1. ✅ Users authenticate on their brand domain (maintains brand identity)
2. ✅ Shared services centralized on skillhubcore.in (single codebase, easier maintenance)
3. ✅ Clear cookie domain separation (no auth conflicts)
4. ✅ Scalable (easy to add new brands or services)
5. ✅ SEO-friendly (brand domains for user portals)
6. ✅ Cost-effective (shared services = less duplication)

**This is NOT just creating a new database - it requires:**
- New subdomain structure
- Cross-domain authentication
- User identity bridge
- Brand-specific gateways
- Shared service apps on skillhubcore.in
- Cloudflare & GCP reconfiguration
