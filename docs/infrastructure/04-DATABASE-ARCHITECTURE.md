# DATABASE ARCHITECTURE
## Complete Database Schema and Access Patterns

---

## **1. DATABASE OVERVIEW**

**Provider**: Neon PostgreSQL (Serverless)  
**Region**: AWS ap-southeast-1 (Singapore)  
**Total Databases**: 7  
**Connection**: Neon serverless with auto-scaling  

---

## **2. DATABASE INVENTORY**

| Database | Purpose | Package | Primary Services | Schema |
|----------|---------|---------|------------------|--------|
| `quiz_platform_prod` | Default/fallback | `@quiz/db` | quiz-api-server | Quiz, Exams, Analytics |
| `rth_prod` | RTH auth & users | `@quiz/db-rth` | quiz-api-server | Users, Roles, Auth |
| `skillup_prod` | SkillUp auth & users | `@quiz/db-skillup` | quiz-api-server | Users, Roles, Auth |
| `tutorial_prod` | Tutorial content (Phase 2B) | `@quiz/db-tutorial` | quiz-api-server, quiz-admin-app | Tutorials, Sections, Progress |
| `people_prod` | Shadow users (identity bridge) | `@quiz/db-people` | quiz-api-server, skillhubcore-admin | Shadow users, Platform access |
| `payment_prod` | Payment transactions | `@quiz/db-payment` | quiz-api-server | Orders, Transactions, Subscriptions |
| `placement_prod` | Placement/jobs data | `@quiz/db-placement` | quiz-api-server, skillhub-placement | Jobs, Applications, Companies |

---

## **3. BRAND-SPECIFIC DATABASES**

### **3.1 rth_prod (RealTutorialHub Authentication)**

**Package**: `@quiz/db-rth`  
**Connection**: `DATABASE_URL_RTH`

**Schema**:

#### **users** table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  shadow_user_id UUID,  -- Links to people_prod.shadow_users
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_shadow_user_id ON users(shadow_user_id);
CREATE INDEX idx_users_last_active ON users(last_active_at);
```

#### **user_profiles** table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### **roles** table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'super_admin', 'user', 'infrastructure'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO roles (name, description) VALUES
  ('user', 'Regular user'),
  ('admin', 'Administrator'),
  ('super_admin', 'Super Administrator'),
  ('infrastructure', 'Infrastructure access');
```

#### **user_roles** table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

#### **refresh_tokens** table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_device_id ON refresh_tokens(device_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

#### **login_attempts** table
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

#### **audit_logs** table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,  -- 'login_success', 'login_failed', 'logout_success', etc.
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

#### **verification_tokens** table
```sql
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'email_verification', 'password_reset'
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
```

#### **password_reset_tokens** table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
```

---

### **3.2 skillup_prod (SkillUp IT Academy Authentication)**

**Package**: `@quiz/db-skillup`  
**Connection**: `DATABASE_URL_SKILLUP`

**Schema**: Identical to `rth_prod` (same tables, same structure)

**Note**: Brand isolation is achieved by having separate databases with identical schemas. Each brand's users, roles, and sessions are completely isolated.

---

## **4. SHARED DATABASES**

### **4.1 tutorial_prod (Tutorial Content - Phase 2B)**

**Package**: `@quiz/db-tutorial`  
**Connection**: `DATABASE_URL_TUTORIAL`

**Purpose**: Stores tutorial content (Layman APIs) accessible by both brands.

**Schema**:

#### **tutorials** table
```sql
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty VARCHAR(20),  -- 'beginner', 'intermediate', 'advanced'
  estimated_duration INTEGER,  -- in minutes
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_by UUID,  -- shadowUserId from people_prod
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tutorials_slug ON tutorials(slug);
CREATE INDEX idx_tutorials_is_published ON tutorials(is_published);
CREATE INDEX idx_tutorials_created_by ON tutorials(created_by);
```

#### **tutorial_sections** table
```sql
CREATE TABLE tutorial_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  section_type VARCHAR(50),  -- 'text', 'video', 'code', 'quiz'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tutorial_sections_tutorial_id ON tutorial_sections(tutorial_id);
CREATE INDEX idx_tutorial_sections_order ON tutorial_sections(tutorial_id, order_index);
```

#### **tutorial_progress** table
```sql
CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- shadowUserId from people_prod
  section_id UUID REFERENCES tutorial_sections(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  time_spent INTEGER,  -- in seconds
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tutorial_id, user_id, section_id)
);

