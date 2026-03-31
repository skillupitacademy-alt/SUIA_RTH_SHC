# Implementation Plan: Multi-Brand Authentication Architecture

## Overview

This implementation plan creates a FAANG-grade multi-brand authentication architecture with brand isolation (separate databases for RTH and SkillUp), shared services on skillhubcore.in, and a User Identity Bridge pattern. All components follow Repository Pattern, Dependency Injection, DTOs, structured logging, OpenTelemetry, rate limiting, and 90%+ test coverage from day one.

## Architecture Components

- **RTH Auth Service**: Authentication for Real Tutorial Hub users (rth_prod database)
- **SkillUp Auth Service**: Authentication for SkillUp IT Academy users (skillup_prod database)
- **User Identity Bridge**: Shadow users in people_prod linking brand identities to shared services
- **SkillHub Auth Validator**: Cross-domain token validation for shared services
- **API Gateways**: Brand-specific gateways (RTH, SkillUp) and shared gateway (SkillHub)
- **Database Packages**: db-rth, db-skillup, db-people with Drizzle ORM

## Tasks

- [ ] 1. Database setup and schema creation
  - [ ] 1.1 Create rth_prod database with schema
    - Create users, user_profiles, roles, user_roles, auth_audit_log tables
    - Add soft delete columns (deleted_at) to all tables
    - Create indexes: idx_users_email, idx_users_deleted, idx_user_profiles_user_id, idx_auth_audit_log_user_id, idx_auth_audit_log_created_at
    - Seed default roles: USER, ADMIN, SUPER_ADMIN
    - _Requirements: TR-1.1, BR-1.1_

  - [ ] 1.2 Create skillup_prod database with schema
    - Create same tables as rth_prod (users, user_profiles, roles, user_roles, auth_audit_log)
    - Add SkillUp-specific tables: faculty, batches
    - Add soft delete columns (deleted_at) to all tables
    - Create indexes: idx_faculty_user_id, idx_faculty_status, idx_batches_status, idx_batches_start_date
    - Seed default roles: USER, ADMIN, SUPER_ADMIN, FACULTY
    - _Requirements: TR-1.2, BR-1.2_

  - [ ] 1.3 Update people_prod database schema
    - Add external_id and external_brand columns to users table
    - Create unique constraint on (external_id, external_brand)
    - Create sso_sessions table for SkillHub sessions
    - Create indexes: idx_users_external, idx_sso_sessions_user_id, idx_sso_sessions_token, idx_sso_sessions_expires_at
    - Add soft delete column (deleted_at) to users table
    - _Requirements: TR-1.3, TR-5.1_


- [ ] 2. Database packages with Drizzle ORM
  - [ ] 2.1 Implement packages/db-rth
    - Create Drizzle schema files for all rth_prod tables
    - Configure postgres connection with statement_timeout: 30000
    - Export db (pooled), dbDirect (migrations), dbReadOnly (analytics)
    - Create drizzle.config.ts with DATABASE_URL_RTH and DATABASE_DIRECT_URL_RTH
    - Implement withTimeout utility for query timeout enforcement
    - _Requirements: TR-1.1, NFR-1_

  - [ ]* 2.2 Write unit tests for packages/db-rth
    - Test connection configuration and timeout settings
    - Test schema definitions and relationships
    - _Requirements: TR-1.1_

  - [ ] 2.3 Implement packages/db-skillup
    - Create Drizzle schema files for all skillup_prod tables (including faculty, batches)
    - Configure postgres connection with statement_timeout: 30000
    - Export db (pooled), dbDirect (migrations), dbReadOnly (analytics)
    - Create drizzle.config.ts with DATABASE_URL_SKILLUP and DATABASE_DIRECT_URL_SKILLUP
    - Implement withTimeout utility for query timeout enforcement
    - _Requirements: TR-1.2, NFR-1_

  - [ ]* 2.4 Write unit tests for packages/db-skillup
    - Test connection configuration and timeout settings
    - Test schema definitions and relationships
    - _Requirements: TR-1.2_

  - [ ] 2.5 Update packages/db-people
    - Add external_id and external_brand columns to users schema
    - Create sso_sessions schema
    - Update drizzle.config.ts with DATABASE_URL_PEOPLE and DATABASE_DIRECT_URL_PEOPLE
    - Configure statement_timeout: 30000
    - _Requirements: TR-1.3, TR-5.1_

  - [ ]* 2.6 Write unit tests for packages/db-people updates
    - Test new schema definitions
    - Test unique constraint on (external_id, external_brand)
    - _Requirements: TR-1.3_


- [ ] 3. Shared types and DTOs
  - [ ] 3.1 Create user DTOs in packages/types
    - Implement UserDTO, CreateUserDTO, UpdateUserDTO with Zod schemas
    - Implement LoginRequestDTO, AuthResultDTO with Zod schemas
    - Implement UserFilters interface
    - Export all DTOs from packages/types/src/dtos/user.dto.ts
    - _Requirements: BR-3.3, NFR-3_

  - [ ] 3.2 Create repository interfaces in packages/types
    - Implement IUserRepository interface with all CRUD methods
    - Implement IShadowUserRepository interface for people_prod
    - Export interfaces from packages/types/src/repositories
    - _Requirements: NFR-3_

  - [ ] 3.3 Create auth error types in packages/types
    - Implement AuthError base class with code, statusCode, details
    - Implement specific errors: InvalidCredentialsError, UserBlockedError, TokenExpiredError, InvalidTokenError, UserNotFoundError, DuplicateUserError, RateLimitError, DatabaseError
    - Export all error types from packages/types/src/errors/AuthErrors.ts
    - _Requirements: BR-3.4_

  - [ ]* 3.4 Write unit tests for DTOs and error types
    - Test Zod schema validation for all DTOs
    - Test error class instantiation and properties
    - _Requirements: BR-3.3, BR-3.4_


- [ ] 4. User Identity Bridge package
  - [ ] 4.1 Implement UserIdentityBridgeService
    - Create packages/identity-bridge/src/UserIdentityBridgeService.ts
    - Implement syncUser method with upsert logic for shadow users
    - Implement getShadowUserId method for external_id lookup
    - Implement grantPlatformAccess method for platform_access table
    - Use withTimeout for all database queries (STANDARD_QUERY_TIMEOUT)
    - Add structured logging with Pino (action: identity.bridge.sync_user, identity.bridge.created, identity.bridge.updated)
    - Wrap all operations with withSpan for OpenTelemetry tracing
    - _Requirements: TR-5.1, BR-2.3, NFR-1_

  - [ ]* 4.2 Write property test for Identity Bridge
    - **Property 7: External ID Mapping Invariant**
    - **Validates: Requirements TR-5.2, CP-4**
    - Test that syncUser with same external_id + external_brand always returns same shadow user ID
    - Test that getShadowUserId is idempotent and deterministic
    - Use fast-check with 100 iterations

  - [ ]* 4.3 Write unit tests for UserIdentityBridgeService
    - Test syncUser creates new shadow user on first call
    - Test syncUser updates existing shadow user on subsequent calls
    - Test getShadowUserId returns correct shadow user ID
    - Test grantPlatformAccess creates platform_access record
    - Test error handling for database failures
    - Target: 90%+ coverage
    - _Requirements: TR-5.1_


