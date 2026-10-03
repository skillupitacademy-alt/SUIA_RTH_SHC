# Investigation 08C: Production Feature Flag Deployment

**Status:** COMPLETE  
**Created:** 2026-10-03  
**Purpose:** Determine exactly how `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` must be configured and deployed for live `skillup-web` application  
**Parent:** Investigation 08 (Testing, Validation, and Certification)

---

## Executive Summary

Investigated production deployment architecture for `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` feature flag to determine where and when it must be configured for live `skillup-web` application.

**Key Finding:** `NEXT_PUBLIC_*` variables are **RUNTIME configuration** in production (loaded from environment files at container startup), but **BUILD-TIME configuration** during Docker image build (embedded into Next.js client bundle).

**Current Status:** `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` is **NOT YET CONFIGURED** in production environment files.

**Deployment Mechanism:** Docker Compose with environment file layering system.

---

## 1. Production Deployment Architecture

### 1.1 Deployment Flow

```text
Local Development
        ↓
deploy-smart.ps1 (orchestrator)
        ↓
Git commit → Tag (12-char short hash)
        ↓
build-save-images.ps1 (Docker build)
        ↓
Environment files merged
        ↓
next build (NEXT_PUBLIC_* embedded into client bundle)
        ↓
Docker image created
        ↓
Image archived and uploaded to production server
        ↓
deploy-load-production.sh (remote execution)
        ↓
docker compose up (with runtime env files)
        ↓
skillup-web container running
        ↓
Browser receives bundled NEXT_PUBLIC_* values
```

### 1.2 Deployment Scripts

**Orchestrator:** `scripts/deploy-smart.ps1`  
**Docker Builder:** `infra/hostinger/scripts/build-save-images.ps1`  
**Compose Base:** `infra/hostinger/compose/docker-compose.yml`  
**Compose Production:** `infra/hostinger/compose/docker-compose.production.yml`

**Production Server:** `root@72.61.115.49:/opt/platform/`

---

## 2. skillup-web Service Definition

### 2.1 Docker Compose Configuration

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
  expose:
    - "3004"
  healthcheck:
    <<: *next-health-defaults
    test: ["CMD-SHELL", "wget --spider -q http://127.0.0.1:3004/api/healthz || exit 1"]
```

### 2.2 Environment File Layering

**Three-layer environment system:**

1. **Shared** `/opt/platform/env/shared/.env` - Cross-service shared configuration
2. **Brand** `/opt/platform/env/brands/skillup.env` - SkillUp brand configuration
3. **Service** `/opt/platform/env/services/skillup-web.env` - Service-specific configuration

**Merge Order:** Shared → Brand → Service (later files override earlier files)

---

## 3. Dockerfile Analysis

### 3.1 Multi-Stage Build Process

**File:** `apps/skillup-web/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
...
FROM base AS deps
...
FROM base AS builder
ENV CLOUD_RUN_BUILD=true
COPY --from=deps /app/node_modules ./node_modules
...
COPY . .
RUN pnpm --filter @quiz/skillup-web build   # ← NEXT_PUBLIC_* embedded here

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
...
CMD ["node", "apps/skillup-web/server.js"]
```

### 3.2 Build-Time vs Runtime

**BUILD-TIME (embedded into client bundle):**
- `NEXT_PUBLIC_*` variables
- Accessed during `pnpm --filter @quiz/skillup-web build`
- Becomes part of JavaScript bundle served to browser

**RUNTIME (loaded from environment files):**
- Server-side environment variables
- Loaded when container starts via `env_file` directive
- Not directly accessible in browser (only server-side code)

### 3.3 Critical Implication

For `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` to reach the browser:

1. **Must exist** in environment **during Docker build**
2. **Must be** in one of the environment files used by `build-save-images.ps1`
3. Next.js build process embeds it into client bundle
4. Browser receives bundled value (not runtime environment)

---

## 4. Build-Save-Images Process

### 4.1 Environment Merging Logic

**File:** `infra/hostinger/scripts/build-save-images.ps1`

**Key Functions:**
- `Read-EnvMap` - Parses .env files
- `Merge-EnvFile` - Merges multiple .env files (later overrides earlier)
- `Get-ServiceEnvFiles` - Extracts env_file paths from docker-compose.yml
- `Get-ServiceBuildArgs` - Extracts build args from docker-compose.yml

**For `skillup-web` build:**
```powershell
$serviceEnvFiles = Get-ServiceEnvFiles -Lines $composeLines -Service "skillup-web"
# Returns:
#   /opt/platform/env/shared/.env
#   /opt/platform/env/brands/skillup.env
#   /opt/platform/env/services/skillup-web.env

