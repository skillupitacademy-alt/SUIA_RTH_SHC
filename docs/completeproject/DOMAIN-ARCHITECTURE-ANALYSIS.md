# Domain Architecture Analysis

> [!IMPORTANT]
> Historical architecture note: this file reflects an older domain plan and still references retired student hosts.
> Current production truth lives in `.kiro/DEPLOYMENT_STATUS_MATRIX.md`.
> Treat `user.realtutorialhub.com`, `user.skillupitacademy.com`, `tutorial.skillhubcore.in`, `quiz.skillhubcore.in`, and `placement.skillhubcore.in` as the active public host map unless this file explicitly says otherwise.

> Based on actual codebase + gateway routing
> Generated: 2026-03-29

---

## Current Apps in Monorepo

```
apps/
├── api-server/              ✅ ACTIVE - Main backend (Next.js)
├── faculty-app/             ✅ ACTIVE - Faculty portal
├── realtutorialhub-admin/   ✅ ACTIVE - RTH admin
├── realtutorialhub-quiz/    ✅ ACTIVE - RTH quiz app
├── realtutorialhub-web/     ✅ ACTIVE - RTH tutorial/notes app
├── skillhubcore-admin/      🔶 SCAFFOLD - Admin for core platform
├── skillup-admin/           ✅ ACTIVE - SkillUp admin
└── skillup-web/             ✅ ACTIVE - SkillUp student portal
```

---

## What You ACTUALLY Need (Minimal Architecture)

### RealTutorialHub (3 domains)
| Domain | App | Purpose | Status |
|--------|-----|---------|--------|
| `notes.realtutorialhub.com` | `realtutorialhub-web` | Tutorial learning | ✅ KEEP |
| `quiz.realtutorialhub.com` | `realtutorialhub-quiz` | Quiz/exam app | ✅ KEEP |
| `admin.realtutorialhub.com` | `realtutorialhub-admin` | Admin portal | ✅ KEEP |

### SkillUp IT Academy (3 domains)
| Domain | App | Purpose | Status |
|--------|-----|---------|--------|
| `app.skillupitacademy.com` | `skillup-web` | Student portal | ✅ KEEP |
| `admin.skillupitacademy.com` | `skillup-admin` | Admin portal | ✅ KEEP |
| `faculty.skillupitacademy.com` | `faculty-app` | Faculty portal | ✅ KEEP |

### SkillHubCore (1 domain)
| Domain | App | Purpose | Status |
|--------|-----|---------|--------|
| `api.skillhubcore.in` | `skillhubcore-service` | Auth/subscription API | 🔶 FUTURE |

### API Gateway (1 domain)
| Domain | Service | Purpose | Status |
|--------|---------|---------|--------|
| `api.realtutorialhub.com` | `api-gateway` (Cloudflare Worker) | Routes to api-server | ✅ KEEP |

---

## What You DON'T Need (Over-Engineering)

### ❌ REMOVE These Planned Domains

