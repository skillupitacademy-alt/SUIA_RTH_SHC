# AI Prompt Templates - Quick Reference

## How to Use This File

Copy-paste these prompts to your AI assistant, replacing `[PHASE_NUMBER]` with the current phase you're working on.

---

## 🎯 Phase 1: Foundation - Database Setup

### Prompt 1A: Create RTH Database Package

```
I'm implementing the multi-brand authentication architecture for a monorepo project.

REFERENCE FILES (read these first):
1. .kiro/specs/multi-brand-auth-architecture/design.md - Section "Data Models" and "Database Connection Configuration"
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 2.1 and 2.2
3. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md - Repository Pattern and Database sections
4. packages/db/src/index.ts - Existing database pattern to follow

TASK: Create packages/db-rth - Database package for RTH brand

REQUIREMENTS:
- Create Drizzle ORM schema for rth_prod database
- Tables: users, user_profiles, roles, user_roles, auth_audit_log
- All tables must have deleted_at column for soft deletes
- Connection config: pooled (db), direct (dbDirect), readonly (dbReadOnly)
- Statement timeout: 30000ms
- Create withTimeout utility wrapper
- Follow existing packages/db pattern

DELIVERABLES:
1. packages/db-rth/package.json
2. packages/db-rth/tsconfig.json
3. packages/db-rth/drizzle.config.ts
4. packages/db-rth/src/index.ts
5. packages/db-rth/src/schema/users.ts
6. packages/db-rth/src/schema/userProfiles.ts
7. packages/db-rth/src/schema/roles.ts
8. packages/db-rth/src/schema/userRoles.ts
9. packages/db-rth/src/schema/authAuditLog.ts
10. packages/db-rth/src/utils/withTimeout.ts

VALIDATION: After creation, run `cd packages/db-rth && pnpm build` - should compile without errors.
```

---

### Prompt 1B: Create SkillUp Database Package

```
REFERENCE FILES:
1. packages/db-rth/src/index.ts - Pattern to replicate
2. .kiro/specs/multi-brand-auth-architecture/design.md - SkillUp Database section
3. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 2.3 and 2.4

TASK: Create packages/db-skillup - Database package for SkillUp brand

REQUIREMENTS:
- Copy structure from packages/db-rth
- Use DATABASE_URL_SKILLUP environment variable
- Add SkillUp-specific tables: faculty, batches
- Follow same FAANG compliance patterns

DELIVERABLES: Same as db-rth plus:
- packages/db-skillup/src/schema/faculty.ts
- packages/db-skillup/src/schema/batches.ts
```

---

### Prompt 1C: Update people_prod Database

```
REFERENCE FILES:
1. packages/db-people/src/schema/users.ts - Existing file to modify
2. .kiro/specs/multi-brand-auth-architecture/design.md - People Database section
3. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 2.5

TASK: Update people_prod database to support shadow users

REQUIREMENTS:
- Add external_id column (TEXT NOT NULL)
- Add external_brand column (TEXT NOT NULL, 'rth' | 'skillup')
- Add UNIQUE constraint on (external_id, external_brand)
- Create sso_sessions table
- Create migration SQL file

DELIVERABLES:
1. Updated packages/db-people/src/schema/users.ts
2. New packages/db-people/src/schema/ssoSessions.ts
3. Migration packages/db-people/migrations/0001_add_external_id.sql
```

---

### Prompt 1D: Create Identity Bridge Package

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "User Identity Bridge Service Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 4.1, 4.2, 4.3
3. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
4. packages/db-people/src/index.ts

TASK: Create packages/identity-bridge - Shadow user management service

REQUIREMENTS:
- Create UserIdentityBridgeService class
- Method: syncUser(input: SyncUserInput): Promise<SyncUserResult>
  - Upsert shadow user in people_prod
  - Return shadowUserId and created flag