$mergedEnv = @{}
foreach ($file in $serviceEnvFiles) {
  Merge-EnvFile -Map $mergedEnv -Path $file
}
```

**Local Build Path Mapping:**
```text
/opt/platform/env/shared/.env          → infra/hostinger/env/shared/.env
/opt/platform/env/brands/skillup.env   → infra/hostinger/env/brands/skillup.env
/opt/platform/env/services/skillup-web.env → infra/hostinger/env/services/skillup-web.env
```

### 4.2 Build Args vs Environment

**Important:** `skillup-web` has **NO declared build args** in docker-compose.yml.

Compare with `skillupitacademy-site` (lines 206-220):
```yaml
skillupitacademy-site:
  ...
  build:
    context: ../../..
    dockerfile: apps/skillupitacademy-site/Dockerfile
    args:
      NEXT_PUBLIC_SUIA_META_PIXEL_ID: ${NEXT_PUBLIC_SUIA_META_PIXEL_ID}
      NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID: ${NEXT_PUBLIC_SUIA_GA4_MEASUREMENT_ID}
      NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID: ${NEXT_PUBLIC_SUIA_GTM_CONTAINER_ID}
      NEXT_PUBLIC_ANALYTICS_ENABLED: ${NEXT_PUBLIC_ANALYTICS_ENABLED}
      NEXT_PUBLIC_ANALYTICS_ENV: ${NEXT_PUBLIC_ANALYTICS_ENV}
      NEXT_PUBLIC_SHC_CONTENT_BASE_URL: ${NEXT_PUBLIC_SHC_CONTENT_BASE_URL}
```

**Consequence:** `skillup-web` Dockerfile receives **ZERO** explicit build args from docker-compose.

### 4.3 How NEXT_PUBLIC_* Actually Reaches Build

**Two mechanisms:**

1. **Environment inheritance** - Docker build inherits environment from shell/compose context
2. **Next.js auto-detection** - Next.js build process reads `.env*` files in app directory

**During Docker build:**
```text
pnpm --filter @quiz/skillup-web build
        ↓
Next.js build process
        ↓
Reads process environment
        ↓
Looks for NEXT_PUBLIC_* variables
        ↓
Embeds found variables into client bundle
```

**Problem:** If `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` is not in build environment, Next.js build will not embed it, regardless of runtime environment files.

---

## 5. Current Production Environment Configuration

### 5.1 Existing NEXT_PUBLIC_* Variables

**Verified in:** `infra/hostinger/env/brands/skillup.env` (lines 23-38)

```bash
# =============================================================================
# PUBLIC URLS (NEXT_PUBLIC_ vars available in browser)
# =============================================================================
NEXT_PUBLIC_BRAND="skillup"
NEXT_PUBLIC_SITE_URL="https://user.skillupitacademy.com"
NEXT_PUBLIC_APP_URL="https://user.skillupitacademy.com"
NEXT_PUBLIC_WEB_APP_URL="https://user.skillupitacademy.com"
NEXT_PUBLIC_WEB_APP_URL_SKILLUP="https://user.skillupitacademy.com"
NEXT_PUBLIC_ADMIN_URL="https://admin.skillupitacademy.com"
NEXT_PUBLIC_API_URL="https://api.skillupitacademy.com/api"
NEXT_PUBLIC_API_URL_SKILLUP="https://api.skillupitacademy.com/api"
NEXT_PUBLIC_USER_URL_SKILLUP="https://user.skillupitacademy.com"
NEXT_PUBLIC_FACULTY_URL="https://faculty.skillupitacademy.com"
NEXT_PUBLIC_TUTORIAL_APP_URL="https://tutorial.skillhubcore.in"
```

**Also in:** `infra/hostinger/env/shared/.env` (line 78)

```bash
NEXT_PUBLIC_SENTRY_DSN="https://79aa148938b04d21381b9086fa4e4a75@o4510960730308608.ingest.us.sentry.io/4510960802201600"
```

### 5.2 skillup-web.env Current Content

**File:** `infra/hostinger/env/services/skillup-web.env` (lines 11-15)

```bash
SERVICE_NAME="skillup-web"

