# Quick Start Guide - Multi-Brand Authentication Architecture

## 📋 What You Have Now

✅ **requirements.md** - What we're building  
✅ **design.md** - How to build it (2305 lines of detailed design)  
✅ **tasks.md** - 45 implementation tasks  
✅ **IMPLEMENTATION_GUIDE.md** - Step-by-step guide with file references  
✅ **AI_PROMPT_TEMPLATES.md** - Copy-paste prompts for your AI  

---

## 🚀 Start Here: 3-Step Process

### Step 1: Understand the Architecture (5 minutes)

Read these sections in order:
1. `requirements.md` - Section "Overview" (understand the problem)
2. `ARCHITECTURE_SUMMARY.md` - High-level architecture
3. `design.md` - Section "High-Level System Architecture" (see the diagram)

**Key Concept**: RTH and SkillUp are completely isolated brands that share services through a neutral identity bridge.

---

### Step 2: Set Up Your Environment (10 minutes)

```bash
# 1. Create environment variables file
cp .env.example .env.local

# 2. Add database URLs (you'll need 3 databases)
# - rth_prod (new)
# - skillup_prod (new)  
# - people_prod (existing, will be updated)

# 3. Add JWT secrets
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=<generate>
JWT_REFRESH_SECRET=<generate>
JWT_SKILLHUB_SECRET=<generate>

# 4. Set up Upstash Redis (for rate limiting)
# Sign up at https://upstash.com
UPSTASH_REDIS_REST_URL=<your-url>
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

---

### Step 3: Start Implementation (Follow Phases)

Open `AI_PROMPT_TEMPLATES.md` and start with **Phase 1, Prompt 1A**.

---

## 📊 Implementation Flow Diagram

```
Phase 1: Foundation (Week 1)
├── Create rth_prod database
├── Create skillup_prod database
├── Update people_prod database
└── Create Identity Bridge package
    ↓
Phase 2: Shared Utilities (Week 1)
├── Create DTOs and types
├── Create Token/Password services
└── Create logging utilities
    ↓
Phase 3: RTH Auth Service (Week 2)
├── Create repository layer
├── Create service logic
├── Create API routes
└── Create deployment config
    ↓
Phase 4: SkillUp Auth Service (Week 2)
└── Replicate RTH pattern
    ↓
Phase 5: SkillHub Auth Validator (Week 2)
└── Create cross-domain validator
    ↓
Phase 6: API Gateways (Week 3)
├── RTH Gateway (Cloudflare Worker)
├── SkillUp Gateway (Cloudflare Worker)
└── SkillHub Gateway (Cloudflare Worker)
    ↓
Phase 7: Frontend Updates (Week 3)
├── Update RTH User Portal
├── Update SkillUp User Portal
└── Update Admin Portals
    ↓
Phase 8: Shared Services (Week 3)
├── Update Quiz service
├── Update Tutorial service
└── Update Placement service
    ↓
Phase 9: Testing & Deployment (Week 4)
├── E2E tests
├── Load tests
└── Deploy to production
```

---

## 🎯 Your First Task (Start Here!)

### Task: Create RTH Database Package

**Time**: 30-45 minutes

**Steps**:

1. **Open AI_PROMPT_TEMPLATES.md**
2. **Copy "Prompt 1A: Create RTH Database Package"**
3. **Give it to your AI assistant** (Claude, ChatGPT, etc.)
4. **Review the generated code**
5. **Create the files in your project**
6. **Validate**: Run `cd packages/db-rth && pnpm build`

**Expected Output**:
```
packages/db-rth/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── src/
│   ├── index.ts
│   ├── schema/
│   │   ├── users.ts
│   │   ├── userProfiles.ts
│   │   ├── roles.ts
│   │   ├── userRoles.ts
│   │   └── authAuditLog.ts
│   └── utils/
│       └── withTimeout.ts
```

**Success Criteria**:
- ✅ Package builds without errors
- ✅ All tables have deleted_at column
- ✅ Connection config has pooled, direct, readonly exports
- ✅ Statement timeout is 30000ms

---

## 📁 File Structure Overview

Here's what you'll create:

```
your-monorepo/
├── packages/
│   ├── db-rth/              ← Phase 1 (NEW)
│   ├── db-skillup/          ← Phase 1 (NEW)
│   ├── db-people/           ← Phase 1 (UPDATE)
│   ├── identity-bridge/     ← Phase 1 (NEW)
│   ├── auth/                ← Phase 2 (NEW)
│   └── types/               ← Phase 2 (UPDATE)
│
├── services/
│   ├── rth-auth-service/    ← Phase 3 (NEW)
│   ├── skillup-auth-service/← Phase 4 (NEW)
│   ├── skillhub-auth-validator/ ← Phase 5 (NEW)
│   ├── api-gateway-rth/     ← Phase 6 (NEW)
│   ├── api-gateway-skillup/ ← Phase 6 (NEW)
│   └── api-gateway-skillhub/← Phase 6 (NEW)
│
├── apps/
│   ├── realtutorialhub-web/ ← Phase 7 (UPDATE)
│   ├── skillup-web/         ← Phase 7 (UPDATE)
│   ├── skillhub-quiz/       ← Phase 8 (UPDATE)
│   ├── skillhub-tutorial/   ← Phase 8 (UPDATE)
│   └── skillhub-placement/  ← Phase 8 (UPDATE)
│
└── scripts/
    ├── deploy-rth-auth.sh   ← Phase 3 (NEW)
    ├── deploy-skillup-auth.sh ← Phase 4 (NEW)
    └── migrate-users.ts     ← Phase 9 (NEW)
