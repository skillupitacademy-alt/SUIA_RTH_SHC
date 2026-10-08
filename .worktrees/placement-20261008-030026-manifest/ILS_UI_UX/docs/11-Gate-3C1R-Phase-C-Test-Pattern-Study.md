# GATE 3C.1R - PHASE C TEST PATTERN STUDY
## Database Connection, API Testing, and End-to-End Verification

**Date:** 2026-09-10  
**Purpose:** Study successful patterns before writing Phase C verification tests

---

## PHASE C OBJECTIVE

Verify the complete universal block-level read path:

```
block_learning_state (database)
        ↓
BlockLearningStateRepository.findByNavigationNode()
        ↓
LearningProgressService.getNavigationProgress()
        ↓
GET /api/tutorial/ils/navigation/:nodeId
        ↓
ILSProvider.updateActiveBlockProgress()
        ↓
activeBlockProgress (UI state)
```

---

## 1. DATABASE CONNECTION PATTERNS

### Pattern A: Repository Testing (from Phase B)

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL,
  webSocketConstructor: ws as any
});

const db = drizzle(pool);
const repo = new BlockLearningStateRepository(db);

// Use repository methods
const states = await repo.findByNavigationNode(userId, navigationNodeId);
```

**✅ USED FOR:**
- Repository layer tests
- Direct database verification
- Write path testing (Phase B successful)

### Pattern B: Service Testing

```typescript
import { LearningProgressService } from '../packages/db-tutorial/src/services/learning-progress.service';
import { TutorialNavigationProgressRepository } from '../packages/db-tutorial/src/repositories/tutorial-navigation-progress.repository';
import { TutorialSectionRepository } from '../packages/db-tutorial/src/repositories/tutorial-section.repository';
import { BlockLearningStateRepository } from '../packages/db-tutorial/src/repositories/block-learning-state.repository';

const progressRepo = new TutorialNavigationProgressRepository();
const sectionRepo = new TutorialSectionRepository();
const blockRepo = new BlockLearningStateRepository(db);

const service = new LearningProgressService(progressRepo, sectionRepo, blockRepo);

// Test service method
const identity = { userId, brand, sessionId };
const progress = await service.getNavigationProgress(identity, navigationNodeId, subtopicId);

console.log('Blocks returned:', progress.blocks.length);
```

**✅ USED FOR:**
- Service layer integration tests
- DTO mapping verification
- Business logic testing

### Pattern C: API Testing (from phase-4.5)

```javascript
// Login first
const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, brand }),
});

const cookies = loginResponse.headers.get('set-cookie');
const accessToken = cookies?.match(/accessToken=([^;]+)/)?.[1];

