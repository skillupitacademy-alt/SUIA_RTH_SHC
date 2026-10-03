# Investigation 08C: Critical Correction - Build Args Required

**Date:** 2026-10-03  
**Status:** BLOCKING ISSUE IDENTIFIED  
**Severity:** HIGH  
**Impact:** Production deployment of `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` **BLOCKED**

---

## Executive Summary

**CRITICAL FINDING:** Adding `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"` to `infra/hostinger/env/brands/skillup.env` is **NOT SUFFICIENT** to make it available during Docker build.

**Root Cause:** `skillup-web` docker-compose configuration has **NO declared `build.args`**, and the build script filters environment variables to include **ONLY** declared build args.

**Current Behavior:** Build script creates empty env file for `skillup-web` → `NEXT_PUBLIC_*` variables **DO NOT** reach Next.js build → browser bundle does NOT contain feature flag.

**Required Fix:** Add explicit `build.args` declaration to `skillup-web` service in `docker-compose.yml`.

---

## Forensic Evidence

### Evidence 1: Build Script Logic

**File:** `infra/hostinger/scripts/build-save-images.ps1` (lines 230-250)

```powershell
foreach ($service in $selected) {
  $serviceEnvFiles = Get-ServiceEnvFiles -Lines $composeLines -Service $service
  $serviceBuildArgs = Get-ServiceBuildArgs -Lines $composeLines -Service $service  # ← Extracts declared args
  $mergedEnv = @{}

  foreach ($file in $serviceEnvFiles) {
    Merge-EnvFile -Map $mergedEnv -Path $file  # ← Merges all env files
  }

  $serviceEnvPath = Join-Path $TempEnvDir "$service.env"
  $buildEnvLines = @()
  foreach ($arg in $serviceBuildArgs) {  # ← ONLY declared args
    if ($mergedEnv.ContainsKey($arg)) {
      $buildEnvLines += "$arg=$($mergedEnv[$arg])"
    }
  }
  if ($buildEnvLines.Count -eq 0) {
    "# No build args declared for $service" | Set-Content -Encoding ASCII -LiteralPath $serviceEnvPath  # ← Empty file!
  } else {
    $buildEnvLines | Set-Content -Encoding ASCII -LiteralPath $serviceEnvPath
  }

  Write-Host "Building $service with $($buildEnvLines.Count) build variable(s)"  # ← Will show "0 build variable(s)"
  
  $buildArgs = @("compose", "--env-file", $serviceEnvPath, "-f", $TempCompose, "-f", $ComposeProd, "build", "--pull")
  
  & docker @buildArgs  # ← Uses filtered env file with ZERO variables
}
```

**Conclusion:** For `skillup-web`, `$buildEnvLines.Count = 0` → temp env file contains `"# No build args declared for skillup-web"`.

### Evidence 2: skillup-web Has No Build Args

**File:** `infra/hostinger/compose/docker-compose.yml` (lines 191-204)

```yaml
skillup-web:
  <<: *common-defaults
  env_file:
    - /opt/platform/env/shared/.env
    - /opt/platform/env/brands/skillup.env
    - /opt/platform/env/services/skillup-web.env
  build:
    context: ../../..
    dockerfile: apps/skillup-web/Dockerfile
    # ← NO build.args section!
  expose:
    - "3004"
  healthcheck:
    <<: *next-health-defaults
    test: ["CMD-SHELL", "wget --spider -q http://127.0.0.1:3004/api/healthz || exit 1"]
```

**Compare with api-server** (lines 68-84):

```yaml
api-server:
  <<: *common-defaults
  env_file:
    - /opt/platform/env/shared/.env
    - /opt/platform/env/services/api-server.env
  depends_on:
    question-judge:
      condition: service_healthy
  build:
    context: ../../..
    dockerfile: apps/api-server/Dockerfile
    args:  # ← Explicit build args declared!
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_WEB_APP_URL: ${NEXT_PUBLIC_WEB_APP_URL}
      NEXT_PUBLIC_ADMIN_URL: ${NEXT_PUBLIC_ADMIN_URL}
      NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN}
  expose:
    - "3000"
```

**Conclusion:** `api-server` has explicit `build.args`, `skillup-web` does not.

### Evidence 3: .env.local Excluded from Docker Build

**File:** `.dockerignore` (lines 30-32)

```
# Local env files
**/.env
**/.env.local
**/.env.*.local
```

**Conclusion:** `.env.local` is **explicitly excluded** from Docker build context. Next.js build inside Docker **CANNOT** read `.env.local`.

### Evidence 4: Dockerfile Copies Everything

**File:** `apps/skillup-web/Dockerfile` (line 37)

```dockerfile
COPY . .
```