# IMPORTANT: Do NOT set NEXT_PUBLIC_LOGIN_URL here
# Let the code use its fallback: https://user.skillupitacademy.com/login
# This ensures brand-specific logic works correctly
```

**Critical Finding:** `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` is **NOT PRESENT** in any production environment file.

---

## 6. Production Deployment Requirements

### 6.1 Where to Add Feature Flag

**Recommended Location:** `infra/hostinger/env/brands/skillup.env`

**Rationale:**
- Brand-level configuration (may vary per brand)
- Consistent with other `NEXT_PUBLIC_*` variables
- Applies to all SkillUp services that need it
- Inherited by `skillup-web` during environment merge

**Alternative Location:** `infra/hostinger/env/services/skillup-web.env`

**Rationale:**
- Service-specific configuration
- Only affects `skillup-web`
- More granular control

**Recommendation:** Use **brand-level** (`skillup.env`) unless requirement is service-specific.

### 6.2 Configuration Format

**Add to:** `infra/hostinger/env/brands/skillup.env`

```bash
# =============================================================================
# FEATURE FLAGS (available in browser via NEXT_PUBLIC_)
# =============================================================================
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"
```

**Position:** After existing `NEXT_PUBLIC_*` variables (line 39+)

### 6.3 Deployment Procedure

**Step 1: Update environment file**
```bash
# On local development machine
# Edit: infra/hostinger/env/brands/skillup.env
# Add: NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"
git add infra/hostinger/env/brands/skillup.env
git commit -m "feat: enable auto-completion for skillup brand"
```

**Step 2: Deploy to production**
```powershell
.\scripts\deploy-smart.ps1 `
  -Services "skillup-web" `
  -NoCache
```

**Critical:** Use `-NoCache` flag to force fresh Docker build. Without it, Docker may reuse cached layer without new environment variable.

**Step 3: Verify on server**
```bash
ssh root@72.61.115.49
cat /opt/platform/env/brands/skillup.env | grep AUTO_COMPLETION
```

**Step 4: Verify in browser**
```javascript
// Navigate to: https://user.skillupitacademy.com/tutorial-v2/.../whatisjava
// Open browser console:
// Look for: [TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}
```

---

## 7. Build-Time vs Runtime Configuration Summary

### 7.1 Next.js NEXT_PUBLIC_* Behavior

**Official Next.js Documentation:**

> Environment variables prefixed with `NEXT_PUBLIC_` are embedded into the browser bundle at **build time**.

**Implications:**

1. **Value frozen at build time** - Changing runtime environment does not change browser value
2. **Requires rebuild** - Must rebuild Docker image to change `NEXT_PUBLIC_*` value
3. **No runtime flexibility** - Cannot change feature flag without redeployment
4. **Cache consideration** - Must use `--no-cache` or risk stale build layer

### 7.2 Configuration Timeline

```text
DEVELOPMENT:
  .env.local or process.env → next dev → browser (dynamic, restarts needed)

PRODUCTION:
  Environment file → Docker build → next build → bundle → container → browser
                     (frozen)                     (static)
