# 10 - MIGRATION PLAN (PART 1)
## Overview and Phase 1-2

---

## **1. MIGRATION OVERVIEW**

### **1.1 Migration Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│ MIGRATION APPROACH: STRANGLER FIG PATTERN                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Monolith                                           │
│  ├─ Keep running in production                              │
│  ├─ Gradually extract services                              │
│  └─ Route traffic to new services incrementally             │
│                                                             │
│  New Services                                               │
│  ├─ Build alongside monolith                                │
│  ├─ Test thoroughly before switching                        │
│  └─ Rollback to monolith if issues                          │
│                                                             │
│  Benefits                                                   │
│  ├─ Zero downtime migration                                 │
│  ├─ Low risk (can rollback anytime)                         │
│  ├─ Incremental value delivery                              │
│  └─ Learn and adjust as you go                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **1.2 Migration Timeline**

```
┌─────────────────────────────────────────────────────────────┐
│ 8-12 MONTH MIGRATION TIMELINE                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Identity Consolidation (2-3 months)               │
│  ├─ Build Identity Service                                  │
│  ├─ Migrate user data                                       │
│  ├─ Dual-write period                                       │
│  └─ Switch to Identity Service                              │
│                                                             │
│  Phase 2: Service Extraction (3-4 months)                   │
│  ├─ Extract Tutorial Service                                │
│  ├─ Extract Exam Service                                    │
│  ├─ Extract Placement Service                               │
│  └─ Extract Training Service                                │
│                                                             │
│  Phase 3: API Gateway (1 month)                             │
│  ├─ Deploy Kong Gateway                                     │
│  ├─ Configure routing                                       │
│  ├─ Migrate traffic                                         │
│  └─ Decommission Cloudflare Worker                          │
│                                                             │
│  Phase 4: BFF Implementation (1-2 months)                   │
│  ├─ Build SkillUp BFF                                       │
│  ├─ Build RealTutorialHub BFF                               │
│  ├─ Migrate frontend                                        │
│  └─ Optimize performance                                    │
│                                                             │
│  Phase 5: Advanced Features (2-3 months)                    │
│  ├─ Implement event sourcing                                │
│  ├─ Add CQRS where needed                                   │
│  ├─ Implement Saga pattern                                  │
│  └─ Optimize and tune                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **1.3 Team Structure**

```
┌─────────────────────────────────────────────────────────────┐
│ MIGRATION TEAM (8-10 ENGINEERS)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Migration Lead (1)                                         │
│  ├─ Overall coordination                                    │
│  ├─ Risk management                                         │
│  └─ Stakeholder communication                               │
│                                                             │
│  Backend Engineers (4-5)                                    │
│  ├─ Service development                                     │
│  ├─ Database migration                                      │
│  └─ API implementation                                      │
│                                                             │
│  Frontend Engineers (2)                                     │
│  ├─ BFF integration                                         │
│  ├─ Frontend migration                                      │
│  └─ Performance optimization                                │
│                                                             │
│  DevOps Engineer (1)                                        │
│  ├─ Infrastructure setup                                    │
│  ├─ CI/CD pipeline                                          │
│  └─ Monitoring and alerting                                 │
│                                                             │
│  QA Engineer (1)                                            │
│  ├─ Test planning                                           │
│  ├─ Integration testing                                     │
│  └─ Performance testing                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **2. PHASE 1: IDENTITY CONSOLIDATION**

**Duration**: 2-3 months  
**Goal**: Single Identity Service for all tenants  
**Risk**: Medium

### **2.1 Week 1-2: Planning and Setup**

**Tasks**:
- [ ] Review current authentication architecture
- [ ] Design Identity Service schema
- [ ] Set up development environment
- [ ] Create project repository
- [ ] Set up CI/CD pipeline

**Deliverables**:
- Identity Service architecture document
- Database schema design
- Development environment ready
- CI/CD pipeline configured

**Team**:
- Migration Lead: Architecture review
- Backend Engineers (2): Schema design, setup
- DevOps Engineer: Infrastructure setup

### **2.2 Week 3-4: Identity Service Development**

**Tasks**:
- [ ] Implement user registration
- [ ] Implement login/logout
- [ ] Implement JWT token generation
- [ ] Implement password reset
- [ ] Implement email verification
- [ ] Write unit tests

**Code Example**:

```typescript
// Identity Service - User Registration
export async function registerUser(data: RegisterUserDto) {
  // Validate input
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    throw new ValidationError(validation.error);
  }
  
  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  
  if (existingUser.length > 0) {
    throw new ConflictError('User already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: passwordHash,
      name: data.name,
      emailVerified: false
    })
    .returning();
  
  // Add user to tenant
  await db.insert(userTenants).values({
    userId: user.id,
    tenantId: data.tenantId
  });
  
  // Assign default role
  const [studentRole] = await db
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.tenantId, data.tenantId),
        eq(roles.name, 'student')
      )
    )
    .limit(1);
  
  await db.insert(userRoles).values({
    userId: user.id,
    roleId: studentRole.id,
    tenantId: data.tenantId
  });
  
  // Send verification email
  await emailService.sendVerificationEmail(user.email, user.id);
  
  // Publish event
  await eventBus.publish('user.registered', {
    userId: user.id,
    tenantId: data.tenantId,
    email: user.email,
    name: user.name
  });
  
  return user;
}
```

**Deliverables**:
- Identity Service MVP
- Unit tests (>80% coverage)
- API documentation

**Team**:
- Backend Engineers (3): Development
- QA Engineer: Test planning

### **2.3 Week 5-6: Multi-Tenant Support**

**Tasks**:
- [ ] Implement tenant management
- [ ] Implement role management
- [ ] Implement permission system
- [ ] Implement tenant switching
- [ ] Write integration tests

**Code Example**:

```typescript
// Tenant switching
export async function switchTenant(userId: string, tenantId: string) {
  // Check if user belongs to tenant
  const membership = await db
    .select()
    .from(userTenants)
    .where(
      and(
        eq(userTenants.userId, userId),
        eq(userTenants.tenantId, tenantId)
      )
    )
    .limit(1);
  
  if (membership.length === 0) {
    throw new ForbiddenError('User not member of tenant');
  }
  
  // Get user roles in tenant
  const roles = await db
    .select({
      role: roles
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.tenantId, tenantId)
      )
    );
  
  // Get permissions
  const permissions = roles.flatMap(r => r.role.permissions);
  
  // Generate new JWT
  const token = jwt.sign({
    userId: userId,
    tenantId: tenantId,
    permissions: permissions
  }, JWT_SECRET, {
    expiresIn: '7d'
  });
  
  return { token };
}
```

**Deliverables**:
- Multi-tenant support
- Role and permission system
- Integration tests

**Team**:
- Backend Engineers (2): Development
- QA Engineer: Integration testing

### **2.4 Week 7-8: Data Migration Preparation**

**Tasks**:
- [ ] Analyze current user data
- [ ] Write migration scripts
- [ ] Test migration on staging data
- [ ] Create rollback scripts
- [ ] Document migration process

**Migration Script**:

```typescript
// Migration script: rth_prod.users → identity_db.users
import { Pool } from 'pg';

const rthPool = new Pool({
  connectionString: process.env.RTH_DATABASE_URL
});

const identityPool = new Pool({
  connectionString: process.env.IDENTITY_DATABASE_URL
});

async function migrateUsers() {
  console.log('Starting user migration...');
  
  // Get RTH tenant ID
  const [rthTenant] = await identityPool.query(
    'SELECT id FROM tenants WHERE slug = $1',
    ['rth']
  );
  
  // Get SkillUp tenant ID
  const [skillupTenant] = await identityPool.query(
    'SELECT id FROM tenants WHERE slug = $1',
    ['skillup']
  );
  
  // Migrate RTH users
  const rthUsers = await rthPool.query('SELECT * FROM users');
  
  for (const user of rthUsers.rows) {
    try {
      // Insert into identity_db
      const [newUser] = await identityPool.query(
        `INSERT INTO users (email, password_hash, name, avatar, email_verified, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           avatar = EXCLUDED.avatar
         RETURNING id`,
        [
          user.email,
          user.password_hash,
          user.name,
          user.avatar,
          user.email_verified,
          user.created_at
        ]
      );
      
      // Add to RTH tenant
      await identityPool.query(
        `INSERT INTO user_tenants (user_id, tenant_id, joined_at)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [newUser.id, rthTenant.id, user.created_at]
      );
      
      // Migrate roles
      await migrateUserRoles(user.id, newUser.id, rthTenant.id);
      
      console.log(`Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
  
  console.log('User migration complete!');
}

async function migrateUserRoles(oldUserId: string, newUserId: string, tenantId: string) {
  // Get user's roles from old database
  const roles = await rthPool.query(
    'SELECT role FROM user_roles WHERE user_id = $1',
    [oldUserId]
  );
  
  for (const role of roles.rows) {
    // Find corresponding role in new database
    const [newRole] = await identityPool.query(
      'SELECT id FROM roles WHERE tenant_id = $1 AND name = $2',
      [tenantId, role.role]
    );
    
    if (newRole) {
      // Insert user role
      await identityPool.query(
        `INSERT INTO user_roles (user_id, role_id, tenant_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [newUserId, newRole.id, tenantId]
      );
    }
  }
}