**SkillUp Microservices** (Unnecessary fragmentation):
- ❌ `learn.skillupitacademy.com` → Just redirect to `notes.realtutorialhub.com`
- ❌ `enquiry.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `admission.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `schedule.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `attendance.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `cert.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `internship.skillupitacademy.com` → Part of `app.skillupitacademy.com`
- ❌ `placement.skillupitacademy.com` → Part of `app.skillupitacademy.com`

**Why?** These are all features WITHIN the student portal, not separate apps. Creating separate domains adds:
- 8 extra DNS records
- 8 extra SSL certificates
- 8 extra deployment pipelines
- 8 extra monitoring endpoints
- Confusing user experience (why am I on 5 different domains?)

**Better Approach**: Use routes within `app.skillupitacademy.com`:
- `app.skillupitacademy.com/enquiry`
- `app.skillupitacademy.com/admission`
- `app.skillupitacademy.com/schedule`
- `app.skillupitacademy.com/attendance`
- `app.skillupitacademy.com/certificates`
- `app.skillupitacademy.com/internship`
- `app.skillupitacademy.com/placement`

---

## Recommended Architecture (Simplified)

### Total Domains: 8 (down from 18+)

**RealTutorialHub** (3):
1. `realtutorialhub.com` → Marketing landing (static site or Next.js)
2. `notes.realtutorialhub.com` → Tutorial app (`realtutorialhub-web`)
3. `quiz.realtutorialhub.com` → Quiz app (`realtutorialhub-quiz`)
4. `admin.realtutorialhub.com` → Admin (`realtutorialhub-admin`)

**SkillUp IT Academy** (3):
1. `skillupitacademy.com` → Marketing landing (static site)
2. `app.skillupitacademy.com` → Student portal (`skillup-web`) - ALL features here
3. `admin.skillupitacademy.com` → Admin (`skillup-admin`)
4. `faculty.skillupitacademy.com` → Faculty (`faculty-app`)

**Backend** (2):
1. `api.realtutorialhub.com` → API Gateway (Cloudflare Worker → api-server)
2. `api.skillhubcore.in` → Auth/Subscription service (FUTURE)

---

## Gateway Routing (Current vs Needed)

### ✅ Currently Active in Gateway (KEEP)
```typescript
{ host: 'app.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_WEB_URL' }
{ host: 'admin.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_ADMIN_URL' }
{ host: 'faculty.skillupitacademy.com', prefix: '/', upstreamKey: 'FACULTY_URL' }
{ host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL' }
```

### ❌ NOT in Gateway (Add if needed)
```typescript
// RTH apps are NOT routed through gateway - they're standalone Next.js apps
// This is CORRECT - no need to add them to gateway
```

### 🔶 Future (Only if SkillHubCore is built)
```typescript
{ host: 'admin.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_ADMIN_URL' }
```

---

## DNS Configuration (Cloudflare)

### What You Need to Configure

**RealTutorialHub**:
```
realtutorialhub.com              → A/CNAME → Vercel/GCP (marketing site)
notes.realtutorialhub.com        → CNAME → realtutorialhub-web.vercel.app
quiz.realtutorialhub.com         → CNAME → realtutorialhub-quiz.vercel.app
admin.realtutorialhub.com        → CNAME → realtutorialhub-admin.vercel.app
api.realtutorialhub.com          → CNAME → api-gateway.workers.dev
```

**SkillUp IT Academy**:
```
skillupitacademy.com             → A/CNAME → Vercel/GCP (marketing site)
app.skillupitacademy.com         → CNAME → skillup-web.vercel.app
admin.skillupitacademy.com       → CNAME → skillup-admin.vercel.app
faculty.skillupitacademy.com     → CNAME → faculty-app.vercel.app
```

**SkillHubCore** (FUTURE):
```
skillhubcore.in                  → A/CNAME → Marketing site
api.skillhubcore.in              → CNAME → skillhubcore-service.run.app (GCP Cloud Run)
admin.skillhubcore.in            → CNAME → skillhubcore-admin.vercel.app
```

**Total DNS Records**: 11 (vs 18+ in over-engineered plan)

---

## Deployment Targets

### Vercel (Frontend Apps)
- `realtutorialhub-web` → `notes.realtutorialhub.com`
- `realtutorialhub-quiz` → `quiz.realtutorialhub.com`
- `realtutorialhub-admin` → `admin.realtutorialhub.com`
- `skillup-web` → `app.skillupitacademy.com`
- `skillup-admin` → `admin.skillupitacademy.com`
- `faculty-app` → `faculty.skillupitacademy.com`
- `skillhubcore-admin` → `admin.skillhubcore.in` (FUTURE)

### GCP Cloud Run (Backend Services)
- `api-server` → Internal only (called by gateway)
- `skillhubcore-service` → `api.skillhubcore.in` (FUTURE)

### Cloudflare Workers (Gateway)
- `api-gateway` → `api.realtutorialhub.com`

---

## Cost Analysis

### Current Over-Engineered Plan (18 domains)
- DNS: 18 records × $0/month = $0
- SSL: 18 certificates × $0/month = $0 (Let's Encrypt)
- Monitoring: 18 endpoints × $5/month = $90/month
- Deployment pipelines: 18 × complexity
- Developer confusion: HIGH

### Simplified Plan (11 domains)
- DNS: 11 records × $0/month = $0
- SSL: 11 certificates × $0/month = $0
- Monitoring: 11 endpoints × $5/month = $55/month
- Deployment pipelines: 11 × complexity
- Developer confusion: LOW

**Savings**: $35/month + reduced complexity

---

## Migration Plan (If Already Deployed)

### Phase 1: Consolidate SkillUp Subdomains
1. Move all features to `app.skillupitacademy.com` routes
2. Set up 301 redirects from old subdomains
3. Update all internal links
4. Remove old DNS records after 30 days

### Phase 2: Simplify Gateway Routing
1. Remove unused host-based routes
2. Keep only: `app.skillupitacademy.com`, `admin.skillupitacademy.com`, `faculty.skillupitacademy.com`
3. Update environment variables

### Phase 3: Documentation Cleanup
1. Update all docs to reflect simplified architecture
2. Remove references to unused domains
3. Update deployment guides

---

## Recommendation

**DO THIS**:
✅ Keep 8 core domains (3 RTH + 3 SkillUp + 2 API)
✅ Use routes within apps instead of separate domains
✅ Add SkillHubCore domains ONLY when service is built
✅ Keep gateway routing simple (4 host-based routes)

**DON'T DO THIS**:
❌ Create separate domains for every feature
❌ Over-engineer with microservices before you need them
❌ Add domains "for future use" - add them when needed
❌ Route RTH apps through gateway (they're standalone)

---

## Answer to Your Question

> Do we need all this as per current project architecture?

**NO.** You need **8 domains**, not 18+.

Your current architecture is **already correct** with the gateway routing you have. The "future" domains in your docs are **over-engineering** that will add complexity without benefit.

**Stick with what's in the gateway now** + the RTH standalone apps. That's it.

---

**END OF ANALYSIS**
