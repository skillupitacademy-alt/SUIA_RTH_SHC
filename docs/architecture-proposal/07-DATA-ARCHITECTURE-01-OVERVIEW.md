# 07 - DATA ARCHITECTURE (PART 1)
## Database Patterns and Multi-Tenant Data Isolation

---

## **1. OVERVIEW**

### **1.1 Data Architecture Principles**

The proposed architecture follows these core principles:

```
┌─────────────────────────────────────────────────────────────┐
│ DATA ARCHITECTURE PRINCIPLES                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Database per Service                                    │
│     ├─ Each service owns its data                           │
│     ├─ No direct database access between services           │
│     └─ Data access only through service APIs                │
│                                                             │
│  2. Multi-Tenant Isolation                                  │
│     ├─ Shared database with tenant_id column                │
│     ├─ Row-Level Security (RLS) enforcement                 │
│     └─ Application-level tenant filtering                   │
│                                                             │
│  3. Event-Driven Communication                              │
│     ├─ Services communicate via events                      │
│     ├─ Eventual consistency model                           │
│     └─ Event sourcing for audit trail                       │
│                                                             │
│  4. Data Consistency                                        │
│     ├─ Strong consistency within service                    │
│     ├─ Eventual consistency across services                 │
│     └─ Saga pattern for distributed transactions            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **2. DATABASE PER SERVICE PATTERN**

### **2.1 Service Database Ownership**

Each service has its own database schema:

```
┌─────────────────────────────────────────────────────────────┐
│ DATABASE OWNERSHIP                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identity Service                                           │
│  └─ identity_db                                             │
│      ├─ users                                               │
│      ├─ tenants                                             │
│      ├─ user_tenants                                        │
│      ├─ roles                                               │
│      ├─ permissions                                         │
│      └─ sessions                                            │
│                                                             │
│  Tutorial Service                                           │
│  └─ tutorial_db                                             │
│      ├─ tutorials                                           │
│      ├─ tutorial_sections                                   │
│      ├─ tutorial_progress                                   │
│      └─ tutorial_ratings                                    │
│                                                             │
│  Exam Service                                               │
│  └─ exam_db                                                 │
│      ├─ exams                                               │
│      ├─ questions                                           │
│      ├─ exam_attempts                                       │
│      └─ exam_results                                        │
│                                                             │
│  Placement Service                                          │
│  └─ placement_db                                            │
│      ├─ companies                                           │
│      ├─ job_postings                                        │
│      ├─ applications                                        │
│      └─ interviews                                          │
│                                                             │
│  Training Service (RTH)                                     │
│  └─ training_db                                             │
│      ├─ training_programs                                   │
│      ├─ training_sessions                                   │
│      ├─ enrollments                                         │
│      └─ certifications                                      │
│                                                             │
│  Notification Service                                       │
│  └─ notification_db                                         │
│      ├─ notifications                                       │
│      ├─ notification_templates                              │
│      └─ notification_preferences                            │
│                                                             │
│  Analytics Service                                          │
│  └─ analytics_db                                            │
│      ├─ events                                              │
│      ├─ metrics                                             │
│      └─ reports                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **2.2 Benefits of Database per Service**

✅ **Independent Scaling**
- Scale databases based on service needs
- Tutorial service needs more storage
- Exam service needs more compute for grading

✅ **Technology Flexibility**
- Use PostgreSQL for relational data
- Use MongoDB for document storage
- Use Redis for caching

✅ **Fault Isolation**
- Database failure affects only one service
- Other services continue operating

✅ **Independent Deployment**
- Schema changes don't affect other services
- Database migrations per service

### **2.3 Challenges and Solutions**

❌ **Challenge**: No joins across services
✅ **Solution**: Use API composition or CQRS

❌ **Challenge**: Data duplication
✅ **Solution**: Accept duplication, use events to sync

❌ **Challenge**: Distributed transactions
✅ **Solution**: Use Saga pattern

---

## **3. MULTI-TENANT DATA ISOLATION**

### **3.1 Isolation Strategies**

There are 3 main strategies for multi-tenant data isolation:

```
┌─────────────────────────────────────────────────────────────┐
│ STRATEGY 1: DATABASE PER TENANT                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  skillup_db          rth_db           tenant3_db            │
│  ├─ users            ├─ users         ├─ users             │
│  ├─ tutorials        ├─ tutorials     ├─ tutorials         │
│  └─ exams            └─ exams         └─ exams             │
│                                                             │
│  ✅ Pros:                                                    │
│     - Complete isolation                                    │
│     - Easy to backup/restore per tenant                     │
│     - Can use different database versions                   │
│                                                             │
│  ❌ Cons:                                                    │
│     - High cost (database per tenant)                       │
│     - Complex management (100s of databases)                │
│     - Difficult to share data across tenants                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STRATEGY 2: SCHEMA PER TENANT                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  shared_db                                                  │
│  ├─ skillup_schema                                          │
│  │   ├─ users                                               │
│  │   ├─ tutorials                                           │
│  │   └─ exams                                               │
│  ├─ rth_schema                                              │
│  │   ├─ users                                               │
│  │   ├─ tutorials                                           │
│  │   └─ exams                                               │
│  └─ tenant3_schema                                          │
│      ├─ users                                               │
│      ├─ tutorials                                           │
│      └─ exams                                               │
│                                                             │
│  ✅ Pros:                                                    │
│     - Good isolation                                        │
│     - Easier management than database per tenant            │
│     - Can share connection pool                             │
│                                                             │
│  ❌ Cons:                                                    │
│     - Still complex with many tenants                       │
│     - Schema migrations affect all tenants                  │
│     - Limited by database schema limits                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STRATEGY 3: SHARED DATABASE WITH TENANT_ID (RECOMMENDED)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  shared_db                                                  │
│  ├─ users                                                   │
│  │   ├─ id                                                  │
│  │   ├─ tenant_id  ← Tenant isolation column               │
│  │   ├─ email                                               │
│  │   └─ ...                                                 │
│  ├─ tutorials                                               │
│  │   ├─ id                                                  │
│  │   ├─ tenant_id  ← Tenant isolation column               │
│  │   ├─ title                                               │
│  │   └─ ...                                                 │
│  └─ exams                                                   │
│      ├─ id                                                  │
│      ├─ tenant_id  ← Tenant isolation column               │
│      ├─ title                                               │
│      └─ ...                                                 │
│                                                             │
│  ✅ Pros:                                                    │
│     - Cost-effective (single database)                      │
│     - Easy to manage                                        │
│     - Can share data across tenants if needed               │
│     - Scales to 1000s of tenants                            │
│                                                             │
│  ❌ Cons:                                                    │
│     - Must enforce tenant_id in all queries                 │
│     - Risk of data leakage if not careful                   │
│     - All tenants affected by database issues               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **3.2 Recommended Strategy: Shared Database with tenant_id**

**Why this strategy?**

1. **Cost-Effective**: Single database for all tenants
2. **Scalable**: Can handle 1000s of tenants
3. **Manageable**: Single schema to maintain
4. **Flexible**: Can move to database-per-tenant later if needed

**Implementation**:

```sql
-- Every table has tenant_id column
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for tenant isolation (CRITICAL for performance)
CREATE INDEX idx_tutorials_tenant_id ON tutorials(tenant_id);

-- Composite index for common queries
CREATE INDEX idx_tutorials_tenant_created 
  ON tutorials(tenant_id, created_at DESC);
```

---

## **4. ROW-LEVEL SECURITY (RLS)**

### **4.1 What is RLS?**

Row-Level Security (RLS) is a PostgreSQL feature that automatically filters rows based on policies.

**Without RLS**:
```sql
-- Developer must remember to add tenant_id filter
SELECT * FROM tutorials WHERE tenant_id = 'skillup-id';

