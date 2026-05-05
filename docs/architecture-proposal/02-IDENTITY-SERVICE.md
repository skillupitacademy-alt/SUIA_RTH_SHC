# IDENTITY SERVICE ARCHITECTURE
## Single Sign-On and Multi-Tenant Authentication

---

## **1. IDENTITY SERVICE OVERVIEW**

### **1.1 Purpose**

The Identity Service is the **single source of truth** for:
- User authentication (login, logout, token refresh)
- User management (registration, profile, password reset)
- Tenant management (tenant creation, configuration)
- Authorization (roles, permissions, policies)
- Session management (active sessions, device tracking)

### **1.2 Key Principles**

1. **Single User Identity**: One user record across all tenants
2. **Multi-Tenancy**: Users can belong to multiple tenants
3. **Tenant Isolation**: Data is isolated per tenant
4. **Service-Agnostic**: Other services trust identity service
5. **Stateless**: JWT-based authentication (no server-side sessions)

---

## **2. DATABASE SCHEMA**

### **2.1 Core Tables**

#### **users** table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),  -- NULL for SSO users
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_blocked ON users(is_blocked);
CREATE INDEX idx_users_last_login ON users(last_login_at);
```

#### **tenants** table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,  -- "skillup", "realtutorialhub"
  name VARCHAR(255) NOT NULL,  -- "SkillUp IT Academy"
  domain VARCHAR(255),  -- "skillupitacademy.com"
  logo_url TEXT,
  primary_color VARCHAR(7),  -- "#FF5733"
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- Seed data
INSERT INTO tenants (slug, name, domain, settings) VALUES
  ('skillup', 'SkillUp IT Academy', 'skillupitacademy.com', '{"features": ["physical_training", "placement"]}'),
  ('realtutorialhub', 'RealTutorialHub', 'realtutorialhub.com', '{"features": ["ai_training", "tutorials"]}');
```

#### **tenant_users** table (Multi-Tenancy)
```sql
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',  -- active, suspended, invited, deleted
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',  -- Tenant-specific user data
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);
CREATE INDEX idx_tenant_users_joined_at ON tenant_users(joined_at);
```

#### **roles** table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for platform roles
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100),
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,  -- System roles can't be deleted
  permissions JSONB DEFAULT '[]',  -- Array of permission strings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_system ON roles(is_system);

-- Seed platform roles (tenant_id = NULL)
INSERT INTO roles (tenant_id, name, display_name, is_system, permissions) VALUES
  (NULL, 'platform_admin', 'Platform Administrator', TRUE, '["*"]'),
  (NULL, 'platform_support', 'Platform Support', TRUE, '["users:read", "tenants:read"]');

-- Seed tenant roles (for each tenant)
INSERT INTO roles (tenant_id, name, display_name, is_system, permissions) VALUES
  ((SELECT id FROM tenants WHERE slug = 'skillup'), 'admin', 'Administrator', TRUE, '["*"]'),
  ((SELECT id FROM tenants WHERE slug = 'skillup'), 'instructor', 'Instructor', TRUE, '["courses:*", "students:read"]'),
  ((SELECT id FROM tenants WHERE slug = 'skillup'), 'student', 'Student', TRUE, '["courses:read", "exams:attempt"]'),
  ((SELECT id FROM tenants WHERE slug = 'realtutorialhub'), 'admin', 'Administrator', TRUE, '["*"]'),
  ((SELECT id FROM tenants WHERE slug = 'realtutorialhub'), 'content_creator', 'Content Creator', TRUE, '["tutorials:*"]'),
  ((SELECT id FROM tenants WHERE slug = 'realtutorialhub'), 'learner', 'Learner', TRUE, '["tutorials:read", "exams:attempt"]');
```

#### **user_roles** table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for platform roles
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- NULL for permanent roles
  UNIQUE(user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
```