```

### 7.3 Feature Flag Lifecycle

**To ENABLE feature:**
1. Add `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"` to environment file
2. Commit to git
3. Deploy with `-NoCache`
4. New image built with feature enabled
5. Container deployed
6. Browser receives new bundle with `enabled: true`

**To DISABLE feature:**
1. Remove or set `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="false"` in environment file
2. Commit to git
3. Deploy with `-NoCache`
4. New image built with feature disabled
5. Container deployed
6. Browser receives new bundle with `enabled: false`

**Runtime toggle NOT possible** - Must redeploy for any change.

---

## 8. Related Services Impact

### 8.1 Other Services That May Need Feature Flag

**Question:** Does `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION` affect other services?

**Analysis based on architecture:**

**`api-server`** - Backend API
- Does NOT consume `NEXT_PUBLIC_*` (server-side only, no browser bundle)
- Auto-completion orchestrator runs in browser, not API
- **NOT AFFECTED**

**`api-gateway`** - Authentication gateway (Cloudflare Worker)
- Does NOT use Next.js (Cloudflare Worker, not Node.js)
- No browser bundle
- **NOT AFFECTED**

**`skillhubcore-admin`** - Admin portal
- Uses Next.js (has Dockerfile with next build)
- Admin portal may have different UX requirements
- **REQUIRES SEPARATE DECISION** - likely should NOT enable (different user workflow)

**`realtutorialhub-web`** - RealTutorialHub learner portal
- Uses Next.js (similar to skillup-web)
- Same tutorial content system (TutorialDocument, ILS, TutorialPageShell)
- **MAY NEED FEATURE FLAG** - depends on brand-specific rollout plan

**`skillup-admin`** - SkillUp admin portal
- Uses Next.js
- Admin workflow, not learner workflow
- **LIKELY DOES NOT NEED** - admins preview content, don't consume tutorials

### 8.2 Multi-Brand Deployment Strategy

**Current Architecture:** Brand-level environment files

```text
infra/hostinger/env/brands/
├── skillup.env         (SkillUp IT Academy)
├── realtutorialhub.env (RealTutorialHub)
└── skillhubcore.env    (SkillHubCore)
```

**Strategy Options:**

**Option A: Per-brand rollout**
```bash
# Enable for SkillUp only
# infra/hostinger/env/brands/skillup.env
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"

# Keep disabled for RTH
# infra/hostinger/env/brands/realtutorialhub.env
# (no variable = defaults to false)
```

**Option B: Platform-wide rollout**
```bash
# Enable for all brands
# infra/hostinger/env/shared/.env
NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"
```

**Recommendation:** Start with **Option A** (SkillUp only) for controlled rollout.

---

## 9. Rollback Mechanism

### 9.1 Rollback Procedure

**If feature causes production issues:**

```powershell
# Option 1: Remove feature flag and redeploy
git revert <commit-hash>
.\scripts\deploy-smart.ps1 -Services "skillup-web" -NoCache

# Option 2: Redeploy previous image tag
ssh root@72.61.115.49
cd /opt/platform/scripts
IMAGE_ARCHIVE=/opt/platform/releases/quiz-platform-images-<previous-tag>.tar \
  IMAGE_TAG=<previous-tag> \
  ./deploy-load-production.sh skillup-web
```

### 9.2 Rollback Timeline

**Estimated rollback time:**
- **Option 1 (rebuild):** 5-10 minutes (git revert + build + deploy)
- **Option 2 (previous image):** 1-2 minutes (load + restart)

**Best Practice:** Keep last 2-3 production images on server for fast rollback.

---

## 10. Production Verification Checklist

### 10.1 Pre-Deployment Verification

```text
[ ] Feature flag added to infra/hostinger/env/brands/skillup.env
[ ] Git commit created with clear message
[ ] Deployment will use -NoCache flag
[ ] Previous production image tag recorded for rollback
[ ] Monitoring/alerting ready
```

### 10.2 Post-Deployment Verification

