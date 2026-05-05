# AUTHENTICATION FLOW
## Complete Authentication Architecture

---

## **1. AUTHENTICATION URLS**

### **1.1 RealTutorialHub**

**User Portal**:
```
Login:    POST https://api.realtutorialhub.com/api/auth/login
Logout:   POST https://api.realtutorialhub.com/api/auth/logout
Refresh:  POST https://api.realtutorialhub.com/api/auth/refresh
Register: POST https://api.realtutorialhub.com/api/auth/register
```

**Admin Portal**:
```
Login:    POST https://api.realtutorialhub.com/api/admin/auth/login
Logout:   POST https://api.realtutorialhub.com/api/admin/auth/logout
Refresh:  POST https://api.realtutorialhub.com/api/admin/auth/refresh
```

### **1.2 SkillUp IT Academy**

**User Portal**:
```
Login:    POST https://api.skillupitacademy.com/api/auth/login
Logout:   POST https://api.skillupitacademy.com/api/auth/logout
Refresh:  POST https://api.skillupitacademy.com/api/auth/refresh
Register: POST https://api.skillupitacademy.com/api/auth/register
```

**Admin Portal**:
```
Login:    POST https://api.skillupitacademy.com/api/admin/auth/login
Logout:   POST https://api.skillupitacademy.com/api/admin/auth/logout
Refresh:  POST https://api.skillupitacademy.com/api/admin/auth/refresh
```

**Note**: Both brands route to the same backend (`quiz-api-server`), but brand is resolved from hostname.

---

## **2. LOGIN FLOW (Step-by-Step)**

### **Step 1: User Submits Login**

**Request**:
```http
POST https://api.realtutorialhub.com/api/auth/login
Content-Type: application/json

{
  "email": "admin@realtutorialhub.com",
  "password": "SecurePassword123!",
  "deviceId": "device-uuid-123",
  "deviceName": "Chrome on MacBook Pro"
}
```

---

### **Step 2: Cloudflare Worker (Edge Gateway)**

**Actions**:
1. **DNS Resolution**: `api.realtutorialhub.com` → Cloudflare Worker
2. **Brand Resolution**: Extract hostname → `realtutorialhub`
3. **Route Matching**: `/api/auth/login` → `EXAM_SERVICE_URL` (quiz-api-server)
4. **Header Injection**:
   ```http
   X-Brand: realtutorialhub
   X-Request-ID: uuid-generated
   X-Forwarded-Host: api.realtutorialhub.com
   X-Internal-Secret: [gateway_secret]
   ```
5. **Proxy**: Forward to `https://quiz-api-server-plldp3atca-as.a.run.app/api/auth/login`

**Note**: Login route is PUBLIC (no JWT validation at edge)

---

### **Step 3: API Server (quiz-api-server)**

**File**: `apps/api-server/src/modules/auth/login.service.ts`

**Actions**:

#### 3.1 Brand Context Selection
```typescript
const brand = req.headers.get('x-brand') || 'realtutorialhub';
const brandContext = getAuthBrandContext(brand);
// For RTH: brandContext.db = rth_prod
// For SkillUp: brandContext.db = skillup_prod
```

#### 3.2 Security Checks
```typescript
// Check if account is locked (rate limiting)
if (await securityService.isAccountLocked(email, ip, brand)) {
  throw new Error('Account temporarily locked');
}
```

#### 3.3 User Lookup
```sql
-- Query brand-specific database (rth_prod or skillup_prod)
SELECT 
  u.id, u.email, u.passwordHash, u.isBlocked, u.emailVerified,
  u.shadowUserId, u.lastActiveAt,
  ur.roleId, r.name as roleName
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
LEFT JOIN roles r ON ur.roleId = r.id
WHERE u.email = 'admin@realtutorialhub.com'
```

**Result**:
```json
{
  "id": "cm5abc123...",
  "email": "admin@realtutorialhub.com",
  "passwordHash": "$2a$10$...",
  "isBlocked": false,
  "emailVerified": true,
  "shadowUserId": "cm5xyz789...",
  "userRoles": [
    { "role": { "name": "admin" } },
    { "role": { "name": "super_admin" } }
  ]
}
```

#### 3.4 Password Verification
```typescript
const passwordMatch = await bcrypt.compare(password, user.passwordHash);
if (!passwordMatch) {
  await securityService.trackLoginAttempt(ip, email, false, brand);
  throw new Error('Invalid credentials');
}
```

#### 3.5 Blocked User Check
```typescript
if (user.isBlocked === true) {
  throw new Error('Account has been blocked');
}
```

---

### **Step 4: Identity Bridge (Shadow User Sync)**

**File**: `packages/identity-bridge/src/index.ts`

**Purpose**: Link brand-specific user to cross-brand shadow user in `people_prod`.

**Actions**:

#### 4.1 Check Shadow User
```typescript
if (!user.shadowUserId) {
  // Create shadow user in people_prod
  const bridge = new UserIdentityBridgeService();
  const result = await bridge.syncUser({
    externalId: user.id,
    externalBrand: brand,
    email: user.email,
    platform: brand
  });
  
  // Update brand-specific user with shadowUserId
  await bridge.updateShadowUserId(
    brandContext.db,
    brandContext.tables.users,
    user.id,
    result.shadowUserId
  );
  
  // Grant platform access
  await bridge.grantPlatformAccess(result.shadowUserId, brand);
}
```

**Shadow User Table** (`people_prod.shadow_users`):
```sql
CREATE TABLE shadow_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE shadow_user_platforms (
  shadow_user_id UUID REFERENCES shadow_users(id),
  platform VARCHAR(50),  -- 'realtutorialhub' or 'skillup'
  external_user_id UUID,
  granted_at TIMESTAMP,
  PRIMARY KEY (shadow_user_id, platform)
);
```

---

### **Step 5: Token Generation**

**File**: `apps/api-server/src/modules/auth/token.service.ts`

**Actions**:

#### 5.1 Extract Roles
```typescript
const roleNames = user.userRoles
  .map(ur => ur.role.name.toLowerCase())
  .filter(role => role !== null);
// Result: ["admin", "super_admin"]

const isAdmin = roleNames.includes('admin') || 
                roleNames.includes('super_admin') || 
                roleNames.includes('infrastructure');
```

#### 5.2 Generate Access Token
```typescript
const accessToken = await tokenService.generateAccessToken({
  userId: user.id,                    // cm5abc123...
  originalUserId: user.id,            // cm5abc123...
  shadowUserId: user.shadowUserId,    // cm5xyz789...
  email: user.email,
  roles: roleNames,                   // ["admin", "super_admin"]
  isAdmin: true,
  tokenType: isAdmin ? 'admin' : 'user',  // "admin"
  brand: brand                        // "realtutorialhub"
});
```

**JWT Payload**:
```json
{
  "userId": "cm5abc123...",
  "originalUserId": "cm5abc123...",
  "shadowUserId": "cm5xyz789...",
  "email": "admin@realtutorialhub.com",
  "roles": ["admin", "super_admin"],
  "isAdmin": true,
  "tokenType": "admin",
  "brand": "realtutorialhub",
  "aud": "admin",
  "iat": 1735689600,
  "exp": 1735690500
}
```

**Signing**:
```typescript
// For admin tokens
const secret = process.env.ADMIN_JWT_SECRET;
const token = jwt.sign(payload, secret, {
  algorithm: 'HS256',
  expiresIn: '15m'
});
```

#### 5.3 Generate Refresh Token
```typescript
const refreshToken = await tokenService.generateRefreshToken(
  user.id,
  isAdmin,
  isAdmin ? 'admin' : 'user',
  {
    tokenType: isAdmin ? 'admin' : 'user',
    brand: brand,
    originalUserId: user.id,
    shadowUserId: user.shadowUserId
  }
);
```

**Refresh Token Payload**:
```json
{
  "userId": "cm5abc123...",
  "tokenType": "admin",
  "brand": "realtutorialhub",
  "originalUserId": "cm5abc123...",
  "shadowUserId": "cm5xyz789...",
  "iat": 1735689600,
  "exp": 1736294400  // 7 days
}
```

---

### **Step 6: Session Storage**

**File**: `apps/api-server/src/modules/auth/repositories/token.repository.ts`

**Actions**:

#### 6.1 Hash Refresh Token
```typescript
const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
```

#### 6.2 Store in Database
```sql
-- Insert into brand-specific database (rth_prod or skillup_prod)
INSERT INTO refresh_tokens (
  id,
  user_id,
  token_hash,
  device_id,
  device_name,
  ip_address,
  user_agent,
  expires_at,
  created_at
) VALUES (
  'rt_uuid_123',
  'cm5abc123...',
  '$2a$10$...',
  'device-uuid-123',
  'Chrome on MacBook Pro',
  '203.0.113.42',
  'Mozilla/5.0...',
  NOW() + INTERVAL '7 days',
  NOW()
);
```

#### 6.3 Update Last Active
```sql
UPDATE users
SET last_active_at = NOW()
WHERE id = 'cm5abc123...';
```

---

### **Step 7: Response to Client**

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: admin_accessToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Domain=.realtutorialhub.com; Path=/; Max-Age=900
Set-Cookie: admin_refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Domain=.realtutorialhub.com; Path=/; Max-Age=604800

{
  "user": {
    "id": "cm5abc123...",
    "email": "admin@realtutorialhub.com",
    "roles": ["admin", "super_admin"],
    "isAdmin": true,
    "shadowUserId": "cm5xyz789..."
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900
}
```

**Cookie Details**:
- **Name**: `admin_accessToken` (for admin) or `accessToken` (for user)
- **HttpOnly**: Yes (prevents XSS)
- **Secure**: Yes (HTTPS only)
- **SameSite**: Lax (CSRF protection)
- **Domain**: `.realtutorialhub.com` (works across subdomains)
- **Path**: `/`
- **Max-Age**: 900 seconds (15 minutes) for access, 604800 (7 days) for refresh

---

## **3. AUTHENTICATED REQUEST FLOW**

### **Step 1: Client Sends Request**

**Request**:
```http
GET https://admin.realtutorialhub.com/api/admin/users
Cookie: admin_accessToken=eyJhbGc...
```

---

### **Step 2: Cloudflare Worker (Edge Authentication)**

**File**: `services/api-gateway/src/middleware/auth.ts`

**Actions**:

#### 2.1 Extract Token
```typescript
// Priority: Cookie > Authorization header
const cookieHeader = request.headers.get('cookie');
const token = getCookieValue(cookieHeader, 'admin_accessToken');
// Fallback to Authorization: Bearer <token>
```

#### 2.2 Verify JWT
```typescript
const tokenService = new TokenService(
  JWT_SECRET,
  JWT_SECRET,
  ADMIN_JWT_SECRET
);

const payload = await tokenService.verifyAccessToken(token);
```

#### 2.3 Validate Claims
```typescript
// Check token type
if (payload.tokenType !== 'admin') {
  return new Response('Forbidden: token_type_mismatch', { status: 403 });
}

// Check brand
const hostnameBrand = resolveBrandFromHostname(url.hostname);
if (payload.brand !== hostnameBrand) {
  return new Response('Forbidden: brand_mismatch', { status: 403 });
}

// Check admin role
if (!payload.roles.includes('admin') && !payload.roles.includes('super_admin')) {
  return new Response('Forbidden: missing_admin_role', { status: 403 });
}
```

#### 2.4 Inject Headers
```typescript
headers.set('X-User-ID', payload.originalUserId);
headers.set('X-Shadow-User-ID', payload.shadowUserId);
headers.set('X-Brand', payload.brand);
headers.set('X-Portal-Identity', 'admin');
headers.set('X-User-Roles', payload.roles.join(','));
headers.set('X-Internal-Secret', INTERNAL_GATEWAY_SECRET);
```

#### 2.5 Proxy to Backend
```typescript
const response = await proxyRequest(request, EXAM_SERVICE_URL, {
  requestId: uuid,
  gatewaySecret: INTERNAL_GATEWAY_SECRET,
  userId: payload.originalUserId,
  shadowUserId: payload.shadowUserId,
  portal: 'admin',
  brand: payload.brand,
  roles: payload.roles
});
```

---

### **Step 3: API Server (Route-Level Authorization)**

**File**: `apps/api-server/src/modules/auth/admin-audience.util.ts`

**Actions**:

#### 3.1 Verify Token (Defense in Depth)
```typescript
const token = tokenService.getAccessToken(req, { scope: 'admin' });
const payload = await tokenService.verifyAdminAccessToken(token, {
  audience: 'admin'
});
```

#### 3.2 RBAC Check
```typescript
const hasAdminAccess = await _verifyAdmin(payload);
if (!hasAdminAccess) {
  throw forbidden('Admin access only');
}
```

---

### **Step 4: RBAC Service**

**File**: `apps/api-server/src/modules/auth/rbac.service.ts`

**Actions**:

#### 4.1 Select Brand Database
```typescript
const brand = payload.brand; // "realtutorialhub"
const authContext = getAuthBrandContext(brand);
// authContext.db = rth_prod
```

#### 4.2 Check Blocked Status
```sql
SELECT is_blocked
FROM users
WHERE id = 'cm5abc123...'
LIMIT 1;
```

#### 4.3 Verify Admin Role
```sql
SELECT ur.*, r.name
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'cm5abc123...'
  AND LOWER(r.name) IN ('admin', 'super_admin', 'infrastructure')
LIMIT 1;
```

**Result**: `true` (admin role found)

---

### **Step 5: Resource Access**

**Actions**:
1. **Authorization Passed**: Execute business logic
2. **Query Database**: Fetch admin users list
3. **Return Response**: Send data to client
4. **Audit Log**: Record access attempt

---

## **4. LOGOUT FLOW**

### **Request**:
```http
POST https://api.realtutorialhub.com/api/admin/auth/logout
Cookie: admin_refreshToken=eyJhbGc...
```

### **Actions**:

#### 4.1 Extract Refresh Token
```typescript
const refreshToken = getCookieValue(req.headers.get('cookie'), 'admin_refreshToken');
```

#### 4.2 Hash Token
```typescript
const tokenHash = await bcrypt.hash(refreshToken, 10);
```

#### 4.3 Revoke Token
```sql
-- Delete from brand-specific database
DELETE FROM refresh_tokens
WHERE token_hash = '$2a$10$...';
```

#### 4.4 Check Remaining Sessions
```sql
SELECT COUNT(*) as session_count
FROM refresh_tokens
WHERE user_id = 'cm5abc123...'
  AND expires_at > NOW();
```

#### 4.5 Update Last Active (if last session)
```sql
-- If session_count = 0
UPDATE users
SET last_active_at = NOW() - INTERVAL '1 hour'
WHERE id = 'cm5abc123...';
```

#### 4.6 Clear Cookies
```http
HTTP/1.1 200 OK
Set-Cookie: admin_accessToken=; HttpOnly; Secure; SameSite=Lax; Domain=.realtutorialhub.com; Path=/; Max-Age=0
Set-Cookie: admin_refreshToken=; HttpOnly; Secure; SameSite=Lax; Domain=.realtutorialhub.com; Path=/; Max-Age=0

{
  "message": "Logged out successfully"
}
```

---

## **5. TOKEN REFRESH FLOW**

### **Request**:
```http
POST https://api.realtutorialhub.com/api/admin/auth/refresh
Cookie: admin_refreshToken=eyJhbGc...
```

### **Actions**:

#### 5.1 Verify Refresh Token
```typescript
const payload = await tokenService.verifyRefreshToken(refreshToken);
```

#### 5.2 Check Token in Database
```sql
SELECT *
FROM refresh_tokens
WHERE user_id = 'cm5abc123...'
  AND token_hash = '$2a$10$...'
  AND expires_at > NOW()
  AND revoked_at IS NULL
LIMIT 1;
```

#### 5.3 Generate New Access Token
```typescript
const newAccessToken = await tokenService.generateAccessToken({
  userId: payload.userId,
  originalUserId: payload.originalUserId,
  shadowUserId: payload.shadowUserId,
  email: user.email,
  roles: user.roles,
  isAdmin: true,
  tokenType: 'admin',
  brand: payload.brand
});
```

#### 5.4 Response
```http
HTTP/1.1 200 OK
Set-Cookie: admin_accessToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Domain=.realtutorialhub.com; Path=/; Max-Age=900

{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

---

## **6. SECURITY FEATURES**

### **6.1 Defense in Depth**
- JWT validated at **edge** (Cloudflare Worker)
- JWT re-validated at **backend** (API server)
- RBAC check queries **database** (real-time)

### **6.2 Brand Isolation**
- Admin role checked in **brand-specific database**
- RTH admin can't access SkillUp resources
- Token brand must match hostname brand

### **6.3 Token Type Validation**
- Admin tokens have `tokenType: "admin"` and `aud: "admin"`
- User tokens have `tokenType: "user"` and `aud: "user"`
- Admin tokens can't access user routes (and vice versa)

### **6.4 Blocked User Check**
- Always queries database for `isBlocked` status
- No caching (real-time security)
- Blocks take effect immediately

### **6.5 Audit Logging**
- All authentication events logged
- Includes: action, userId, IP, brand, timestamp
- Stored in brand-specific `audit_logs` table

### **6.6 Rate Limiting**
- Failed login attempts tracked per IP + email
- Account locked after 5 failed attempts
- Lockout duration: 15 minutes

### **6.7 Device Tracking**
- Each session tied to specific device
- Device ID, name, IP, user agent stored
- Logout only revokes current device (multi-device support)

---

## **7. PERFORMANCE OPTIMIZATIONS**

### **7.1 Edge JWT Validation**
- JWT verified at Cloudflare edge (< 10ms)
- Reduces backend load by 80%
- Only valid requests reach backend

### **7.2 Token Caching**
- JWT payload cached in memory (edge)
- No database query for every request
- Refresh token validates against DB

### **7.3 Connection Pooling**
- Neon serverless auto-scales connections
- No connection overhead
- Sub-50ms query latency

### **7.4 Smart Placement**
- Cloudflare Worker executes closer to Singapore backend
- Reduces latency by 50-100ms
- Optimal for Asia-Pacific users

---

## **AUTHENTICATION SUMMARY**

| Feature | Implementation | Security Level |
|---------|----------------|----------------|
| JWT Validation | Edge + Backend | High |
| Brand Isolation | Separate databases | High |
| Token Type Validation | Admin/User separation | High |
| Blocked User Check | Real-time DB query | High |
| Audit Logging | All events logged | Medium |
| Rate Limiting | IP + Email tracking | Medium |
| Device Tracking | Multi-device support | Medium |
| Password Hashing | bcrypt (cost 10) | High |
| Token Expiry | 15min access, 7day refresh | Medium |
| Cookie Security | HttpOnly, Secure, SameSite | High |
