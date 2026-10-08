# COMMIT PLAN - Modified Files Review

## ✅ COMPLETED
- `.gitignore` updated and committed ✅
- Helper scripts excluded from git (kept locally) ✅

## 📋 MODIFIED FILES (Need Review)

### Category 1: RBAC & Auth Improvements (Previous Work)
These files were modified in previous sessions for RBAC/auth improvements:

**API Server:**
- `apps/api-server/src/lib/auth-context.ts`
- `apps/api-server/src/middleware/internal-auth.middleware.ts`
- `apps/api-server/src/app/api/auth/*.ts` (login, logout, me, profile, etc.)
- `apps/api-server/src/app/api/admin/auth/*.ts`

**Packages:**
- `packages/auth/src/index.ts`
- `packages/auth/src/middleware/auth.middleware.ts`
- `packages/auth/src/rbac.types.ts`
- `packages/auth/src/rbac.service.ts` (DELETED)

**Gateway:**
- `services/api-gateway/src/index.ts`
- `services/api-gateway/src/lib/proxy.ts`
- `services/api-gateway/src/middleware/auth.ts`

**Shared Branding:**
- `src/share-branding/ProfilePage.tsx` (uses unifiedFetch - KEEP ✅)
- `src/share-branding/auth/*.ts` (auth improvements)
- `src/share-branding/ui/device-sessions.tsx`
- `src/share-branding/services/userProfileClient.ts`

### Category 2: Dashboard Pages
- `apps/realtutorialhub-web/src/app/dashboard/page.tsx`
- `apps/skillup-web/src/app/dashboard/page.tsx`

### Category 3: Dependencies
- `package.json`
- `pnpm-lock.yaml`

### Category 4: Other
- `scripts/deploy-direct.sh`
- Various API routes

## 🎯 RECOMMENDATION

**Option A: Commit All Modified Files (Big Commit)**
```bash
git add -A
git commit -m "feat: RBAC improvements, auth enhancements, and unifiedFetch integration"
```

**Pros:**
- ✅ Everything committed at once
- ✅ Clean working directory

**Cons:**
- ❌ Large commit (hard to review)
- ❌ Mixed concerns

---

**Option B: Selective Commit (Recommended)**

Commit in logical groups:

**Step 1: Core Auth/RBAC**
```bash
git add packages/auth/
git add apps/api-server/src/lib/auth-context.ts
git add apps/api-server/src/middleware/internal-auth.middleware.ts
git commit -m "feat: enhance RBAC and auth context handling"
```

**Step 2: Gateway Improvements**
```bash
git add services/api-gateway/
git commit -m "feat: improve gateway auth and proxy handling"
```

**Step 3: Shared Components (unifiedFetch)**
```bash
git add src/share-branding/ProfilePage.tsx
git add src/share-branding/auth/
git add src/share-branding/services/
git add src/share-branding/ui/
git commit -m "feat: migrate to unifiedFetch for better auth handling"
```

**Step 4: API Routes**
```bash
git add apps/api-server/src/app/api/
git commit -m "feat: update API routes with improved auth"
```

**Step 5: Dependencies**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

---

**Option C: Review First, Commit Later**
- Review each file's changes
- Understand what each change does
- Decide what to keep/revert
- Then commit selectively

## ❓ WHAT DO YOU WANT TO DO?

1. **Option A** - Commit everything now (quick)
2. **Option B** - Commit in logical groups (organized)
3. **Option C** - Review changes first (careful)
4. **Option D** - Keep as-is, don't commit yet (wait)

Please choose an option.