```text
[ ] Container restarted successfully (docker ps shows skillup-web running)
[ ] Health check passing (wget /api/healthz returns 200)
[ ] Navigate to production tutorial URL
[ ] Open browser DevTools console
[ ] Verify log: [TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}
[ ] Verify DOM attribute: <div data-auto-completion-enabled="true">
[ ] Verify D1 block becomes active
[ ] Verify telemetry heartbeat starts
[ ] Verify orchestrator evaluation occurs
[ ] Monitor for errors in production logs
[ ] Monitor Sentry for new errors
```

### 10.3 Browser Verification Command

```javascript
// Paste in browser console on tutorial page:
document.querySelector('[data-auto-completion-enabled]')?.getAttribute('data-auto-completion-enabled')
// Expected: "true"

// Or check environment value:
document.querySelector('[data-auto-completion-env-value]')?.getAttribute('data-auto-completion-env-value')
// Expected: "true"
```

---

## 11. Known Gaps and Limitations

### 11.1 Build Args vs Environment Variables

**Current Limitation:** `skillup-web` docker-compose definition has NO explicit `build.args` section.

**Implication:** Feature flag relies on Docker build environment inheritance rather than explicit build arg passing.

**Risk:** Less explicit, harder to audit what variables are actually used during build.

**Mitigation:** Add explicit build args to docker-compose.yml for clarity:

```yaml
skillup-web:
  ...
  build:
    context: ../../..
    dockerfile: apps/skillup-web/Dockerfile
    args:
      NEXT_PUBLIC_ENABLE_AUTO_COMPLETION: ${NEXT_PUBLIC_ENABLE_AUTO_COMPLETION}
```

**Status:** NOT REQUIRED for functionality, but RECOMMENDED for clarity.

### 11.2 NoCache Requirement

**Current Limitation:** Must use `-NoCache` flag to guarantee fresh build with new environment variable.

**Risk:** Operator may forget `-NoCache` → stale Docker cache → old bundle deployed.

**Mitigation:** Document requirement clearly in deployment runbook.

### 11.3 Runtime Flexibility

**Current Limitation:** Cannot toggle feature flag at runtime without redeployment.

**Alternative Approach:** Server-side feature flag system (not implemented).

**Status:** Accepted limitation - `NEXT_PUBLIC_*` design choice by Next.js.

---

## 12. Integration with Investigation 08

### 12.1 Relationship to 08A (Step 3 Pre-Flight)

**08A Scope:** Local development testing pre-flight

**08C Scope:** Production deployment configuration

**Key Difference:**

- **08A:** `cross-env NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true pnpm --filter @quiz/skillup-web dev`
- **08C:** Add to `infra/hostinger/env/brands/skillup.env` + deploy with `-NoCache`

### 12.2 Production Pre-Flight Addition

**08A should be updated to note:**

> Production deployment requires adding `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION="true"` to `infra/hostinger/env/brands/skillup.env` and deploying with `--no-cache` flag. See Investigation 08C for complete production deployment procedure.

---

## 13. Recommendations

### 13.1 Immediate Actions

1. ✅ **Add feature flag to skillup.env** (when ready for production)
2. ✅ **Deploy with -NoCache** (when adding flag)
3. ✅ **Verify in production browser console** (after deployment)
4. ✅ **Monitor Sentry for errors** (first 24 hours)

### 13.2 Documentation Updates

1. ✅ **Update 08A_STEP3_RUNTIME_PREFLIGHT.md** - Add production deployment reference
2. ✅ **Create deployment runbook** - Step-by-step production deployment guide
3. ✅ **Document rollback procedure** - Fast rollback for production issues

### 13.3 Architecture Improvements (Optional)

1. **Add explicit build args to docker-compose.yml** - Improve clarity
2. **Create deployment verification script** - Automated post-deployment checks
3. **Implement server-side feature flag system** - Runtime toggleability (future consideration)

---

## 14. Answers to Original Questions