- [ ] 5. Token and password services
  - [ ] 5.1 Implement TokenService in packages/auth
    - Implement generateAccessToken with brand claim and 15m expiry
    - Implement generateRefreshToken with 7d expiry
    - Implement generateSkillHubToken with 24h expiry
    - Implement verifyBrandToken with brand-specific validation
    - Implement verifySkillHubToken for SkillHub session validation
    - Use jsonwebtoken library with proper issuer and audience claims
    - _Requirements: BR-3.3, TR-4.1, TR-4.2_

  - [ ]* 5.2 Write property test for TokenService
    - **Property 6: JWT Structure Consistency**
    - **Validates: Requirements BR-3.3, NFR-3**
    - Test that all generated tokens contain required fields (userId/shadowUserId, email/brand, roles)
    - Test that tokens include brand claim
    - Use fast-check with 100 iterations

  - [ ]* 5.3 Write unit tests for TokenService
    - Test token generation with valid payloads
    - Test token verification with valid tokens
    - Test token verification fails with expired tokens
    - Test token verification fails with invalid signatures
    - Test token verification fails with wrong audience
    - Target: 90%+ coverage
    - _Requirements: BR-3.3_

  - [ ] 5.4 Implement PasswordService in packages/auth
    - Implement hash method using bcrypt with salt rounds 10
    - Implement verify method for password comparison
    - Add structured logging for password operations (no PII)
    - _Requirements: TR-4.1, TR-4.2, NFR-2_

  - [ ]* 5.5 Write unit tests for PasswordService
    - Test password hashing produces different hashes for same password
    - Test password verification succeeds with correct password
    - Test password verification fails with incorrect password
    - Target: 90%+ coverage
    - _Requirements: TR-4.1_


- [ ] 6. RTH Auth Service - Repository layer
  - [ ] 6.1 Implement DrizzleUserRepository for RTH
    - Create services/rth-auth-service/src/repositories/DrizzleUserRepository.ts
    - Implement IUserRepository interface
    - Implement findById, findByEmail, create, update, softDelete, findAll methods
    - Use withTimeout for all database queries
    - Implement getUserRoles and assignRole helper methods
    - All queries must filter WHERE deleted_at IS NULL
    - Return UserDTO objects (never raw Drizzle rows)
    - _Requirements: TR-4.1, BR-1.1, NFR-3_

  - [ ]* 6.2 Write property test for RTH UserRepository
    - **Property 1: Brand Database Isolation**
    - **Validates: Requirements BR-1.1, BR-1.2, BR-1.3, BR-1.4, CP-1, NFR-2**
    - Test that users created in RTH repository are not accessible from SkillUp repository
    - Use fast-check with 100 iterations

  - [ ]* 6.3 Write unit tests for DrizzleUserRepository
    - Test findById returns user with roles
    - Test findByEmail returns user (case-insensitive)
    - Test create assigns default USER role
    - Test update modifies user and returns updated DTO
    - Test softDelete sets deleted_at timestamp
    - Test findAll with filters (email, isBlocked, limit, offset)
    - Test queries exclude soft-deleted users
    - Mock database client with vi.mock
    - Target: 90%+ coverage
    - _Requirements: TR-4.1_


- [ ] 7. RTH Auth Service - Core authentication logic
  - [ ] 7.1 Implement RthAuthService
    - Create services/rth-auth-service/src/services/RthAuthService.ts
    - Implement login method with password validation and shadow user sync
    - Implement register method with password hashing and shadow user creation
    - Implement logout method with token revocation
    - Implement forgotPassword and resetPassword methods
    - Use dependency injection for all dependencies (userRepo, identityBridge, tokenService, passwordService)
    - Wrap all operations with withSpan for OpenTelemetry
    - Add structured logging for all auth actions (login.success, login.failed, register.success, etc.)
    - Log auth attempts to auth_audit_log table
    - _Requirements: TR-4.1, BR-1.1, BR-3.1, BR-3.2_

  - [ ]* 7.2 Write property test for RthAuthService
    - **Property 2: Shadow User Sync**
    - **Validates: Requirements TR-4.1, TR-4.2, TR-5.1**
    - Test that every authentication operation syncs user to people_prod
    - Test that shadow user is created with correct external_id, external_brand, platform
    - Use fast-check with 100 iterations

  - [ ]* 7.3 Write unit tests for RthAuthService
    - Test login with valid credentials returns tokens and shadow user ID
    - Test login with invalid credentials throws InvalidCredentialsError
    - Test login with blocked user throws UserBlockedError
    - Test register creates user and syncs to people_prod
    - Test register with duplicate email throws DuplicateUserError
    - Test logout revokes tokens
    - Test forgotPassword sends reset email
    - Test resetPassword updates password
    - Mock all dependencies (userRepo, identityBridge, tokenService, passwordService)
    - Target: 90%+ coverage
    - _Requirements: TR-4.1, BR-3.4_


- [ ] 8. RTH Auth Service - API routes and middleware
  - [ ] 8.1 Implement RTH Auth API routes with Hono
    - Create services/rth-auth-service/src/index.ts with Hono app
    - Implement POST /auth/register with Zod validation
    - Implement POST /auth/login with Zod validation
    - Implement POST /auth/logout
    - Implement POST /auth/forgot-password with Zod validation
    - Implement POST /auth/reset-password with Zod validation
    - Implement POST /auth/refresh with token rotation
    - Add rate limiting: login (5/min), register (10/hour), forgot-password (3/hour)
    - Add request ID middleware for correlation tracking
    - Add error handler middleware for consistent error responses
    - _Requirements: TR-4.1, BR-3.1, BR-3.2, NFR-2_

  - [ ]* 8.2 Write integration tests for RTH Auth API
    - Test full registration flow (POST /auth/register → 201 with tokens)
    - Test full login flow (POST /auth/login → 200 with tokens)
    - Test rate limiting (6th login in 1 min → 429)
    - Test Zod validation errors (invalid email → 400)
    - Test error responses have consistent format
    - _Requirements: TR-4.1, BR-3.4_


- [ ] 9. SkillUp Auth Service - Repository layer
  - [ ] 9.1 Implement DrizzleUserRepository for SkillUp
    - Create services/skillup-auth-service/src/repositories/DrizzleUserRepository.ts
    - Implement IUserRepository interface (same as RTH)
    - Implement findById, findByEmail, create, update, softDelete, findAll methods
    - Use withTimeout for all database queries
    - Implement getUserRoles and assignRole helper methods
    - All queries must filter WHERE deleted_at IS NULL
    - Return UserDTO objects (never raw Drizzle rows)
    - _Requirements: TR-4.2, BR-1.2, NFR-3_

  - [ ] 9.2 Implement DrizzleFacultyRepository for SkillUp
    - Create services/skillup-auth-service/src/repositories/DrizzleFacultyRepository.ts
    - Implement IFacultyRepository interface
    - Implement findById, findByUserId, create, update, softDelete methods
    - Use withTimeout for all database queries
    - All queries must filter WHERE deleted_at IS NULL
    - _Requirements: TR-1.2_

  - [ ]* 9.3 Write unit tests for SkillUp repositories
    - Test DrizzleUserRepository (same tests as RTH)
    - Test DrizzleFacultyRepository CRUD operations
    - Mock database client with vi.mock
    - Target: 90%+ coverage
    - _Requirements: TR-4.2, TR-1.2_


- [ ] 10. SkillUp Auth Service - Core authentication logic
  - [ ] 10.1 Implement SkillUpAuthService
    - Create services/skillup-auth-service/src/services/SkillUpAuthService.ts
    - Implement login method (same flow as RTH but with skillup_prod database)
    - Implement register method with password hashing and shadow user creation
    - Implement logout method with token revocation
    - Implement forgotPassword and resetPassword methods
    - Use dependency injection for all dependencies
    - Wrap all operations with withSpan for OpenTelemetry
    - Add structured logging for all auth actions
    - Log auth attempts to auth_audit_log table
    - JWT tokens should have brand="skillup"
    - _Requirements: TR-4.2, BR-1.2, BR-3.1, BR-3.2_

  - [ ]* 10.2 Write unit tests for SkillUpAuthService
    - Test login with valid credentials returns tokens with brand="skillup"
    - Test login with invalid credentials throws InvalidCredentialsError
    - Test register creates user in skillup_prod and syncs to people_prod
    - Test logout revokes tokens
    - Test forgotPassword and resetPassword flows
    - Mock all dependencies
    - Target: 90%+ coverage
    - _Requirements: TR-4.2, BR-3.4_