- Method: getShadowUserId(externalId, externalBrand): Promise<string | null>
- Method: grantPlatformAccess(shadowUserId, platform): Promise<void>
- Use dependency injection (constructor injection)
- Add Pino structured logging
- Wrap operations with withSpan for OpenTelemetry
- Use withTimeout for all database queries
- Write unit tests with 90%+ coverage

DELIVERABLES:
1. packages/identity-bridge/package.json
2. packages/identity-bridge/tsconfig.json
3. packages/identity-bridge/src/index.ts
4. packages/identity-bridge/src/UserIdentityBridgeService.ts
5. packages/identity-bridge/src/types.ts
6. packages/identity-bridge/src/utils/logger.ts
7. packages/identity-bridge/src/utils/telemetry.ts
8. packages/identity-bridge/tests/UserIdentityBridgeService.test.ts

VALIDATION: Run `cd packages/identity-bridge && pnpm test -- --coverage` - must be 90%+
```

---

## 🎯 Phase 2: Shared Auth Utilities

### Prompt 2A: Create Shared Types and DTOs

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "DTOs" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 3.1, 3.2, 3.3
3. packages/types/src/index.ts - Existing types structure

TASK: Create user DTOs, repository interfaces, and error types

REQUIREMENTS:
- Create Zod schemas for: UserDTO, CreateUserDTO, UpdateUserDTO, LoginRequestDTO, AuthResultDTO
- Create IUserRepository interface with methods: findById, findByEmail, create, update, softDelete, findAll
- Create auth error classes: AuthError (base), InvalidCredentialsError, UserBlockedError, TokenExpiredError, InvalidTokenError, UserNotFoundError, DuplicateUserError, RateLimitError, DatabaseError
- All errors should have: code, statusCode, details properties
- Export all from packages/types

DELIVERABLES:
1. packages/types/src/dtos/user.dto.ts
2. packages/types/src/repositories/IUserRepository.ts
3. packages/types/src/errors/AuthErrors.ts
4. Updated packages/types/src/index.ts (add exports)
5. packages/types/tests/dtos/user.dto.test.ts
```

---

### Prompt 2B: Create Token and Password Services

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "Token Service Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 5.1, 5.4
3. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create TokenService and PasswordService in packages/auth

REQUIREMENTS:
TokenService:
- generateAccessToken(payload): JWT with 15m expiry, brand claim
- generateRefreshToken(payload): JWT with 7d expiry
- generateSkillHubToken(payload): JWT with 24h expiry
- verifyBrandToken(token, brand): Verify with brand-specific validation
- verifySkillHubToken(token): Verify SkillHub session token
- Use jsonwebtoken library with issuer/audience claims

PasswordService:
- hash(password): bcrypt with 10 salt rounds
- verify(password, hash): Compare password with hash

Both services:
- Use dependency injection
- Add structured logging (no PII)
- Write unit tests with 90%+ coverage

DELIVERABLES:
1. packages/auth/package.json
2. packages/auth/tsconfig.json
3. packages/auth/src/index.ts
4. packages/auth/src/TokenService.ts
5. packages/auth/src/PasswordService.ts
6. packages/auth/src/types.ts
7. packages/auth/tests/TokenService.test.ts
8. packages/auth/tests/PasswordService.test.ts
```

---

### Prompt 2C: Create Logging and Telemetry Utilities

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - Logging section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 19
3. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create logging and telemetry utilities

REQUIREMENTS:
Logger (Pino):
- Configure with correlation ID support
- Implement PII redaction (passwords, tokens, full emails)
- Log levels: info, warn, error
- Export singleton logger instance

Telemetry (OpenTelemetry):
- Create withSpan helper function
- Configure GCP Cloud Trace exporter
- Add span attributes: userId, shadowUserId, brand, action
- Record exceptions on errors

DELIVERABLES:
1. packages/auth/src/utils/logger.ts
2. packages/auth/src/utils/telemetry.ts
3. packages/auth/tests/utils/logger.test.ts
```

---

## 🎯 Phase 3: RTH Auth Service

