# Multi-Brand Authentication Architecture - Implementation Guide

## Overview

This guide provides the exact sequence, files to reference, and AI prompts for implementing the multi-brand authentication architecture. Follow phases in order for smooth implementation.

## Reference Files (Always Include These)

When giving prompts to your AI, always include these reference files:

### Core Architecture Documents
1. `.kiro/specs/multi-brand-auth-architecture/requirements.md` - What we're building
2. `.kiro/specs/multi-brand-auth-architecture/design.md` - How to build it
3. `.kiro/specs/multi-brand-auth-architecture/tasks.md` - Implementation tasks
4. `docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md` - Coding standards

### Existing Code References (for context)
5. `packages/db/src/index.ts` - Existing database pattern to follow
6. `packages/types/src/index.ts` - Existing types structure
7. `apps/api-server/src/index.ts` - Existing API structure (if applicable)

---

## Phase 1: Foundation (Database & Identity Bridge)

**Goal**: Set up databases and the Identity Bridge that connects brands to shared services.

### Step 1.1: Create Database Schemas

**AI Prompt Template**:
```
I'm implementing Phase 1 of the multi-brand authentication architecture.

CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Data Models section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Tasks 1-2)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- packages/db/src/index.ts (existing pattern to follow)

TASK: Create database package for RTH brand (packages/db-rth)

REQUIREMENTS:
1. Create packages/db-rth/src/schema/users.ts with users table
2. Create packages/db-rth/src/schema/userProfiles.ts
3. Create packages/db-rth/src/schema/roles.ts
4. Create packages/db-rth/src/schema/authAuditLog.ts
5. Create packages/db-rth/src/index.ts with db connection (pooled, direct, readonly)
6. Add soft delete (deleted_at) to all tables
7. Follow FAANG compliance: statement_timeout: 30000, withTimeout utility
8. Create drizzle.config.ts
9. Create package.json with dependencies

OUTPUT: Complete file structure for packages/db-rth
```

**Files to Create**:
- `packages/db-rth/package.json`
- `packages/db-rth/tsconfig.json`
- `packages/db-rth/drizzle.config.ts`
- `packages/db-rth/src/index.ts`
- `packages/db-rth/src/schema/users.ts`
- `packages/db-rth/src/schema/userProfiles.ts`
- `packages/db-rth/src/schema/roles.ts`
- `packages/db-rth/src/schema/userRoles.ts`
- `packages/db-rth/src/schema/authAuditLog.ts`
- `packages/db-rth/src/utils/withTimeout.ts`

**Validation**: Run `cd packages/db-rth && pnpm build` - should compile without errors

---

### Step 1.2: Create SkillUp Database Package

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Data Models section)
- packages/db-rth/src/index.ts (pattern to replicate)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 2.3)

TASK: Create database package for SkillUp brand (packages/db-skillup)

REQUIREMENTS:
1. Copy structure from packages/db-rth
2. Add SkillUp-specific tables: faculty.ts, batches.ts
3. Use DATABASE_URL_SKILLUP environment variable
4. Follow same FAANG compliance patterns

OUTPUT: Complete file structure for packages/db-skillup
```

**Files to Create**: Same as db-rth plus:
- `packages/db-skillup/src/schema/faculty.ts`
- `packages/db-skillup/src/schema/batches.ts`

---

### Step 1.3: Update people_prod Database

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (People Database section)
- packages/db-people/src/schema/users.ts (existing file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 2.5)

TASK: Update people_prod database to support shadow users

REQUIREMENTS:
1. Add external_id column to users table
2. Add external_brand column ('rth' | 'skillup')
3. Add unique constraint on (external_id, external_brand)
4. Create sso_sessions table
5. Create migration file

OUTPUT: 
- Updated packages/db-people/src/schema/users.ts
- New packages/db-people/src/schema/ssoSessions.ts
- Migration file packages/db-people/migrations/0001_add_external_id.sql
```