// Run migration
migrateUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

**Deliverables**:
- Migration scripts
- Rollback scripts
- Migration documentation
- Test results

**Team**:
- Backend Engineers (2): Script development
- QA Engineer: Testing

### **2.5 Week 9-10: Dual-Write Implementation**

**Tasks**:
- [ ] Implement dual-write in monolith
- [ ] Write to both old and new databases
- [ ] Monitor for inconsistencies
- [ ] Fix any data sync issues

**Dual-Write Code**:

```typescript
// In monolith: Write to both databases
export async function registerUser(data: RegisterUserDto) {
  // Write to old database (rth_prod or skillup_prod)
  const oldUser = await oldDb.insert(users).values({
    email: data.email,
    password_hash: await bcrypt.hash(data.password, 10),
    name: data.name
  }).returning();
  
  try {
    // Write to new Identity Service
    await fetch(`${IDENTITY_SERVICE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
        tenantId: data.tenantId
      })
    });
  } catch (error) {
    // Log error but don't fail (old database is source of truth)
    logger.error('Failed to write to Identity Service', {
      error: error.message,
      userId: oldUser.id
    });
  }
  
  return oldUser;
}
```

**Deliverables**:
- Dual-write implementation
- Monitoring dashboard
- Inconsistency reports

**Team**:
- Backend Engineers (2): Implementation
- DevOps Engineer: Monitoring setup

### **2.6 Week 11-12: Production Migration**

**Tasks**:
- [ ] Run migration on production data
- [ ] Verify data integrity
- [ ] Switch authentication to Identity Service
- [ ] Monitor for issues
- [ ] Keep dual-write for 1 week

**Migration Checklist**:

```
Pre-Migration:
├─ [ ] Backup all databases
├─ [ ] Test migration scripts on staging
├─ [ ] Prepare rollback plan
├─ [ ] Schedule maintenance window
└─ [ ] Notify users

Migration:
├─ [ ] Run migration scripts
├─ [ ] Verify user count matches
├─ [ ] Verify roles migrated correctly
├─ [ ] Test login for sample users
└─ [ ] Check for errors in logs

Post-Migration:
├─ [ ] Monitor error rates
├─ [ ] Monitor login success rate
├─ [ ] Check for data inconsistencies
├─ [ ] Keep dual-write for 1 week
└─ [ ] Gather user feedback
```

**Deliverables**:
- Migrated production data
- Identity Service in production
- Monitoring and alerts
- Migration report

**Team**:
- All team members: Migration execution
- Migration Lead: Coordination

---

## **3. PHASE 2: SERVICE EXTRACTION**

**Duration**: 3-4 months  
**Goal**: Extract Tutorial, Exam, Placement, Training services  
**Risk**: Medium-High

### **3.1 Service Extraction Order**

```
1. Tutorial Service (Month 1)
   ├─ Least complex
   ├─ Fewest dependencies
   └─ Good learning experience

2. Exam Service (Month 2)
   ├─ Medium complexity
   ├─ Depends on Tutorial Service
   └─ Critical for business

