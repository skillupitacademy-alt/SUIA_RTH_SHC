# Backend Phase 01: Auth & Identity System

## 🎯 Objective
Implement a production-grade authentication and authorization system using JWT, Refresh Tokens, and Role-Based Access Control (RBAC).

## 📋 Task Breakdown

### 1. Database Completion (`packages/db`)
- [x] Add `roles` and `user_roles` tables.
- [x] Add `refresh_tokens` table.
- [x] Add `password_hash` and `email_verified` to `users` table.

### 2. Core Security Services (`apps/api-server`)
- [x] **Password Service**: bcrypt hashing and verification logic.
- [x] **Token Service**: JWT sign/verify, expiration logic, and rotation.
- [x] **Auth Service**: Main logic for `signup`, `login`, and `refresh`.
- [x] **Hardening**:
    - [x] JWT signature verification in global middleware.
    - [x] Rate limiting and CSRF protection (Already present).

### 3. API Integration
- [x] **Routes**: `signup`, `login`, `refresh`, `me`, `logout`, `forgot-password`, `reset-password`.
- [x] **Middleware**:
    - [x] `authenticate`: Validates tokens (Hardened in global middleware).
    - [x] `authorize`: Validates roles (Present in routes/services).

## 🧪 Verification Checkpoints
- [x] Success: User can sign up and receive a pair of Access/Refresh tokens.
- [x] Success: Access token expires, and Refresh token generates a new one.
- [x] Success: Protected routes return 401/403 for invalid/unauthorized users.
