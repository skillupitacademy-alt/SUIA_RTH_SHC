# INFRASTRUCTURE DOCUMENTATION
## Complete Architecture Analysis for admin.realtutorialhub.com

---

## **DOCUMENTATION INDEX**

This comprehensive infrastructure analysis is organized into the following documents:

### **📋 01-EXECUTIVE-SUMMARY.md**
High-level overview of the entire infrastructure, key principles, and component summary.

**Contents**:
- Architecture principles (Brand Isolation, Shared Resources, Edge Gateway, Microservices)
- Infrastructure components overview
- admin.realtutorialhub.com stack details
- Authentication & authorization summary
- Deployment workflow overview
- Key metrics and security features

**Read this first** for a complete understanding of the system.

---

### **🖥️ 02-PHYSICAL-INFRASTRUCTURE.md**
Detailed configuration of all physical resources and services.

**Contents**:
- 10 Cloud Run services (detailed configurations)
- Cloudflare Worker gateway setup
- Container registry details
- Secrets management (GCP Secret Manager)
- Networking (DNS, TLS/SSL)
- Monitoring & observability setup
- Resource summary and cost estimates

**Use this** when you need specific service configurations or deployment details.

---

### **🔐 03-AUTHENTICATION-FLOW.md**
Complete authentication and authorization flow documentation.

**Contents**:
- Authentication URLs for both brands
- Step-by-step login flow (7 steps)
- Authenticated request flow
- Logout and token refresh flows
- JWT token structure and claims
- Security features (defense in depth, brand isolation)
- Performance optimizations

**Use this** to understand how authentication works across the entire stack.

---

### **🗄️ 04-DATABASE-ARCHITECTURE.md**
Complete database schema, access patterns, and management.

**Contents**:
- 7 database inventory and purposes
- Brand-specific databases (rth_prod, skillup_prod)
- Shared databases (tutorial_prod, people_prod, etc.)
- Complete table schemas with indexes
- Service-to-database mapping
- Connection management (Neon serverless)
- Migration strategy
- Security and performance

**Use this** when working with database queries, migrations, or understanding data flow.

---

## **QUICK REFERENCE**

### **admin.realtutorialhub.com Stack**

```
┌─────────────────────────────────────────────────────────────┐
│ USER BROWSER                                                │
│ https://admin.realtutorialhub.com                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ CLOUDFLARE WORKER (Edge Gateway)                            │
│ - Brand resolution: realtutorialhub                         │
│ - JWT validation (if authenticated)                         │
│ - Route: admin.realtutorialhub.com/* → quiz-admin-app      │
│ - Route: api.realtutorialhub.com/* → quiz-api-server       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ CLOUD RUN SERVICES (asia-southeast1)                        │
│                                                             │
│ ┌─────────────────────┐    ┌─────────────────────┐         │
│ │ quiz-admin-app      │    │ quiz-api-server     │         │
│ │ Port: 3002          │    │ Port: 3000          │         │
│ │ RAM: 1Gi            │    │ RAM: 2Gi            │         │
│ │ DB: tutorial_prod   │    │ DB: ALL 7 databases │         │
│ └─────────────────────┘    └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ NEON POSTGRESQL (AWS ap-southeast-1)                        │
│                                                             │
│ • rth_prod          - RTH authentication                    │
│ • skillup_prod      - SkillUp authentication                │
│ • tutorial_prod     - Tutorial content                      │
│ • people_prod       - Shadow users                          │
│ • quiz_platform_prod - Quiz platform                        │
│ • payment_prod      - Payments                              │
│ • placement_prod    - Placement                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **KEY URLS**

### **RealTutorialHub**
- **User Portal**: https://user.realtutorialhub.com
- **Admin Portal**: https://admin.realtutorialhub.com
- **API**: https://api.realtutorialhub.com

### **SkillUp IT Academy**
- **User Portal**: https://user.skillupitacademy.com
- **Admin Portal**: https://admin.skillupitacademy.com
- **Faculty Portal**: https://faculty.skillupitacademy.com
- **API**: https://api.skillupitacademy.com

### **SkillHubCore**
- **Quiz**: https://quiz.skillhubcore.in
- **Tutorial**: https://tutorial.skillhubcore.in
- **Placement**: https://placement.skillhubcore.in
- **API**: https://api.skillhubcore.in

---

## **AUTHENTICATION ENDPOINTS**

### **RealTutorialHub**
```bash
# User Login
POST https://api.realtutorialhub.com/api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Admin Login
POST https://api.realtutorialhub.com/api/admin/auth/login
{
  "email": "admin@realtutorialhub.com",
  "password": "admin123"
}
```

### **SkillUp IT Academy**
```bash
# User Login
POST https://api.skillupitacademy.com/api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Admin Login
POST https://api.skillupitacademy.com/api/admin/auth/login
{
  "email": "admin@skillupitacademy.com",
  "password": "admin123"
}
```

---

## **DATABASE CONNECTIONS**

### **Brand-Specific (Authentication)**
```bash
# RealTutorialHub
DATABASE_URL_RTH=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/rth_prod