3. Placement Service (Month 2-3)
   ├─ Medium complexity
   ├─ Independent from other services
   └─ SkillUp specific

4. Training Service (Month 3)
   ├─ Medium complexity
   ├─ Independent from other services
   └─ RealTutorialHub specific
```

### **3.2 Tutorial Service Extraction**

**Week 1-2: Service Development**

**Tasks**:
- [ ] Create Tutorial Service repository
- [ ] Design database schema
- [ ] Implement CRUD operations
- [ ] Implement search functionality
- [ ] Write unit tests

**Database Schema**:

```sql
-- Tutorial Service database
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail VARCHAR(500),
  difficulty VARCHAR(20),
  duration_minutes INTEGER,
  visibility VARCHAR(20) DEFAULT 'public',
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE tutorial_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  section_id UUID REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE (tenant_id, tutorial_id, user_id, section_id)
);

-- Indexes
CREATE INDEX idx_tutorials_tenant ON tutorials(tenant_id);
CREATE INDEX idx_tutorials_status ON tutorials(status);
CREATE INDEX idx_tutorial_sections_tutorial ON tutorial_sections(tutorial_id);
CREATE INDEX idx_tutorial_progress_user ON tutorial_progress(user_id);

-- Enable RLS
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY tenant_isolation ON tutorials
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation ON tutorial_sections
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation ON tutorial_progress
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**API Implementation**:

```typescript
// Tutorial Service API
import express from 'express';
import { authenticate, requirePermission } from './middleware';

const app = express();

// Get all tutorials
app.get('/tutorials',
  authenticate,
  requirePermission('tutorials:read'),
  async (req, res) => {
    const { tenantId } = req.user;
    const { page = 1, limit = 20, status, difficulty } = req.query;
    
    let query = db
      .select()
      .from(tutorials)
      .where(eq(tutorials.tenantId, tenantId));
    
    if (status) {
      query = query.where(eq(tutorials.status, status));
    }
    
    if (difficulty) {
      query = query.where(eq(tutorials.difficulty, difficulty));
    }
    
    const results = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(tutorials.createdAt));
    
    res.json({
      data: results,
      pagination: {
        page: page,
        limit: limit,
        total: results.length
      }
    });
  }
);

// Get tutorial by ID
app.get('/tutorials/:id',
  authenticate,
  requirePermission('tutorials:read'),
  async (req, res) => {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    const [tutorial] = await db
      .select()
      .from(tutorials)
      .where(
        and(
          eq(tutorials.id, id),
          eq(tutorials.tenantId, tenantId)
        )
      )
      .limit(1);
    
    if (!tutorial) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }
    
    // Get sections
    const sections = await db
      .select()
      .from(tutorialSections)
      .where(eq(tutorialSections.tutorialId, id))
      .orderBy(tutorialSections.orderIndex);
    
    res.json({
      ...tutorial,
      sections: sections
    });
  }
);

// Create tutorial
app.post('/tutorials',
  authenticate,
  requirePermission('tutorials:write'),
  async (req, res) => {
    const { tenantId, userId } = req.user;
    const data = req.body;
    
    const [tutorial] = await db
      .insert(tutorials)
      .values({
        ...data,
        tenantId: tenantId,
        createdBy: userId
      })
      .returning();
    
    // Publish event
    await eventBus.publish('tutorial.created', {
      tutorialId: tutorial.id,
      tenantId: tenantId,
      createdBy: userId
    });
    
    res.status(201).json(tutorial);
  }
);

app.listen(8082);
```

**Week 3-4: Data Migration**

**Tasks**:
- [ ] Write migration scripts
- [ ] Test on staging data
- [ ] Run production migration
- [ ] Verify data integrity

**Week 5-6: Traffic Migration**

**Tasks**:
- [ ] Deploy Tutorial Service
- [ ] Route 10% traffic to new service
- [ ] Monitor for errors
- [ ] Gradually increase to 100%
- [ ] Decommission old code

**Deliverables**:
- Tutorial Service in production
- Migrated data
- 100% traffic on new service

---

**Continue to Part 2**: 10-MIGRATION-PLAN-02-PHASES-3-5.md