**But:** `.dockerignore` filters this to **exclude** `.env.local`.

**Conclusion:** Even though `COPY . .` appears to copy everything, `.dockerignore` prevents `.env.local` from reaching Docker build context.

---

## Impact Analysis

### Current Production State

**If deployed as-is:**

```text
1. Add NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true" to skillup.env
2. Run deploy-smart.ps1 -Services "skillup-web" -NoCache
3. build-save-images.ps1 runs
4. Extracts skillup-web build args → returns empty array
5. Creates temp env file: "# No build args declared for skillup-web"
6. docker compose --env-file <empty-file> build skillup-web
7. Docker build runs pnpm --filter @quiz/skillup-web build
8. Next.js build looks for NEXT_PUBLIC_* in process.env
9. process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION = undefined
10. Next.js build does NOT embed variable into bundle
11. Browser receives bundle WITHOUT feature flag
12. TutorialPageShell evaluates: {rawValue: undefined, enabled: false}
13. Auto-completion DOES NOT WORK in production
```

**Test Outcome:** Step 3 bridge test would **FAIL** in production (enabled: false).

### Why Local Development Works

```text
Local Development:
  1. cross-env NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true
  2. pnpm --filter @quiz/skillup-web dev
  3. Next.js dev server inherits from shell environment
  4. process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION = "true"
  5. Browser receives enabled: true
  6. Works! ✅

Production (current):
  1. Variable in skillup.env
  2. Build script filters to declared args only
  3. skillup-web has no declared args
  4. Empty env file passed to docker build
  5. process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETION = undefined
  6. Fails! ❌
```

---

## Required Fix

### Option 1: Add Explicit Build Args (RECOMMENDED)

**File:** `infra/hostinger/compose/docker-compose.yml`

**Current:**
```yaml
skillup-web:
  <<: *common-defaults
  env_file:
    - /opt/platform/env/shared/.env
    - /opt/platform/env/brands/skillup.env
    - /opt/platform/env/services/skillup-web.env
  build:
    context: ../../..
    dockerfile: apps/skillup-web/Dockerfile
  expose:
    - "3004"
```

**Fixed:**
```yaml
skillup-web:
  <<: *common-defaults
  env_file:
    - /opt/platform/env/shared/.env
    - /opt/platform/env/brands/skillup.env
    - /opt/platform/env/services/skillup-web.env
  build:
    context: ../../..
    dockerfile: apps/skillup-web/Dockerfile
    args:
      NEXT_PUBLIC_ENABLE_AUTO_COMPLETION: ${NEXT_PUBLIC_ENABLE_AUTO_COMPLETION}
  expose:
    - "3004"
```

**Rationale:**
- ✅ Explicit and auditable
- ✅ Matches `api-server` pattern
- ✅ Build script will extract and pass variable
- ✅ Next.js build will receive variable
- ✅ Browser bundle will contain feature flag

### Option 2: Modify Build Script to Pass All NEXT_PUBLIC_* Variables

**File:** `infra/hostinger/scripts/build-save-images.ps1`

**Modify logic to:**
1. Extract declared build args
2. **ALSO** extract all `NEXT_PUBLIC_*` variables from merged env
3. Pass both sets to Docker build