### Prompt 3A: Create RTH Repository Layer

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "Repository Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 6.1, 6.2, 6.3
3. packages/types/src/repositories/IUserRepository.ts
4. packages/db-rth/src/index.ts
5. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create DrizzleUserRepository for RTH Auth Service

REQUIREMENTS:
- Implement IUserRepository interface
- Methods: findById, findByEmail, create, update, softDelete, findAll
- Helper methods: getUserRoles, assignRole
- Use withTimeout for all queries (STANDARD_QUERY_TIMEOUT)
- Filter WHERE deleted_at IS NULL on all queries
- Return UserDTO objects (never raw Drizzle rows)
- Use dependency injection (inject database connection)
- Write unit tests with 90%+ coverage
- Write property test for brand isolation

DELIVERABLES:
1. services/rth-auth-service/package.json
2. services/rth-auth-service/tsconfig.json
3. services/rth-auth-service/src/repositories/DrizzleUserRepository.ts
4. services/rth-auth-service/tests/repositories/DrizzleUserRepository.test.ts
5. services/rth-auth-service/tests/properties/brand-isolation.property.test.ts
```

---

### Prompt 3B: Create RTH Auth Service Logic

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "RTH Auth Service Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 7.1, 7.2, 7.3
3. packages/identity-bridge/src/UserIdentityBridgeService.ts
4. packages/auth/src/TokenService.ts
5. packages/auth/src/PasswordService.ts
6. docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create RthAuthService - Core authentication logic

REQUIREMENTS:
- Method: login(credentials, ip, userAgent): Promise<AuthResultDTO>
  1. Find user by email
  2. Check if blocked
  3. Verify password
  4. Sync to people_prod via Identity Bridge
  5. Generate JWT tokens with brand="realtutorialhub"
  6. Update last_active_at
  7. Log to auth_audit_log
  
- Method: register(data, ip, userAgent): Promise<AuthResultDTO>
  1. Check if user exists
  2. Hash password
  3. Create user in rth_prod
  4. Sync to people_prod
  5. Generate tokens
  6. Log registration

- Methods: logout, forgotPassword, resetPassword
- Use dependency injection for all dependencies
- Wrap operations with withSpan
- Add structured logging for all actions
- Write unit tests with 90%+ coverage
- Write property test for shadow user sync

DELIVERABLES:
1. services/rth-auth-service/src/services/RthAuthService.ts
2. services/rth-auth-service/tests/services/RthAuthService.test.ts
3. services/rth-auth-service/tests/properties/shadow-user-sync.property.test.ts
```

---

### Prompt 3C: Create RTH API Routes

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "API Gateway Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 8.1, 8.2
3. services/rth-auth-service/src/services/RthAuthService.ts

TASK: Create RTH Auth API with Hono framework

REQUIREMENTS:
- Create Hono app with middleware: CORS, request ID, error handler
- Routes:
  - POST /auth/register (Zod validation, rate limit: 10/hour)
  - POST /auth/login (Zod validation, rate limit: 5/min)
  - POST /auth/logout
  - POST /auth/forgot-password (rate limit: 3/hour)
  - POST /auth/reset-password
  - POST /auth/refresh
- Set cookies with Domain=.realtutorialhub.com, HttpOnly, Secure, SameSite=Lax
- Return consistent error format
- Add health check endpoint GET /health
- Write integration tests

DELIVERABLES:
1. services/rth-auth-service/src/index.ts
2. services/rth-auth-service/src/middleware/errorHandler.ts
3. services/rth-auth-service/src/middleware/requestId.ts
4. services/rth-auth-service/src/middleware/rateLimiter.ts
5. services/rth-auth-service/src/di/container.ts
6. services/rth-auth-service/tests/integration/auth-api.test.ts
```

---

### Prompt 3D: Create RTH Deployment Configuration

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - Deployment section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 35.1, 35.4

TASK: Create Dockerfile and deployment scripts for RTH Auth Service

REQUIREMENTS:
Dockerfile:
- Base: Node.js 20 Alpine
- Install dependencies with pnpm
- Build TypeScript to JavaScript
- Expose port 8080
- Health check: /health endpoint

Deployment script:
- Deploy to GCP Cloud Run
- Region: asia-south1 (Mumbai)
- Min instances: 1, Max instances: 10
- Memory: 512Mi, CPU: 1
- Add environment variables from secrets

DELIVERABLES:
1. services/rth-auth-service/Dockerfile
2. services/rth-auth-service/.dockerignore
3. scripts/deploy-rth-auth.sh
4. services/rth-auth-service/.env.example
```

