# COMPREHENSIVE INFRASTRUCTURE ANALYSIS
## Executive Summary

---

## **OVERVIEW**

This is a **multi-brand, multi-tenant SaaS platform** running on **Google Cloud Platform (GCP)** with **Cloudflare Workers** as the edge gateway. The infrastructure serves **3 brands** (RealTutorialHub, SkillUp IT Academy, SkillHubCore) through **10 Cloud Run services**, **7 Neon PostgreSQL databases**, and **1 Cloudflare Worker gateway** with **13 configured routes**.

---

## **KEY ARCHITECTURE PRINCIPLES**

### 1. **Brand Isolation**
- Authentication and user data are isolated per brand in separate databases
- Each brand has its own database: `rth_prod`, `skillup_prod`
- Admin roles are checked in brand-specific databases
- JWT tokens include brand claim for validation

### 2. **Shared Resources**
- Tutorial content stored in `tutorial_prod` (accessible by all brands)
- Quiz platform shared across brands
- Placement services shared via `placement_prod`
- Shadow users in `people_prod` bridge brand-specific identities

### 3. **Edge Gateway Architecture**
- Cloudflare Workers handle routing, authentication, and brand resolution at the edge
- JWT validation at edge reduces backend load
- Smart Placement executes worker closer to Singapore backend
- 13 configured routes across 3 brands

### 4. **Microservices Design**
- Each service is containerized and deployed independently to Cloud Run
- Services communicate via internal APIs
- Horizontal auto-scaling (0-10 instances)
- Zero downtime deployments with health checks

### 5. **Security First**
- Defense in depth: JWT validated at edge AND backend
- Brand validation: Token brand must match hostname brand
- Token type validation: Admin tokens can't access user routes
- Blocked user check: Always queries DB (no cache)
- Audit logging: All authentication events logged with brand context

---

## **INFRASTRUCTURE COMPONENTS**

### **Compute Layer**
- **10 Cloud Run Services** in asia-southeast1 (Singapore)
- **1 Cloudflare Worker** (global CDN with Smart Placement)
- **Auto-scaling**: 0-10 instances per service
- **Container Registry**: GCP Artifact Registry

### **Database Layer**
- **7 Neon PostgreSQL Databases** in AWS ap-southeast-1 (Singapore)
- **Serverless**: Auto-scaling connections
- **Isolation**: Brand-specific auth databases
- **Shared**: Content and platform databases

### **Edge Layer**
- **Cloudflare Workers**: Global edge network
- **13 Routes**: Across 3 brands
- **Smart Placement**: Executes closer to backend
- **JWT Validation**: At edge for performance

### **Deployment Pipeline**
- **GitHub Actions**: CI/CD automation
- **Docker**: Multi-stage builds
- **GCP Workload Identity**: Secure authentication
- **Secret Manager**: Centralized secrets management
- **Health Checks**: Automated smoke tests

---

## **ADMIN.REALTUTORIALHUB.COM STACK**

### **Frontend**
- **Service**: `quiz-admin-app` (Cloud Run)
- **URL**: https://admin.realtutorialhub.com
- **Port**: 3002
- **Resources**: 1Gi RAM, 1 CPU
- **Framework**: Next.js 14 (App Router)
- **Direct DB**: `tutorial_prod` (BFF routes only)

### **Gateway**
- **Service**: `platform-api-gateway` (Cloudflare Worker)
- **Routes**: 
  - `admin.realtutorialhub.com/*` → quiz-admin-app
  - `api.realtutorialhub.com/*` → quiz-api-server
- **Responsibilities**: Brand resolution, JWT validation, routing

### **Backend**
- **Service**: `quiz-api-server` (Cloud Run)
- **URL**: https://api.realtutorialhub.com (public)
- **Port**: 3000
- **Resources**: 2Gi RAM, 2 CPU
- **Framework**: Next.js 14 (API Routes)
- **Direct DB**: ALL 7 databases

### **Databases (Direct Access)**
1. `tutorial_prod` - Tutorial content (quiz-admin-app BFF)
2. `rth_prod` - RTH authentication (quiz-api-server)
3. `skillup_prod` - SkillUp authentication (quiz-api-server)
4. `quiz_platform_prod` - Default/fallback (quiz-api-server)
5. `people_prod` - Shadow users (quiz-api-server)
6. `payment_prod` - Payments (quiz-api-server)
7. `placement_prod` - Placement (quiz-api-server)

---

