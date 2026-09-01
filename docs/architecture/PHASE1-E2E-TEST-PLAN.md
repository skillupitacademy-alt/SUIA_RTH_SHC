# Phase 1 Learner URL/Route Resolution - E2E Test Plan

**Date:** 2026-08-24  
**Objective:** Certify Phase 1 page identity through authenticated browser E2E testing

---

## IMPLEMENTATION STATUS

✅ **Route Structure:** `/tutorial-v2/[domain]/[subject]/[topic]/[subtopic]/[navigationNodeId]`  
✅ **Identity Chain:** `(subtopicId, navigationNodeId, brandId)` implemented  
✅ **Delivery Service:** `getTutorialByPage()` called with exact `navigationNodeId`  
✅ **Sidebar Validation:** Validates `navigationNodeId` against published sidebar tree  
✅ **Active Navigation:** Exact `item.id === params.navigationNodeId` (no fallback)  
✅ **activeUrl Resolution:** Resolved by exact `navigationNodeId` (not subtopic)  
✅ **Delivery Regression:** 26/26 tests passing  

---

## E2E TEST ENVIRONMENTS

### SkillUp Web (Student Portal)
- **Local URL:** `http://localhost:3004`
- **Production URL:** `https://user.skillupitacademy.com`
- **Brand ID:** `skillup`
- **Dev Server:** `cd apps/skillup-web; pnpm dev`

### RealTutorialHub Web
- **Local URL:** `http://localhost:3003`
- **Production URL:** `https://user.realtutorialhub.com`
- **Brand ID:** `realtutorialhub`
- **Dev Server:** `cd apps/realtutorialhub-web; pnpm dev`

### SkillHubCore Admin (Content Management)
- **Local URL:** `http://localhost:3007`
- **Production URL:** `https://admin.skillhubcore.in`
- **Brand ID:** N/A (admin portal)
- **Dev Server:** `cd apps/skillhubcore-admin; pnpm dev`

### API Server
- **Local URL:** `http://localhost:3000`
- **Dev Server:** `cd apps/api-server; pnpm dev`

---

## TEST CREDENTIALS

### Student User (SkillUp)
```
Email: student@skillupitacademy.com
Password: testing
```

### Admin User (SkillHubCore)
```
Email: admin@skillhubcore.in
Password: testing
```

### Test Users (RealTutorialHub)
```
Email: anujoshi@gmail.com OR yashicajoshi@gmail.com
Password: testing
```

**⚠️ IMPORTANT:** Do NOT commit these credentials to test files. Use environment variables.

---

## TEST DATA

### Java Tutorial Subtopic
- **Subtopic ID:** `12efacf1-b5ad-4b43-9fe4-17ba1cf249e4`
- **Subtopic Name:** "What is Java?"
- **Subtopic Slug:** `whatisjava`
- **Topic:** Java Basics
- **Subject:** Backend Development / Java
- **Domain:** Full Stack Development / Programming

### Real Sidebar Pages
- **Page A:** `what-is-java`
- **Page B:** `java-syntax`
- **Page C:** `primitive-data-types`

### Expected URLs (Local - SkillUp)
```
http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java
http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/java-syntax
http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/primitive-data-types
```

---

## E2E TEST CASES

### Test 1: LOGIN
**Prerequisites:** None  
**Steps:**
1. Navigate to `http://localhost:3004/login`
2. Enter credentials: `student@skillupitacademy.com` / `testing`
3. Click "Login"

**Expected:**
- ✅ Redirect to dashboard or last visited page
- ✅ `accessToken` cookie set
- ✅ No authentication errors

---

### Test 2: PAGE A RESOLUTION
**Prerequisites:** Authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java`

**Expected:**
- ✅ Page loads without 404
- ✅ Content displays "What is Java?" heading
- ✅ Sidebar shows "What is Java?" as active
- ✅ URL bar shows exact `what-is-java` (with hyphens)
- ✅ Previous/Next navigation buttons visible
- ✅ No console errors

**Verify Identity Chain:**
```
URL navigationNodeId: "what-is-java"
       ↓
Route param: "what-is-java"
       ↓
Sidebar validation: PASS
       ↓
getTutorialByPage("whatisjava", "what-is-java", "skillup")
       ↓
Database query: WHERE navigationNodeId = 'what-is-java'
       ↓
Content: Page A (What is Java?)
```

---

### Test 3: PAGE B RESOLUTION
**Prerequisites:** Authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/java-syntax`

**Expected:**
- ✅ Page loads without 404
- ✅ Content displays "Java Syntax" heading
- ✅ Sidebar shows "Java Syntax" as active (NOT "What is Java?")
- ✅ URL bar shows exact `java-syntax`
- ✅ Content is DIFFERENT from Page A