# SkillUp IT Academy
DATABASE_URL_SKILLUP=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/skillup_prod
```

### **Shared (Content & Platform)**
```bash
# Tutorial Content
DATABASE_URL_TUTORIAL=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/tutorial_prod

# Shadow Users (Identity Bridge)
DATABASE_URL_PEOPLE=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/people_prod

# Quiz Platform
DATABASE_URL=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/quiz_platform_prod

# Payments
DATABASE_URL_PAYMENT=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/payment_prod

# Placement
DATABASE_URL_PLACEMENT=postgresql://user:pass@ep-xxx.aws-ap-southeast-1.neon.tech/placement_prod
```

---

## **DEPLOYMENT COMMANDS**

### **Deploy All Services**
```bash
# Trigger GitHub Actions workflow
gh workflow run deploy-cloudrun.yml --ref main -f scope=all
```

### **Deploy Specific Scope**
```bash
# Deploy quiz services only
gh workflow run deploy-cloudrun.yml --ref main -f scope=quiz

# Deploy tutorial services only
gh workflow run deploy-cloudrun.yml --ref main -f scope=tutorial

# Deploy skillup services only
gh workflow run deploy-cloudrun.yml --ref main -f scope=skillup
```

### **Deploy Gateway**
```bash
# Trigger gateway deployment
gh workflow run deploy-gateway.yml --ref main
```

### **Manual Deployment**
```bash
# Build and deploy quiz-admin-app
cd apps/realtutorialhub-admin
docker build -t quiz-admin-app .
docker push asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-admin-app:latest
gcloud run deploy quiz-admin-app --image asia-southeast1-docker.pkg.dev/[PROJECT]/quiz-platform/quiz-admin-app:latest --region asia-southeast1
```

---

## **MONITORING & DEBUGGING**

### **View Logs**
```bash
# Cloud Run logs
gcloud run services logs read quiz-admin-app --region asia-southeast1 --limit 100

# Cloudflare Worker logs
wrangler tail --env production
```

### **Health Checks**
```bash
# Check service health
curl https://api.realtutorialhub.com/api/health/live

# Check gateway health
curl https://admin.realtutorialhub.com/healthz
```

### **Database Access**
```bash
# Open Drizzle Studio
pnpm --filter @quiz/db-rth db:studio

# Run migrations
pnpm --filter @quiz/db-rth db:migrate
```

---

## **SECURITY CHECKLIST**

### **Authentication**
- ✅ JWT validated at edge (Cloudflare Worker)
- ✅ JWT re-validated at backend (API server)
- ✅ Brand validation (token brand matches hostname)
- ✅ Token type validation (admin/user separation)
- ✅ Blocked user check (real-time DB query)
- ✅ Audit logging (all auth events)

### **Authorization**
- ✅ RBAC implemented (role-based access control)
- ✅ Brand isolation (separate databases)
- ✅ Admin role check (queries brand-specific DB)
- ✅ Resource-level permissions

### **Data Security**
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.2+)
- ✅ Password hashing (bcrypt cost 10)
- ✅ Token hashing (bcrypt cost 10)
- ✅ Secrets management (GCP Secret Manager)

### **Network Security**
- ✅ HTTPS only (TLS termination at Cloudflare)
- ✅ CORS configured
- ✅ Rate limiting (at edge)
- ✅ DDoS protection (Cloudflare)

---

## **PERFORMANCE METRICS**

| Metric | Target | Actual |
|--------|--------|--------|
| Edge Latency | < 50ms | ~30ms |
| Backend Latency | < 300ms | ~150ms |
| JWT Validation | < 10ms | ~5ms |
| Database Query | < 50ms | ~30ms |
| Page Load Time | < 2s | ~1.5s |
| API Response Time | < 500ms | ~200ms |

---

## **TROUBLESHOOTING**

### **Common Issues**

#### **1. Authentication Failed**
```bash
# Check JWT secret
echo $ADMIN_JWT_SECRET