---

## 🎯 Phase 4: SkillUp Auth Service

### Prompt 4: Create SkillUp Auth Service (Replicate RTH)

```
REFERENCE FILES:
1. services/rth-auth-service/ - Complete structure to replicate
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 9, 10, 11
3. packages/db-skillup/src/index.ts

TASK: Create SkillUp Auth Service (replicate RTH pattern)

REQUIREMENTS:
- Copy entire structure from services/rth-auth-service
- Change database connection to skillup_prod
- Change JWT brand claim to "skillup"
- Change cookie domain to .skillupitacademy.com
- Add DrizzleFacultyRepository for faculty management
- Update all references from "rth" to "skillup"
- Keep same FAANG compliance patterns
- Write same tests (unit, integration, property)

DELIVERABLES:
Complete services/skillup-auth-service package with same structure as rth-auth-service, plus:
- src/repositories/DrizzleFacultyRepository.ts
- tests/repositories/DrizzleFacultyRepository.test.ts
```

---

## 🎯 Phase 5: SkillHub Auth Validator

### Prompt 5: Create SkillHub Auth Validator

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "SkillHub Auth Validator Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 13, 14
3. packages/identity-bridge/src/UserIdentityBridgeService.ts
4. packages/auth/src/TokenService.ts

TASK: Create SkillHub Auth Validator service

REQUIREMENTS:
- Create SkillHubAuthValidator class
- Method: validateBrandToken(token, brand): Promise<ValidationResult>
  1. Verify JWT signature with brand-specific key
  2. Extract shadowUserId from token
  3. Verify shadow user exists in people_prod
  4. Generate SkillHub session token
  5. Store SSO session in people_prod
  
- Method: verifySkillHubToken(token): Promise<SkillHubTokenPayload>
- Use dependency injection
- Add structured logging and OpenTelemetry
- Create Hono API with POST /validate endpoint
- Write unit tests and property tests

DELIVERABLES:
1. services/skillhub-auth-validator/package.json
2. services/skillhub-auth-validator/src/SkillHubAuthValidator.ts
3. services/skillhub-auth-validator/src/index.ts
4. services/skillhub-auth-validator/tests/SkillHubAuthValidator.test.ts
5. services/skillhub-auth-validator/tests/properties/token-validation.property.test.ts
6. services/skillhub-auth-validator/Dockerfile
```

---

## 🎯 Phase 6: API Gateways

### Prompt 6A: Create RTH API Gateway

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "API Gateway Implementation" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Tasks 15, 18

TASK: Create RTH API Gateway (Cloudflare Worker with Hono)

REQUIREMENTS:
- Route /auth/* to RTH Auth Service
- Route /* to SkillHub API with x-brand: realtutorialhub header
- Add CORS for: user.realtutorialhub.com, admin.realtutorialhub.com
- Add rate limiting: AUTH tier (5/min), GENERAL tier (60/min)
- Rewrite Set-Cookie headers to Domain=.realtutorialhub.com
- Add request ID middleware
- Use Upstash Redis for rate limiting
- Write unit tests and property tests

DELIVERABLES:
1. services/api-gateway-rth/package.json
2. services/api-gateway-rth/wrangler.toml
3. services/api-gateway-rth/src/index.ts
4. services/api-gateway-rth/src/middleware/rateLimiter.ts
5. services/api-gateway-rth/src/middleware/requestId.ts
6. services/api-gateway-rth/tests/index.test.ts
7. services/api-gateway-rth/tests/properties/routing.property.test.ts
```