CREATE INDEX idx_tutorial_progress_user_id ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);
```

#### **tutorial_enrollments** table
```sql
CREATE TABLE tutorial_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- shadowUserId from people_prod
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT FALSE,
  UNIQUE(tutorial_id, user_id)
);

CREATE INDEX idx_tutorial_enrollments_user_id ON tutorial_enrollments(user_id);
CREATE INDEX idx_tutorial_enrollments_tutorial_id ON tutorial_enrollments(tutorial_id);
```

**Access Pattern**:
- **quiz-api-server**: Full CRUD access
- **quiz-admin-app**: Read/Write access via BFF routes
- **User Identification**: Uses `shadowUserId` (not brand-specific userId)

---

### **4.2 people_prod (Shadow Users - Identity Bridge)**

**Package**: `@quiz/db-people`  
**Connection**: `DATABASE_URL_PEOPLE`

**Purpose**: Cross-brand identity management. Links brand-specific users to a unified shadow user.

**Schema**:

#### **shadow_users** table
```sql
CREATE TABLE shadow_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_users_email ON shadow_users(email);
```

#### **shadow_user_platforms** table
```sql
CREATE TABLE shadow_user_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shadow_user_id UUID REFERENCES shadow_users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,  -- 'realtutorialhub', 'skillup'
  external_user_id UUID NOT NULL,  -- userId from rth_prod or skillup_prod
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  UNIQUE(shadow_user_id, platform)
);

CREATE INDEX idx_shadow_user_platforms_shadow_user_id ON shadow_user_platforms(shadow_user_id);
CREATE INDEX idx_shadow_user_platforms_external_user_id ON shadow_user_platforms(external_user_id);
```

**Example Data**:
```sql
-- Shadow user
INSERT INTO shadow_users (id, email) VALUES
  ('cm5xyz789...', 'admin@realtutorialhub.com');

-- Platform links
INSERT INTO shadow_user_platforms (shadow_user_id, platform, external_user_id) VALUES
  ('cm5xyz789...', 'realtutorialhub', 'cm5abc123...'),  -- RTH user
  ('cm5xyz789...', 'skillup', 'cm5def456...');          -- SkillUp user (if same email)
```

**Use Case**: User with same email on both brands gets single shadow user, enabling cross-brand features like shared tutorial progress.

---

### **4.3 quiz_platform_prod (Quiz & Exams)**

**Package**: `@quiz/db`  
**Connection**: `DATABASE_URL`

**Purpose**: Quiz platform, exams, questions, analytics.

**Key Tables**:
- `domains` - Subject domains (e.g., "Programming", "Mathematics")
- `subjects` - Subjects within domains
- `topics` - Topics within subjects
- `subtopics` - Subtopics within topics
- `questions` - Quiz questions
- `exams` - Exam definitions
- `exam_attempts` - User exam attempts
- `user_answers` - User answers to questions
- `analytics_events` - User activity tracking

**Access Pattern**: Shared across all brands (no brand filtering)

---

### **4.4 payment_prod (Payment Transactions)**

**Package**: `@quiz/db-payment`  
**Connection**: `DATABASE_URL_PAYMENT`

**Purpose**: Payment processing, subscriptions, orders.

**Key Tables**:
- `orders` - Purchase orders
- `transactions` - Payment transactions
- `subscriptions` - Subscription plans
- `invoices` - Generated invoices
- `payment_methods` - Saved payment methods

**Access Pattern**: Uses `shadowUserId` for cross-brand payment history

---

### **4.5 placement_prod (Placement & Jobs)**

**Package**: `@quiz/db-placement`  
**Connection**: `DATABASE_URL_PLACEMENT`

**Purpose**: Job postings, applications, company profiles.

**Key Tables**:
- `companies` - Company profiles
- `jobs` - Job postings
- `applications` - Job applications
- `interviews` - Interview schedules
- `placements` - Successful placements

**Access Pattern**: Uses `shadowUserId` for cross-brand job applications

---

## **5. DATABASE ACCESS PATTERNS**

### **5.1 Service-to-Database Mapping**

| Service | Databases | Access Type |
|---------|-----------|-------------|
| quiz-api-server | ALL 7 | Full CRUD |
| quiz-admin-app | tutorial_prod | Read/Write (BFF) |
| skillhubcore-admin | people_prod | Full CRUD |
| skillhub-placement | placement_prod | Full CRUD |
| realtutorialhub-web | None | API-only |
| skillup-web | None | API-only |
| skillup-admin | None | API-only |
| faculty-app | None | API-only |
| quiz-web-app | None | API-only |

### **5.2 Brand-Specific Routing**

**File**: `apps/api-server/src/modules/auth/brand-db.ts`

```typescript
export function getAuthBrandContext(brand: RequestBrand) {
  if (brand === 'skillup') {
    return {
      db: skillupDb,
      tables: skillupTables
    };
  }
  
  return {
    db: realtutorialhubDb,
    tables: realtutorialhubTables
  };
}
```

**Usage**:
```typescript
// In login service
const brand = req.headers.get('x-brand') || 'realtutorialhub';
const brandContext = getAuthBrandContext(brand);

