# O1 Block Placement - End-to-End Test

## 📋 Overview

This E2E test validates the **complete lifecycle** of the O1 block placement system from insertion to rendering.

**Test File:** `.agents/scripts/test-o1-block-e2e.mjs`

---

## 🎯 What This Test Validates

### **Critical Success Criteria:**
1. ✅ **Schema Validation** - O1 block passes runtime Zod validation
2. ✅ **Save Operation** - PATCH returns 200 (not 400 validation error)
3. ✅ **Data Persistence** - Block survives database round-trip
4. ✅ **Block Integrity** - All fields (type, version, content) preserved

### **Optional Success Criteria:**
5. ⚠️ **Publish Operation** - Tutorial can be published
6. ⚠️ **Learner Rendering** - Page loads without errors

---

## 🧪 Test Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Authentication                                     │
│ POST /api/auth/login → Get JWT cookie                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Create Test Tutorial                              │
│ POST /api/tutorial-composer/sections                       │
│ Creates empty tutorial section                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Build O1 Block Payload                            │
│ Constructs block using registry defaults                   │
│ - type: 'objective', version: 'O1'                         │
│ - 3 objective items with title + description              │
│ - Note with title + text                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Save Tutorial (CRITICAL TEST) ⚠️                  │
│ PATCH /api/tutorial-composer/sections/{id}                 │
│ Expected: HTTP 200                                          │
│ Failure: HTTP 400 = schema validation rejected block       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Verify Persistence                                │
│ GET /api/tutorial-composer/sections/{id}                   │
│ Confirms: Block exists with correct structure              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Publish Tutorial (Optional)                       │
│ POST /api/tutorial-composer/sections/{id}/publish          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 7: Learner Page Render (Optional)                   │
│ GET /tutorial/{id}                                          │
│ Checks: Page loads, contains objective content             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prerequisites

### **1. Services Running**
```powershell
# Terminal 1: Frontend (Next.js)
cd apps/skillhubcore-admin
pnpm dev
# Should be running on http://skillhubcore.localhost:3007

# Terminal 2: Database (PostgreSQL)
# Ensure your database is running and migrations applied
```

### **2. Test User Exists**
The test uses these credentials:
- **Email:** `admin@skillhubcore.in`
- **Password:** `testing`

Ensure this user exists in your database with admin privileges.

### **3. Test Data IDs**
Update these constants in `test-o1-block-e2e.mjs` if needed:
```javascript
const TEST_BRAND_ID = 1;      // Valid brand ID
const TEST_SUBTOPIC_ID = 1;   // Valid subtopic ID
```

---

## ▶️ How to Run

### **Execute the Test:**
```powershell
node .agents/scripts/test-o1-block-e2e.mjs
```

### **Expected Output (Success):**
```
╔════════════════════════════════════════════════════════════════╗
║  O1 Block Placement - End-to-End Test                         ║
║  Phase 6: Complete Lifecycle Verification                     ║
╚════════════════════════════════════════════════════════════════╝

=== TEST 1: Admin Login ===
Attempting login: admin@skillhubcore.in
Response: HTTP 200
✅ Auth cookie obtained

=== TEST 2: Create Tutorial Section ===
Response: HTTP 201
✅ Tutorial section created: 123e4567-e89b-12d3-a456-426614174000

=== TEST 3: Build O1 Block Payload ===
✅ O1 block built: abc12345-6789-1234-abcd-ef1234567890
   Type: objective, Version: O1
   Objectives count: 3

=== TEST 4: Save Tutorial with O1 Block (CRITICAL) ===
This tests if PATCH_BLOCKS_SCHEMA validation accepts O1 blocks
Response: HTTP 200
✅ PASS: Tutorial saved successfully (HTTP 200)
✅ CRITICAL: PATCH_BLOCKS_SCHEMA accepted O1 block

=== TEST 5: Verify O1 Block Persisted ===
Response: HTTP 200
Tutorial blocks count: 1
✅ O1 block found: abc12345-6789-1234-abcd-ef1234567890
   Type: objective, Version: O1
   Objectives: 3 items
✅ PASS: O1 block persisted correctly with all data

╔════════════════════════════════════════════════════════════════╗
║  FINAL RESULTS                                                 ║
╚════════════════════════════════════════════════════════════════╝
{
  "login": "PASS",
  "create_section": "PASS",
  "build_block": "PASS",
  "save_with_o1": "PASS",
  "verify_persistence": "PASS",
  "publish": "PASS",
  "learner_render": "PASS"
}

✅ SUCCESS: All critical tests passed!
   - O1 block schema validated
   - Save operation succeeded (HTTP 200)
   - Block persisted correctly

Test section ID: 123e4567-e89b-12d3-a456-426614174000
Cleanup: You can delete this test tutorial from the admin UI
```

