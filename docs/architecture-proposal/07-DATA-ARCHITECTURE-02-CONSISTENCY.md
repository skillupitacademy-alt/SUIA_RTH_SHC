# 07 - DATA ARCHITECTURE (PART 2)
## Data Consistency Patterns and Distributed Transactions

---

## **7. DATA CONSISTENCY PATTERNS**

### **7.1 Consistency Models**

```
┌─────────────────────────────────────────────────────────────┐
│ CONSISTENCY MODELS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Strong Consistency                                         │
│  ├─ All reads see latest write immediately                  │
│  ├─ Used within a single service                            │
│  └─ Example: User updates profile, sees change immediately  │
│                                                             │
│  Eventual Consistency                                       │
│  ├─ Reads may see stale data temporarily                    │
│  ├─ Used across services                                    │
│  └─ Example: User updates profile, other services sync      │
│      within seconds                                         │
│                                                             │
│  Causal Consistency                                         │
│  ├─ Related operations maintain order                       │
│  ├─ Used for dependent operations                           │
│  └─ Example: Create tutorial → Add sections (order matters) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **7.2 When to Use Each Model**

**Strong Consistency** (within service):
```typescript
// Example: User updates profile
async function updateProfile(userId: string, data: UpdateProfileDto) {
  // Single database transaction
  await db.transaction(async (tx) => {
    // Update user
    await tx.update(users)
      .set(data)
      .where(eq(users.id, userId));
    
    // Update audit log
    await tx.insert(auditLogs).values({
      userId: userId,
      action: 'profile.updated',
      timestamp: new Date()
    });
  });
  
  // User immediately sees updated profile ✅
}
```

**Eventual Consistency** (across services):
```typescript
// Example: User updates profile, other services sync
async function updateProfile(userId: string, data: UpdateProfileDto) {
  // Update in Identity Service
  await identityService.updateProfile(userId, data);
  
  // Publish event
  await eventBus.publish('user.profile.updated', {
    userId: userId,
    name: data.name,
    avatar: data.avatar
  });
  
  // Tutorial Service will sync within seconds ⏱️
  // Exam Service will sync within seconds ⏱️
}
```

---

## **8. SAGA PATTERN**

### **8.1 What is Saga Pattern?**

Saga pattern manages distributed transactions across multiple services.

**Problem**: You can't use database transactions across services.

```typescript
// ❌ This doesn't work across services
await db.transaction(async (tx) => {
  // Create order in Order Service
  await orderService.createOrder(orderData);
  
  // Charge payment in Payment Service
  await paymentService.charge(paymentData);
  
  // Update inventory in Inventory Service
  await inventoryService.updateStock(inventoryData);
});
```

**Solution**: Use Saga pattern with compensating transactions.

### **8.2 Saga Example: Enrollment Process**

**Scenario**: Student enrolls in a course

**Steps**:
1. Create enrollment in Enrollment Service
2. Charge payment in Payment Service
3. Grant access in Tutorial Service
4. Send confirmation email in Notification Service

**If any step fails, rollback previous steps.**

```typescript
// Saga orchestrator
class EnrollmentSaga {
  async execute(enrollmentData: EnrollmentData) {
    const sagaId = generateId();
    const steps: SagaStep[] = [];
    
    try {
      // Step 1: Create enrollment
      const enrollment = await this.createEnrollment(enrollmentData);
      steps.push({
        name: 'createEnrollment',
        compensate: () => this.cancelEnrollment(enrollment.id)
      });
      
      // Step 2: Charge payment
      const payment = await this.chargePayment(enrollmentData.paymentData);
      steps.push({
        name: 'chargePayment',
        compensate: () => this.refundPayment(payment.id)
      });
      
      // Step 3: Grant access
      await this.grantAccess(enrollment.userId, enrollment.courseId);
      steps.push({
        name: 'grantAccess',
        compensate: () => this.revokeAccess(enrollment.userId, enrollment.courseId)
      });
      
      // Step 4: Send confirmation
      await this.sendConfirmation(enrollment.userId, enrollment.courseId);
      steps.push({
        name: 'sendConfirmation',
        compensate: () => {} // No compensation needed
      });
      
      // All steps succeeded ✅
      await this.markSagaComplete(sagaId);
      
      return { success: true, enrollment };
      
    } catch (error) {
      // Rollback all completed steps
      console.error('Saga failed, rolling back:', error);
      
      for (let i = steps.length - 1; i >= 0; i--) {
        try {
          await steps[i].compensate();
        } catch (compensateError) {
          console.error(`Failed to compensate ${steps[i].name}:`, compensateError);
        }
      }
      
      await this.markSagaFailed(sagaId, error);
      
      return { success: false, error };
    }
  }
  
  private async createEnrollment(data: EnrollmentData) {
    return await enrollmentService.create(data);
  }
  
  private async cancelEnrollment(enrollmentId: string) {
    return await enrollmentService.cancel(enrollmentId);
  }
  
  private async chargePayment(paymentData: PaymentData) {
    return await paymentService.charge(paymentData);
  }
  
  private async refundPayment(paymentId: string) {
    return await paymentService.refund(paymentId);
  }
  
  private async grantAccess(userId: string, courseId: string) {
    return await tutorialService.grantAccess(userId, courseId);
  }
  
  private async revokeAccess(userId: string, courseId: string) {
    return await tutorialService.revokeAccess(userId, courseId);
  }
  
  private async sendConfirmation(userId: string, courseId: string) {
    return await notificationService.sendEnrollmentConfirmation(userId, courseId);
  }
}
```

### **8.3 Saga State Management**

```sql
-- Saga state table
CREATE TABLE sagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,  -- 'enrollment', 'refund', etc.
  status VARCHAR(20) NOT NULL,  -- 'pending', 'completed', 'failed', 'compensating'
  data JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saga steps table
CREATE TABLE saga_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id UUID NOT NULL REFERENCES sagas(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,  -- 'pending', 'completed', 'failed', 'compensated'
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE (saga_id, step_number)
);
```

---

## **9. EVENT SOURCING**

### **9.1 What is Event Sourcing?**

Event Sourcing stores all changes as a sequence of events instead of storing current state.

**Traditional Approach** (store current state):
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  status VARCHAR(20)
);

-- Update user
UPDATE users SET status = 'active' WHERE id = 'user-123';

-- ❌ Lost history: Can't see previous status
```

**Event Sourcing Approach** (store events):
```sql
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,  -- user-123
  aggregate_type VARCHAR(50),  -- 'user'
  event_type VARCHAR(100),     -- 'user.created', 'user.activated'
  event_data JSONB,
  version INTEGER,
  created_at TIMESTAMP
);

-- Events for user-123
INSERT INTO events VALUES
  ('evt-1', 'user-123', 'user', 'user.created', '{"name":"John","email":"john@example.com"}', 1, '2024-01-01'),
  ('evt-2', 'user-123', 'user', 'user.activated', '{"status":"active"}', 2, '2024-01-02'),
  ('evt-3', 'user-123', 'user', 'user.suspended', '{"status":"suspended","reason":"..."}', 3, '2024-01-03');

-- ✅ Full history preserved
```

### **9.2 Event Sourcing Benefits**

✅ **Complete Audit Trail**
- See all changes ever made
- Know who made changes and when
- Replay events to debug issues

✅ **Time Travel**
- Reconstruct state at any point in time
- "What was user's status on Jan 2?"

✅ **Event-Driven Architecture**
- Events can trigger other services
- Easy to add new features that react to events

### **9.3 Event Sourcing Implementation**

```typescript
// Event store
class EventStore {
  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any
  ) {
    // Get current version
    const currentVersion = await this.getLatestVersion(aggregateId);
    
    // Append event
    await db.insert(events).values({
      aggregateId: aggregateId,
      aggregateType: aggregateType,
      eventType: eventType,
      eventData: eventData,
      version: currentVersion + 1,
      createdAt: new Date()
    });
    
    // Publish event to event bus
    await eventBus.publish(eventType, {
      aggregateId: aggregateId,
      ...eventData
    });
  }
  
  async getEvents(aggregateId: string): Promise<Event[]> {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.aggregateId, aggregateId))
      .orderBy(events.version);
    
    return result;
  }
  
  async getLatestVersion(aggregateId: string): Promise<number> {
    const result = await db
      .select({ version: events.version })
      .from(events)
      .where(eq(events.aggregateId, aggregateId))
      .orderBy(desc(events.version))
      .limit(1);
    
    return result[0]?.version || 0;
  }
}

// User aggregate
class UserAggregate {
  private id: string;
  private name: string;
  private email: string;
  private status: string;
  private version: number;
  
  constructor(id: string) {
    this.id = id;
    this.version = 0;
  }
  
  // Load from events
  async load(eventStore: EventStore) {
    const events = await eventStore.getEvents(this.id);
    
    for (const event of events) {
      this.apply(event);
    }
  }
  
  // Apply event to state
  private apply(event: Event) {
    switch (event.eventType) {
      case 'user.created':
        this.name = event.eventData.name;
        this.email = event.eventData.email;
        this.status = 'pending';
        break;
      
      case 'user.activated':
        this.status = 'active';
        break;
      
      case 'user.suspended':
        this.status = 'suspended';
        break;
    }
    
    this.version = event.version;
  }
  
  // Commands
  async activate(eventStore: EventStore) {
    if (this.status === 'active') {
      throw new Error('User already active');
    }
    
    await eventStore.append(
      this.id,
      'user',
      'user.activated',
      { status: 'active' }
    );
    
    this.status = 'active';
    this.version++;
  }
  
  async suspend(eventStore: EventStore, reason: string) {
    if (this.status === 'suspended') {
      throw new Error('User already suspended');
    }
    
    await eventStore.append(
      this.id,
      'user',
      'user.suspended',
      { status: 'suspended', reason: reason }
    );
    
    this.status = 'suspended';
    this.version++;
  }
}

// Usage
const user = new UserAggregate('user-123');
await user.load(eventStore);
await user.activate(eventStore);
```

### **9.4 Event Sourcing with CQRS**

Event Sourcing is often combined with CQRS (Command Query Responsibility Segregation).

```
┌─────────────────────────────────────────────────────────────┐
│ CQRS PATTERN                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Write Side (Commands)                                      │
│  ├─ Append events to event store                            │
│  ├─ Validate business rules                                 │
│  └─ Publish events                                          │
│                                                             │
│  Read Side (Queries)                                        │
│  ├─ Read from optimized read models                         │
│  ├─ Denormalized for fast queries                           │
│  └─ Updated by event handlers                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```typescript
// Write model (event sourced)
class UserWriteModel {
  async activateUser(userId: string) {
    const user = new UserAggregate(userId);
    await user.load(eventStore);
    await user.activate(eventStore);
  }
}

// Read model (optimized for queries)
class UserReadModel {
  async getUserById(userId: string) {
    // Fast query from read model
    return await db
      .select()
      .from(userReadModel)
      .where(eq(userReadModel.id, userId))
      .limit(1);
  }
  
  async getActiveUsers() {
    // Fast query with index
    return await db
      .select()
      .from(userReadModel)
      .where(eq(userReadModel.status, 'active'));
  }
}

// Event handler to update read model
eventBus.subscribe('user.activated', async (event) => {
  await db
    .update(userReadModel)
    .set({ status: 'active' })
    .where(eq(userReadModel.id, event.aggregateId));
});
```

---

## **10. CQRS (COMMAND QUERY RESPONSIBILITY SEGREGATION)**

### **10.1 What is CQRS?**

CQRS separates read and write operations into different models.

**Without CQRS**:
```typescript
// Same model for reads and writes
class UserService {
  async getUser(id: string) {
    return await db.select().from(users).where(eq(users.id, id));
  }
  
  async updateUser(id: string, data: UpdateUserDto) {
    return await db.update(users).set(data).where(eq(users.id, id));
  }
}
```

**With CQRS**:
```typescript
// Separate models for reads and writes
class UserCommandService {
  async updateUser(id: string, data: UpdateUserDto) {
    // Write to event store
    await eventStore.append(id, 'user', 'user.updated', data);
  }
}

class UserQueryService {
  async getUser(id: string) {
    // Read from optimized read model
    return await db.select().from(userReadModel).where(eq(userReadModel.id, id));
  }
  
  async searchUsers(query: string) {
    // Complex query optimized for reads
    return await db
      .select()
      .from(userReadModel)
      .where(like(userReadModel.name, `%${query}%`));
  }
}
```

### **10.2 CQRS Benefits**

✅ **Optimized Reads**
- Read models denormalized for fast queries
- Can use different database for reads (e.g., Elasticsearch)

✅ **Optimized Writes**
- Write model focused on business logic
- No complex joins or aggregations

✅ **Independent Scaling**
- Scale read and write sides independently
- Most apps are read-heavy (90% reads, 10% writes)

### **10.3 CQRS Implementation**

```typescript
// Command side
interface Command {
  type: string;
  aggregateId: string;
  data: any;
}

class CommandHandler {
  async handle(command: Command) {
    switch (command.type) {
      case 'CreateUser':
        return await this.handleCreateUser(command);
      case 'UpdateUser':
        return await this.handleUpdateUser(command);
      case 'DeleteUser':
        return await this.handleDeleteUser(command);
    }
  }
  
  private async handleCreateUser(command: Command) {
    // Validate
    if (!command.data.email) {
      throw new Error('Email required');
    }
    
    // Append event
    await eventStore.append(
      command.aggregateId,
      'user',
      'user.created',
      command.data
    );
  }
}

// Query side
interface Query {
  type: string;
  params: any;
}