---

### Test 4: PAGE C RESOLUTION
**Prerequisites:** Authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/primitive-data-types`

**Expected:**
- ✅ Page loads without 404
- ✅ Content displays "Primitive Data Types" heading
- ✅ Sidebar shows "Primitive Data Types" as active
- ✅ URL bar shows exact `primitive-data-types`
- ✅ Content is DIFFERENT from Page A and Page B

---

### Test 5: PAGE ISOLATION (Critical!)
**Prerequisites:** Authenticated  
**Steps:**
1. Visit Page A: `.../what-is-java`
2. Note the content heading/first paragraph
3. Visit Page B: `.../java-syntax`
4. Verify content is COMPLETELY DIFFERENT
5. Visit Page C: `.../primitive-data-types`
6. Verify content is COMPLETELY DIFFERENT
7. Return to Page A: `.../what-is-java`
8. Verify content matches original Page A

**Expected:**
- ❌ Page A content NEVER appears on Page B URL
- ❌ Page B content NEVER appears on Page C URL
- ❌ Page C content NEVER appears on Page A URL
- ✅ Each navigationNodeId returns ONLY its own content

---

### Test 6: EXACT NAVIGATION NODE ID
**Prerequisites:** Authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/whatisjava`

**Expected:**
- ❌ **404 NOT FOUND** (because `whatisjava` is subtopic slug, not a page node.id)
- ✅ Error message or not-found page displays

**Why:** Phase 1 requires EXACT sidebar `node.id` with hyphens. The subtopic slug is `whatisjava` (no hyphens), but the page node.id is `what-is-java` (with hyphens). These must NOT be interchangeable.

---

### Test 7: NONEXISTENT PAGE
**Prerequisites:** Authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/page-does-not-exist`

**Expected:**
- ❌ **404 NOT FOUND**
- ✅ Does NOT fallback to Page A/B/C
- ✅ Sidebar validation rejects nonexistent `navigationNodeId`

---

### Test 8: PREVIOUS/NEXT NAVIGATION
**Prerequisites:** Authenticated, start on Page B  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/java-syntax`

**Expected:**
- ✅ **Previous** button visible, links to `.../what-is-java`
- ✅ **Next** button visible, links to `.../primitive-data-types`
- ✅ Click Previous → navigates to Page A with URL showing `what-is-java`
- ✅ Click Next → navigates to Page C with URL showing `primitive-data-types`
- ✅ Each navigation updates URL with correct `navigationNodeId`

---

### Test 9: SIDEBAR CLICK NAVIGATION
**Prerequisites:** Authenticated, on any Java page  
**Steps:**
1. Locate sidebar
2. Find "Java Syntax" link
3. Click it

**Expected:**
- ✅ Navigates to `.../java-syntax`
- ✅ Content changes to Java Syntax page
- ✅ "Java Syntax" becomes active in sidebar
- ✅ Browser URL shows `.../java-syntax` (not `.../whatisjava`)

---

### Test 10: DIRECT URL ACCESS (No Navigation)
**Prerequisites:** Authenticated, clear browser history/cache  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/primitive-data-types`

**Expected:**
- ✅ Page loads directly without requiring navigation through other pages
- ✅ Content shows "Primitive Data Types"
- ✅ Sidebar shows "Primitive Data Types" as active
- ✅ Deep-link works correctly

---

### Test 11: BROWSER BACK/FORWARD
**Prerequisites:** Authenticated  
**Steps:**
1. Visit Page A: `.../what-is-java`
2. Click Next → Page B: `.../java-syntax`
3. Click Next → Page C: `.../primitive-data-types`
4. Click browser **Back** button
5. Click browser **Back** button again
6. Click browser **Forward** button

**Expected:**
- ✅ Back from C → shows Page B with URL `.../java-syntax`
- ✅ Back from B → shows Page A with URL `.../what-is-java`
- ✅ Forward from A → shows Page B with URL `.../java-syntax`
- ✅ Each navigation updates both URL and content correctly
- ✅ Active sidebar item matches current page

---

### Test 12: UNPUBLISHED PAGE
**Prerequisites:** Authenticated student user, unpublished test page exists  
**URL:** URL to unpublished page

**Expected:**
- ❌ **404 NOT FOUND** or no content
- ✅ Student users cannot see unpublished content
- ℹ️ (Admin with `includeUnpublished=true` CAN see it)

---

### Test 13: CROSS-BRAND ISOLATION
**Prerequisites:** Authenticated to SkillUp  
**URL:** `http://localhost:3004/tutorial-v2/.../[page-from-realtutorialhub-only]`

**Expected:**
- ❌ **404** or **403** if page is RealTutorialHub-exclusive
- ✅ Brand filtering works correctly
- ✅ Shared content IS visible on both brands