**Rationale:**
- ✅ Automatic for all future `NEXT_PUBLIC_*` variables
- ❌ More complex build script logic
- ❌ Less explicit (harder to audit what's passed)
- ❌ Deviation from current pattern

**Recommendation:** Use **Option 1** (explicit build args).

---

## Corrected Deployment Procedure

### Step 1: Add Build Arg to docker-compose.yml

```yaml
# File: infra/hostinger/compose/docker-compose.yml
# Location: skillup-web service definition

skillup-web:
  ...
  build:
    context: ../../..
    dockerfile: apps/skillup-web/Dockerfile
    args:
      NEXT_PUBLIC_ENABLE_AUTO_COMPLETION: ${NEXT_PUBLIC_ENABLE_AUTO_COMPLETION}
  ...
```

### Step 2: Add Variable to Environment File

```bash
# File: infra/hostinger/env/brands/skillup.env

# =============================================================================
# FEATURE FLAGS (available in browser via NEXT_PUBLIC_)
# =============================================================================
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"
```

### Step 3: Commit Both Changes

```bash
git add infra/hostinger/compose/docker-compose.yml
git add infra/hostinger/env/brands/skillup.env
git commit -m "feat: add auto-completion feature flag for skillup-web

- Add NEXT_PUBLIC_ENABLE_AUTO_COMPLETION build arg to docker-compose
- Set flag to true in skillup.env
- Enables auto-completion orchestrator in SkillUp learner portal"
```

### Step 4: Deploy with NoCache

```powershell
.\scripts\deploy-smart.ps1 `
  -Services "skillup-web" `
  -NoCache
```

### Step 5: Verify Build Output

**Expected output during build:**
```text
Building skillup-web with 1 build variable(s)  # ← Was "0 build variable(s)" before fix
```

### Step 6: Verify in Production Browser

```javascript
// Navigate to: https://user.skillupitacademy.com/tutorial-v2/.../whatisjava
// Browser console:
[TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}

// DOM verification:
document.querySelector('[data-auto-completion-enabled]')?.getAttribute('data-auto-completion-enabled')
// Expected: "true"
```

---

## Verification Commands

### Local Verification (Before Committing)

```powershell
# 1. Make docker-compose.yml change
# 2. Make skillup.env change
# 3. Test build locally:

.\infra\hostinger\scripts\build-save-images.ps1 `
  -ImageTag "test" `
  -Services "skillup-web" `
  -NoCache

# Expected output:
# "Building skillup-web with 1 build variable(s)"  ← Confirms fix working
```

### Production Verification (After Deployment)

```bash
# SSH to production server
ssh root@72.61.115.49

# Check container environment (runtime - won't show NEXT_PUBLIC_*)
docker exec <skillup-web-container> env | grep AUTO

# Check if bundle contains flag (inspect JavaScript source)
# This requires accessing browser bundle or checking browser DevTools
```

---

## Why This Was Missed

### Original 08C Analysis Assumptions

**Incorrect Assumption:**
> "Environment variables from `skillup.env` automatically reach Docker build through environment inheritance."

**Reality:**
Build script **explicitly filters** environment variables to include **ONLY** declared build args.

**Why Assumption Seemed Reasonable:**
- Other services (like `api-server`) work correctly
- Local development works without explicit declaration
- Documentation didn't show build arg filtering logic

**Corrected Understanding:**
- `api-server` works because it HAS declared build args
- Local dev works because it doesn't use build-save-images.ps1
- Build script intentionally filters for security/clarity

---

## Impact on Investigation 08C

### Sections Requiring Correction

**Section 6.2 (Configuration Format):**
- ❌ INCOMPLETE: Only adding to `skillup.env` is not sufficient
- ✅ CORRECTED: Must also add build arg to docker-compose.yml

**Section 7.1 (Build-Time Behavior):**
- ❌ MISLEADING: "Value frozen at build time" is true, but variable doesn't reach build
- ✅ CORRECTED: Variable must be declared as build arg first

**Section 11.1 (Known Gaps):**
- ✅ CORRECTLY IDENTIFIED: Noted lack of build args as gap
- ❌ UNDERSTATED: Classified as "recommended" but actually "required"

---

## Revised Status

**Investigation 08C Status:** ❌ REQUIRES CORRECTION before certification

**Production Deployment Status:** ❌ BLOCKED until docker-compose.yml updated

**Required Actions:**
1. ✅ Add `build.args` to `skillup-web` in docker-compose.yml
2. ✅ Add `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"` to skillup.env
3. ✅ Test build locally to verify "1 build variable(s)"
4. ✅ Deploy to production with `-NoCache`
5. ✅ Verify in production browser

**Estimated Fix Time:** 5 minutes (add build arg) + 10 minutes (deploy + verify)

---

## Recommended Next Steps

### Immediate (Required for Feature Flag)

1. **Add build arg to docker-compose.yml** (blocking)
2. **Test local build** to verify fix
3. **Update 08C document** with corrected procedure
4. **Deploy to production** with both changes

### Follow-Up (Infrastructure Improvement)

1. **Audit all Next.js services** for missing NEXT_PUBLIC_* build args
2. **Document build arg requirement** in deployment guidelines
3. **Consider build script enhancement** to auto-detect NEXT_PUBLIC_* variables (optional)
4. **Add deployment verification script** to catch missing build args

---

## Related Documents

**08C Main:** `08C_PRODUCTION_FEATURE_FLAG_DEPLOYMENT.md` (requires correction)  
**08A Pre-Flight:** `08A_STEP3_RUNTIME_PREFLIGHT.md` (update with build arg requirement)  
**Investigation 08 Main:** `08_TESTING_VALIDATION_AND_CERTIFICATION.md`

---

## Final Assessment

**Original 08C Conclusion:** ❌ INCORRECT
> "Adding to `skillup.env` is sufficient."

**Corrected Conclusion:** ✅ VERIFIED
> "Must add build arg to docker-compose.yml AND add to skillup.env."

**Credit:** User identified the gap:
> "We still need to inspect build scripts to determine exactly how environment variables are passed into the Docker build."

**Forensic verification confirmed:** Build args are **required**, not optional.

---

**END OF CRITICAL CORRECTION**