// Query brand-specific database
const user = await brandContext.db
  .select()
  .from(brandContext.tables.users)
  .where(eq(brandContext.tables.users.email, email))
  .limit(1);
```

---

## **6. CONNECTION MANAGEMENT**

### **6.1 Neon Serverless**

**Features**:
- Auto-scaling connections
- No connection pooling needed
- Sub-50ms query latency
- Automatic failover
- Point-in-time recovery

**Connection String Format**:
```
postgresql://user:password@ep-xxx.aws-ap-southeast-1.neon.tech/dbname?sslmode=require
```

### **6.2 Drizzle ORM**

**Package**: `drizzle-orm`  
**Version**: 0.45.1

**Configuration**:
```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);
```

**Query Example**:
```typescript
import { eq } from 'drizzle-orm';
import { users } from './schema';

const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'admin@realtutorialhub.com'))
  .limit(1);
```

---

## **7. MIGRATION MANAGEMENT**

### **7.1 Drizzle Kit**

**Package**: `drizzle-kit`  
**Version**: 0.31.8

**Commands**:
```bash
# Generate migration
pnpm --filter @quiz/db-rth db:generate

# Apply migration
pnpm --filter @quiz/db-rth db:migrate

# Open Drizzle Studio
pnpm --filter @quiz/db-rth db:studio
```

**Migration Files**: `packages/db-rth/drizzle/`

### **7.2 Migration Strategy**

1. **Development**: Generate migration from schema changes
2. **Testing**: Apply to test database
3. **Staging**: Apply to staging database
4. **Production**: Apply during deployment (automated)

**Rollback**: Use Neon's point-in-time recovery

---

## **8. SECURITY**

### **8.1 Connection Security**

- **SSL/TLS**: Required for all connections
- **Secrets**: Stored in GCP Secret Manager
- **IAM**: Workload Identity for service authentication
- **Network**: Private VPC (no public access)

### **8.2 Data Security**

- **Encryption at Rest**: AES-256
- **Encryption in Transit**: TLS 1.2+
- **Password Hashing**: bcrypt (cost 10)
- **Token Hashing**: bcrypt (cost 10)

### **8.3 Access Control**

- **Database Users**: Separate per service
- **Permissions**: Least privilege principle
- **Audit Logging**: All auth events logged
- **Backup**: Daily automated backups

---

## **9. PERFORMANCE**

### **9.1 Indexing Strategy**

- **Primary Keys**: UUID with gen_random_uuid()
- **Foreign Keys**: Indexed automatically
- **Lookup Fields**: email, token_hash, device_id
- **Timestamp Fields**: created_at, expires_at

### **9.2 Query Optimization**

- **Limit Clauses**: Always use LIMIT for single-row queries
- **Index Usage**: Verify with EXPLAIN ANALYZE
- **Connection Pooling**: Neon handles automatically
- **Caching**: Redis for frequently accessed data

### **9.3 Monitoring**

- **Slow Queries**: Logged and alerted
- **Connection Count**: Monitored
- **Query Latency**: P50, P95, P99 tracked
- **Error Rate**: Monitored and alerted

---

## **DATABASE SUMMARY**

| Metric | Value |
|--------|-------|
| Total Databases | 7 |
| Brand-Specific DBs | 2 (rth_prod, skillup_prod) |
| Shared DBs | 5 |
| Total Tables | ~50 |
| Primary Services | 4 (with direct DB access) |
| Connection Type | Neon Serverless |
| Region | AWS ap-southeast-1 |
| Latency | < 50ms |
| Backup Frequency | Daily |
| Retention | 30 days |