```

**Legend**:
- (NEW) = Completely new code
- (UPDATE) = Modify existing code

---

## 🔍 How to Use the Reference Files

When giving prompts to your AI, always include these files:

### For Database Work:
```
REFERENCE FILES:
- .kiro/specs/multi-brand-auth-architecture/design.md (Data Models section)
- packages/db/src/index.ts (existing pattern)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

### For Service Work:
```
REFERENCE FILES:
- .kiro/specs/multi-brand-auth-architecture/design.md (Service Implementation section)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (specific task)
- docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md
```

### For Frontend Work:
```
REFERENCE FILES:
- .kiro/specs/multi-brand-auth-architecture/design.md (Frontend section)
- apps/realtutorialhub-web/src/app/login/page.tsx (existing pattern)
```

---

## ⚡ Quick Commands Reference

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Check test coverage
pnpm test -- --coverage

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run specific package tests
cd packages/identity-bridge
pnpm test

# Run specific service
cd services/rth-auth-service
pnpm dev

# Deploy to GCP Cloud Run
./scripts/deploy-rth-auth.sh

# Deploy to Cloudflare Workers
cd services/api-gateway-rth
pnpm deploy
```

---

## 🎓 Learning Path

If you're new to any of these technologies:

### Drizzle ORM
- Read: https://orm.drizzle.team/docs/overview
- Focus on: Schema definition, queries, migrations

### Hono Framework
- Read: https://hono.dev/
- Focus on: Routing, middleware, context

### OpenTelemetry
- Read: https://opentelemetry.io/docs/
- Focus on: Spans, traces, attributes

### Cloudflare Workers
- Read: https://developers.cloudflare.com/workers/
- Focus on: Deployment, environment variables, routing

---

## 🐛 Troubleshooting

### Problem: "Module not found" errors
**Solution**: Run `pnpm install` in the root directory

### Problem: TypeScript errors in new packages
**Solution**: Make sure tsconfig.json extends from root config:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### Problem: Database connection fails
**Solution**: Check environment variables in .env.local:
```bash
# Verify database URLs are correct
echo $DATABASE_URL_RTH
echo $DATABASE_URL_SKILLUP
echo $DATABASE_URL_PEOPLE
```

### Problem: Tests failing
**Solution**: Make sure all dependencies are installed:
```bash
cd packages/identity-bridge
pnpm install
pnpm build
pnpm test
```

---

## 📞 Need Help?

1. **Check the design.md** - It has detailed implementation guidance
2. **Check the tasks.md** - It has specific requirements for each task
3. **Check IMPLEMENTATION_GUIDE.md** - It has step-by-step instructions
4. **Check AI_PROMPT_TEMPLATES.md** - It has ready-to-use prompts

---

## ✅ Success Checklist

After completing each phase, verify:

### Phase 1 Complete:
- [ ] packages/db-rth builds successfully
- [ ] packages/db-skillup builds successfully
- [ ] packages/db-people updated with external_id columns
- [ ] packages/identity-bridge has 90%+ test coverage

### Phase 2 Complete:
- [ ] packages/types has all DTOs and interfaces
- [ ] packages/auth has TokenService and PasswordService
- [ ] All tests pass with 90%+ coverage

### Phase 3 Complete:
- [ ] services/rth-auth-service builds successfully
- [ ] Can register and login users
- [ ] Tokens are generated correctly
- [ ] Users are synced to people_prod
- [ ] All tests pass

### Phase 4 Complete:
- [ ] services/skillup-auth-service builds successfully
- [ ] Same functionality as RTH but with skillup brand
- [ ] All tests pass

### Phase 5 Complete:
- [ ] services/skillhub-auth-validator validates tokens
- [ ] Generates SkillHub session tokens
- [ ] All tests pass

### Phase 6 Complete:
- [ ] All 3 API gateways deployed to Cloudflare
- [ ] Routing works correctly
- [ ] Rate limiting enforced
- [ ] CORS configured

### Phase 7 Complete:
- [ ] RTH User Portal uses new auth API
- [ ] SkillUp User Portal uses new auth API
- [ ] Cross-domain redirect works

### Phase 8 Complete:
- [ ] Quiz service uses shadowUserId
- [ ] Tutorial service uses shadowUserId
- [ ] Placement service uses shadowUserId
- [ ] Brand theming works

### Phase 9 Complete:
- [ ] All E2E tests pass
- [ ] Load tests meet performance requirements
- [ ] All services deployed to production
- [ ] DNS configured correctly

---

## 🎉 You're Ready!

**Next Step**: Open `AI_PROMPT_TEMPLATES.md` and copy **Prompt 1A** to start building!

**Estimated Timeline**: 3-4 weeks for full implementation

**Remember**: 
- Follow phases in order
- Don't skip tests (90%+ coverage required)
- Validate after each phase
- Use the AI prompts - they're designed to work!

Good luck! 🚀