#### **sessions** table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),  -- web, mobile, desktop
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at);
```

#### **login_attempts** table
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),  -- invalid_password, user_not_found, account_blocked
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_tenant_id ON login_attempts(tenant_id);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

#### **audit_logs** table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  action VARCHAR(100) NOT NULL,  -- user.login, user.logout, user.created, role.granted
  resource_type VARCHAR(50),  -- user, tenant, role
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## **3. JWT STRUCTURE**

### **3.1 Access Token**

```json
{
  "sub": "user-uuid-123",
  "email": "admin@skillupitacademy.com",
  "tenantId": "tenant-uuid-456",
  "tenantSlug": "skillup",
  "roles": ["admin", "instructor"],
  "permissions": ["*"],
  "tokenType": "access",
  "iat": 1735689600,
  "exp": 1735690500,
  "aud": "platform",
  "iss": "identity-service"
}
```

### **3.2 Refresh Token**

```json
{
  "sub": "user-uuid-123",
  "tenantId": "tenant-uuid-456",
  "sessionId": "session-uuid-789",
  "deviceId": "device-uuid-abc",
  "tokenType": "refresh",
  "iat": 1735689600,
  "exp": 1736294400,
  "aud": "platform",
  "iss": "identity-service"
}
```

### **3.3 Token Signing**

```typescript
// Access Token (short-lived, 15 minutes)
const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
  algorithm: 'RS256',  // Use RSA for better security
  expiresIn: '15m',
  audience: 'platform',
  issuer: 'identity-service'
});

// Refresh Token (long-lived, 7 days)
const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
  algorithm: 'RS256',
  expiresIn: '7d',
  audience: 'platform',
  issuer: 'identity-service'
});
```

---

## **4. API ENDPOINTS**

### **4.1 Authentication Endpoints**

#### **POST /auth/register**
```typescript
Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantSlug": "skillup"  // Optional, can be derived from hostname
}