**Files to Modify**:
- `packages/db-people/src/schema/users.ts`

**Files to Create**:
- `packages/db-people/src/schema/ssoSessions.ts`
- `packages/db-people/migrations/0001_add_external_id.sql`

---

### Step 1.4: Create Identity Bridge Package

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (User Identity Bridge section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 4)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
- packages/db-people/src/index.ts

TASK: Create Identity Bridge package (packages/identity-bridge)

REQUIREMENTS:
1. Create UserIdentityBridgeService class
2. Implement syncUser(input: SyncUserInput): Promise<SyncUserResult>
3. Implement getShadowUserId(externalId, externalBrand): Promise<string | null>
4. Implement grantPlatformAccess(shadowUserId, platform): Promise<void>
5. Use dependency injection (no static methods)
6. Add structured logging with Pino
7. Wrap operations with withSpan for OpenTelemetry
8. Use withTimeout for all database queries

OUTPUT: Complete packages/identity-bridge package
```

**Files to Create**:
- `packages/identity-bridge/package.json`
- `packages/identity-bridge/tsconfig.json`
- `packages/identity-bridge/src/index.ts`
- `packages/identity-bridge/src/UserIdentityBridgeService.ts`
- `packages/identity-bridge/src/types.ts`
- `packages/identity-bridge/src/utils/logger.ts`
- `packages/identity-bridge/src/utils/telemetry.ts`

**Validation**: 
```bash
cd packages/identity-bridge
pnpm build
pnpm test  # Should have 90%+ coverage
```

---

## Phase 2: Shared Services (Auth Utilities)

**Goal**: Create reusable authentication utilities used by all auth services.

### Step 2.1: Create Shared Types and DTOs

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (DTOs section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 3)
- packages/types/src/index.ts (existing types structure)

TASK: Create user DTOs and repository interfaces

REQUIREMENTS:
1. Create UserDTO, CreateUserDTO, UpdateUserDTO with Zod schemas
2. Create LoginRequestDTO, AuthResultDTO with Zod schemas
3. Create IUserRepository interface
4. Create auth error types (InvalidCredentialsError, UserBlockedError, etc.)
5. Export all from packages/types/src/dtos/user.dto.ts
6. Export all from packages/types/src/repositories/IUserRepository.ts
7. Export all from packages/types/src/errors/AuthErrors.ts

OUTPUT: Updated packages/types with new DTOs and interfaces
```

**Files to Create**:
- `packages/types/src/dtos/user.dto.ts`
- `packages/types/src/repositories/IUserRepository.ts`
- `packages/types/src/errors/AuthErrors.ts`

**Files to Modify**:
- `packages/types/src/index.ts` (add exports)

---

### Step 2.2: Create Token Service

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Token Service section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 5.1)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create TokenService in packages/auth

REQUIREMENTS:
1. Create TokenService class with dependency injection
2. Implement generateAccessToken(payload: AccessTokenPayload): Promise<string>
3. Implement generateRefreshToken(payload: RefreshTokenPayload): Promise<string>
4. Implement generateSkillHubToken(payload: SkillHubTokenPayload): Promise<string>
5. Implement verifyBrandToken(token, brand): Promise<AccessTokenPayload>
6. Implement verifySkillHubToken(token): Promise<SkillHubTokenPayload>
7. Use jsonwebtoken library with proper issuer/audience claims
8. Add structured logging

OUTPUT: packages/auth/src/TokenService.ts
```

**Files to Create**:
- `packages/auth/package.json`
- `packages/auth/tsconfig.json`
- `packages/auth/src/index.ts`
- `packages/auth/src/TokenService.ts`
- `packages/auth/src/PasswordService.ts`
- `packages/auth/src/types.ts`

---

### Step 2.3: Create Logging and Telemetry Utilities

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Logging section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 19)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create logging and telemetry utilities

REQUIREMENTS:
1. Create Pino logger with correlation ID support
2. Implement PII redaction (passwords, tokens, emails)
3. Create withSpan helper for OpenTelemetry
4. Configure GCP Cloud Trace exporter

OUTPUT: 
- packages/auth/src/utils/logger.ts
- packages/auth/src/utils/telemetry.ts
```

