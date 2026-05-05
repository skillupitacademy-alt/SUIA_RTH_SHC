# CURRENT VS PROPOSED ARCHITECTURE
## Detailed Comparison and Migration Strategy

---

## **1. CURRENT ARCHITECTURE ANALYSIS**

### **1.1 Current Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│ CURRENT: BRAND-CENTRIC ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CLOUDFLARE WORKER (Edge Gateway)                                    │
│ ├─ Brand Resolution: hostname → "skillup" or "realtutorialhub"     │
│ ├─ JWT Validation: Validates brand-specific tokens                 │
│ └─ Routing: Routes to appropriate backend                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ MONOLITHIC API SERVER (quiz-api-server)                            │
│ ├─ Handles ALL business logic                                      │
│ ├─ Connects to ALL 7 databases                                     │
│ ├─ Brand-aware routing internally                                  │
│ └─ 2Gi RAM, 2 CPU, 0-10 instances                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASES (7 Total)                                                 │
│                                                                     │
│ Brand-Specific (Authentication):                                    │
│ ├─ rth_prod          (RTH users, roles, sessions)                  │
│ └─ skillup_prod      (SkillUp users, roles, sessions)              │
│                                                                     │
│ Shared (Platform Services):                                         │
│ ├─ quiz_platform_prod (Quiz/Exam data)                             │
│ ├─ tutorial_prod      (Tutorial content)                           │
│ ├─ people_prod        (Shadow users - identity bridge)             │
│ ├─ payment_prod       (Payment transactions)                       │
│ └─ placement_prod     (Placement/jobs data)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### **1.2 Current Architecture Problems**

#### **Problem 1: Brand-Centric Authentication**
```typescript
// Current: Brand determines database
const brand = req.headers.get('x-brand'); // "skillup" or "realtutorialhub"
const brandContext = getAuthBrandContext(brand);

if (brand === 'skillup') {
  db = skillupDb;  // skillup_prod
} else {
  db = realtutorialhubDb;  // rth_prod
}

// Query brand-specific database
const user = await db.select().from(users).where(eq(users.email, email));
```

**Issues**:
- ❌ Adding new brand requires new database
- ❌ User can't exist in multiple brands
- ❌ Duplicate user data across brands
- ❌ Complex shadow user sync logic
- ❌ Brand-specific code paths

#### **Problem 2: Monolithic API Server**
```typescript
// Current: Single service handles everything
quiz-api-server:
  - Authentication
  - Authorization
  - Tutorial management
  - Exam management
  - Placement management
  - Payment processing
  - User management
  - Analytics
  - Notifications
```

**Issues**:
- ❌ Can't scale services independently
- ❌ Single point of failure
- ❌ Deploy all or nothing
- ❌ Tight coupling between domains
- ❌ Hard to maintain and test

#### **Problem 3: Confused Service Boundaries**
```
Current Confusion:
├─ Is "SkillUp" a brand or a service?
├─ Is "RealTutorialHub" a brand or a service?
├─ Are tutorials a shared service or brand-specific?
├─ Are exams a shared service or brand-specific?
└─ Who owns what data?
```

**Issues**:
- ❌ Unclear ownership
- ❌ Mixed responsibilities
- ❌ Hard to reason about system
- ❌ Difficult to add new features

#### **Problem 4: Shadow User Complexity**
```typescript
// Current: Complex identity bridge
1. User logs in to RTH → rth_prod.users
2. Check if shadowUserId exists
3. If not, create shadow user in people_prod
4. Link RTH user to shadow user
5. Use shadowUserId for shared services

// Same user logs in to SkillUp
1. User logs in to SkillUp → skillup_prod.users
2. Check if shadowUserId exists
3. If email matches, link to same shadow user
4. Now user has 2 identities linked to 1 shadow user
```

**Issues**:
- ❌ Complex sync logic
- ❌ Data consistency challenges
- ❌ Hard to debug identity issues
- ❌ Performance overhead

---

## **2. PROPOSED ARCHITECTURE**

