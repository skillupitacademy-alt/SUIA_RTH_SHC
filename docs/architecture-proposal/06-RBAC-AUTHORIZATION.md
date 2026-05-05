# 06 - RBAC & AUTHORIZATION
## Role-Based Access Control and Permission Management

---

## **1. OVERVIEW**

### **1.1 Authorization in Multi-Tenant Architecture**

In the proposed architecture, authorization happens at **multiple levels**:

```
┌─────────────────────────────────────────────────────────────┐
│ AUTHORIZATION LAYERS                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. API Gateway Level                                       │
│     ├─ JWT validation                                       │
│     ├─ Tenant membership check                              │
│     └─ Basic authentication                                 │
│                                                             │
│  2. Service Level                                           │
│     ├─ Permission-based access control                      │
│     ├─ Resource ownership validation                        │
│     └─ Tenant isolation enforcement                         │
│                                                             │
│  3. Data Level                                              │
│     ├─ Row-level security (RLS)                             │
│     ├─ Tenant-scoped queries                                │
│     └─ Data access policies                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **2. RBAC MODEL**

### **2.1 Core Concepts**

#### **Roles**
```typescript
// Roles are tenant-scoped
interface Role {
  id: string;
  tenantId: string;  // NULL for platform roles
  name: string;      // 'admin', 'instructor', 'student'
  displayName: string;
  permissions: Permission[];
  isSystem: boolean; // System roles can't be deleted
}
```

#### **Permissions**
```typescript
// Permissions follow resource:action pattern
type Permission = 
  | 'tutorials:read'
  | 'tutorials:write'
  | 'tutorials:delete'
  | 'exams:read'
  | 'exams:write'
  | 'exams:attempt'
  | 'users:read'
  | 'users:write'
  | '*';  // Wildcard for admin

// Permission structure
interface Permission {
  resource: string;  // 'tutorials', 'exams', 'users'
  action: string;    // 'read', 'write', 'delete', 'attempt'
  scope?: string;    // 'own', 'tenant', 'all'
}
```

#### **User Roles**
```typescript
// Users can have multiple roles per tenant
interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;  // Optional expiration
}
```

### **2.2 Role Hierarchy**

```
Platform Roles (tenant_id = NULL):
├─ platform_admin      → All permissions across all tenants
└─ platform_support    → Read-only access to all tenants

Tenant Roles (SkillUp):
├─ admin               → All permissions within tenant
├─ instructor          → Manage courses, view students
├─ student             → View courses, attempt exams
└─ guest               → Limited read-only access

Tenant Roles (RealTutorialHub):
├─ admin               → All permissions within tenant
├─ content_creator     → Create/edit tutorials
├─ learner             → View tutorials, attempt exams
└─ guest               → Limited read-only access
```

---

## **3. PERMISSION SYSTEM**

### **3.1 Permission Format**

**Pattern**: `resource:action:scope`

**Examples**:
```typescript
// Read permissions
'tutorials:read:own'      // Read own tutorials
'tutorials:read:tenant'   // Read all tutorials in tenant
'tutorials:read:all'      // Read all tutorials (platform admin)

// Write permissions
'tutorials:write:own'     // Edit own tutorials
'tutorials:write:tenant'  // Edit all tutorials in tenant

// Delete permissions
'tutorials:delete:own'    // Delete own tutorials
'tutorials:delete:tenant' // Delete all tutorials in tenant

// Special permissions
'exams:attempt'           // Attempt exams (students)
'exams:grade'             // Grade exams (instructors)
'users:impersonate'       // Impersonate users (support)
```

### **3.2 Permission Checking**

#### **Service-Level Permission Check**

```typescript
// Middleware for permission checking
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId, tenantId, permissions } = req.user;
    
    // Check if user has permission
    if (!hasPermission(permissions, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Missing permission: ${permission}`
      });
    }
    
    next();
  };
}

// Usage in routes
router.get('/tutorials', 
  requirePermission('tutorials:read'),
  getTutorials
);

router.post('/tutorials',
  requirePermission('tutorials:write'),
  createTutorial
);

router.delete('/tutorials/:id',
  requirePermission('tutorials:delete'),
  deleteTutorial
);
```

#### **Permission Checking Logic**

```typescript
function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Check for wildcard permission (admin)
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check for resource wildcard (e.g., 'tutorials:*')
  const [resource, action] = requiredPermission.split(':');
  const resourceWildcard = `${resource}:*`;
  if (userPermissions.includes(resourceWildcard)) {
    return true;
  }
  
  return false;
}
```

### **3.3 Resource Ownership**

```typescript
// Check if user owns the resource
async function checkOwnership(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Query database to check ownership
  const resource = await db
    .select()
    .from(resourceType)
    .where(
      and(
        eq(resourceType.id, resourceId),
        eq(resourceType.createdBy, userId)
      )
    )
    .limit(1);
  
  return !!resource;
}

// Usage in route handler
async function deleteTutorial(req: Request, res: Response) {
  const { userId, permissions } = req.user;
  const { id } = req.params;
  
  // Check if user has tenant-wide delete permission
  if (hasPermission(permissions, 'tutorials:delete:tenant')) {
    // Can delete any tutorial in tenant
    await tutorialService.delete(id);
    return res.json({ success: true });
  }
  
  // Check if user has own delete permission and owns the tutorial
  if (hasPermission(permissions, 'tutorials:delete:own')) {
    const isOwner = await checkOwnership(userId, 'tutorials', id);
    
    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own tutorials'
      });
    }
    
    await tutorialService.delete(id);
    return res.json({ success: true });
  }
  
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Missing permission to delete tutorials'
  });
}
```

---

## **4. POLICY-BASED ACCESS CONTROL (PBAC)**

### **4.1 Policy Structure**

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  actions: string[];      // ['tutorials:read', 'tutorials:write']
  resources: string[];    // ['tutorials/*', 'tutorials/123']
  conditions?: Condition[];
}

interface Condition {
  type: 'time' | 'ip' | 'attribute';
  operator: 'equals' | 'contains' | 'between';
  value: any;
}
```

### **4.2 Policy Examples**

```typescript
// Policy 1: Students can only attempt exams during exam hours
const examTimePolicy: Policy = {
  id: 'exam-time-policy',
  name: 'Exam Time Restriction',
  description: 'Students can only attempt exams during scheduled hours',
  effect: 'allow',
  actions: ['exams:attempt'],
  resources: ['exams/*'],
  conditions: [
    {
      type: 'time',
      operator: 'between',
      value: {
        start: '09:00',
        end: '17:00'
      }
    }
  ]
};

// Policy 2: Instructors can only grade exams in their courses
const gradeOwnCoursesPolicy: Policy = {
  id: 'grade-own-courses',
  name: 'Grade Own Courses Only',
  description: 'Instructors can only grade exams in courses they teach',
  effect: 'allow',
  actions: ['exams:grade'],
  resources: ['exams/*'],
  conditions: [
    {
      type: 'attribute',
      operator: 'equals',
      value: {
        attribute: 'exam.course.instructorId',
        equals: '${user.id}'
      }
    }
  ]
};

// Policy 3: Deny access from specific IP ranges
const ipRestrictionPolicy: Policy = {
  id: 'ip-restriction',
  name: 'IP Restriction',
  description: 'Deny access from blacklisted IPs',
  effect: 'deny',
  actions: ['*'],
  resources: ['*'],
  conditions: [
    {
      type: 'ip',
      operator: 'contains',
      value: ['192.168.1.0/24', '10.0.0.0/8']
    }
  ]
};
```

### **4.3 Policy Evaluation**

```typescript
async function evaluatePolicy(
  policy: Policy,
  context: {
    user: User;
    action: string;
    resource: string;
    request: Request;
  }
): Promise<boolean> {
  // Check if action matches
  const actionMatches = policy.actions.some(a => 
    a === '*' || a === context.action || matchPattern(a, context.action)
  );
  
  if (!actionMatches) return false;
  
  // Check if resource matches
  const resourceMatches = policy.resources.some(r =>
    r === '*' || r === context.resource || matchPattern(r, context.resource)
  );
  
  if (!resourceMatches) return false;
  
  // Evaluate conditions
  if (policy.conditions) {
    for (const condition of policy.conditions) {
      const conditionMet = await evaluateCondition(condition, context);
      if (!conditionMet) return false;
    }
  }
  
  return true;
}

async function evaluateCondition(
  condition: Condition,
  context: any
): Promise<boolean> {
  switch (condition.type) {
    case 'time':
      return evaluateTimeCondition(condition, context);
    case 'ip':
      return evaluateIpCondition(condition, context);
    case 'attribute':
      return evaluateAttributeCondition(condition, context);
    default:
      return false;
  }
}
```

---

## **5. ATTRIBUTE-BASED ACCESS CONTROL (ABAC)**

### **5.1 Attributes**

```typescript
interface AccessContext {
  // Subject attributes (user)
  subject: {
    id: string;
    roles: string[];
    department?: string;
    level?: string;
  };
  
  // Resource attributes
  resource: {
    type: string;
    id: string;
    owner: string;
    visibility: 'public' | 'private' | 'restricted';
    tags?: string[];
  };
  
  // Environment attributes
  environment: {
    time: Date;
    ip: string;
    location?: string;
    device?: string;
  };
  
  // Action
  action: string;
}
```

### **5.2 ABAC Rules**

```typescript
// Rule: Users can only view tutorials in their department
const departmentRule: ABACRule = {
  name: 'Department Access',
  condition: (context: AccessContext) => {
    return context.subject.department === context.resource.tags?.includes(context.subject.department);
  }
};

// Rule: Senior users can access all resources
const seniorityRule: ABACRule = {
  name: 'Seniority Access',
  condition: (context: AccessContext) => {
    return context.subject.level === 'senior';
  }
};

// Rule: Public resources are accessible to all
const publicResourceRule: ABACRule = {
  name: 'Public Resource Access',
  condition: (context: AccessContext) => {
    return context.resource.visibility === 'public';
  }
};
```

### **5.3 ABAC Evaluation**

```typescript
async function checkAccess(context: AccessContext): Promise<boolean> {
  // Get applicable rules
  const rules = await getRulesForAction(context.action);
  
  // Evaluate each rule
  for (const rule of rules) {
    if (await rule.condition(context)) {
      return true;
    }
  }
  
  return false;
}

// Usage
const context: AccessContext = {
  subject: {
    id: 'user-123',
    roles: ['instructor'],
    department: 'engineering'
  },
  resource: {
    type: 'tutorial',
    id: 'tutorial-456',
    owner: 'user-789',
    visibility: 'private',
    tags: ['engineering', 'advanced']
  },
  environment: {
    time: new Date(),
    ip: '192.168.1.100'
  },
  action: 'tutorials:read'
};

const hasAccess = await checkAccess(context);
```

---

## **6. TENANT ISOLATION**

### **6.1 Middleware Enforcement**

```typescript
// Tenant isolation middleware
export function enforceTenantIsolation() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { tenantId } = req.user;
    
    // Attach tenant filter to all queries
    req.tenantFilter = {
      tenantId: tenantId
    };
    
    next();
  };
}

// Usage in service
async function getTutorials(req: Request) {
  const { tenantFilter } = req;
  
  // All queries automatically filtered by tenant
  const tutorials = await db
    .select()
    .from(tutorials)
    .where(eq(tutorials.tenantId, tenantFilter.tenantId));
  
  return tutorials;
}
```

### **6.2 Database-Level Isolation (PostgreSQL RLS)**

```sql
-- Enable Row Level Security
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON tutorials
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create policy for platform admins
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
```

```typescript
// Set tenant context before queries
async function setTenantContext(tenantId: string, userId: string) {
  await db.execute(sql`
    SET LOCAL app.current_tenant_id = ${tenantId};
    SET LOCAL app.current_user_id = ${userId};
  `);
}

// Usage
async function getTutorials(tenantId: string, userId: string) {
  await setTenantContext(tenantId, userId);
  
  // Query automatically filtered by RLS
  const tutorials = await db.select().from(tutorials);
  
  return tutorials;
}
```

---

## **7. AUTHORIZATION FLOW**

### **7.1 Complete Authorization Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REQUEST ARRIVES                                          │
│    GET /tutorials/123                                       │
│    Authorization: Bearer <jwt>                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API GATEWAY                                              │
│    ├─ Validate JWT                                          │
│    ├─ Extract userId, tenantId, roles, permissions          │
│    └─ Forward to service with headers                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE MIDDLEWARE                                       │
│    ├─ Check permission: 'tutorials:read'                    │
│    ├─ Enforce tenant isolation                              │
│    └─ Set tenant context                                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BUSINESS LOGIC                                           │
│    ├─ Query database (tenant-filtered)                      │
│    ├─ Check resource ownership (if needed)                  │
│    └─ Apply business rules                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DATABASE (RLS)                                           │
│    ├─ Apply row-level security policies                     │
│    ├─ Filter by tenant_id                                   │
│    └─ Return authorized data only                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. RESPONSE                                                 │
│    200 OK                                                   │
│    { tutorial data }                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## **8. IMPLEMENTATION EXAMPLES**

### **8.1 Tutorial Service Authorization**

```typescript
// Tutorial service with complete authorization
class TutorialService {
  async getTutorial(
    tutorialId: string,
    userId: string,
    tenantId: string,
    permissions: string[]
  ) {
    // Check read permission
    if (!hasPermission(permissions, 'tutorials:read')) {
      throw new ForbiddenError('Missing permission: tutorials:read');
    }
    
    // Query with tenant isolation
    const tutorial = await db
      .select()
      .from(tutorials)
      .where(
        and(
          eq(tutorials.id, tutorialId),
          eq(tutorials.tenantId, tenantId)
        )
      )
      .limit(1);
    
    if (!tutorial) {
      throw new NotFoundError('Tutorial not found');
    }
    
    // Check visibility
    if (tutorial.visibility === 'private') {
      // Only owner or admin can view private tutorials
      const isOwner = tutorial.createdBy === userId;
      const isAdmin = hasPermission(permissions, '*');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('Tutorial is private');
      }
    }
    
    return tutorial;
  }
  
  async createTutorial(
    data: CreateTutorialDto,
    userId: string,
    tenantId: string,
    permissions: string[]
  ) {
    // Check write permission
    if (!hasPermission(permissions, 'tutorials:write')) {
      throw new ForbiddenError('Missing permission: tutorials:write');
    }
    
    // Create tutorial with tenant and owner
    const tutorial = await db.insert(tutorials).values({
      ...data,
      tenantId: tenantId,
      createdBy: userId
    }).returning();
    
    return tutorial;
  }
  
  async deleteTutorial(
    tutorialId: string,
    userId: string,
    tenantId: string,
    permissions: string[]
  ) {
    // Get tutorial first
    const tutorial = await this.getTutorial(
      tutorialId,
      userId,
      tenantId,
      permissions
    );
    
    // Check delete permission
    const canDeleteAll = hasPermission(permissions, 'tutorials:delete:tenant');
    const canDeleteOwn = hasPermission(permissions, 'tutorials:delete:own');
    
    if (!canDeleteAll && !canDeleteOwn) {
      throw new ForbiddenError('Missing permission to delete tutorials');
    }
    
    // Check ownership if only has own permission
    if (!canDeleteAll && canDeleteOwn) {
      if (tutorial.createdBy !== userId) {
        throw new ForbiddenError('You can only delete your own tutorials');
      }
    }
    
    // Delete tutorial
    await db
      .delete(tutorials)
      .where(
        and(
          eq(tutorials.id, tutorialId),
          eq(tutorials.tenantId, tenantId)
        )
      );
    
    return { success: true };
  }
}
```

---

## **9. BEST PRACTICES**

### **9.1 Security Best Practices**

✅ **Principle of Least Privilege**
- Grant minimum permissions needed
- Use specific permissions over wildcards
- Regularly audit and revoke unused permissions

✅ **Defense in Depth**
- Multiple authorization layers (gateway, service, database)
- Don't rely on single point of authorization
- Validate at every layer

✅ **Fail Secure**
- Default to deny access
- Explicit allow required
- Log all authorization failures

✅ **Audit Everything**
- Log all permission checks
- Track permission grants/revokes
- Monitor for suspicious patterns

### **9.2 Performance Optimization**

✅ **Cache Permissions**
```typescript
// Cache user permissions in JWT
const token = jwt.sign({
  userId: user.id,
  tenantId: tenant.id,
  permissions: ['tutorials:read', 'tutorials:write', 'exams:attempt']
}, SECRET);

// No need to query database for every request
```

✅ **Batch Permission Checks**
```typescript
// Check multiple permissions at once
function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(p => 
    hasPermission(userPermissions, p)
  );
}
```

✅ **Index Database Properly**
```sql
-- Index for tenant isolation
CREATE INDEX idx_tutorials_tenant_id ON tutorials(tenant_id);

-- Index for ownership checks
CREATE INDEX idx_tutorials_created_by ON tutorials(created_by);

-- Composite index for common queries
CREATE INDEX idx_tutorials_tenant_user ON tutorials(tenant_id, created_by);
```

---

## **10. SUMMARY**

### **10.1 Key Takeaways**

✅ **Multi-Layer Authorization**
- Gateway: JWT validation, tenant membership
- Service: Permission checks, resource ownership
- Database: Row-level security, tenant isolation

✅ **RBAC Model**
- Tenant-scoped roles
- Permission format: `resource:action:scope`
- Support for role hierarchy

✅ **Advanced Patterns**
- Policy-Based Access Control (PBAC)
- Attribute-Based Access Control (ABAC)
- Time-based and condition-based access

✅ **Tenant Isolation**
- Application-level filtering
- Database-level RLS
- Middleware enforcement

### **10.2 Implementation Checklist**

- [ ] Define roles and permissions per tenant
- [ ] Implement permission checking middleware
- [ ] Add tenant isolation to all queries
- [ ] Enable Row-Level Security (RLS)
- [ ] Cache permissions in JWT
- [ ] Audit all authorization decisions
- [ ] Test with different user roles
- [ ] Document permission requirements

---

**Next Document**: 07-DATA-ARCHITECTURE.md (Data patterns and strategies)