**Files to Create**:
- `packages/auth/src/utils/logger.ts`
- `packages/auth/src/utils/telemetry.ts`

---

## Phase 3: RTH Auth Service

**Goal**: Build complete authentication service for RTH brand.

### Step 3.1: Create RTH Repository Layer

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Repository Implementation section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 6)
- packages/types/src/repositories/IUserRepository.ts
- packages/db-rth/src/index.ts
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create DrizzleUserRepository for RTH

REQUIREMENTS:
1. Implement IUserRepository interface
2. Implement findById, findByEmail, create, update, softDelete, findAll
3. Use withTimeout for all queries
4. Filter WHERE deleted_at IS NULL
5. Return UserDTO objects (never raw Drizzle rows)
6. Implement getUserRoles and assignRole helpers
7. Use dependency injection

OUTPUT: services/rth-auth-service/src/repositories/DrizzleUserRepository.ts
```

**Files to Create**:
- `services/rth-auth-service/package.json`
- `services/rth-auth-service/tsconfig.json`
- `services/rth-auth-service/src/repositories/DrizzleUserRepository.ts`

---

### Step 3.2: Create RTH Auth Service Logic

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (RTH Auth Service Implementation)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 7)
- packages/identity-bridge/src/UserIdentityBridgeService.ts
- packages/auth/src/TokenService.ts
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md

TASK: Create RthAuthService

REQUIREMENTS:
1. Implement login(credentials, ip, userAgent): Promise<AuthResultDTO>
2. Implement register(data, ip, userAgent): Promise<AuthResultDTO>
3. Implement logout, forgotPassword, resetPassword methods
4. Use dependency injection for all dependencies
5. Wrap operations with withSpan
6. Add structured logging for all auth actions
7. Log to auth_audit_log table
8. Sync users to people_prod via Identity Bridge

OUTPUT: services/rth-auth-service/src/services/RthAuthService.ts
```

**Files to Create**:
- `services/rth-auth-service/src/services/RthAuthService.ts`

---

### Step 3.3: Create RTH API Routes

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (API Routes section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 8)
- services/rth-auth-service/src/services/RthAuthService.ts

TASK: Create RTH Auth API with Hono

REQUIREMENTS:
1. Create Hono app with CORS, request ID, error handler middleware
2. Implement POST /auth/register with Zod validation
3. Implement POST /auth/login with Zod validation
4. Implement POST /auth/logout
5. Implement POST /auth/forgot-password
6. Implement POST /auth/reset-password
7. Add rate limiting: login (5/min), register (10/hour)
8. Set cookies with Domain=.realtutorialhub.com

OUTPUT: services/rth-auth-service/src/index.ts
```

**Files to Create**:
- `services/rth-auth-service/src/index.ts`
- `services/rth-auth-service/src/middleware/errorHandler.ts`
- `services/rth-auth-service/src/middleware/requestId.ts`
- `services/rth-auth-service/src/di/container.ts`

---

### Step 3.4: Create RTH Deployment Configuration

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Deployment section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 35)

TASK: Create Dockerfile and deployment scripts for RTH Auth Service

REQUIREMENTS:
1. Create Dockerfile with Node.js 20 Alpine
2. Expose port 8080 for GCP Cloud Run
3. Add health check endpoint /health
4. Create deployment script for GCP Cloud Run (asia-south1)

OUTPUT:
- services/rth-auth-service/Dockerfile
- scripts/deploy-rth-auth.sh
```

**Files to Create**:
- `services/rth-auth-service/Dockerfile`
- `services/rth-auth-service/.dockerignore`
- `scripts/deploy-rth-auth.sh`

---

## Phase 4: SkillUp Auth Service