---

### Test 14: AUTHENTICATION REDIRECT
**Prerequisites:** NOT authenticated  
**URL:** `http://localhost:3004/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java`

**Expected:**
- ✅ Redirects to `/login?redirect=/tutorial-v2/programming/java/java-basics/whatisjava/what-is-java`
- ✅ After login, redirects back to original URL with `navigationNodeId` preserved
- ✅ Page loads correctly after authentication

---

### Test 15: CONCURRENT PAGE REQUESTS (Browser DevTools)
**Prerequisites:** Authenticated  
**Steps:**
1. Open Browser DevTools → Network tab
2. Visit Page A
3. While Page A is loading, open Page B in new tab
4. While Page B is loading, open Page C in new tab

**Expected:**
- ✅ Each request returns DIFFERENT tutorial content
- ✅ No cross-contamination in responses
- ✅ Network responses show distinct `navigationNodeId` in request params
- ✅ Each page displays correct content

---

## AUTOMATED E2E TEST SCRIPT

### Using Existing Scripts
```bash
# Start dev server
cd apps/skillup-web
pnpm dev

# In another terminal
TEST_BASE_URL=http://localhost:3004 \
TEST_STUDENT_EMAIL=student@skillupitacademy.com \
TEST_STUDENT_PASSWORD=testing \
node scripts/test-tutorial-delivery-e2e.mjs
```

### Phase 1 Specific Test (To Be Created)
```bash
node scripts/test-phase1-page-resolution-e2e.mjs
```

**Test should verify:**
1. Login
2. Navigate to each of 3 pages
3. Verify distinct content
4. Verify URL contains correct `navigationNodeId`
5. Verify sidebar active state
6. Verify previous/next navigation
7. Verify exact node.id (no normalization)

---

## CERTIFICATION CHECKLIST

### ✅ Implementation
- [x] Route parameter `[navigationNodeId]` added
- [x] `TutorialSidebarDeliveryParams` includes `navigationNodeId`
- [x] `getTutorialByPage()` called with exact `navigationNodeId`
- [x] Sidebar validation implemented
- [x] `activeUrl` resolved by exact `navigationNodeId`
- [x] Active navigation uses ONLY exact ID (no fallback)
- [x] URL generation includes `/${item.id}`
- [x] No normalization of `navigationNodeId`

### ✅ Unit/Integration Tests
- [x] Delivery Service: 26/26 passing
- [ ] Learner Page Resolution: 13 tests (DB initialization pending)

### ⏳ E2E Tests
- [ ] Test 1: Login ✅
- [ ] Test 2: Page A Resolution
- [ ] Test 3: Page B Resolution
- [ ] Test 4: Page C Resolution
- [ ] Test 5: Page Isolation ⚠️ **CRITICAL**
- [ ] Test 6: Exact Navigation Node ID ⚠️ **CRITICAL**
- [ ] Test 7: Nonexistent Page
- [ ] Test 8: Previous/Next Navigation
- [ ] Test 9: Sidebar Click Navigation
- [ ] Test 10: Direct URL Access
- [ ] Test 11: Browser Back/Forward
- [ ] Test 12: Unpublished Page
- [ ] Test 13: Cross-Brand Isolation
- [ ] Test 14: Authentication Redirect
- [ ] Test 15: Concurrent Requests

### ⏳ Production Build
- [ ] SkillUp Web build succeeds
- [ ] RealTutorialHub Web build succeeds
- [ ] No TypeScript errors in app context
- [ ] No build warnings

---

## SUCCESS CRITERIA

**Phase 1 Learner URL/Route Resolution is CERTIFIED when:**

1. ✅ All 15 E2E tests pass
2. ✅ Page isolation verified (Test 5)
3. ✅ Exact node.id enforcement verified (Test 6)
4. ✅ URL identity chain proven end-to-end
5. ✅ Production builds succeed
6. ✅ Delivery regression remains 26/26

**Critical Non-Negotiables:**
- ❌ Page A request NEVER returns Page B content
- ❌ `whatisjava` (no hyphen) NEVER acts as valid `navigationNodeId`
- ❌ Subtopic-based active navigation fallback REMOVED
- ✅ Exact sidebar `node.id` flows through entire chain unchanged

---

## NEXT PHASE AFTER CERTIFICATION

Once Phase 1 E2E certification is complete:
1. Create Phase 1 sidebar pages for other subtopics
2. Multi-page tutorial authoring workflow
3. Phase 2: Intra-page navigation (`#heading-id`)
4. Phase 3: Cross-page references
5. Performance optimization (caching, prefetch)

---

**Status:** Implementation Complete → E2E Testing In Progress