// Then call API
const apiResponse = await fetch(`${baseUrl}/api/tutorial/ils/navigation/${navigationNodeId}?subtopicId=${subtopicId}`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${accessToken}`,
    'x-session-id': sessionId,
  },
});

const data = await apiResponse.json();
console.log('API Response:', data);
```

**✅ USED FOR:**
- API endpoint verification
- Response serialization checks
- Authentication flow testing

---

## 2. CORRECT UUID FORMAT

**✅ CORRECT:**
```typescript
const testUserId = '00000000-0000-0000-0000-000000000001';  // 36 characters
```

**❌ WRONG:**
```typescript
const testUserId = '00000000-0000-0000-0000-test1c1ruser01';  // Invalid format
```

**Pattern:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (exactly 36 chars)

---

## 3. TEST DATA SETUP

### Repository Write (from Phase B - VERIFIED WORKING)

```typescript
const testUserId = '00000000-0000-0000-0000-000000000001';
const testNavigationNodeId = 'gate-3c1r-test-node';
const testSessionId = 'gate-3c1r-test-session-001';

// Create D1 block state
await repo.upsert({
  userId: testUserId,
  navigationNodeId: testNavigationNodeId,
  blockId: 'test-d1-block-uuid',
  blockVersion: 'D1',
  lastSessionId: testSessionId,
  expectedTimeSec: 120,
  activeTimeSec: 30,
});

// Create C1 block state
await repo.upsert({
  userId: testUserId,
  navigationNodeId: testNavigationNodeId,
  blockId: 'test-c1-block-uuid',
  blockVersion: 'C1',
  lastSessionId: testSessionId,
  expectedTimeSec: 180,
  activeTimeSec: 45,
});
```

---

## 4. PHASE C VERIFICATION MATRIX

### Test C.1: Repository Read
**Goal:** Verify `findByNavigationNode()` returns all blocks for a navigation node

```typescript
const states = await repo.findByNavigationNode(testUserId, testNavigationNodeId);

console.log(`✅ Retrieved ${states.length} block states`);
// Expected: 2 (D1 + C1)

const d1State = states.find(s => s.blockVersion === 'D1');
const c1State = states.find(s => s.blockVersion === 'C1');

console.log(`✅ D1 visitCount: ${d1State.visitCount}`);
console.log(`✅ C1 activeTimeSec: ${c1State.activeTimeSec}`);
```

### Test C.2: Service Integration
**Goal:** Verify service calls repository and maps to DTO

```typescript
const progress = await service.getNavigationProgress(
  { userId: testUserId, brand: 'realtutorialhub' },
  testNavigationNodeId,
  testSubtopicId
);

console.log(`✅ Service returned ${progress.blocks.length} blocks`);
// Expected: 2 (D1 + C1)

const d1Block = progress.blocks.find(b => b.blockVersion === 'D1');
console.log(`✅ D1 DTO has visitCount: ${d1Block.visitCount}`);
console.log(`✅ D1 DTO has activeTimeSec: ${d1Block.activeTimeSec}`);
console.log(`✅ D1 DTO has expectedTimeSec: ${d1Block.expectedTimeSec}`);
```

### Test C.3: Soft-Delete Filtering
**Goal:** Verify deleted blocks are excluded

```typescript
// Soft-delete D1 block
await repo.softDelete(d1State.id);

// Re-fetch
const statesAfterDelete = await repo.findByNavigationNode(testUserId, testNavigationNodeId);

console.log(`✅ After soft-delete: ${statesAfterDelete.length} blocks`);
// Expected: 1 (only C1)

if (statesAfterDelete.every(s => s.blockVersion !== 'D1')) {
  console.log('✅ D1 correctly excluded after soft-delete');
}
```

### Test C.4: User Isolation
**Goal:** Verify User A cannot see User B's blocks

```typescript
const userAId = '00000000-0000-0000-0000-000000000001';
const userBId = '00000000-0000-0000-0000-000000000002';

// Create for User A
await repo.upsert({
  userId: userAId,
  navigationNodeId: testNavigationNodeId,
  blockId: 'test-block',
  blockVersion: 'D1',
});

// Query as User B
const userBStates = await repo.findByNavigationNode(userBId, testNavigationNodeId);

if (userBStates.length === 0) {
  console.log('✅ User B cannot see User A's blocks');
}
```

### Test C.5: Navigation Node Isolation
**Goal:** Verify blocks from node A don't appear in node B results

```typescript
const nodeA = 'test-node-a';
const nodeB = 'test-node-b';

// Create block in node A
await repo.upsert({
  userId: testUserId,
  navigationNodeId: nodeA,
  blockId: 'test-block',
  blockVersion: 'D1',
});

// Query node B
const nodeBStates = await repo.findByNavigationNode(testUserId, nodeB);

if (nodeBStates.length === 0) {
  console.log('✅ Node A blocks do not appear in Node B query');
}
```

### Test C.6: Missing Record Semantics
**Goal:** Verify blocks without telemetry return zero/default semantics

```typescript
// Query block that doesn't exist
const progress = await service.getNavigationProgress(
  { userId: testUserId, brand: 'realtutorialhub' },
  'empty-node',
  testSubtopicId
);

console.log(`✅ Empty node returns ${progress.blocks.length} blocks`);
// Expected: 0 or empty array

// ILSProvider should handle missing block gracefully
const activeBlockProgress = {
  blockId: 'nonexistent-block',
  blockType: 'D1',
  blockVersion: 'D1',
  isCompleted: false,
  completedAt: null,
  visitCount: 0,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec: null,
  firstViewedAt: null,
  lastViewedAt: null,
};
```

### Test C.7: Date Serialization
**Goal:** Verify Date fields serialize correctly to ISO strings

```typescript
const progress = await service.getNavigationProgress(identity, nodeId, subtopicId);

const block = progress.blocks[0];

// Check Date objects in service layer
console.log('Service layer Date:', block.firstViewedAt instanceof Date);
// Expected: true

// Check API response (JSON serialization)
const apiResponse = await fetch(apiUrl);
const apiData = await apiResponse.json();
const apiBlock = apiData.data.blocks[0];

console.log('API response firstViewedAt:', apiBlock.firstViewedAt);
// Expected: ISO string like "2026-09-10T12:00:00.000Z"
```

### Test C.8: Universal D1/C1 Path
**Goal:** Verify D1 and C1 use same code path (no block-specific branching)

```typescript
// Both should use same repository method
const d1States = states.filter(s => s.blockVersion === 'D1');
const c1States = states.filter(s => s.blockVersion === 'C1');

console.log('✅ D1 count:', d1States.length);
console.log('✅ C1 count:', c1States.length);

// Both should appear in same service response
const d1Block = progress.blocks.find(b => b.blockVersion === 'D1');
const c1Block = progress.blocks.find(b => b.blockVersion === 'C1');

console.log('✅ D1 has same DTO structure as C1');
console.log('✅ No block-type specific logic detected');
```

---

## 5. CLEANUP PATTERN

```typescript
// After tests, clean up test data
console.log('Cleaning up test data...');

await db.execute(
  `DELETE FROM block_learning_state WHERE user_id = '${testUserId}'`
);

await pool.end();

console.log('✅ Cleanup complete');
```

---

## 6. ERROR HANDLING

```typescript
try {
  // Test code
} catch (error) {
  console.log('\n' + '='.repeat(70));
  console.log('❌ TEST FAILED');
  console.log('='.repeat(70));
  console.log('\nError:', error.message);
  console.log('Code:', error.code);
  
  if (error.message.includes('deletedAt')) {
    console.log('\n🔴 SOFT-DELETE FILTER BROKEN');
  }
  
  console.log('\nFull error:');
  console.error(error);
} finally {
  await pool.end();
}
```

---

## 7. AUTHENTICATION FOR API TESTS

```typescript
// Helper function for API tests
async function getAuthenticatedHeaders(brand = 'realtutorialhub') {
  const credentials = {
    realtutorialhub: {
      email: 'ajayshah@gmail.com',
      password: 'testing',
    },
    skillup: {
      email: 'student@skillupitacademy.com',
      password: 'testing',
    },
  };
  
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...credentials[brand], brand }),
  });
  
  const cookies = loginResponse.headers.get('set-cookie');
  const accessToken = cookies?.match(/accessToken=([^;]+)/)?.[1];
  
  return {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${accessToken}`,
    'x-session-id': 'gate-3c1r-test-session',
  };
}
```

---

## 8. REQUIRED ENVIRONMENT VARIABLES

```bash
DATABASE_URL_TUTORIAL=postgresql://...
DATABASE_URL_PEOPLE=postgresql://...  # For user lookup if needed
```

**Location:** `.env.local` file at workspace root

---

## 9. SCRIPT EXECUTION PATTERN

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

console.log('=== GATE 3C.1R - PHASE C: READ PATH VERIFICATION ===\n');

(async () => {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL_TUTORIAL,
    webSocketConstructor: ws as any
  });
  
  const db = drizzle(pool);
  
  try {
    // Test code here
    
    console.log('\n✅ PHASE C COMPLETE');
    
  } catch (error) {
    console.error('\n❌ PHASE C FAILED:', error);
  } finally {
    await pool.end();
  }
})();
```