**Goal**: Build authentication service for SkillUp brand (similar to RTH).

### Step 4.1: Create SkillUp Auth Service

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- services/rth-auth-service/src/services/RthAuthService.ts (pattern to replicate)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Tasks 9-11)
- packages/db-skillup/src/index.ts

TASK: Create SkillUp Auth Service (replicate RTH pattern)

REQUIREMENTS:
1. Copy structure from services/rth-auth-service
2. Change database connection to skillup_prod
3. Change JWT brand claim to "skillup"
4. Change cookie domain to .skillupitacademy.com
5. Add faculty repository and management

OUTPUT: Complete services/skillup-auth-service package
```

**Files to Create**: Same structure as rth-auth-service:
- `services/skillup-auth-service/package.json`
- `services/skillup-auth-service/src/repositories/DrizzleUserRepository.ts`
- `services/skillup-auth-service/src/repositories/DrizzleFacultyRepository.ts`
- `services/skillup-auth-service/src/services/SkillUpAuthService.ts`
- `services/skillup-auth-service/src/index.ts`
- `services/skillup-auth-service/Dockerfile`

---

## Phase 5: SkillHub Auth Validator

**Goal**: Build cross-domain token validator for shared services.

### Step 5.1: Create SkillHub Auth Validator

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (SkillHub Auth Validator section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Tasks 13-14)
- packages/identity-bridge/src/UserIdentityBridgeService.ts
- packages/auth/src/TokenService.ts

TASK: Create SkillHub Auth Validator service

REQUIREMENTS:
1. Create SkillHubAuthValidator class
2. Implement validateBrandToken(token, brand): Promise<ValidationResult>
3. Implement verifySkillHubToken(token): Promise<SkillHubTokenPayload>
4. Create SSO sessions in people_prod
5. Generate SkillHub tokens for shared services
6. Add structured logging and OpenTelemetry

OUTPUT: services/skillhub-auth-validator package
```

**Files to Create**:
- `services/skillhub-auth-validator/package.json`
- `services/skillhub-auth-validator/src/SkillHubAuthValidator.ts`
- `services/skillhub-auth-validator/src/index.ts`
- `services/skillhub-auth-validator/Dockerfile`

---

## Phase 6: API Gateways (Cloudflare Workers)

**Goal**: Create API gateways for routing and rate limiting.

### Step 6.1: Create RTH API Gateway

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (API Gateway Implementation)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 15)

TASK: Create RTH API Gateway (Cloudflare Worker with Hono)

