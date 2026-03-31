# API Documentation

## Services

### Auth API (`api-server`)
- File: `api-server.openapi.yaml`
- Base URLs: `api.realtutorialhub.com`, `api.skillupitacademy.com`
- Framework: Next.js App Router
- Brand detection: hostname-based

### SkillHub Core Service
- File: `skillhubcore.openapi.yaml`
- Base URL: `api.skillhubcore.in`
- Framework: Hono
- Brand detection: JWT platform claim

## Key Concepts

### Brand Isolation
Every request is brand-scoped. Brand is determined by:
1. Hostname (api-server)
2. JWT platform claim (skillhubcore-service)

### Portal Identity
The x-portal-identity header indicates the user type:
- user: end user portal
- admin: brand admin portal
- faculty: SkillUp faculty portal
- super_admin: SkillHub super admin
- infrastructure: internal service calls

### Shadow Users
Brand users (rth_prod, skillup_prod) are linked to shadow
users in people_prod via the Identity Bridge.
Shadow user ID is used by all shared services.