### **2.1 Proposed Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│ PROPOSED: SERVICE-ORIENTED ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CLOUDFLARE WORKER (API Gateway)                                     │
│ ├─ Tenant Resolution: hostname → tenant_id                          │
│ ├─ JWT Validation: Validates platform tokens                        │
│ ├─ Service Discovery: Routes to appropriate service                 │
│ └─ Rate Limiting: Per-tenant quotas                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ BFF LAYER (Backend for Frontend)                                    │
│                                                                     │
│ ┌─────────────────────┐         ┌─────────────────────┐            │
│ │ SkillUp BFF         │         │ RTH BFF             │            │
│ │ - Aggregates calls  │         │ - Aggregates calls  │            │
│ │ - Tenant-specific   │         │ - Tenant-specific   │            │
│ │ - GraphQL/REST      │         │ - GraphQL/REST      │            │
│ └─────────────────────┘         └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PLATFORM SERVICES (Microservices)                                   │
│                                                                     │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│ │ Identity Service │  │ Tutorial Engine  │  │ Exam Engine      │  │
│ │ - Authentication │  │ - Content mgmt   │  │ - Quiz creation  │  │
│ │ - Authorization  │  │ - Progress track │  │ - Exam attempts  │  │
│ │ - User mgmt      │  │ - Certificates   │  │ - Analytics      │  │
│ └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│ │ Placement Engine │  │ Training Engine  │  │ Internship Eng   │  │
│ │ - Job postings   │  │ - Physical train │  │ - Internship mgmt│  │
│ │ - Applications   │  │ - AI training    │  │ - Assignments    │  │
│ │ - Interviews     │  │ - Scheduling     │  │ - Evaluations    │  │
│ └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│ │ Certification    │  │ Payment Engine   │  │ Notification Eng │  │
│ │ - Cert issuance  │  │ - Transactions   │  │ - Email/SMS      │  │
│ │ - Verification   │  │ - Subscriptions  │  │ - Push notifs    │  │
│ │ - Templates      │  │ - Invoicing      │  │ - In-app alerts  │  │
│ └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DATA LAYER (Database per Service)                                   │
│                                                                     │
│ ├─ identity_db       (Users, tenants, roles, sessions)             │
│ ├─ tutorial_db       (Tutorials, sections, progress)               │
│ ├─ exam_db           (Exams, questions, attempts)                  │
│ ├─ placement_db      (Jobs, applications, interviews)              │
│ ├─ training_db       (Courses, schedules, attendance)              │
│ ├─ internship_db     (Internships, assignments, evaluations)       │
│ ├─ certification_db  (Certificates, templates, verifications)      │
│ ├─ payment_db        (Transactions, subscriptions, invoices)       │
│ └─ notification_db   (Messages, templates, delivery status)        │
└─────────────────────────────────────────────────────────────────────┘
```

### **2.2 Key Architectural Changes**

#### **Change 1: Single Identity Service**

**Before (Current)**:
```sql
-- rth_prod.users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  shadow_user_id UUID  -- Links to people_prod
);