REQUIREMENTS:
1. Route /auth/* to RTH Auth Service
2. Route /* to SkillHub API with x-brand: realtutorialhub
3. Add CORS for RTH domains
4. Add rate limiting middleware
5. Rewrite cookies to Domain=.realtutorialhub.com
6. Add request ID middleware

OUTPUT: services/api-gateway-rth package
```

**Files to Create**:
- `services/api-gateway-rth/package.json`
- `services/api-gateway-rth/wrangler.toml`
- `services/api-gateway-rth/src/index.ts`
- `services/api-gateway-rth/src/middleware/rateLimiter.ts`

---

### Step 6.2: Create SkillUp API Gateway

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- services/api-gateway-rth/src/index.ts (pattern to replicate)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 16)

TASK: Create SkillUp API Gateway (replicate RTH pattern)

REQUIREMENTS:
1. Copy structure from api-gateway-rth
2. Route /auth/* to SkillUp Auth Service
3. Change x-brand header to "skillup"
4. Change cookie domain to .skillupitacademy.com
5. Update CORS for SkillUp domains

OUTPUT: services/api-gateway-skillup package
```

**Files to Create**: Same structure as api-gateway-rth

---

### Step 6.3: Create SkillHub API Gateway

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (SkillHub Gateway section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 17)

TASK: Create SkillHub API Gateway

REQUIREMENTS:
1. Implement POST /auth/validate (calls SkillHub Auth Validator)
2. Route /quiz/* to Quiz Service
3. Route /tutorial/* to Tutorial Service
4. Route /placement/* to Placement Service
5. Add auth middleware to extract shadowUserId
6. Add x-shadow-user-id and x-brand headers to proxied requests
7. Set cookies for .skillhubcore.in

OUTPUT: services/api-gateway-skillhub package
```

**Files to Create**:
- `services/api-gateway-skillhub/package.json`
- `services/api-gateway-skillhub/wrangler.toml`
- `services/api-gateway-skillhub/src/index.ts`
- `services/api-gateway-skillhub/src/middleware/auth.ts`

---

## Phase 7: Frontend Updates

**Goal**: Update frontend apps to use new auth services.

### Step 7.1: Update RTH User Portal

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Frontend section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 20)
- apps/realtutorialhub-web/src/app/login/page.tsx (existing login page)

TASK: Update RTH User Portal authentication

REQUIREMENTS:
1. Update login page to use fixed portalIdentity='user' and brand='realtutorialhub'
2. Remove hostname-derived portal identity logic
3. Update API base URL to https://api.realtutorialhub.com
4. Implement cross-domain redirect to SkillHub after login
5. Pass accessToken and brand in redirect URL

OUTPUT: Updated apps/realtutorialhub-web login flow
```

**Files to Modify**:
- `apps/realtutorialhub-web/src/app/login/page.tsx`
- `apps/realtutorialhub-web/src/lib/auth.ts`
- `apps/realtutorialhub-web/src/app/dashboard/page.tsx`

**Files to Create**:
- `apps/realtutorialhub-web/src/app/auth/callback/route.ts`

---

### Step 7.2: Update SkillUp User Portal

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- apps/realtutorialhub-web/src/app/login/page.tsx (pattern to replicate)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 21)

TASK: Update SkillUp User Portal authentication

REQUIREMENTS:
1. Same as RTH but with brand='skillup'
2. API base URL: https://api.skillupitacademy.com
3. Cookie domain: .skillupitacademy.com

OUTPUT: Updated apps/skillup-web login flow
```

**Files to Modify**: Similar to RTH portal

---

## Phase 8: Shared Services Updates

**Goal**: Update shared services to use shadow user IDs.

### Step 8.1: Update Quiz Service

**AI Prompt Template**:
```
CONTEXT FILES TO READ:
- .kiro/specs/multi-brand-auth-architecture/design.md (Shared Services section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 23)
- apps/skillhub-quiz/src/middleware/auth.ts (if exists)

TASK: Update Quiz service for multi-brand support

REQUIREMENTS:
1. Create auth middleware to extract shadowUserId from SkillHub token
2. Update all database queries to use shadowUserId
3. Extract brand from x-brand header
4. Implement brand-specific UI customization
5. Add structured logging with shadowUserId and brand

OUTPUT: Updated quiz service with shadow user support
```

**Files to Modify**:
- Quiz service auth middleware
- Quiz service database queries

**Files to Create**:
- `apps/skillhub-quiz/src/middleware/auth.ts`
- `packages/ui/src/utils/brandTheme.ts`

---

## Phase 9: Testing and Deployment

### Step 9.1: Run All Tests

**Commands**:
```bash
# Run all unit tests
pnpm test

# Run property-based tests
pnpm test:properties

# Check coverage (must be 90%+)
pnpm test -- --coverage

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

---

### Step 9.2: Deploy Services

**Deployment Sequence**:

1. **Deploy Databases**:
```bash
# Run migrations
cd services/rth-auth-service
pnpm db:migrate

cd ../skillup-auth-service
pnpm db:migrate

cd ../../packages/db-people
pnpm db:migrate
```

2. **Deploy Backend Services** (GCP Cloud Run):
```bash
./scripts/deploy-rth-auth.sh
./scripts/deploy-skillup-auth.sh
./scripts/deploy-skillhub-validator.sh
```

3. **Deploy API Gateways** (Cloudflare Workers):
```bash
cd services/api-gateway-rth
pnpm deploy

cd ../api-gateway-skillup
pnpm deploy

cd ../api-gateway-skillhub
pnpm deploy
```

4. **Deploy Frontend Apps** (GCP Cloud Run):
```bash
# Deploy updated frontends
./scripts/deploy-rth-user.sh
./scripts/deploy-skillup-user.sh
```

5. **Configure DNS** (Cloudflare):
- Follow Task 36 in tasks.md
- Add CNAME records for all subdomains
- Enable SSL/TLS Full (strict)

---

## Quick Reference: File Dependencies

### When Creating RTH Auth Service, You Need:
```
✅ packages/db-rth (database)
✅ packages/identity-bridge (shadow users)
✅ packages/auth (tokens, passwords)
✅ packages/types (DTOs, interfaces)
```

### When Creating SkillUp Auth Service, You Need:
```
✅ packages/db-skillup (database)
✅ packages/identity-bridge (shadow users)
✅ packages/auth (tokens, passwords)
✅ packages/types (DTOs, interfaces)
```

### When Creating SkillHub Auth Validator, You Need:
```
✅ packages/db-people (shadow users)
✅ packages/identity-bridge (user sync)
✅ packages/auth (token verification)
```

### When Creating API Gateways, You Need:
```
✅ All backend services deployed
✅ Environment variables configured
✅ Upstash Redis for rate limiting
```

---

## Environment Variables Checklist

Create `.env.local` files with these variables:

### RTH Auth Service:
```env
DATABASE_URL_RTH=postgresql://...
DATABASE_DIRECT_URL_RTH=postgresql://...
DATABASE_URL_PEOPLE=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_SKILLHUB_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
OTEL_EXPORTER_OTLP_ENDPOINT=...
```

### SkillUp Auth Service:
```env
DATABASE_URL_SKILLUP=postgresql://...
DATABASE_DIRECT_URL_SKILLUP=postgresql://...
DATABASE_URL_PEOPLE=postgresql://...
# ... same JWT and Redis variables
```

### API Gateways (wrangler.toml):
```toml
[vars]
RTH_AUTH_SERVICE_URL = "https://rth-auth-service-xxx.run.app"
SKILLHUB_API_URL = "https://api.skillhubcore.in"
COOKIE_DOMAIN = ".realtutorialhub.com"
BRAND = "realtutorialhub"
```

---

## Summary: Implementation Order

1. ✅ **Phase 1**: Databases & Identity Bridge (Foundation)
2. ✅ **Phase 2**: Shared Auth Utilities (Reusable code)
3. ✅ **Phase 3**: RTH Auth Service (First brand)
4. ✅ **Phase 4**: SkillUp Auth Service (Second brand)
5. ✅ **Phase 5**: SkillHub Auth Validator (Cross-domain)
6. ✅ **Phase 6**: API Gateways (Routing layer)
7. ✅ **Phase 7**: Frontend Updates (User-facing)
8. ✅ **Phase 8**: Shared Services Updates (Quiz, Tutorial, Placement)
9. ✅ **Phase 9**: Testing & Deployment (Go live)

**Estimated Timeline**: 3-4 weeks for full implementation with testing.

---

## Tips for AI Prompts

### ✅ DO:
- Always reference the design.md file
- Always reference FAANG compliance document
- Specify exact file paths to create
- Ask for complete implementations with tests
- Request validation commands

### ❌ DON'T:
- Skip the foundation (Phase 1)
- Try to implement multiple phases at once
- Forget to include reference files in prompts
- Skip tests (90%+ coverage required)
- Deploy without running tests

---

## Need Help?

If you get stuck at any phase:
1. Check the design.md for detailed implementation guidance
2. Check the tasks.md for specific requirements
3. Look at existing packages for patterns to follow
4. Run tests to validate your implementation

Good luck with implementation! 🚀