---

### Prompt 6B: Create SkillUp API Gateway

```
REFERENCE FILES:
1. services/api-gateway-rth/ - Pattern to replicate
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 16

TASK: Create SkillUp API Gateway (replicate RTH pattern)

REQUIREMENTS:
- Copy structure from api-gateway-rth
- Route /auth/* to SkillUp Auth Service
- Change x-brand header to "skillup"
- Change cookie domain to .skillupitacademy.com
- Update CORS for SkillUp domains: user.skillupitacademy.com, admin.skillupitacademy.com, faculty.skillupitacademy.com

DELIVERABLES: Same structure as api-gateway-rth
```

---

### Prompt 6C: Create SkillHub API Gateway

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - "SkillHub API Gateway" section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 17

TASK: Create SkillHub API Gateway

REQUIREMENTS:
- POST /auth/validate endpoint (calls SkillHub Auth Validator)
- Route /quiz/* to Quiz Service
- Route /exam/* to Quiz Service
- Route /tutorial/* to Tutorial Service
- Route /placement/* to Placement Service
- Add auth middleware to extract shadowUserId from SkillHub token
- Add x-shadow-user-id and x-brand headers to all proxied requests
- Set cookies for .skillhubcore.in domain
- Add CORS for SkillHub domains

DELIVERABLES:
1. services/api-gateway-skillhub/package.json
2. services/api-gateway-skillhub/wrangler.toml
3. services/api-gateway-skillhub/src/index.ts
4. services/api-gateway-skillhub/src/middleware/auth.ts
5. services/api-gateway-skillhub/tests/index.test.ts
```

---

## 🎯 Phase 7: Frontend Updates

### Prompt 7A: Update RTH User Portal

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - Frontend section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 20
3. apps/realtutorialhub-web/src/app/login/page.tsx

TASK: Update RTH User Portal authentication

REQUIREMENTS:
- Update login page to use fixed portalIdentity='user' and brand='realtutorialhub'
- Remove hostname-derived portal identity logic
- Update API base URL to https://api.realtutorialhub.com
- Implement cross-domain redirect to SkillHub after login
- Create /auth/callback route to handle SkillHub redirects
- Pass accessToken and brand in redirect URL to quiz.skillhubcore.in

DELIVERABLES:
1. Updated apps/realtutorialhub-web/src/app/login/page.tsx
2. Updated apps/realtutorialhub-web/src/lib/auth.ts
3. New apps/realtutorialhub-web/src/app/auth/callback/route.ts
4. Updated apps/realtutorialhub-web/src/app/dashboard/page.tsx
```

---

### Prompt 7B: Update SkillUp User Portal

```
REFERENCE FILES:
1. apps/realtutorialhub-web/ - Pattern to replicate
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 21

TASK: Update SkillUp User Portal authentication

REQUIREMENTS:
- Same as RTH but with brand='skillup'
- API base URL: https://api.skillupitacademy.com
- Cookie domain: .skillupitacademy.com
- Redirect to quiz.skillhubcore.in with brand=skillup

DELIVERABLES: Same structure as RTH portal updates
```

---

## 🎯 Phase 8: Shared Services Updates

### Prompt 8: Update Quiz Service for Multi-Brand

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/design.md - Shared Services section
2. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 23
3. packages/auth/src/TokenService.ts

TASK: Update Quiz service for multi-brand support

REQUIREMENTS:
- Create auth middleware to extract shadowUserId from SkillHub token
- Update all database queries to use shadowUserId instead of brand-specific user ID
- Extract brand from x-brand header
- Implement brand-specific UI customization (logo, colors, tagline)
- Create getBrandTheme utility in packages/ui
- Add structured logging with shadowUserId and brand
- Write property test for shadow user ID consistency

DELIVERABLES:
1. apps/skillhub-quiz/src/middleware/auth.ts
2. Updated database queries to use shadowUserId
3. packages/ui/src/utils/brandTheme.ts
4. apps/skillhub-quiz/tests/properties/shadow-user-consistency.property.test.ts
```

---

## 🎯 Phase 9: Testing and Deployment

### Prompt 9A: Create E2E Tests

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 41

TASK: Create E2E tests for complete user journeys

REQUIREMENTS:
Test 1: RTH user journey
- Register on user.realtutorialhub.com
- Login and receive RTH cookies
- Click "Take Quiz" and redirect to quiz.skillhubcore.in
- Validate token and set SkillHub cookies
- Access quiz with shadow user ID
- Access tutorial with same shadow user ID

Test 2: SkillUp user journey (same flow with SkillUp brand)

Test 3: Brand isolation
- RTH user cannot access SkillUp data
- RTH cookies don't work on SkillUp domains

Use Playwright or Cypress

DELIVERABLES:
1. tests/e2e/rth-user-journey.spec.ts
2. tests/e2e/skillup-user-journey.spec.ts
3. tests/e2e/brand-isolation.spec.ts
```

---

### Prompt 9B: Create Load Tests

```
REFERENCE FILES:
1. .kiro/specs/multi-brand-auth-architecture/tasks.md - Task 42

TASK: Create k6 load tests

REQUIREMENTS:
Test 1: RTH Auth Service
- 100 concurrent registrations
- 500 concurrent logins
- Stages: Smoke (10 VUs × 1 min), Load (100 VUs × 5 min), Stress (500 VUs × 5 min)
- Thresholds: p(95) < 500ms, failure rate < 0.5%

Test 2: Cross-domain auth flow
- 1000 concurrent users accessing shared services
- Thresholds: p(95) < 1000ms

Test 3: Identity Bridge
- 1000 concurrent user syncs
- Measure syncUser latency (should be < 100ms p(95))

DELIVERABLES:
1. tests/load/rth-auth-flow.k6.js
2. tests/load/cross-domain-auth.k6.js
3. tests/load/identity-bridge.k6.js
```

---

## Quick Copy-Paste Checklist

Before starting each phase, copy-paste this checklist:

```
✅ Phase 1: Foundation
  ✅ 1A: RTH Database Package
  ✅ 1B: SkillUp Database Package
  ✅ 1C: Update people_prod
  ✅ 1D: Identity Bridge Package

✅ Phase 2: Shared Utilities
  ✅ 2A: Types and DTOs
  ✅ 2B: Token and Password Services
  ✅ 2C: Logging and Telemetry

✅ Phase 3: RTH Auth Service
  ✅ 3A: Repository Layer
  ✅ 3B: Service Logic
  ✅ 3C: API Routes
  ✅ 3D: Deployment Config

✅ Phase 4: SkillUp Auth Service
  ✅ 4: Complete Service (replicate RTH)

✅ Phase 5: SkillHub Auth Validator
  ✅ 5: Validator Service

✅ Phase 6: API Gateways
  ✅ 6A: RTH Gateway
  ✅ 6B: SkillUp Gateway
  ✅ 6C: SkillHub Gateway

✅ Phase 7: Frontend Updates
  ✅ 7A: RTH User Portal
  ✅ 7B: SkillUp User Portal

✅ Phase 8: Shared Services
  ✅ 8: Quiz Service Updates

✅ Phase 9: Testing & Deployment
  ✅ 9A: E2E Tests
  ✅ 9B: Load Tests
  ✅ 9C: Deploy All Services
```

---

## Validation Commands

After each phase, run these commands:

```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Check coverage (must be 90%+)
pnpm test -- --coverage

# Lint
pnpm lint
```

---

## Emergency Rollback

If something goes wrong:

```bash
# Rollback database migrations
cd packages/db-rth
pnpm db:rollback

# Rollback GCP Cloud Run deployment
gcloud run services update rth-auth-service --image=<previous-image>

# Rollback Cloudflare Worker
cd services/api-gateway-rth
wrangler rollback
```