- [ ] 11. SkillUp Auth Service - API routes and middleware
  - [ ] 11.1 Implement SkillUp Auth API routes with Hono
    - Create services/skillup-auth-service/src/index.ts with Hono app
    - Implement POST /auth/register with Zod validation
    - Implement POST /auth/login with Zod validation
    - Implement POST /auth/logout
    - Implement POST /auth/forgot-password with Zod validation
    - Implement POST /auth/reset-password with Zod validation
    - Implement POST /auth/refresh with token rotation
    - Add rate limiting: login (5/min), register (10/hour), forgot-password (3/hour)
    - Add request ID middleware for correlation tracking
    - Add error handler middleware for consistent error responses
    - _Requirements: TR-4.2, BR-3.1, BR-3.2, NFR-2_

  - [ ]* 11.2 Write integration tests for SkillUp Auth API
    - Test full registration flow
    - Test full login flow with brand="skillup" in token
    - Test rate limiting enforcement
    - Test Zod validation errors
    - Test error responses have consistent format
    - _Requirements: TR-4.2, BR-3.4_

- [ ] 12. Checkpoint - Database and auth services foundation complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 13. SkillHub Auth Validator service
  - [ ] 13.1 Implement SkillHubAuthValidator
    - Create services/skillhub-auth-validator/src/SkillHubAuthValidator.ts
    - Implement validateBrandToken method to verify RTH or SkillUp tokens
    - Implement verifySkillHubToken method for SkillHub session validation
    - Implement createSSOSession method to store sessions in people_prod
    - Use dependency injection for identityBridge and tokenService
    - Wrap all operations with withSpan for OpenTelemetry
    - Add structured logging for validation actions
    - _Requirements: TR-7.1, TR-7.2, BR-2.1, BR-2.2_

  - [ ]* 13.2 Write property test for SkillHub Auth Validator
    - **Property 9: Token Validation Round Trip**
    - **Validates: Requirements TR-7.1, TR-7.2**
    - Test that valid brand token validates successfully and generates valid SkillHub token
    - Test that SkillHub token contains correct shadow user ID and brand
    - Use fast-check with 100 iterations

  - [ ]* 13.3 Write unit tests for SkillHubAuthValidator
    - Test validateBrandToken with valid RTH token
    - Test validateBrandToken with valid SkillUp token
    - Test validateBrandToken fails with invalid token
    - Test validateBrandToken fails with expired token
    - Test verifySkillHubToken succeeds with valid token
    - Test createSSOSession stores session in people_prod
    - Mock all dependencies
    - Target: 90%+ coverage
    - _Requirements: TR-7.1, TR-7.2_


- [ ] 14. SkillHub Auth Validator - API routes
  - [ ] 14.1 Implement SkillHub Auth Validator API with Hono
    - Create services/skillhub-auth-validator/src/index.ts with Hono app
    - Implement POST /validate endpoint to validate brand tokens
    - Extract token from Authorization header and brand from x-brand header
    - Return skillhubToken and shadowUserId on success
    - Add request ID middleware
    - Add error handler middleware
    - Add structured logging for all validation attempts
    - _Requirements: TR-7.1, TR-7.2_

  - [ ]* 14.2 Write integration tests for SkillHub Auth Validator API
    - Test POST /validate with valid RTH token returns SkillHub token
    - Test POST /validate with valid SkillUp token returns SkillHub token
    - Test POST /validate with invalid token returns 401
    - Test POST /validate without brand header returns 400
    - _Requirements: TR-7.1, TR-7.2_