### **Expected Output (Failure - Schema Validation):**
```
=== TEST 4: Save Tutorial with O1 Block (CRITICAL) ===
Response: HTTP 400
❌ VALIDATION ERROR: Schema validation failed
Response body: {"error":{"code":"TUTORIAL_DOCUMENT_INVALID",...}}

Validation details:
  - blocks.0.content.objectives.0: Objective item must have either 'title' or 'text'
  
❌ TEST FAILED: Schema validation rejected O1 block
```

---

## 🔍 What Gets Tested

### **1. Schema Structure Validation**
- ✅ Block has required fields: `id`, `type`, `version`, `content`
- ✅ Type is literal `'objective'`
- ✅ Version is literal `'O1'`
- ✅ Content matches `ObjectiveO1ContentSchema`

### **2. Objective Items Validation**
- ✅ Each objective has `title` field (registry default format)
- ✅ Optional fields present: `verb`, `description`, `badge`, `icon`
- ✅ At least one objective exists
- ✅ Title/text mutual requirement satisfied

### **3. Runtime Validation**
- ✅ Zod schema export exists and is accessible
- ✅ `PATCH_BLOCKS_SCHEMA` validation accepts O1 blocks
- ✅ No TypeScript interface-only exports

### **4. Data Persistence**
- ✅ Block survives database write/read cycle
- ✅ All nested fields preserved (objectives array, note object)
- ✅ IDs remain unchanged

### **5. Integration Points**
- ✅ Composer → Save → Database pipeline works
- ✅ Database → Load → Hydration pipeline works
- ⚠️ Publish validation gates (if active)
- ⚠️ Learner page rendering (if implemented)

---

## 🐛 Troubleshooting

### **Problem: Login Failed**
```
❌ Login failed: No auth cookie
```
**Solution:**
- Verify `admin@skillhubcore.in` user exists
- Check password is `testing`
- Ensure frontend is running on port 3007

### **Problem: HTTP 400 on Save**
```
❌ VALIDATION ERROR: Schema validation failed
```
**Solution:**
- Check `PATCH_BLOCKS_SCHEMA` in `packages/types/src/tutorial-rich-document/index.ts`
- Verify `ObjectiveO1BlockSchema` is exported
- Confirm schema matches registry default structure

### **Problem: HTTP 404 on Section Create**
```
Failed to create section: HTTP 404
```
**Solution:**
- Verify `TEST_BRAND_ID` and `TEST_SUBTOPIC_ID` exist in database
- Check user has access to those entities

### **Problem: Frontend Not Running**
```
Request timeout
```
**Solution:**
```powershell
cd apps/skillhubcore-admin
pnpm dev
```

---

## 📊 Test Coverage

| Layer | Test Type | Coverage |
|-------|-----------|----------|
| **API Layer** | Integration | ✅ POST /sections, PATCH /sections, GET /sections |
| **Schema Layer** | Runtime Validation | ✅ Zod parse with actual registry defaults |
| **Database Layer** | Persistence | ✅ Write + Read round-trip |
| **Auth Layer** | JWT Flow | ✅ Login + Cookie + Authenticated requests |
| **Composer Layer** | Block Insertion | ✅ Build payload matching registry |
| **Renderer Layer** | Optional | ⚠️ HTML presence check only |

---

## 🎯 Success Metrics

### **Critical Pass Criteria:**
```javascript
results.login === 'PASS' &&
results.create_section === 'PASS' &&
results.save_with_o1 === 'PASS' &&
results.verify_persistence === 'PASS'
```

### **Exit Codes:**
- **0** = All critical tests passed
- **1** = At least one critical test failed

---

## 🧹 Cleanup

After running the test, a tutorial section is created in your database.

**Manual Cleanup:**
1. Note the section ID from test output
2. Navigate to Admin UI → Tutorial Composer
3. Find and delete the test tutorial: "O1 E2E Test Tutorial"

**OR**

**Automated Cleanup (Optional):**
```javascript
// Add to script after tests complete:
await deleteSection(authCookie, sectionId);
```

---

## 📝 Related Files

| File | Purpose |
|------|---------|
| `packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts` | Runtime Zod schema |
| `packages/types/src/tutorial-rich-document/index.ts` | `PATCH_BLOCKS_SCHEMA` union |
| `apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts` | Registry defaults |
| `apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts` | PATCH handler |
| `packages/ui/src/tutorial/blocks/ObjectiveO1Block.tsx` | Renderer component |

---

## 🚦 Next Steps After Test Passes

1. ✅ **All Tests Pass** → Ready for production
2. ⚠️ **Publish Fails** → Check publish validation gates
3. ⚠️ **Learner Render Fails** → Check `TutorialBlockRenderer` routing
4. 🎉 **Success** → O1 block placement system is production-ready!

---

## 📚 Documentation References

- **Testing Strategy:** `.agents/evidence/comprehensive-repair-strategy.md`
- **Schema Contract:** `objective-o1.schema.ts` header comments
- **Placement System:** `services/project-ai/tests/test_file_operations_placement.py`
- **Auth Chain:** `.agents/scripts/test-auth-chain.mjs`