-- Easy to forget and leak data! ❌
SELECT * FROM tutorials;  -- Returns ALL tenants' data
```

**With RLS**:
```sql
-- RLS automatically filters by tenant_id
SELECT * FROM tutorials;  -- Returns only current tenant's data ✅
```

### **4.2 Implementing RLS**

```sql
-- Step 1: Enable RLS on table
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON tutorials
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Step 3: Create policy for platform admins (can see all tenants)
CREATE POLICY platform_admin_policy ON tutorials
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_setting('app.current_user_id')::UUID
        AND r.name = 'platform_admin'
        AND r.tenant_id IS NULL
    )
  );

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tutorials TO app_user;
```

### **4.3 Setting Tenant Context**

```typescript
// Set tenant context before queries
async function setTenantContext(
  client: PoolClient,
  tenantId: string,
  userId: string
) {
  await client.query(`
    SET LOCAL app.current_tenant_id = $1;
    SET LOCAL app.current_user_id = $2;
  `, [tenantId, userId]);
}

// Usage in service
async function getTutorials(tenantId: string, userId: string) {
  const client = await pool.connect();
  
  try {
    // Set context
    await setTenantContext(client, tenantId, userId);
    
    // Query automatically filtered by RLS
    const result = await client.query('SELECT * FROM tutorials');
    
    return result.rows;
  } finally {
    client.release();
  }
}
```

### **4.4 RLS Best Practices**

✅ **Always set tenant context**
```typescript
// Use middleware to set context automatically
app.use(async (req, res, next) => {
  if (req.user) {
    await setTenantContext(req.dbClient, req.user.tenantId, req.user.id);
  }
  next();
});
```

✅ **Test RLS policies**
```typescript
// Test that users can't access other tenants' data
describe('Tenant Isolation', () => {
  it('should not return other tenants data', async () => {
    // Set context to tenant A
    await setTenantContext(client, 'tenant-a', 'user-a');
    
    // Query should only return tenant A's data
    const result = await client.query('SELECT * FROM tutorials');
    
    expect(result.rows.every(r => r.tenant_id === 'tenant-a')).toBe(true);
  });
});
```

✅ **Monitor RLS performance**
```sql
-- Check if RLS policies are using indexes
EXPLAIN ANALYZE SELECT * FROM tutorials;

-- Should show "Index Scan using idx_tutorials_tenant_id"
```

---

## **5. DATA DUPLICATION AND SYNCHRONIZATION**

### **5.1 When to Duplicate Data**

In microservices, some data duplication is **necessary and acceptable**:

```
┌─────────────────────────────────────────────────────────────┐
│ EXAMPLE: USER DATA DUPLICATION                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identity Service (Source of Truth)                         │
│  └─ users                                                   │
│      ├─ id: "user-123"                                      │
│      ├─ email: "john@example.com"                           │
│      ├─ name: "John Doe"                                    │
│      ├─ avatar: "https://..."                               │
│      └─ ...                                                 │
│                                                             │
│  Tutorial Service (Cached User Data)                        │
│  └─ tutorial_authors                                        │
│      ├─ user_id: "user-123"                                 │
│      ├─ name: "John Doe"        ← Duplicated                │
│      └─ avatar: "https://..."   ← Duplicated                │
│                                                             │
│  Exam Service (Cached User Data)                            │
│  └─ exam_takers                                             │
│      ├─ user_id: "user-123"                                 │
│      ├─ name: "John Doe"        ← Duplicated                │
│      └─ avatar: "https://..."   ← Duplicated                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why duplicate?**

1. **Performance**: Avoid calling Identity Service for every query
2. **Availability**: Service works even if Identity Service is down
3. **Simplicity**: No complex joins across services

**What to duplicate?**

✅ **Duplicate**: Rarely changing data (name, avatar)
❌ **Don't duplicate**: Frequently changing data (balance, status)

### **5.2 Event-Driven Synchronization**

Use events to keep duplicated data in sync:

```typescript
// Identity Service publishes event when user updates profile
class IdentityService {
  async updateUserProfile(userId: string, data: UpdateProfileDto) {
    // Update in database
    await db.update(users)
      .set(data)
      .where(eq(users.id, userId));
    
    // Publish event
    await eventBus.publish('user.profile.updated', {
      userId: userId,
      name: data.name,
      avatar: data.avatar,
      updatedAt: new Date()
    });
  }
}

// Tutorial Service subscribes to event
class TutorialService {
  constructor() {
    eventBus.subscribe('user.profile.updated', this.handleUserProfileUpdated);
  }
  
  async handleUserProfileUpdated(event: UserProfileUpdatedEvent) {
    // Update cached user data
    await db.update(tutorialAuthors)
      .set({
        name: event.name,
        avatar: event.avatar
      })
      .where(eq(tutorialAuthors.userId, event.userId));
  }
}

// Exam Service subscribes to same event
class ExamService {
  constructor() {
    eventBus.subscribe('user.profile.updated', this.handleUserProfileUpdated);
  }
  
  async handleUserProfileUpdated(event: UserProfileUpdatedEvent) {
    // Update cached user data
    await db.update(examTakers)
      .set({
        name: event.name,
        avatar: event.avatar
      })
      .where(eq(examTakers.userId, event.userId));
  }
}
```

### **5.3 Event Bus Implementation**

```typescript
// Event bus interface
interface EventBus {
  publish(eventType: string, data: any): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}

// Redis-based event bus
class RedisEventBus implements EventBus {
  private redis: Redis;
  private subscribers: Map<string, EventHandler[]>;
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.subscribers = new Map();
    this.startListening();
  }
  
  async publish(eventType: string, data: any) {
    const event = {
      type: eventType,
      data: data,
      timestamp: new Date(),
      id: generateId()
    };
    
    // Publish to Redis channel
    await this.redis.publish('events', JSON.stringify(event));
    
    // Also store in stream for replay
    await this.redis.xadd(
      `events:${eventType}`,
      '*',
      'data', JSON.stringify(event)
    );
  }
  
  subscribe(eventType: string, handler: EventHandler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }
  
  private async startListening() {
    const subscriber = this.redis.duplicate();
    
    await subscriber.subscribe('events');
    
    subscriber.on('message', async (channel, message) => {
      const event = JSON.parse(message);
      const handlers = this.subscribers.get(event.type) || [];
      
      for (const handler of handlers) {
        try {
          await handler(event.data);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      }
    });
  }
}
```

---

## **6. DATABASE SCHEMA EXAMPLES**

### **6.1 Identity Service Schema**

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,  -- 'skillup', 'rth'
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (global, not tenant-specific)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User-Tenant relationship (many-to-many)
CREATE TABLE user_tenants (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULL for platform roles
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- User roles
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id, tenant_id)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant ON user_tenants(tenant_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

### **6.2 Tutorial Service Schema**

```sql
-- Tutorials table
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,  -- References tenants in Identity Service
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail VARCHAR(500),
  difficulty VARCHAR(20),  -- 'beginner', 'intermediate', 'advanced'
  duration_minutes INTEGER,
  visibility VARCHAR(20) DEFAULT 'public',  -- 'public', 'private', 'restricted'
  status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'published', 'archived'
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  UNIQUE (tenant_id, slug)
);

-- Tutorial sections
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

-- Tutorial progress (user progress tracking)
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

-- Tutorial ratings
CREATE TABLE tutorial_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, tutorial_id, user_id)
);

-- Cached user data (for display purposes)
CREATE TABLE tutorial_authors (
  user_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tutorials_tenant ON tutorials(tenant_id);
CREATE INDEX idx_tutorials_tenant_status ON tutorials(tenant_id, status);
CREATE INDEX idx_tutorials_created_by ON tutorials(created_by);
CREATE INDEX idx_tutorial_sections_tutorial ON tutorial_sections(tutorial_id);
CREATE INDEX idx_tutorial_progress_user ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_tutorial ON tutorial_progress(tutorial_id);
CREATE INDEX idx_tutorial_ratings_tutorial ON tutorial_ratings(tutorial_id);

-- Enable RLS
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY tenant_isolation_policy ON tutorials
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON tutorial_sections
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON tutorial_progress
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON tutorial_ratings
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

**Continue to Part 2**: 07-DATA-ARCHITECTURE-02-CONSISTENCY.md