# Verify token
curl -H "Authorization: Bearer $TOKEN" https://api.realtutorialhub.com/api/admin/users

# Check Cloudflare Worker logs
wrangler tail --env production
```

#### **2. Database Connection Failed**
```bash
# Test connection
psql $DATABASE_URL_RTH

# Check secret
gcloud secrets versions access latest --secret="DATABASE_URL_RTH"

# Verify service has access
gcloud run services describe quiz-api-server --region asia-southeast1
```

#### **3. Deployment Failed**
```bash
# Check GitHub Actions logs
gh run list --workflow=deploy-cloudrun.yml

# View specific run
gh run view [RUN_ID]

# Check Cloud Run service
gcloud run services describe quiz-admin-app --region asia-southeast1
```

#### **4. Brand Mismatch**
```bash
# Verify x-brand header
curl -v https://api.realtutorialhub.com/api/health/live

# Check gateway routing
# File: services/api-gateway/src/routes/routing-table.ts
```

---

## **ARCHITECTURE DECISIONS**

### **Why Cloudflare Workers?**
- **Global Edge Network**: Reduces latency for users worldwide
- **JWT Validation at Edge**: Reduces backend load by 80%
- **Smart Placement**: Executes closer to Singapore backend
- **DDoS Protection**: Built-in security
- **Cost-Effective**: Pay per request, no idle costs

### **Why Neon PostgreSQL?**
- **Serverless**: Auto-scaling connections, no management overhead
- **Low Latency**: Sub-50ms queries from Singapore
- **Point-in-Time Recovery**: Easy rollback
- **Cost-Effective**: Pay for storage + compute used
- **Developer Experience**: Excellent Drizzle ORM integration

### **Why Brand-Specific Databases?**
- **Data Isolation**: Complete separation of user data
- **Compliance**: Easier to meet data residency requirements
- **Security**: Breach in one brand doesn't affect others
- **Performance**: Smaller databases = faster queries
- **Scalability**: Can scale brands independently

### **Why Shadow Users?**
- **Cross-Brand Features**: Shared tutorial progress, payments
- **Single Identity**: User with same email on both brands
- **Privacy**: Brand-specific data stays isolated
- **Flexibility**: Easy to add new brands

---

## **FUTURE ENHANCEMENTS**

### **Short Term (1-3 months)**
- [ ] Add Redis caching for frequently accessed data
- [ ] Implement GraphQL API for frontend
- [ ] Add real-time notifications (WebSockets)
- [ ] Improve monitoring with custom dashboards

### **Medium Term (3-6 months)**
- [ ] Implement CDN for static assets
- [ ] Add multi-region deployment (US, EU)
- [ ] Implement advanced analytics
- [ ] Add A/B testing framework

### **Long Term (6-12 months)**
- [ ] Migrate to Kubernetes (GKE)
- [ ] Implement service mesh (Istio)
- [ ] Add machine learning features
- [ ] Implement advanced security (WAF, SIEM)

---

## **CONTACT & SUPPORT**

### **Documentation**
- **Location**: `docs/infrastructure/`
- **Last Updated**: 2026-05-04
- **Version**: 1.0.0

### **Team**
- **DevOps**: devops@realtutorialhub.com
- **Backend**: backend@realtutorialhub.com
- **Security**: security@realtutorialhub.com

### **Emergency Contacts**
- **On-Call**: +1-XXX-XXX-XXXX
- **Slack**: #infrastructure-alerts
- **PagerDuty**: https://realtutorialhub.pagerduty.com

---

## **CHANGELOG**

### **Version 1.0.0** (2026-05-04)
- Initial comprehensive infrastructure documentation
- Documented all 10 Cloud Run services
- Documented 7 Neon PostgreSQL databases
- Documented Cloudflare Worker gateway
- Documented authentication & authorization flows
- Documented database schemas and access patterns

---

**END OF DOCUMENTATION**

For detailed information, refer to the individual documentation files listed above.
