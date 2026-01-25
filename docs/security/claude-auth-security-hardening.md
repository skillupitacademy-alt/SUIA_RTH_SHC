# CLAUDE AUTH SECURITY HARDENING TASK
# Platform: Quiz Platform (realtutorialhub.com)
# Phase: Platform Core → Security Hardening Layer
# Stack: Next.js + TypeScript + Vercel + Neon + Drizzle + Turborepo
# Execution Mode: Enterprise Platform Engineering

## GLOBAL CONTEXT
This project follows:
- PRD.md
- TRD.md
- System Architecture Document
- Security Architecture Document
- AI Architecture Document
- Platform Roadmap
- Implementation Architecture
- Engineering Principles & Optimization Playbook

Agent files:
- architect-agent.md
- backend-agent.md
- frontend-agent.md
- devops-agent.md
- qa-agent.md
- docs-agent.md
- ai-agent.md
- build-workflow.md

Claude must respect:
- SOLID
- DRY
- KISS
- YAGNI
- Clean Architecture
- Domain-driven design
- Zero-trust security
- API-first design
- Modularization
- Scalability
- Enterprise security standards

---

# 🎯 TASK OBJECTIVE
Harden the existing Auth & Identity System to **production-grade security level**.

This task is NOT about new features.
This task is about **security, trust, resilience, and protection**.

---

# 🔐 SECURITY FEATURES TO IMPLEMENT

## 1. Refresh Token Rotation
- Rotate refresh token on every use
- Invalidate old refresh token
- Store token hashes
- Implement token reuse detection
- Auto revoke compromised sessions

---

## 2. Token Revocation System
- Global logout support
- Session invalidation
- Refresh token blacklist
- Token versioning strategy

---

## 3. Email Verification Flow
- Email verification token generation
- Token expiry
- Secure verification endpoint
- User activation state
- Resend verification flow

---

## 4. Brute Force Protection
- Login attempt tracking
- IP-based rate limiting
- Account-based rate limiting
- Temporary lockouts
- Progressive delays

---

## 5. Rate Limiting Middleware
- Global API rate limits
- Auth route rate limits
- Admin route stricter limits
- IP throttling
- User throttling

---

## 6. Audit Logging
Create audit logs for:
- login
- logout
- token refresh
- failed logins
- profile changes
- role changes
- admin actions
- permission changes

---

## 7. IP & Device Tracking
- IP logging
- device fingerprinting (basic)
- session-device binding
- anomaly detection readiness

---

## 8. Admin Auth Isolation
- Separate cookie namespace
- Separate JWT secrets
- Separate token scope
- Separate middleware
- Separate session handling
- Separate refresh logic

Domains:
- quiz.realtutorialhub.com → user auth
- admin.realtutorialhub.com → admin auth
- api.realtutorialhub.com → service auth

---

## 9. Cookie Hardening
- HttpOnly
- Secure
- SameSite=strict
- Domain isolation
- Path scoping
- Expiry control

---

## 10. CSRF Protection
- CSRF tokens
- Double-submit cookie pattern
- Origin validation
- Header validation

---

## 11. CORS Policy
- Strict domain allowlist
- Origin validation
- Method restrictions
- Header restrictions
- Credential policy

---

## 12. Session Security
- Session expiry enforcement
- Concurrent session limits
- Device-based session invalidation
- Session rotation
- Idle session expiry

---

# 🗄️ DATABASE EXTENSIONS

Add/extend tables:

### audit_logs
- id
- user_id
- action
- ip
- device
- created_at
- metadata

### login_attempts
- id
- user_id
- ip
- attempts
- locked_until

### revoked_tokens
- id
- token_hash
- expires_at

---

# 🧱 MODULE EXTENSIONS (api-server)

Extend:

apps/api-server/src/modules/auth/
- security.service.ts
- rate-limit.middleware.ts
- audit.service.ts
- device.service.ts
- csrf.middleware.ts
- cors.middleware.ts
- admin-auth.middleware.ts

---

# 🛠️ ENV VARIABLES

Add:
AUTH_MAX_LOGIN_ATTEMPTS
AUTH_LOCK_TIME
RATE_LIMIT_WINDOW
RATE_LIMIT_MAX
CSRF_SECRET
ADMIN_JWT_SECRET
ADMIN_COOKIE_DOMAIN
USER_COOKIE_DOMAIN

---

# 🧪 QA REQUIREMENTS

Implement tests for:
- brute force
- rate limit
- refresh rotation
- token revocation
- CSRF
- CORS
- cookie security
- admin isolation
- audit logging
- session invalidation

---

# 📚 DOCUMENTATION

Generate docs for:
- security architecture
- token lifecycle
- session lifecycle
- refresh rotation
- admin isolation
- CSRF model
- CORS policy
- audit logging model
- rate limiting model

---

# 🧠 EXECUTION RULES FOR CLAUDE

Claude must:
- Extend existing auth system
- NOT rewrite existing logic
- NOT break API contracts
- NOT break frontend flows
- Preserve backward compatibility
- Follow module boundaries
- Follow layered architecture
- Use dependency injection patterns
- Use middleware pattern
- Use service pattern
- Respect monorepo structure
- Respect agents
- Respect governance
- Implement real security logic
- No mock security
- No demo logic
- No placeholders
- No insecure defaults

---

# ✅ FINAL OUTPUT EXPECTED

- Hardened auth system
- Production-grade security
- Token rotation active
- Token revocation active
- Brute force protection active
- Rate limiting active
- CSRF protection active
- CORS protection active
- Admin auth isolated
- Audit logging active
- Device tracking active
- Session security active
- Tests added
- Docs generated