class QueryHandler {
  async handle(query: Query) {
    switch (query.type) {
      case 'GetUser':
        return await this.handleGetUser(query);
      case 'SearchUsers':
        return await this.handleSearchUsers(query);
      case 'GetUserStats':
        return await this.handleGetUserStats(query);
    }
  }
  
  private async handleGetUser(query: Query) {
    return await db
      .select()
      .from(userReadModel)
      .where(eq(userReadModel.id, query.params.id));
  }
  
  private async handleSearchUsers(query: Query) {
    return await db
      .select()
      .from(userReadModel)
      .where(like(userReadModel.name, `%${query.params.query}%`))
      .limit(20);
  }
}

// Read model projections
class UserProjection {
  constructor() {
    eventBus.subscribe('user.created', this.handleUserCreated);
    eventBus.subscribe('user.updated', this.handleUserUpdated);
    eventBus.subscribe('user.deleted', this.handleUserDeleted);
  }
  
  async handleUserCreated(event: Event) {
    await db.insert(userReadModel).values({
      id: event.aggregateId,
      name: event.data.name,
      email: event.data.email,
      status: 'pending',
      createdAt: event.createdAt
    });
  }
  
  async handleUserUpdated(event: Event) {
    await db
      .update(userReadModel)
      .set(event.data)
      .where(eq(userReadModel.id, event.aggregateId));
  }
  
  async handleUserDeleted(event: Event) {
    await db
      .delete(userReadModel)
      .where(eq(userReadModel.id, event.aggregateId));
  }
}
```

---

## **11. DATABASE MIGRATION STRATEGIES**

### **11.1 Zero-Downtime Migrations**

**Expand-Contract Pattern**:

```
Phase 1: Expand (Add new column)
├─ Add new column
├─ Dual-write to old and new columns
└─ Backfill existing data

Phase 2: Migrate (Switch reads)
├─ Update code to read from new column
└─ Monitor for issues

Phase 3: Contract (Remove old column)
├─ Stop writing to old column
└─ Drop old column
```

**Example**: Rename `user_name` to `full_name`

```sql
-- Phase 1: Expand
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Dual-write in application
UPDATE users SET 
  user_name = 'John Doe',
  full_name = 'John Doe'
WHERE id = 'user-123';

-- Backfill existing data
UPDATE users SET full_name = user_name WHERE full_name IS NULL;

-- Phase 2: Migrate (update code to read from full_name)
-- Deploy new code

-- Phase 3: Contract
ALTER TABLE users DROP COLUMN user_name;
```

### **11.2 Database Versioning**

```typescript
// Migration files
// migrations/001_create_users_table.ts
export async function up(db: Database) {
  await db.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email').unique();
    table.string('name');
    table.timestamps();
  });
}

export async function down(db: Database) {
  await db.schema.dropTable('users');
}

// migrations/002_add_avatar_to_users.ts
export async function up(db: Database) {
  await db.schema.alterTable('users', (table) => {
    table.string('avatar');
  });
}

export async function down(db: Database) {
  await db.schema.alterTable('users', (table) => {
    table.dropColumn('avatar');
  });
}

// Run migrations
class MigrationRunner {
  async runMigrations() {
    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = await this.getAllMigrations();
    
    for (const migration of allMigrations) {
      if (!appliedMigrations.includes(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up(db);
        await this.recordMigration(migration.name);
      }
    }
  }
}
```

---

## **12. SUMMARY**

### **12.1 Key Takeaways**

✅ **Database per Service**
- Each service owns its data
- No direct database access between services
- Independent scaling and deployment

✅ **Multi-Tenant Isolation**
- Shared database with tenant_id column
- Row-Level Security (RLS) for automatic filtering
- Application-level tenant context

✅ **Data Consistency**
- Strong consistency within service
- Eventual consistency across services
- Saga pattern for distributed transactions

✅ **Event Sourcing & CQRS**
- Event sourcing for complete audit trail
- CQRS for optimized reads and writes
- Event-driven synchronization

✅ **Zero-Downtime Migrations**
- Expand-Contract pattern
- Dual-write during migration
- Database versioning

### **12.2 Implementation Checklist**

- [ ] Design database schema per service
- [ ] Add tenant_id to all tables
- [ ] Enable Row-Level Security (RLS)
- [ ] Implement event bus for service communication
- [ ] Create event handlers for data synchronization
- [ ] Implement Saga pattern for distributed transactions
- [ ] Set up database migration system
- [ ] Test tenant isolation thoroughly
- [ ] Monitor data consistency across services

---

**Next Document**: 08-DEPLOYMENT-STRATEGY.md (Kubernetes, CI/CD, deployment patterns)