Response:
{
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tenant": {
    "id": "tenant-uuid-456",
    "slug": "skillup",
    "name": "SkillUp IT Academy"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

#### **POST /auth/login**
```typescript
Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "tenantSlug": "skillup",  // Optional, can be derived from hostname
  "deviceId": "device-uuid-abc",  // Optional, generated if not provided
  "deviceName": "Chrome on MacBook Pro"
}

Response:
{
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["student"]
  },
  "tenant": {
    "id": "tenant-uuid-456",
    "slug": "skillup",
    "name": "SkillUp IT Academy"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

#### **POST /auth/refresh**
```typescript
Request:
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

#### **POST /auth/logout**
```typescript
Request:
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "message": "Logged out successfully"
}
```

### **4.2 User Management Endpoints**

#### **GET /users/me**
```typescript
Headers:
{
  "Authorization": "Bearer eyJhbGc..."
}

Response:
{
  "id": "user-uuid-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://cdn.example.com/avatars/123.jpg",
  "tenants": [
    {
      "id": "tenant-uuid-456",
      "slug": "skillup",
      "name": "SkillUp IT Academy",
      "roles": ["student"],
      "joinedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "tenant-uuid-789",
      "slug": "realtutorialhub",
      "name": "RealTutorialHub",
      "roles": ["learner"],
      "joinedAt": "2024-02-20T14:45:00Z"
    }
  ]
}
```

#### **PATCH /users/me**
```typescript
Request:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}

Response:
{
  "id": "user-uuid-123",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

### **4.3 Tenant Management Endpoints**

#### **POST /tenants**
```typescript
Request:
{
  "slug": "newcompany",
  "name": "New Company",
  "domain": "newcompany.com",
  "settings": {
    "features": ["tutorials", "exams"]
  }
}

Response:
{
  "id": "tenant-uuid-new",
  "slug": "newcompany",
  "name": "New Company",
  "domain": "newcompany.com",
  "isActive": true,
  "createdAt": "2024-05-04T10:00:00Z"
}
```

#### **GET /tenants/:slug**
```typescript
Response:
{
  "id": "tenant-uuid-456",
  "slug": "skillup",
  "name": "SkillUp IT Academy",
  "domain": "skillupitacademy.com",
  "logoUrl": "https://cdn.example.com/logos/skillup.png",
  "primaryColor": "#FF5733",
  "settings": {
    "features": ["physical_training", "placement"]
  },
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

---

## **5. AUTHENTICATION FLOW**

### **5.1 Login Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SUBMITS LOGIN                                       │
│    POST /auth/login                                         │
│    { email, password, tenantSlug }                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. IDENTITY SERVICE                                         │
│    ├─ Resolve tenant by slug                                │
│    ├─ Find user by email                                    │
│    ├─ Verify password                                       │
│    ├─ Check if user belongs to tenant                       │
│    ├─ Check if user is blocked                              │
│    └─ Check if tenant is active                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LOAD USER ROLES & PERMISSIONS                            │
│    SELECT r.name, r.permissions                             │
│    FROM user_roles ur                                       │
│    JOIN roles r ON ur.role_id = r.id                        │
│    WHERE ur.user_id = ? AND ur.tenant_id = ?                │
│      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERATE TOKENS                                          │
│    ├─ Access Token (15 min, includes roles & permissions)   │
│    └─ Refresh Token (7 days, includes session ID)           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CREATE SESSION                                           │
│    INSERT INTO sessions (                                   │
│      user_id, tenant_id, refresh_token_hash,                │
│      device_id, device_name, ip_address                     │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. AUDIT LOG                                                │
│    INSERT INTO audit_logs (                                 │
│      user_id, tenant_id, action: 'user.login'               │
│    )                                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. RETURN TOKENS                                            │
│    { user, tenant, accessToken, refreshToken }              │
└─────────────────────────────────────────────────────────────┘
```

### **5.2 Token Validation Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SERVICE RECEIVES REQUEST                                 │
│    GET /tutorials                                           │
│    Authorization: Bearer eyJhbGc...                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API GATEWAY VALIDATES TOKEN                              │
│    ├─ Verify JWT signature                                  │
│    ├─ Check expiration                                      │
│    ├─ Extract tenantId, userId, roles                       │
│    └─ Forward to service with headers                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE RECEIVES REQUEST                                 │
│    Headers:                                                 │
│    ├─ X-User-ID: user-uuid-123                              │
│    ├─ X-Tenant-ID: tenant-uuid-456                          │
│    ├─ X-User-Roles: admin,instructor                        │
│    └─ X-User-Permissions: *                                 │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVICE CHECKS PERMISSIONS                               │
│    if (!hasPermission('tutorials:read')) {                  │
│      return 403 Forbidden                                   │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SERVICE EXECUTES BUSINESS LOGIC                          │
│    ├─ Query data with tenant_id filter                      │
│    └─ Return response                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## **6. MULTI-TENANCY PATTERNS**

### **6.1 User Belongs to Multiple Tenants**

```typescript
// User logs in to SkillUp
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "tenantSlug": "skillup"
}

// Returns token with tenantId = skillup

// Same user logs in to RealTutorialHub
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "tenantSlug": "realtutorialhub"
}

// Returns token with tenantId = realtutorialhub

// User can switch tenants without re-login
POST /auth/switch-tenant
{
  "tenantSlug": "realtutorialhub"
}

// Returns new token with different tenantId
```

### **6.2 Tenant Invitation Flow**

```typescript
// Admin invites user to tenant
POST /tenants/skillup/invitations
{
  "email": "newuser@example.com",
  "role": "student"
}

// Creates tenant_user record with status = 'invited'
// Sends invitation email

// User accepts invitation
POST /invitations/:token/accept
{
  "password": "SecurePassword123!"  // If new user
}

// Updates tenant_user status to 'active'
// User can now log in to tenant
```

---

## **7. SECURITY FEATURES**

### **7.1 Rate Limiting**

```typescript
// Per-IP rate limiting
- 5 failed login attempts per 15 minutes
- 100 API requests per minute

// Per-tenant rate limiting
- 1000 API requests per minute
- 10 concurrent sessions per user
```

### **7.2 Password Policy**

```typescript
Password Requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Not in common password list
- Not same as email
```

### **7.3 Session Management**

```typescript
// Automatic session cleanup
DELETE FROM sessions
WHERE expires_at < NOW()
  OR last_activity_at < NOW() - INTERVAL '30 days';

// Concurrent session limit
SELECT COUNT(*) FROM sessions
WHERE user_id = ? AND tenant_id = ? AND revoked_at IS NULL;

// If count > 10, revoke oldest session
```

---

**Continue to 03-SERVICE-ENGINES.md for service architecture...**