- [ ] 15. RTH API Gateway (Cloudflare Worker)
  - [ ] 15.1 Implement RTH API Gateway with Hono
    - Create services/api-gateway-rth/src/index.ts with Hono app
    - Implement routing: /auth/* → RTH Auth Service
    - Implement routing: /* → SkillHub API with x-brand: realtutorialhub header
    - Add CORS middleware for RTH domains (user.realtutorialhub.com, admin.realtutorialhub.com)
    - Add request ID middleware
    - Add rate limiting middleware (AUTH tier for /auth/login, GENERAL tier for other routes)
    - Implement cookie domain rewriting for .realtutorialhub.com
    - Add structured logging for all proxied requests
    - _Requirements: TR-3.1, BR-4.1, NFR-2_

  - [ ]* 15.2 Write property test for RTH API Gateway
    - **Property 8: API Gateway Routing**
    - **Validates: Requirements TR-3.1, TR-3.2, TR-3.3**
    - Test that /auth/* routes proxy to RTH Auth Service
    - Test that other routes proxy to SkillHub API with x-brand header
    - Use fast-check with 100 iterations

  - [ ]* 15.3 Write unit tests for RTH API Gateway
    - Test /auth/login proxies to RTH Auth Service
    - Test /quiz/start proxies to SkillHub API with x-brand: realtutorialhub
    - Test CORS headers are set correctly
    - Test rate limiting is enforced
    - Test cookie domain is rewritten to .realtutorialhub.com
    - Mock fetch calls to upstream services
    - Target: 90%+ coverage
    - _Requirements: TR-3.1_


- [ ] 16. SkillUp API Gateway (Cloudflare Worker)
  - [ ] 16.1 Implement SkillUp API Gateway with Hono
    - Create services/api-gateway-skillup/src/index.ts with Hono app
    - Implement routing: /auth/* → SkillUp Auth Service
    - Implement routing: /* → SkillHub API with x-brand: skillup header
    - Add CORS middleware for SkillUp domains (user.skillupitacademy.com, admin.skillupitacademy.com, faculty.skillupitacademy.com)
    - Add request ID middleware
    - Add rate limiting middleware (AUTH tier for /auth/login, GENERAL tier for other routes)
    - Implement cookie domain rewriting for .skillupitacademy.com
    - Add structured logging for all proxied requests
    - _Requirements: TR-3.2, BR-4.2, NFR-2_

  - [ ]* 16.2 Write unit tests for SkillUp API Gateway
    - Test /auth/login proxies to SkillUp Auth Service
    - Test /quiz/start proxies to SkillHub API with x-brand: skillup
    - Test CORS headers are set correctly for SkillUp domains
    - Test rate limiting is enforced
    - Test cookie domain is rewritten to .skillupitacademy.com
    - Mock fetch calls to upstream services
    - Target: 90%+ coverage
    - _Requirements: TR-3.2_


- [ ] 17. SkillHub API Gateway (Cloudflare Worker)
  - [ ] 17.1 Implement SkillHub API Gateway with Hono
    - Create services/api-gateway-skillhub/src/index.ts with Hono app
    - Implement POST /auth/validate endpoint (calls SkillHub Auth Validator)
    - Implement routing: /quiz/* → Quiz Service
    - Implement routing: /exam/* → Quiz Service
    - Implement routing: /tutorial/* → Tutorial Service
    - Implement routing: /placement/* → Placement Service
    - Implement routing: /payment/* → Payment Service
    - Add CORS middleware for SkillHub domains (quiz.skillhubcore.in, tutorial.skillhubcore.in, placement.skillhubcore.in)
    - Add auth middleware to extract shadowUserId from SkillHub token
    - Add request ID middleware
    - Add x-shadow-user-id and x-brand headers to all proxied requests
    - Add structured logging for all proxied requests
    - _Requirements: TR-3.3, BR-2.1, BR-2.2_

  - [ ]* 17.2 Write unit tests for SkillHub API Gateway
    - Test POST /auth/validate calls SkillHub Auth Validator
    - Test /quiz/start proxies to Quiz Service with x-shadow-user-id header
    - Test /tutorial/content proxies to Tutorial Service with x-brand header
    - Test auth middleware extracts shadowUserId from token
    - Test CORS headers are set correctly for SkillHub domains
    - Mock fetch calls to upstream services
    - Target: 90%+ coverage
    - _Requirements: TR-3.3_


- [ ] 18. Rate limiting middleware package
  - [ ] 18.1 Implement rate limiting middleware
    - Create packages/auth/src/middleware/rateLimiter.ts
    - Implement rateLimiter function using @upstash/ratelimit
    - Define rate limit tiers: AUTH (5/min), GENERAL (60/min), ADMIN (30/min)
    - Add X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
    - Return 429 with retryAfter on rate limit exceeded
    - Use sliding window algorithm
    - _Requirements: NFR-2_

  - [ ]* 18.2 Write unit tests for rate limiting middleware
    - Test AUTH tier allows 5 requests per minute
    - Test 6th request in 1 minute returns 429
    - Test rate limit headers are set correctly
    - Test different tiers have different limits
    - Mock Upstash Redis client
    - Target: 90%+ coverage
    - _Requirements: NFR-2_


- [ ] 19. Logging and telemetry utilities
  - [ ] 19.1 Implement structured logging with Pino
    - Create packages/auth/src/utils/logger.ts
    - Configure Pino logger with correlation ID support
    - Implement PII redaction (never log passwords, tokens, full emails)
    - Add log levels: info, warn, error
    - Export logger instance
    - _Requirements: NFR-3_

  - [ ] 19.2 Implement OpenTelemetry utilities
    - Create packages/auth/src/utils/telemetry.ts
    - Implement withSpan helper function for tracing
    - Configure OpenTelemetry SDK for GCP Cloud Trace
    - Add span attributes for userId, shadowUserId, brand, action
    - Export withSpan function
    - _Requirements: NFR-3_

  - [ ]* 19.3 Write unit tests for logging and telemetry
    - Test logger redacts PII (passwords, tokens)
    - Test withSpan creates spans with correct attributes
    - Test withSpan records exceptions on errors
    - Mock Pino and OpenTelemetry SDK
    - Target: 90%+ coverage
    - _Requirements: NFR-3_


- [ ] 20. Frontend - RTH User Portal updates
  - [ ] 20.1 Update RTH User Portal authentication
    - Rename apps/realtutorialhub-quiz to apps/realtutorialhub-user (if needed)
    - Update login page to use fixed portalIdentity='user' and brand='realtutorialhub'
    - Remove hostname-derived portal identity logic
    - Update API base URL to https://api.realtutorialhub.com
    - Implement cross-domain redirect to SkillHub after login
    - Pass accessToken and brand in redirect URL to quiz.skillhubcore.in
    - _Requirements: TR-6.1, TR-6.4, BR-4.1_

  - [ ] 20.2 Implement SkillHub callback handler in RTH User Portal
    - Create /auth/callback route to handle SkillHub redirects
    - Extract token and brand from URL parameters
    - Call SkillHub Auth Validator to validate token
    - Set SkillHub cookies for .skillhubcore.in
    - Redirect to appropriate SkillHub service
    - _Requirements: TR-6.2, TR-6.3_

  - [ ]* 20.3 Write unit tests for RTH User Portal auth
    - Test login page uses fixed portal identity
    - Test login success redirects to SkillHub with token
    - Test callback handler validates token and sets cookies
    - Mock API calls
    - _Requirements: TR-6.1, TR-6.4_


- [ ] 21. Frontend - SkillUp User Portal updates
  - [ ] 21.1 Update SkillUp User Portal authentication
    - Rename apps/skillup-web to apps/skillup-user (if needed)
    - Update login page to use fixed portalIdentity='user' and brand='skillup'
    - Remove hostname-derived portal identity logic
    - Update API base URL to https://api.skillupitacademy.com
    - Implement cross-domain redirect to SkillHub after login
    - Pass accessToken and brand in redirect URL to quiz.skillhubcore.in
    - _Requirements: TR-6.1, TR-6.4, BR-4.2_

  - [ ] 21.2 Implement SkillHub callback handler in SkillUp User Portal
    - Create /auth/callback route to handle SkillHub redirects
    - Extract token and brand from URL parameters
    - Call SkillHub Auth Validator to validate token
    - Set SkillHub cookies for .skillhubcore.in
    - Redirect to appropriate SkillHub service
    - _Requirements: TR-6.2, TR-6.3_

  - [ ]* 21.3 Write unit tests for SkillUp User Portal auth
    - Test login page uses fixed portal identity
    - Test login success redirects to SkillHub with token
    - Test callback handler validates token and sets cookies
    - Mock API calls
    - _Requirements: TR-6.1, TR-6.4_


- [ ] 22. Frontend - Admin Portal updates
  - [ ] 22.1 Update RTH Admin Portal authentication
    - Update apps/realtutorialhub-admin login page to use fixed portalIdentity='admin' and brand='realtutorialhub'
    - Remove hostname-derived portal identity logic
    - Update API base URL to https://api.realtutorialhub.com
    - Ensure cookies are set for .realtutorialhub.com
    - _Requirements: TR-6.1, TR-6.4, BR-4.1_

  - [ ] 22.2 Update SkillUp Admin Portal authentication
    - Update apps/skillup-admin login page to use fixed portalIdentity='admin' and brand='skillup'
    - Remove hostname-derived portal identity logic
    - Update API base URL to https://api.skillupitacademy.com
    - Ensure cookies are set for .skillupitacademy.com
    - _Requirements: TR-6.1, TR-6.4, BR-4.2_

  - [ ] 22.3 Update SkillUp Faculty Portal authentication
    - Update apps/skillup-faculty login page to use fixed portalIdentity='faculty' and brand='skillup'
    - Remove hostname-derived portal identity logic
    - Update API base URL to https://api.skillupitacademy.com
    - Ensure cookies are set for .skillupitacademy.com
    - _Requirements: TR-6.1, TR-6.4, BR-4.2_


- [ ] 23. Shared services - Quiz service updates
  - [ ] 23.1 Create SkillHub Quiz service (or update existing)
    - Create apps/skillhub-quiz (or update existing quiz service)
    - Implement auth middleware to extract shadowUserId from SkillHub token
    - Update all database queries to use shadowUserId instead of brand-specific user ID
    - Implement brand detection from x-brand header
    - Implement brand-specific UI customization (logo, colors, tagline)
    - Add structured logging with shadowUserId and brand
    - _Requirements: TR-7.2, TR-7.3, BR-2.1, BR-2.2_

  - [ ]* 23.2 Write property test for Quiz service
    - **Property 3: Shadow User ID Consistency**
    - **Validates: Requirements BR-2.3, BR-2.4, BR-2.5, CP-4**
    - Test that same shadow user ID is used across multiple quiz operations
    - Test that quiz progress is tracked with shadow user ID
    - Use fast-check with 100 iterations

  - [ ]* 23.3 Write unit tests for Quiz service auth middleware
    - Test middleware extracts shadowUserId from token
    - Test middleware extracts brand from header
    - Test middleware rejects invalid tokens
    - Mock token verification
    - Target: 90%+ coverage
    - _Requirements: TR-7.2_


- [ ] 24. Shared services - Tutorial service updates
  - [ ] 24.1 Update Tutorial service for multi-brand support
    - Update apps/skillhub-tutorial (or create if doesn't exist)
    - Implement auth middleware to extract shadowUserId from SkillHub token
    - Update all database queries to use shadowUserId
    - Implement brand detection from x-brand header
    - Implement brand-specific UI customization
    - Add structured logging with shadowUserId and brand
    - _Requirements: TR-7.3, BR-2.1, BR-2.2_

  - [ ]* 24.2 Write unit tests for Tutorial service auth middleware
    - Test middleware extracts shadowUserId from token
    - Test middleware extracts brand from header
    - Test tutorial progress is saved with shadow user ID
    - Mock token verification
    - Target: 90%+ coverage
    - _Requirements: TR-7.3_


- [ ] 25. Shared services - Placement service updates
  - [ ] 25.1 Update Placement service for multi-brand support
    - Update apps/skillhub-placement (or create if doesn't exist)
    - Implement auth middleware to extract shadowUserId from SkillHub token
    - Update all database queries to use shadowUserId
    - Implement brand detection from x-brand header
    - Implement brand-specific UI customization
    - Add structured logging with shadowUserId and brand
    - _Requirements: BR-2.1, BR-2.2_

  - [ ]* 25.2 Write unit tests for Placement service auth middleware
    - Test middleware extracts shadowUserId from token
    - Test placement profiles use shadow user ID
    - Mock token verification
    - Target: 90%+ coverage
    - _Requirements: BR-2.1_

- [ ] 26. Checkpoint - All services and gateways implemented
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 27. Cross-domain authentication integration
  - [ ] 27.1 Implement cross-domain auth flow in RTH User Portal
    - Update dashboard to include "Take Quiz" button
    - On click, read accessToken from cookie
    - Redirect to quiz.skillhubcore.in/auth/callback?token={accessToken}&brand=realtutorialhub
    - Implement similar flows for "Learn Tutorial" and "View Placement"
    - _Requirements: TR-6.2, BR-2.1_

  - [ ] 27.2 Implement cross-domain auth flow in SkillUp User Portal
    - Update dashboard to include "Take Quiz" button
    - On click, read accessToken from cookie
    - Redirect to quiz.skillhubcore.in/auth/callback?token={accessToken}&brand=skillup
    - Implement similar flows for "Learn Tutorial" and "View Placement"
    - _Requirements: TR-6.2, BR-2.2_

  - [ ] 27.3 Implement auth callback handler in SkillHub services
    - Create /auth/callback route in quiz.skillhubcore.in
    - Extract token and brand from URL parameters
    - Call POST /auth/validate on api.skillhubcore.in
    - Set SkillHub cookies for .skillhubcore.in domain
    - Redirect to quiz dashboard
    - Implement same callback in tutorial.skillhubcore.in and placement.skillhubcore.in
    - _Requirements: TR-6.2, TR-6.3, BR-2.1, BR-2.2_

  - [ ]* 27.4 Write property test for cross-domain authentication
    - **Property 4: Cross-Domain Authentication**
    - **Validates: Requirements BR-2.1, BR-2.2, CP-3**
    - Test that authenticated users from both brands can access shared services
    - Test that SkillHub validator creates valid sessions
    - Use fast-check with 100 iterations

  - [ ]* 27.5 Write integration tests for cross-domain auth flow
    - Test full flow: RTH login → redirect to SkillHub → validate → access quiz
    - Test full flow: SkillUp login → redirect to SkillHub → validate → access quiz
    - Test SkillHub cookies are set correctly
    - Test shadow user ID is consistent across services
    - _Requirements: TR-6.2, BR-2.1, BR-2.2_


- [ ] 28. Cookie management and security
  - [ ] 28.1 Implement cookie utilities
    - Create packages/auth/src/utils/cookies.ts
    - Implement setCookie function with domain, httpOnly, secure, sameSite options
    - Implement getCookie function for reading cookies
    - Implement clearCookie function for logout
    - Ensure all cookies have HttpOnly and Secure flags
    - _Requirements: BR-4.1, BR-4.2, BR-4.3, NFR-2_

  - [ ]* 28.2 Write property test for cookie domain correctness
    - **Property 5: Cookie Domain Correctness**
    - **Validates: Requirements BR-4.1, BR-4.2, BR-4.3, BR-4.4, CP-2, NFR-4**
    - Test that RTH auth sets cookies with domain=.realtutorialhub.com
    - Test that SkillUp auth sets cookies with domain=.skillupitacademy.com
    - Test that SkillHub auth sets cookies with domain=.skillhubcore.in
    - Test that all cookies have HttpOnly and Secure flags
    - Use fast-check with 100 iterations

  - [ ]* 28.3 Write property test for no cross-brand cookie leakage
    - **Property 12: No Cross-Brand Cookie Leakage**
    - **Validates: Requirements BR-4.4**
    - Test that RTH cookies are not sent to SkillUp domains
    - Test that SkillUp cookies are not sent to RTH domains
    - Use fast-check with 100 iterations

  - [ ]* 28.4 Write unit tests for cookie utilities
    - Test setCookie creates cookie with correct attributes
    - Test getCookie reads cookie value
    - Test clearCookie removes cookie
    - Target: 90%+ coverage
    - _Requirements: BR-4.1, BR-4.2_


- [ ] 29. Brand-specific UI customization
  - [ ] 29.1 Implement brand theme utilities
    - Create packages/ui/src/utils/brandTheme.ts
    - Implement getBrandTheme function returning logo, colors, name, tagline
    - Support brands: 'realtutorialhub' and 'skillup'
    - RTH theme: primaryColor=#FF2D55, logo=/logos/rth-logo.svg, name="Real Tutorial Hub", tagline="AI-Powered Learning"
    - SkillUp theme: primaryColor=#4F46E5, logo=/logos/skillup-logo.svg, name="SkillUp IT Academy", tagline="Expert-Led Training"
    - _Requirements: TR-7.4_

  - [ ] 29.2 Apply brand theming to SkillHub services
    - Update quiz.skillhubcore.in to use getBrandTheme based on x-brand header
    - Update tutorial.skillhubcore.in to use getBrandTheme
    - Update placement.skillhubcore.in to use getBrandTheme
    - Show brand-specific logo, colors, and tagline in UI
    - _Requirements: TR-7.4, BR-2.1, BR-2.2_

  - [ ]* 29.3 Write unit tests for brand theme utilities
    - Test getBrandTheme returns correct theme for RTH
    - Test getBrandTheme returns correct theme for SkillUp
    - Test theme is applied correctly in UI components
    - _Requirements: TR-7.4_


- [ ] 30. Error handling and resilience
  - [ ] 30.1 Implement error handler middleware
    - Create services/rth-auth-service/src/middleware/errorHandler.ts
    - Handle AuthError instances with proper status codes
    - Add request ID to all error responses
    - Add structured logging for all errors
    - Implement same error handler for SkillUp Auth Service
    - _Requirements: BR-3.4, NFR-3_

  - [ ] 30.2 Implement Circuit Breaker pattern
    - Create packages/resilience/src/CircuitBreaker.ts
    - Implement CircuitBreaker class with CLOSED, OPEN, HALF_OPEN states
    - Configure failure threshold, success threshold, timeout, reset timeout
    - Use for cross-service calls (Identity Bridge, SkillHub Auth Validator)
    - _Requirements: NFR-4_

  - [ ]* 30.3 Write property test for error handling consistency
    - **Property 10: Authentication Error Consistency**
    - **Validates: Requirements BR-3.4**
    - Test that all auth services return errors in consistent format
    - Test that error responses include correct HTTP status codes
    - Use fast-check with 100 iterations

  - [ ]* 30.4 Write unit tests for Circuit Breaker
    - Test circuit opens after failure threshold
    - Test circuit closes after success threshold in HALF_OPEN state
    - Test circuit rejects requests when OPEN
    - Test timeout enforcement
    - Target: 90%+ coverage
    - _Requirements: NFR-4_


- [ ] 31. Dependency injection setup
  - [ ] 31.1 Implement DI container for RTH Auth Service
    - Create services/rth-auth-service/src/di/container.ts
    - Register TokenService, PasswordService, UserIdentityBridgeService, DrizzleUserRepository, RthAuthService
    - Use constructor injection for all services
    - No static methods anywhere
    - _Requirements: NFR-3_

  - [ ] 31.2 Implement DI container for SkillUp Auth Service
    - Create services/skillup-auth-service/src/di/container.ts
    - Register TokenService, PasswordService, UserIdentityBridgeService, DrizzleUserRepository, DrizzleFacultyRepository, SkillUpAuthService
    - Use constructor injection for all services
    - No static methods anywhere
    - _Requirements: NFR-3_

  - [ ] 31.3 Implement DI container for SkillHub Auth Validator
    - Create services/skillhub-auth-validator/src/di/container.ts
    - Register TokenService, UserIdentityBridgeService, SkillHubAuthValidator
    - Use constructor injection for all services
    - _Requirements: NFR-3_

  - [ ]* 31.4 Write unit tests for DI containers
    - Test all services can be resolved from container
    - Test services receive correct dependencies
    - Test container throws error for unregistered services
    - _Requirements: NFR-3_


- [ ] 32. Database migrations
  - [ ] 32.1 Create migration scripts for rth_prod
    - Create services/rth-auth-service/migrations/0001_create_users.sql
    - Create services/rth-auth-service/migrations/0002_create_user_profiles.sql
    - Create services/rth-auth-service/migrations/0003_create_roles.sql
    - Create services/rth-auth-service/migrations/0004_create_user_roles.sql
    - Create services/rth-auth-service/migrations/0005_create_auth_audit_log.sql
    - Create services/rth-auth-service/migrations/0006_create_indexes.sql
    - Create services/rth-auth-service/migrations/0007_seed_roles.sql
    - _Requirements: TR-1.1_

  - [ ] 32.2 Create migration scripts for skillup_prod
    - Create services/skillup-auth-service/migrations/0001_create_users.sql
    - Create services/skillup-auth-service/migrations/0002_create_user_profiles.sql
    - Create services/skillup-auth-service/migrations/0003_create_roles.sql
    - Create services/skillup-auth-service/migrations/0004_create_user_roles.sql
    - Create services/skillup-auth-service/migrations/0005_create_auth_audit_log.sql
    - Create services/skillup-auth-service/migrations/0006_create_faculty.sql
    - Create services/skillup-auth-service/migrations/0007_create_batches.sql
    - Create services/skillup-auth-service/migrations/0008_create_indexes.sql
    - Create services/skillup-auth-service/migrations/0009_seed_roles.sql
    - _Requirements: TR-1.2_

  - [ ] 32.3 Create migration scripts for people_prod updates
    - Create packages/db-people/migrations/0001_add_external_id_columns.sql
    - Create packages/db-people/migrations/0002_create_sso_sessions.sql
    - Create packages/db-people/migrations/0003_create_indexes.sql
    - _Requirements: TR-1.3_

  - [ ] 32.4 Run migrations on development databases
    - Run migrations for rth_prod
    - Run migrations for skillup_prod
    - Run migrations for people_prod
    - Verify all tables and indexes created correctly
    - _Requirements: TR-1.1, TR-1.2, TR-1.3_


- [ ] 33. Data migration from existing databases
  - [ ] 33.1 Create RTH user migration script
    - Create scripts/migrate-rth-users.ts
    - Query existing RTH users from quiz_platform_prod (or current database)
    - Insert users into rth_prod.users with password hashes
    - Create user_profiles for each user
    - Assign default USER role to all users
    - Log migration progress and errors
    - _Requirements: TR-8.1, TR-8.2_

  - [ ] 33.2 Create SkillUp user migration script
    - Create scripts/migrate-skillup-users.ts
    - Query existing SkillUp users from quiz_platform_prod (or current database)
    - Insert users into skillup_prod.users with password hashes
    - Create user_profiles for each user
    - Assign default USER role to all users
    - Migrate faculty data if exists
    - Log migration progress and errors
    - _Requirements: TR-8.1, TR-8.2_

  - [ ] 33.3 Create shadow user sync script
    - Create scripts/sync-existing-users-to-people.ts
    - Query all users from rth_prod and skillup_prod
    - Call UserIdentityBridgeService.syncUser for each user
    - Create shadow users in people_prod with correct external_id and external_brand
    - Grant platform access for each user
    - Log sync progress and errors
    - _Requirements: TR-8.1, TR-8.2_

  - [ ] 33.4 Run migration scripts and validate
    - Run migrate-rth-users.ts and verify all RTH users migrated
    - Run migrate-skillup-users.ts and verify all SkillUp users migrated
    - Run sync-existing-users-to-people.ts and verify all shadow users created
    - Verify no data loss (compare user counts before/after)
    - Verify auth still works for migrated users
    - _Requirements: TR-8.2_


- [ ] 34. Environment configuration
  - [ ] 34.1 Configure environment variables for RTH Auth Service
    - Add DATABASE_URL_RTH (pooled connection)
    - Add DATABASE_DIRECT_URL_RTH (migrations only)
    - Add DATABASE_URL_RTH_READONLY (analytics)
    - Add DATABASE_URL_PEOPLE (for Identity Bridge)
    - Add JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_SKILLHUB_SECRET
    - Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (rate limiting)
    - Add OTEL_EXPORTER_OTLP_ENDPOINT (OpenTelemetry)
    - Create .env.example with all required variables
    - _Requirements: NFR-2, NFR-3_

  - [ ] 34.2 Configure environment variables for SkillUp Auth Service
    - Add DATABASE_URL_SKILLUP (pooled connection)
    - Add DATABASE_DIRECT_URL_SKILLUP (migrations only)
    - Add DATABASE_URL_SKILLUP_READONLY (analytics)
    - Add DATABASE_URL_PEOPLE (for Identity Bridge)
    - Add JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_SKILLHUB_SECRET
    - Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    - Add OTEL_EXPORTER_OTLP_ENDPOINT
    - Create .env.example with all required variables
    - _Requirements: NFR-2, NFR-3_

  - [ ] 34.3 Configure environment variables for SkillHub Auth Validator
    - Add DATABASE_URL_PEOPLE
    - Add JWT_ACCESS_SECRET, JWT_SKILLHUB_SECRET
    - Add OTEL_EXPORTER_OTLP_ENDPOINT
    - Create .env.example with all required variables
    - _Requirements: NFR-2, NFR-3_

  - [ ] 34.4 Configure environment variables for API Gateways
    - RTH Gateway: RTH_AUTH_SERVICE_URL, SKILLHUB_API_URL, COOKIE_DOMAIN=.realtutorialhub.com, BRAND=realtutorialhub
    - SkillUp Gateway: SKILLUP_AUTH_SERVICE_URL, SKILLHUB_API_URL, COOKIE_DOMAIN=.skillupitacademy.com, BRAND=skillup
    - SkillHub Gateway: QUIZ_SERVICE_URL, TUTORIAL_SERVICE_URL, PLACEMENT_SERVICE_URL, PAYMENT_SERVICE_URL, SKILLHUB_AUTH_VALIDATOR_URL
    - Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for all gateways
    - Create wrangler.toml for each gateway with environment variables
    - _Requirements: TR-3.1, TR-3.2, TR-3.3_


- [ ] 35. Deployment configuration
  - [ ] 35.1 Create Dockerfile for RTH Auth Service
    - Create services/rth-auth-service/Dockerfile
    - Use Node.js 20 Alpine base image
    - Install dependencies with pnpm
    - Build TypeScript to JavaScript
    - Expose port 8080 for GCP Cloud Run
    - Set health check endpoint /health
    - _Requirements: NFR-4_

  - [ ] 35.2 Create Dockerfile for SkillUp Auth Service
    - Create services/skillup-auth-service/Dockerfile
    - Use Node.js 20 Alpine base image
    - Install dependencies with pnpm
    - Build TypeScript to JavaScript
    - Expose port 8080 for GCP Cloud Run
    - Set health check endpoint /health
    - _Requirements: NFR-4_

  - [ ] 35.3 Create Dockerfile for SkillHub Auth Validator
    - Create services/skillhub-auth-validator/Dockerfile
    - Use Node.js 20 Alpine base image
    - Install dependencies with pnpm
    - Build TypeScript to JavaScript
    - Expose port 8080 for GCP Cloud Run
    - Set health check endpoint /health
    - _Requirements: NFR-4_

  - [ ] 35.4 Create GCP Cloud Run deployment scripts
    - Create scripts/deploy-rth-auth.sh for RTH Auth Service
    - Create scripts/deploy-skillup-auth.sh for SkillUp Auth Service
    - Create scripts/deploy-skillhub-validator.sh for SkillHub Auth Validator
    - Configure region: asia-south1 (Mumbai)
    - Configure min instances: 1, max instances: 10
    - Configure memory: 512Mi, CPU: 1
    - Add environment variables from secrets
    - _Requirements: NFR-4_

  - [ ] 35.5 Create Cloudflare Worker deployment scripts
    - Create scripts/deploy-gateway-rth.sh for RTH API Gateway
    - Create scripts/deploy-gateway-skillup.sh for SkillUp API Gateway
    - Create scripts/deploy-gateway-skillhub.sh for SkillHub API Gateway
    - Use wrangler deploy command
    - Configure routes for each gateway
    - _Requirements: TR-3.1, TR-3.2, TR-3.3_


- [ ] 36. Cloudflare DNS configuration
  - [ ] 36.1 Configure DNS for RTH brand domain
    - Add CNAME: user.realtutorialhub.com → GCP Cloud Run (RTH User Portal)
    - Add CNAME: admin.realtutorialhub.com → GCP Cloud Run (RTH Admin Portal)
    - Add CNAME: api.realtutorialhub.com → Cloudflare Worker (RTH API Gateway)
    - Enable Cloudflare proxy (orange cloud) for all records
    - Configure SSL/TLS to Full (strict)
    - _Requirements: TR-2.1, TR-3.1_

  - [ ] 36.2 Configure DNS for SkillUp brand domain
    - Add CNAME: user.skillupitacademy.com → GCP Cloud Run (SkillUp User Portal)
    - Add CNAME: admin.skillupitacademy.com → GCP Cloud Run (SkillUp Admin Portal)
    - Add CNAME: faculty.skillupitacademy.com → GCP Cloud Run (SkillUp Faculty Portal)
    - Add CNAME: api.skillupitacademy.com → Cloudflare Worker (SkillUp API Gateway)
    - Enable Cloudflare proxy (orange cloud) for all records
    - Configure SSL/TLS to Full (strict)
    - _Requirements: TR-2.2, TR-3.2_

  - [ ] 36.3 Configure DNS for SkillHub shared domain
    - Add CNAME: quiz.skillhubcore.in → GCP Cloud Run (Quiz Service)
    - Add CNAME: tutorial.skillhubcore.in → GCP Cloud Run (Tutorial Service)
    - Add CNAME: placement.skillhubcore.in → GCP Cloud Run (Placement Service)
    - Add CNAME: api.skillhubcore.in → Cloudflare Worker (SkillHub API Gateway)
    - Add CNAME: admin.skillhubcore.in → GCP Cloud Run (SkillHub Admin Portal)
    - Enable Cloudflare proxy (orange cloud) for all records
    - Configure SSL/TLS to Full (strict)
    - _Requirements: TR-2.3, TR-3.3_


- [ ] 37. Performance optimization
  - [ ] 37.1 Implement Redis caching for shadow user lookups
    - Create packages/identity-bridge/src/cache/ShadowUserCache.ts
    - Cache shadow user ID lookups with key: shadow:{externalId}:{externalBrand}
    - Set TTL: 5 minutes
    - Invalidate cache on user sync
    - Use Upstash Redis
    - _Requirements: NFR-1_

  - [ ] 37.2 Add database query timeout enforcement
    - Verify all database queries use withTimeout wrapper
    - STANDARD_QUERY_TIMEOUT: 15 seconds for read queries
    - REPORT_QUERY_TIMEOUT: 30 seconds for complex queries
    - Throw timeout error if query exceeds limit
    - _Requirements: NFR-1_

  - [ ]* 37.3 Write property test for user sync performance
    - **Property 11: User Sync Performance**
    - **Validates: Requirements NFR-1**
    - Test that syncUser completes in less than 100ms under normal load
    - Use fast-check with 100 iterations

  - [ ]* 37.4 Write unit tests for Redis caching
    - Test cache hit returns cached shadow user ID
    - Test cache miss queries database and caches result
    - Test cache invalidation on user sync
    - Mock Redis client
    - Target: 90%+ coverage
    - _Requirements: NFR-1_


- [ ] 38. Security hardening
  - [ ] 38.1 Implement CSRF protection
    - Add CSRF token generation and validation to all auth routes
    - Use double-submit cookie pattern
    - Add CSRF middleware to RTH and SkillUp Auth Services
    - _Requirements: NFR-2_

  - [ ] 38.2 Implement brute force protection
    - Track failed login attempts in Redis with key: login:attempts:{email}
    - Lock account for 1 hour after 10 failed attempts
    - Send Sentry alert on account lockout
    - Add structured logging for brute force attempts
    - _Requirements: NFR-2_

  - [ ] 38.3 Implement token rotation
    - Wrap token refresh in db.transaction()
    - Revoke old refresh token and issue new one atomically
    - If new token insert fails, old token not revoked (prevents lockout)
    - Add audit trail for token rotation events
    - _Requirements: NFR-2_

  - [ ]* 38.4 Write unit tests for security features
    - Test CSRF token validation
    - Test brute force protection locks account after 10 attempts
    - Test token rotation is atomic
    - Test Sentry alert is sent on lockout
    - Mock Redis and database
    - Target: 90%+ coverage
    - _Requirements: NFR-2_


- [ ] 39. Monitoring and observability
  - [ ] 39.1 Configure OpenTelemetry for all services
    - Add OpenTelemetry SDK to RTH Auth Service
    - Add OpenTelemetry SDK to SkillUp Auth Service
    - Add OpenTelemetry SDK to SkillHub Auth Validator
    - Configure GCP Cloud Trace exporter
    - Add trace context propagation across services
    - _Requirements: NFR-3_

  - [ ] 39.2 Configure structured logging for all services
    - Ensure all services use Pino logger with correlation IDs
    - Add X-Request-ID header to all requests
    - Propagate request ID across service boundaries
    - Configure log levels: info for production, debug for development
    - _Requirements: NFR-3_

  - [ ] 39.3 Add health check endpoints
    - Implement GET /health for RTH Auth Service
    - Implement GET /health for SkillUp Auth Service
    - Implement GET /health for SkillHub Auth Validator
    - Health check should verify database connectivity
    - Return 200 if healthy, 503 if unhealthy
    - _Requirements: NFR-4_

  - [ ] 39.4 Configure Sentry error tracking
    - Add Sentry SDK to all auth services
    - Configure error sampling rate: 100% for auth errors
    - Add user context to Sentry events (shadowUserId, brand)
    - Configure alerts for critical errors (brute force, database failures)
    - _Requirements: NFR-3_


- [ ] 40. Documentation and configuration files
  - [ ] 40.1 Create README for RTH Auth Service
    - Document service purpose and responsibilities
    - Document API endpoints and request/response formats
    - Document environment variables
    - Document deployment process
    - Document testing approach
    - _Requirements: NFR-3_

  - [ ] 40.2 Create README for SkillUp Auth Service
    - Document service purpose and responsibilities
    - Document API endpoints and request/response formats
    - Document environment variables
    - Document deployment process
    - Document testing approach
    - _Requirements: NFR-3_

  - [ ] 40.3 Create README for SkillHub Auth Validator
    - Document service purpose and responsibilities
    - Document token validation flow
    - Document environment variables
    - Document deployment process
    - _Requirements: NFR-3_

  - [ ] 40.4 Create README for User Identity Bridge package
    - Document Identity Bridge pattern
    - Document shadow user concept
    - Document API methods and usage examples
    - Document testing approach
    - _Requirements: NFR-3_

  - [ ] 40.5 Create architecture diagram
    - Create docs/architecture/multi-brand-auth-flow.md
    - Include sequence diagrams for brand login and cross-domain auth
    - Include component diagram showing all services and databases
    - Include data flow diagrams
    - _Requirements: NFR-3_


- [ ] 41. End-to-end testing
  - [ ]* 41.1 Write E2E test for RTH user journey
    - Test: User registers on user.realtutorialhub.com
    - Test: User logs in and receives RTH cookies
    - Test: User clicks "Take Quiz" and redirects to quiz.skillhubcore.in
    - Test: SkillHub validates token and sets SkillHub cookies
    - Test: User can access quiz with shadow user ID
    - Test: User can access tutorial with same shadow user ID
    - Use Playwright or Cypress
    - _Requirements: BR-2.1, BR-2.3, CP-3, CP-4_

  - [ ]* 41.2 Write E2E test for SkillUp user journey
    - Test: User registers on user.skillupitacademy.com
    - Test: User logs in and receives SkillUp cookies
    - Test: User clicks "Take Quiz" and redirects to quiz.skillhubcore.in
    - Test: SkillHub validates token and sets SkillHub cookies
    - Test: User can access quiz with shadow user ID
    - Test: User can access tutorial with same shadow user ID
    - Use Playwright or Cypress
    - _Requirements: BR-2.2, BR-2.3, CP-3, CP-4_

  - [ ]* 41.3 Write E2E test for brand isolation
    - Test: RTH user cannot access SkillUp user data
    - Test: SkillUp user cannot access RTH user data
    - Test: RTH cookies don't work on SkillUp domains
    - Test: SkillUp cookies don't work on RTH domains
    - _Requirements: BR-1.3, BR-1.4, BR-4.4, CP-1, CP-2_


- [ ] 42. Load testing and performance validation
  - [ ]* 42.1 Create k6 load test for RTH Auth Service
    - Create tests/load/rth-auth-flow.k6.js
    - Simulate: 100 concurrent registrations, 500 concurrent logins
    - Stages: Smoke (10 VUs × 1 min), Load (100 VUs × 5 min), Stress (500 VUs × 5 min)
    - Thresholds: http_req_duration p(95) < 500ms, http_req_failed < 0.5%
    - Run from GCP Mumbai VM
    - _Requirements: NFR-1, NFR-4_

  - [ ]* 42.2 Create k6 load test for cross-domain auth flow
    - Create tests/load/cross-domain-auth.k6.js
    - Simulate: User login → token validation → SkillHub access
    - Test 1000 concurrent users accessing shared services
    - Thresholds: http_req_duration p(95) < 1000ms, http_req_failed < 0.5%
    - Verify shadow user ID consistency under load
    - _Requirements: NFR-1, NFR-4_

  - [ ]* 42.3 Create k6 load test for Identity Bridge
    - Create tests/load/identity-bridge.k6.js
    - Simulate: 1000 concurrent user syncs to people_prod
    - Measure syncUser latency (should be < 100ms p(95))
    - Test cache hit rate for shadow user lookups
    - _Requirements: NFR-1_


- [ ] 43. Package.json and build configuration
  - [ ] 43.1 Create package.json for RTH Auth Service
    - Add dependencies: hono, drizzle-orm, postgres, jsonwebtoken, bcrypt, pino, @opentelemetry/sdk-node, @upstash/ratelimit
    - Add dev dependencies: vitest, @types/node, typescript, tsx
    - Add scripts: dev, build, start, test, migrate, lint, typecheck
    - Configure TypeScript with tsconfig.json
    - _Requirements: NFR-3_

  - [ ] 43.2 Create package.json for SkillUp Auth Service
    - Add same dependencies as RTH Auth Service
    - Add scripts: dev, build, start, test, migrate, lint, typecheck
    - Configure TypeScript with tsconfig.json
    - _Requirements: NFR-3_

  - [ ] 43.3 Create package.json for SkillHub Auth Validator
    - Add dependencies: hono, drizzle-orm, postgres, jsonwebtoken, pino, @opentelemetry/sdk-node
    - Add dev dependencies: vitest, @types/node, typescript, tsx
    - Add scripts: dev, build, start, test, lint, typecheck
    - Configure TypeScript with tsconfig.json
    - _Requirements: NFR-3_

  - [ ] 43.4 Create package.json for API Gateways
    - Add dependencies: hono, @upstash/ratelimit, @upstash/redis
    - Add dev dependencies: wrangler, vitest, typescript
    - Add scripts: dev, deploy, test, lint, typecheck
    - Configure wrangler.toml for each gateway
    - _Requirements: NFR-3_

  - [ ] 43.5 Update root package.json with new workspaces
    - Add services/rth-auth-service to workspaces
    - Add services/skillup-auth-service to workspaces
    - Add services/skillhub-auth-validator to workspaces
    - Add services/api-gateway-rth to workspaces
    - Add services/api-gateway-skillup to workspaces
    - Add services/api-gateway-skillhub to workspaces
    - Add packages/identity-bridge to workspaces
    - _Requirements: NFR-3_


- [ ] 44. Monorepo build and type checking
  - [ ] 44.1 Configure Turborepo for new services
    - Update turbo.json with build pipelines for new services
    - Add dependencies between packages (identity-bridge → db-people, auth services → identity-bridge)
    - Configure cache settings for build outputs
    - _Requirements: NFR-3_

  - [ ] 44.2 Run full monorepo build
    - Run pnpm install to install all dependencies
    - Run pnpm build:all to build all packages and services
    - Verify no build errors
    - Verify all TypeScript types are correct
    - _Requirements: NFR-3_

  - [ ] 44.3 Run full monorepo type checking
    - Run pnpm typecheck:all
    - Fix any type errors in new services
    - Ensure all existing tests still pass (1138+ tests)
    - _Requirements: NFR-3_

  - [ ] 44.4 Run full test suite
    - Run pnpm test to execute all unit tests
    - Verify all new tests pass
    - Verify all existing tests still pass
    - Check test coverage: statements 90%, branches 85%, functions 90%
    - _Requirements: NFR-3_

- [ ] 45. Final checkpoint - All implementation complete
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All services follow FAANG compliance: Repository Pattern, DI, DTOs, structured logging, OpenTelemetry, rate limiting, 90%+ test coverage
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate cross-service interactions
- E2E tests validate complete user journeys
- Checkpoints ensure incremental validation at key milestones

## FAANG Compliance Checklist

Before marking implementation complete, verify:

- [ ] Repository Pattern: All database access via Repository classes, no direct DB calls in services
- [ ] Dependency Injection: All services use DI, no static methods
- [ ] DTOs: All API boundaries use typed DTO objects, no raw DB types in responses
- [ ] Structured Logging: Pino logger with correlation IDs, no console.log
- [ ] OpenTelemetry: All critical operations wrapped with withSpan()
- [ ] Rate Limiting: Every public endpoint protected with appropriate tier
- [ ] Zod Validation: Every API input validated with Zod schema
- [ ] Transactions: Multi-step writes wrapped in db.transaction()
- [ ] Audit Trail: Every auth action logged to auth_audit_log
- [ ] Soft Deletes: All tables have deleted_at column, all queries filter deleted records
- [ ] Test Coverage: 90%+ statements, 85%+ branches, 90%+ functions
- [ ] All 1138+ existing tests still passing

## Test Coverage Requirements

All services MUST achieve minimum test coverage:
- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%

Run `pnpm test -- --coverage` to verify coverage meets requirements.

## Deployment Checklist

Before deploying to production:

- [ ] All migrations run successfully on production databases
- [ ] All environment variables configured in GCP Secret Manager
- [ ] All services deployed to GCP Cloud Run (asia-south1)
- [ ] All API Gateways deployed to Cloudflare Workers
- [ ] DNS records configured and propagated
- [ ] SSL certificates valid for all domains
- [ ] Health checks passing for all services
- [ ] Load tests passing with acceptable performance
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented

