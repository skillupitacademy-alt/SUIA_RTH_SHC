# 🔐 IDENTITY GUIDE: originalUserId vs shadowUserId

## 📋 TL;DR

```typescript
// ✅ CORRECT: Database operations
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);

// ✅ CORRECT: Logging/monitoring
const trackingId = getObservabilityUserId(auth);
logger.info('User action', { userId: trackingId });

// ❌ WRONG: Using shadowUserId for database
const profile = await db.profiles.findById(auth.shadowUserId); // WRONG!
```

---

## 🎯 THE TWO USER IDs

### **originalUserId** (Brand-Specific)
- **What:** The user's ID in the brand-specific database
- **Where:** `db-rth` or `db-skillup` database
- **Use for:** ALL database queries, profile lookups, data updates
- **Example:** `usr_abc123` (points to RealTutorialHub user record)

### **shadowUserId** (Cross-Brand)
- **What:** The user's ID in the central identity database
- **Where:** `db-people` database
- **Use for:** Logging, monitoring, cross-brand tracking
- **Example:** `shadow_xyz789` (points to central identity record)

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL IDENTITY                          │
│                     (db-people)                              │
│                                                              │
│  shadowUserId: shadow_xyz789                                │
│  email: user@example.com                                    │
│  ├─ RealTutorialHub user: usr_abc123                        │
│  └─ SkillUp user: usr_def456                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│  RealTutorialHub │              │     SkillUp      │
│    (db-rth)      │              │   (db-skillup)   │
│                  │              │                  │
│ originalUserId:  │              │ originalUserId:  │
│  usr_abc123      │              │  usr_def456      │
│                  │              │                  │
│ Profile, Exams,  │              │ Profile, Exams,  │
│ Progress, etc.   │              │ Progress, etc.   │
└──────────────────┘              └──────────────────┘
```

---

## ✅ CORRECT USAGE PATTERNS

### **Pattern 1: Database Query**
```typescript
import { extractAuthFromRequest, getDatabaseUserId } from '@/share-branding/auth';

export async function GET(req: NextRequest) {
  const auth = await extractAuthFromRequest(req);
  
  if (!auth.isAuthenticated) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // ✅ CORRECT: Use getDatabaseUserId for database queries
  const userId = getDatabaseUserId(auth);
  const profile = await db.profiles.findById(userId);
  
  return Response.json({ profile });
}
```

### **Pattern 2: Logging**
```typescript
import { extractAuthFromRequest, getObservabilityUserId } from '@/share-branding/auth';

export async function POST(req: NextRequest) {
  const auth = await extractAuthFromRequest(req);
  
  // ✅ CORRECT: Use getObservabilityUserId for logging
  const trackingId = getObservabilityUserId(auth);
  
  logger.info('User submitted exam', {
    userId: trackingId,
    examId: 'exam_123',
    timestamp: Date.now(),
  });
  
  // ✅ CORRECT: Use getDatabaseUserId for database
  const userId = getDatabaseUserId(auth);
  await db.exams.create({ userId, examId: 'exam_123' });
  
  return Response.json({ success: true });
}
```

### **Pattern 3: Both IDs Explicitly**
```typescript
import { extractAuthFromRequest, getIdentityContext } from '@/share-branding/auth';

export async function GET(req: NextRequest) {
  const auth = await extractAuthFromRequest(req);
  const identity = getIdentityContext(auth);
  
  // ✅ CORRECT: Explicit usage
  const profile = await db.profiles.findById(identity.originalUserId);
  
  logger.info('Profile loaded', {
    userId: identity.shadowUserId,
    brand: identity.brand,
  });
  
  return Response.json({ profile });
}
```

---

## ❌ COMMON MISTAKES

### **Mistake 1: Using shadowUserId for Database**
```typescript
// ❌ WRONG: This will return wrong/missing data
const profile = await db.profiles.findById(auth.shadowUserId);

// ✅ CORRECT: Use getDatabaseUserId
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);
```

### **Mistake 2: Using Generic userId Field**
```typescript
// ❌ WRONG: Ambiguous - which ID is this?
const userId = auth.userId;
const profile = await db.profiles.findById(userId);

// ✅ CORRECT: Be explicit
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);
```

### **Mistake 3: Direct Field Access**
```typescript
// ❌ WRONG: Direct access bypasses validation
const userId = auth.originalUserId;
const profile = await db.profiles.findById(userId);

// ✅ CORRECT: Use helper function (includes validation)
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);
```

---

## 🔍 WHEN TO USE WHICH

| Use Case | Function | Reason |
|----------|----------|--------|
| Database queries | `getDatabaseUserId()` | Returns brand-specific user ID |
| Profile lookups | `getDatabaseUserId()` | Profile stored under originalUserId |
| Exam records | `getDatabaseUserId()` | Exams linked to originalUserId |
| Progress tracking | `getDatabaseUserId()` | Progress stored per brand |
| User data updates | `getDatabaseUserId()` | Updates brand-specific record |
| **Logging** | `getObservabilityUserId()` | Cross-brand tracking |
| **Monitoring** | `getObservabilityUserId()` | Unified user view |
| **Analytics** | `getObservabilityUserId()` | Cross-brand analytics |
| **Tracing** | `getObservabilityUserId()` | Distributed tracing |

---

## 🚨 CRITICAL RULES

1. **NEVER use shadowUserId for database queries**
   - It points to the wrong database (db-people, not db-rth/db-skillup)
   - Will return null or wrong user data

2. **ALWAYS use getDatabaseUserId() for database operations**
   - Enforces correct ID usage
   - Includes validation
   - Provides audit trail

3. **Use getObservabilityUserId() for logging/monitoring**
   - Enables cross-brand tracking
   - Consistent user identity across brands

4. **Avoid direct field access**
   - Use helper functions instead of `auth.originalUserId`
   - Helper functions include validation and logging

---

## 🧪 TESTING YOUR CODE

### **Test 1: Verify Database Query**
```typescript
// Your code
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);

// Test: Profile should exist
expect(profile).toBeDefined();
expect(profile.id).toBe(userId);
```

### **Test 2: Verify Logging**
```typescript
// Your code
const trackingId = getObservabilityUserId(auth);
logger.info('Action', { userId: trackingId });

// Test: Log should contain shadowUserId
expect(logOutput).toContain(auth.shadowUserId);
```

### **Test 3: Verify Identity Context**
```typescript
// Your code
const identity = getIdentityContext(auth);

// Test: Both IDs should be present
expect(identity.originalUserId).toBeDefined();
expect(identity.shadowUserId).toBeDefined();
expect(identity.brand).toMatch(/realtutorialhub|skillup/);
```

---

## 📚 MIGRATION GUIDE

If you have existing code using `auth.userId` or `auth.shadowUserId` directly:

### **Step 1: Identify Usage**
```bash
# Find all direct userId usage
grep -r "auth\.userId" src/
grep -r "auth\.shadowUserId" src/
grep -r "auth\.originalUserId" src/
```

### **Step 2: Categorize**
- Database queries → Use `getDatabaseUserId()`
- Logging/monitoring → Use `getObservabilityUserId()`
- Both needed → Use `getIdentityContext()`

### **Step 3: Replace**
```typescript
// BEFORE
const userId = auth.userId;
const profile = await db.profiles.findById(userId);

// AFTER
const userId = getDatabaseUserId(auth);
const profile = await db.profiles.findById(userId);
```

### **Step 4: Test**
- Run unit tests
- Test login flow
- Verify profile loads correctly
- Check logs for IDENTITY_GUARD entries

---

## 🔗 RELATED FILES

- `src/share-branding/auth/identityGuard.ts` - Identity guard implementation
- `src/share-branding/auth/unifiedBffAuth.ts` - Auth extraction
- `src/share-branding/auth/index.ts` - Exports

---

## ❓ FAQ

**Q: Why do we have two user IDs?**  
A: To support cross-brand identity while maintaining brand-specific data isolation.

**Q: Can I use shadowUserId for database queries?**  
A: NO. It will return wrong/missing data. Always use `getDatabaseUserId()`.

**Q: What if I need both IDs?**  
A: Use `getIdentityContext()` to get both IDs explicitly.

**Q: How do I know which ID to use?**  
A: Database = `getDatabaseUserId()`, Logging = `getObservabilityUserId()`.

**Q: What happens if I use the wrong ID?**  
A: Database queries will fail or return wrong data. Use the helper functions to avoid this.

---

**Last Updated:** April 24, 2026  
**Phase:** 2 - Identity Enforcement