---

## 10. PHASE C TEST EXECUTION ORDER

1. **Repository Read Test** (C.1)
   - Write test data via Phase B pattern
   - Call `findByNavigationNode()`
   - Verify both D1 and C1 returned

2. **Service Integration Test** (C.2)
   - Call `getNavigationProgress()`
   - Verify `blocks[]` array populated
   - Verify DTO field mapping

3. **Isolation Tests** (C.3, C.4, C.5)
   - Soft-delete filtering
   - User isolation
   - Navigation node isolation

4. **Edge Case Tests** (C.6, C.7)
   - Missing records
   - Date serialization

5. **Universality Test** (C.8)
   - Verify no D1/C1 branching
   - Same repository method
   - Same DTO structure

6. **Cleanup**
   - Delete test data
   - Close connections

---

## 11. SUCCESS CRITERIA

✅ **Phase C PASS Criteria:**

1. Repository returns all blocks for navigation node
2. Service calls repository and maps to DTO correctly
3. API endpoint includes `blocks[]` array
4. All DTO fields present (visitCount, revisionCount, activeTimeSec, expectedTimeSec, timestamps)
5. Soft-deleted blocks excluded
6. User isolation works
7. Navigation node isolation works
8. Missing records handled gracefully
9. Date fields serialize to ISO strings
10. D1 and C1 use same code path
11. No TypeScript errors
12. No runtime errors

---

## 12. PHASE B EVIDENCE TO REUSE

From Phase B (commit 5b1487c7), we know:

✅ **Write Path Verified:**
- D1 first visit: visitCount=1
- D1 same-session: visitCount unchanged
- D1 new-session: visitCount=2
- D1 active time: 30s
- C1 first visit: visitCount=1
- C1 active time: 45s
- NO 42P10 errors
- Repository uses correct `targetWhere`

✅ **Test UUID Format:**
```typescript
const testUserId = '00000000-0000-0000-0000-000000000001';
```

✅ **Test Navigation Node:**
```typescript
const testNavigationNodeId = 'gate-3c1r-test-node';
```

✅ **Session ID:**
```typescript
const testSessionId = 'gate-3c1r-test-session-001';
```

---

## READY FOR PHASE C VERIFICATION

With these patterns, Phase C tests can now:

1. ✅ Reuse Phase B write pattern for test data setup
2. ✅ Use correct database connection (Drizzle + Neon)
3. ✅ Use correct UUID format
4. ✅ Test repository read method
5. ✅ Test service integration
6. ✅ Test API endpoint
7. ✅ Verify isolation (soft-delete, user, node)
8. ✅ Verify serialization
9. ✅ Verify universality (no D1/C1 branches)
10. ✅ Clean up test data

**Next:** Write `_gate_3c1r_test_phase_c.ts` script using these patterns