## **AUTHENTICATION & AUTHORIZATION**

### **Authentication URLs**
- **RTH Login**: `https://api.realtutorialhub.com/api/auth/login`
- **RTH Admin Login**: `https://api.realtutorialhub.com/api/admin/auth/login`
- **SkillUp Login**: `https://api.skillupitacademy.com/api/auth/login`
- **SkillUp Admin Login**: `https://api.skillupitacademy.com/api/admin/auth/login`

**Both route to the same backend** (`quiz-api-server`), but brand is resolved from hostname.

### **Authorization Flow**
1. **Edge Validation**: Cloudflare Worker validates JWT
2. **Brand Resolution**: Derives brand from hostname
3. **Header Injection**: Sets `x-brand`, `x-user-id`, `x-user-roles`
4. **Backend Validation**: API server re-validates token (defense in depth)
5. **RBAC Check**: Queries brand-specific database for admin role
6. **Resource Access**: Grants or denies based on role

### **JWT Token Claims**
```json
{
  "userId": "cm5abc123...",           // Brand-specific user ID
  "originalUserId": "cm5abc123...",   // Same as userId
  "shadowUserId": "cm5xyz789...",     // Cross-brand shadow ID
  "email": "admin@realtutorialhub.com",
  "roles": ["admin", "super_admin"],  // Normalized lowercase
  "isAdmin": true,
  "tokenType": "admin",               // "admin" or "user"
  "brand": "realtutorialhub",         // "realtutorialhub" or "skillup"
  "aud": "admin",                     // Audience claim
  "iat": 1735689600,
  "exp": 1735690500                   // 15 minutes
}
```

---

## **DEPLOYMENT WORKFLOW**

### **GCP Cloud Run Deployment**
1. **Trigger**: Push to main or manual dispatch
2. **Plan**: Detect changed files, determine scope
3. **Authenticate**: Workload Identity Federation (no keys)
4. **Build**: Multi-stage Docker build with pnpm
5. **Push**: Upload to Artifact Registry
6. **Deploy**: Rolling deployment to Cloud Run
7. **Health Check**: Automated smoke tests

### **Cloudflare Gateway Deployment**
1. **Resolve Upstreams**: Get Cloud Run service URLs
2. **Build**: Compile TypeScript, bundle with esbuild
3. **Validate**: Check routing table, verify upstreams
4. **Set Secrets**: JWT secrets via wrangler
5. **Deploy**: Upload to Cloudflare, activate globally

---

## **KEY METRICS**

### **Performance**
- **Edge Latency**: < 50ms (Cloudflare global network)
- **Backend Latency**: 100-300ms (Singapore region)
- **JWT Validation**: < 10ms (at edge)
- **Database Queries**: < 50ms (Neon serverless)

### **Scalability**
- **Auto-scaling**: 0-10 instances per service
- **Concurrency**: 1000 requests per instance
- **Max Capacity**: 10,000 concurrent requests per service
- **Database**: Serverless auto-scaling connections

### **Availability**
- **Cloud Run**: 99.95% SLA
- **Cloudflare**: 100% uptime guarantee
- **Neon**: 99.95% SLA
- **Zero Downtime**: Rolling deployments

---

## **SECURITY FEATURES**

1. **JWT Validation**: At edge and backend (defense in depth)
2. **Brand Isolation**: Separate databases per brand
3. **Token Type Validation**: Admin/user token separation
4. **Blocked User Check**: Real-time DB query (no cache)
5. **Audit Logging**: All auth events logged with brand context
6. **Secret Management**: GCP Secret Manager (no hardcoded secrets)
7. **HTTPS Only**: TLS termination at Cloudflare
8. **Rate Limiting**: At edge to prevent abuse

---

## **NEXT SECTIONS**

- **02-PHYSICAL-INFRASTRUCTURE.md**: Detailed service configurations
- **03-AUTHENTICATION-FLOW.md**: Complete auth flow diagrams
- **04-AUTHORIZATION-RBAC.md**: RBAC implementation details
- **05-DATABASE-ARCHITECTURE.md**: Database schemas and access patterns
- **06-GCP-DEPLOYMENT.md**: Deployment pipeline details
- **07-CLOUDFLARE-GATEWAY.md**: Gateway configuration and routing
- **08-REQUEST-FLOW.md**: End-to-end request tracing
- **09-MONITORING-OBSERVABILITY.md**: Logging and monitoring setup
- **10-TROUBLESHOOTING.md**: Common issues and solutions