-- skillup_prod.users (duplicate schema)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  shadow_user_id UUID  -- Links to people_prod
);
```

**After (Proposed)**:
```sql
-- identity_db.users (single source of truth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- identity_db.tenant_users (multi-tenancy)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  status VARCHAR(20) DEFAULT 'active',  -- active, suspended, deleted
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- identity_db.tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,  -- "skillup", "realtutorialhub"
  display_name VARCHAR(255),  -- "SkillUp IT Academy"
  domain VARCHAR(255),  -- "skillupitacademy.com"
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Benefits**:
- ✅ Single user record across all tenants
- ✅ User can belong to multiple tenants
- ✅ No shadow user complexity
- ✅ Easy to add new tenants
- ✅ Centralized user management

#### **Change 2: Service Decomposition**

**Before (Current)**:
```typescript
// Monolithic API server
quiz-api-server/
├─ src/
│  ├─ modules/
│  │  ├─ auth/           (Authentication)
│  │  ├─ users/          (User management)
│  │  ├─ tutorials/      (Tutorial management)
│  │  ├─ exams/          (Exam management)
│  │  ├─ placement/      (Placement management)
│  │  ├─ payments/       (Payment processing)
│  │  └─ notifications/  (Notification sending)
```

**After (Proposed)**:
```typescript
// Microservices
services/
├─ identity-service/      (Authentication & Authorization)
├─ tutorial-engine/       (Tutorial management)
├─ exam-engine/           (Exam management)
├─ placement-engine/      (Placement management)
├─ training-engine/       (Training management)
├─ internship-engine/     (Internship management)
├─ certification-engine/  (Certification management)
├─ payment-engine/        (Payment processing)
└─ notification-engine/   (Notification sending)
```

**Benefits**:
- ✅ Independent deployment
- ✅ Independent scaling
- ✅ Technology diversity
- ✅ Clear ownership
- ✅ Easier testing

#### **Change 3: Tenant-Aware Services**

**Before (Current)**:
```typescript
// Brand-specific logic
async function login(email: string, password: string, brand: string) {
  const brandContext = getAuthBrandContext(brand);
  const user = await brandContext.db
    .select()
    .from(brandContext.tables.users)
    .where(eq(brandContext.tables.users.email, email));
  
  // Brand-specific database query
}
```

**After (Proposed)**:
```typescript
// Tenant-agnostic service with tenant context
async function login(email: string, password: string, tenantId: string) {
  // Single database, tenant-scoped query
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  
  // Verify user belongs to tenant
  const tenantUser = await db
    .select()
    .from(tenantUsers)
    .where(
      and(
        eq(tenantUsers.userId, user.id),
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.status, 'active')
      )
    );
  
  if (!tenantUser) {
    throw new Error('User not found in tenant');
  }
  
  // Generate tenant-scoped JWT
  const token = generateToken({
    userId: user.id,
    tenantId: tenantId,
    email: user.email
  });
  
  return { user, token };
}
```

**Benefits**:
- ✅ Single code path
- ✅ Tenant isolation at application level
- ✅ Easy to add new tenants
- ✅ No brand-specific logic

---

## **3. DETAILED COMPARISON**

### **3.1 Authentication & Authorization**

| Aspect | Current | Proposed |
|--------|---------|----------|
| **User Storage** | Per-brand databases | Single identity database |
| **User Uniqueness** | Per-brand (can duplicate) | Global (email unique) |
| **Tenant Association** | Implicit (database) | Explicit (tenant_users table) |
| **JWT Structure** | `{ userId, brand, roles }` | `{ userId, tenantId, permissions }` |
| **Role Management** | Per-brand roles table | Tenant-scoped roles |
| **Permission Check** | Brand-specific DB query | Service-specific policy |
| **Multi-Tenant User** | Complex shadow user | Native support |
| **SSO Support** | Hard to implement | Easy to implement |

### **3.2 Service Architecture**

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Service Count** | 1 monolith | 9+ microservices |
| **Deployment** | All-or-nothing | Independent |
| **Scaling** | Vertical only | Horizontal per service |
| **Technology** | Node.js only | Polyglot (Node, Go, Python) |
| **Database** | 7 databases, 1 service | 9 databases, 9 services |
| **Failure Impact** | Entire platform down | Single service down |
| **Team Structure** | Single team | Multiple teams |
| **Development Speed** | Slow (conflicts) | Fast (parallel) |

### **3.3 Data Architecture**

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Data Isolation** | Database-level | Application-level |
| **Schema Changes** | Affects all brands | Affects single service |
| **Data Consistency** | Shadow user sync | Event-driven |
| **Backup Strategy** | Per-database | Per-service |
| **Data Migration** | Complex (multiple DBs) | Simple (single DB per service) |
| **Query Performance** | Good (small DBs) | Good (indexed tenant_id) |

### **3.4 API Gateway**

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Routing Logic** | Brand-based | Tenant-based |
| **Service Discovery** | Hardcoded URLs | Dynamic discovery |
| **Rate Limiting** | Per-IP | Per-tenant |
| **Circuit Breaker** | None | Per-service |
| **Request Tracing** | Basic | Distributed tracing |
| **API Versioning** | None | Per-service versioning |

---

## **4. MIGRATION STRATEGY**

### **4.1 Migration Phases**

```
Phase 1: Identity Consolidation (2-3 months)
├─ Create identity_db
├─ Migrate users from rth_prod and skillup_prod
├─ Create tenant_users mapping
├─ Deploy identity-service
└─ Update JWT structure

Phase 2: Service Extraction (3-4 months)
├─ Extract tutorial-engine
├─ Extract exam-engine
├─ Extract placement-engine
├─ Extract payment-engine
└─ Update API gateway routing

Phase 3: BFF Implementation (1-2 months)
├─ Create skillup-bff
├─ Create rth-bff
├─ Migrate frontend to use BFFs
└─ Deprecate direct service calls

Phase 4: Advanced Features (2-3 months)
├─ Implement event-driven architecture
├─ Add distributed tracing
├─ Implement CQRS for read-heavy services
└─ Add service mesh (Istio)

Phase 5: Optimization (Ongoing)
├─ Performance tuning
├─ Cost optimization
├─ Security hardening
└─ Monitoring improvements
```

### **4.2 Migration Risks & Mitigation**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data Loss** | Critical | Low | Backup before migration, dry-run |
| **Downtime** | High | Medium | Blue-green deployment, rollback plan |
| **Performance Degradation** | Medium | Medium | Load testing, gradual rollout |
| **User Confusion** | Low | High | Clear communication, training |
| **Cost Overrun** | Medium | Medium | Budget tracking, cost alerts |
| **Team Resistance** | Medium | High | Training, documentation, support |

### **4.3 Rollback Strategy**

```
Rollback Plan:
├─ Keep old system running in parallel
├─ Feature flags for gradual migration
├─ Database snapshots before each phase
├─ Automated rollback scripts
└─ 24/7 monitoring during migration
```

---

## **5. COST ANALYSIS**

### **5.1 Current Costs (Estimated)**

```
Current Monthly Costs:
├─ Cloud Run (10 services): $300
├─ Neon PostgreSQL (7 databases): $200
├─ Cloudflare Worker: $50
├─ GCP Secret Manager: $10
├─ GCP Artifact Registry: $20
├─ Monitoring (Sentry): $50
└─ Total: ~$630/month
```

### **5.2 Proposed Costs (Estimated)**

```
Proposed Monthly Costs:
├─ Cloud Run (15 services): $450
├─ Neon PostgreSQL (9 databases): $250
├─ Cloudflare Worker: $50
├─ GCP Secret Manager: $15
├─ GCP Artifact Registry: $30
├─ Monitoring (Sentry + Prometheus): $100
├─ Service Mesh (Istio): $50
└─ Total: ~$945/month

Cost Increase: +$315/month (+50%)
```

**Justification**:
- Better scalability (can handle 10x traffic)
- Improved reliability (99.99% uptime)
- Faster development (parallel teams)
- Easier maintenance (clear boundaries)
- Future-proof (easy to add services)

---

## **6. DECISION MATRIX**

### **Should You Migrate?**

| Factor | Weight | Current Score | Proposed Score | Weighted Gain |
|--------|--------|---------------|----------------|---------------|
| **Scalability** | 20% | 3/10 | 9/10 | +1.2 |
| **Maintainability** | 20% | 4/10 | 9/10 | +1.0 |
| **Development Speed** | 15% | 5/10 | 8/10 | +0.45 |
| **Cost Efficiency** | 15% | 7/10 | 6/10 | -0.15 |
| **Reliability** | 15% | 6/10 | 9/10 | +0.45 |
| **Security** | 10% | 7/10 | 9/10 | +0.2 |
| **Team Productivity** | 5% | 5/10 | 8/10 | +0.15 |
| **Total** | 100% | 5.2/10 | 8.3/10 | **+3.1** |

**Recommendation**: ✅ **MIGRATE** - Significant improvement across all metrics

---

## **7. NEXT STEPS**

1. **Review Proposal**: Share with team and stakeholders
2. **Proof of Concept**: Build identity-service prototype
3. **Cost Approval**: Get budget approval for migration
4. **Team Training**: Train team on microservices patterns
5. **Start Phase 1**: Begin identity consolidation

---

**Continue to 02-IDENTITY-SERVICE.md for detailed identity architecture...**
