# Implementation Plan: Phase 1 - Task 3 (AuthService Unit Tests)

This task implements critical safety tests for the `AuthService`, ensuring all security-related logic is validated before architectural refactoring begins.

## Proposed Changes

### [Component: API Server]
#### [NEW] [auth.service.test.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/__tests__/auth.service.test.ts)
- **Target**: [apps/api-server/src/modules/auth/auth.service.ts](file:///d:/onlinewebsites/quiz-platform/apps/api-server/src/modules/auth/auth.service.ts).
- **Mocking Strategy**: Use `vi.mock()` for all static dependencies:
  - `@quiz/db` (Mock the database provider)
  - `TokenService` (Mock JWT generation/validation)
  - `SecurityService` (Mock password hashing and lockout logic)
  - `EmailService` (Mock welcome and reset emails)
  - `AuditService` (Mock logging)

## Test Scenarios

### 1. Signup Flow
- [ ] Successful user creation.
- [ ] Duplicate email error (should throw 400).
- [ ] Graceful handling of email provider failure (user created, but log error).

### 2. Login Flow
- [ ] Successful login (returns JWTs and creates session).
- [ ] Wrong password (should throw 401).
- [ ] Account lockout detection (verify delegation to SecurityService).

### 3. Token Management
- [ ] Valid refresh token rotation.
- [ ] **Security**: Token reuse detection (stolen token replay should revoke the entire token family).
- [ ] Expired token handling.

### 4. Password Recovery
- [ ] Generate reset token and send email.
- [ ] Reset password with valid token.
- [ ] Invalid/Expired token rejection.

## Verification Plan

### Automated Tests
- Run `pnpm test auth.service` from the root.
- Achieve **90%+ line coverage** for the `AuthService` file.

### Manual Verification
- None required; purely automated logic verification.