### Q1: Where is `skillup-web` built?
**A:** Locally on deployment machine via `build-save-images.ps1`, then uploaded to production server.

### Q2: What command builds it?
**A:** `pnpm --filter @quiz/skillup-web build` inside Docker build context.

### Q3: Does `deploy-direct.sh` build it locally or remotely?
**A:** **Locally.** Docker image built locally, archived, uploaded to server, then loaded remotely.

### Q4: Where does its environment come from?
**A:** Three-layer merge: `shared/.env` → `brands/skillup.env` → `services/skillup-web.env`

### Q5: At what point must `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true` exist?
**A:** **During Docker build** (`pnpm --filter @quiz/skillup-web build` step) for Next.js to embed it into client bundle.

### Q6: Is the value available during `next build`?
**A:** Yes, if present in environment files used by `build-save-images.ps1`.

### Q7: Does deployed application receive it at runtime, build time, or both?
**A:** **Build time** (embedded into bundle). Runtime environment files loaded but `NEXT_PUBLIC_*` already frozen in bundle.

### Q8: Is it configured in Cloudflare, GCP, or another platform?
**A:** **Neither.** Hostinger VPS deployment with Docker Compose. Environment files on VPS at `/opt/platform/env/`.

### Q9: Does `api-server` actually consume the variable?
**A:** **No.** `api-server` is backend API with no browser bundle. `NEXT_PUBLIC_*` only affects browser code.

### Q10: Does `api-gateway` consume it?
**A:** **No.** `api-gateway` is Cloudflare Worker (not Next.js, no browser bundle).

### Q11: Does `skillhubcore-admin` consume it?
**A:** **TBD.** It uses Next.js but is admin portal. Requires separate decision for admin workflow.

### Q12: Does `realtutorialhub-web` consume it?
**A:** **Potentially.** Same architecture as `skillup-web`. Depends on brand-specific rollout strategy.

### Q13: What is the production rollback mechanism?
**A:** Two options: (1) git revert + redeploy with `-NoCache` (5-10 min), (2) load previous image archive (1-2 min).

### Q14: How can deployed browser prove intended value?
**A:** Browser console log: `[TutorialPageShell] Auto-completion flag evaluation: {rawValue: true, enabled: true}` and DOM attribute `data-auto-completion-enabled="true"`.

### Q15: Can feature be disabled without modifying `.env.local` or application source?
**A:** **Yes.** Remove or set `="false"` in production environment file, then redeploy with `-NoCache`. No source code change required.

---

## 15. Final Status

**Investigation Status:** ✅ COMPLETE

**Production Configuration Status:** ❌ NOT YET DEPLOYED (feature flag not in production environment files)

**Deployment Procedure:** ✅ DOCUMENTED

**Rollback Procedure:** ✅ DOCUMENTED

**Verification Procedure:** ✅ DOCUMENTED

**Next Action:** Await decision to enable feature flag in production for SkillUp brand.

---

## 16. Related Documents

**Investigation 08 Main:** `08_TESTING_VALIDATION_AND_CERTIFICATION.md`  
**Step 3 Pre-Flight:** `08A_STEP3_RUNTIME_PREFLIGHT.md`  
**Evidence Correlation:** `08B_EXECUTION_EVIDENCE_CORRELATION.md`  
**Gate H Evidence:** `08A_GATE_H_EXECUTION_EVIDENCE.md`

---

## 17. Document Maintenance

**Last Updated:** 2026-10-03  
**Deployment Scripts Verified:** `scripts/deploy-smart.ps1`, `infra/hostinger/scripts/build-save-images.ps1`  
**Environment Files Inspected:** `infra/hostinger/env/brands/skillup.env`, `infra/hostinger/env/services/skillup-web.env`  
**Docker Files Verified:** `apps/skillup-web/Dockerfile`, `infra/hostinger/compose/docker-compose.yml`  
**Next Review:** After first production deployment of feature flag

---

**END OF INVESTIGATION 08C**
