# 🤖 AI Model Reading Order - Complete Guide

**Simple, linear reading order for AI models implementing this project**

---

## 🎯 Purpose

This document provides a **simple, numbered list** of exactly which files to read and in what order. No confusion, no decisions needed - just follow the numbers.

---

## 📖 Reading Order

### Phase 1: Orientation (Day 0 - Before Implementation)

**Total Time**: ~65 minutes

```
1. START_HERE.md (10 minutes)
   Purpose: Main entry point, understand the navigation
   
2. VERIFICATION_SUMMARY.md (5 minutes)
   Purpose: See what already exists (47% done!)
   
3. ARCHITECTURE_SUMMARY.md (15 minutes)
   Purpose: Understand the overall architecture
   
4. EXISTING_SERVICES_VERIFIED.md (20 minutes)
   Purpose: Know what code already exists and where
   
5. IMPLEMENTATION_PRIORITY.md (15 minutes)
   Purpose: Get your day-by-day implementation plan
```

**After reading these 5 files, you're ready to start Day 1!**

---

### Phase 2: Daily Implementation (Days 1-18)

**Each Day, Read These in Order**:

```
1. IMPLEMENTATION_PRIORITY.md (Today's section)
   Example: "Day 3: Email Verification Brand Awareness"
   
2. AI_PROMPT_TEMPLATES.md (Today's prompt)
   Example: Find "Email Verification" section
   
3. Specific code files mentioned in today's task
   Example: apps/api-server/src/modules/auth/signup.service.ts
   
4. Implement changes (follow code examples)

5. Test changes

6. Move to next day
```

---

### Phase 3: Reference (As Needed During Implementation)

**Only read these when you need specific information**:

```
When you need detailed technical specs:
→ design.md (2305 lines, search for specific section)

When you need to understand requirements:
→ requirements.md

When you need gap analysis details:
→ GAP_ANALYSIS.md (search for specific gap)

When you need to see all tasks:
→ tasks.md (45 tasks with dependencies)

When you need existing features info:
→ EXISTING_FEATURES_ANALYSIS.md

When you need brand comparison:
→ RTH_SKILLUP_COMPARISON.md

When you're lost:
→ NAVIGATION_MAP.md (visual guide)
```

---

## 📅 Week-by-Week Reading Guide

### Week 1: Brand Awareness (Days 1-7)

#### Day 1-2: Email Templates
```
1. IMPLEMENTATION_PRIORITY.md → Day 1-2 section
2. AI_PROMPT_TEMPLATES.md → Email Templates prompt
3. apps/api-server/src/modules/email/EmailService.ts (read existing code)
4. apps/api-server/src/modules/email/providers/ResendEmailProvider.ts (read existing code)
5. Implement brand-specific templates
6. Test email sending
```

#### Day 3: Email Verification Brand Awareness
```
1. IMPLEMENTATION_PRIORITY.md → Day 3 section
2. AI_PROMPT_TEMPLATES.md → Email Verification prompt
3. apps/api-server/src/modules/auth/signup.service.ts (read existing code)
4. packages/db/src/schema/auth.ts (read verification_tokens table)
5. Implement brand parameter
6. Test verification flow
```

#### Day 4: Password Reset Brand Awareness
```
1. IMPLEMENTATION_PRIORITY.md → Day 4 section
2. AI_PROMPT_TEMPLATES.md → Password Reset prompt
3. apps/api-server/src/modules/auth/password-recovery.service.ts (read existing code)
4. packages/db/src/schema/auth.ts (read password_reset_tokens table)
5. Implement brand-specific URLs
6. Test reset flow
```

#### Day 5: RBAC Brand Isolation
```
1. IMPLEMENTATION_PRIORITY.md → Day 5 section
2. AI_PROMPT_TEMPLATES.md → RBAC prompt
3. services/skillhubcore-service/src/middleware/verify-jwt.ts (read existing code)
4. Implement brand isolation
5. Test role enforcement
```

#### Day 6: Account Lockout Brand Tracking
```
1. IMPLEMENTATION_PRIORITY.md → Day 6 section
2. AI_PROMPT_TEMPLATES.md → Account Lockout prompt
3. apps/api-server/src/modules/auth/security.service.ts (read existing code)
4. packages/db/src/schema/auth.ts (read login_attempts table)
5. Implement brand tracking
6. Test lockout logic
```

#### Day 7: Session Management Endpoints
```
1. IMPLEMENTATION_PRIORITY.md → Day 7 section
2. AI_PROMPT_TEMPLATES.md → Session Management prompt
3. services/skillhubcore-service/src/modules/auth/auth.routes.ts (read existing code)
4. services/skillhubcore-service/src/modules/user/user.repository.ts (read existing code)
5. Implement brand-specific endpoints
6. Test session management
```

---

### Week 2: Identity Bridge & Migration (Days 8-14)

#### Day 8-10: Identity Bridge Implementation
```
1. IMPLEMENTATION_PRIORITY.md → Day 8-10 section
2. design.md → Search for "Identity Bridge" section
3. AI_PROMPT_TEMPLATES.md → Identity Bridge prompt
4. packages/db-people/src/schema/users.ts (read shadow user schema)
5. Create packages/identity-bridge/src/bridge.service.ts
6. Implement shadow user sync logic
7. Test bridge functionality
```

#### Day 11-12: Data Migration Scripts
```
1. IMPLEMENTATION_PRIORITY.md → Day 11-12 section
2. design.md → Search for "Data Migration" section
3. AI_PROMPT_TEMPLATES.md → Data Migration prompt
4. packages/db/src/schema/auth.ts (read existing user schema)
5. Create scripts/migrate-existing-users.ts
6. Create scripts/validate-migration.ts
7. Create scripts/rollback-migration.ts
8. Test migration on staging data
```

#### Day 13-14: Multi-Brand Health Checks
```
1. IMPLEMENTATION_PRIORITY.md → Day 13-14 section
2. AI_PROMPT_TEMPLATES.md → Health Checks prompt
3. apps/api-server/src/modules/core/health.service.ts (read existing code)
4. Implement multi-brand health check methods
5. Test health endpoints
```

---

### Week 3: Testing & Documentation (Days 15-18)

#### Day 15-16: Security Testing
```
1. IMPLEMENTATION_PRIORITY.md → Day 15-16 section
2. GAP_ANALYSIS.md → Search for "Security Testing" section
3. Create tests/security/ directory
4. Create SQL injection tests
5. Create XSS tests
6. Create CSRF tests
7. Run OWASP ZAP scan
8. Fix all critical vulnerabilities
```

#### Day 17: API Documentation
```
1. IMPLEMENTATION_PRIORITY.md → Day 17 section
2. GAP_ANALYSIS.md → Search for "API Documentation" section
3. Create docs/api/openapi.yaml
4. Document all auth endpoints
5. Set up Swagger UI
6. Test interactive docs
```

#### Day 18: Audit Trail Enhancements
```
1. IMPLEMENTATION_PRIORITY.md → Day 18 section
2. GAP_ANALYSIS.md → Search for "Audit Trail" section
3. packages/db/src/schema/auth.ts (modify audit_logs table)
4. apps/api-server/src/modules/auth/audit.service.ts (enhance logging)
5. Test audit logging
```

---

## 🔄 Daily Reading Pattern

**Every single day, follow this exact pattern**:

```
Morning:
├─ 1. Open IMPLEMENTATION_PRIORITY.md
├─ 2. Find today's section (e.g., "Day 5")
├─ 3. Read the task description
├─ 4. Open AI_PROMPT_TEMPLATES.md
├─ 5. Find today's prompt
├─ 6. Read the specific files mentioned
├─ 7. Understand existing code
├─ 8. Implement changes
├─ 9. Test changes
└─ 10. Mark task complete, move to next day
```

---

## ✅ Reading Checklist

### Before Day 1
- [ ] Read START_HERE.md
- [ ] Read VERIFICATION_SUMMARY.md
- [ ] Read ARCHITECTURE_SUMMARY.md
- [ ] Read EXISTING_SERVICES_VERIFIED.md
- [ ] Read IMPLEMENTATION_PRIORITY.md (full overview)
- [ ] Understand: 47% already done
- [ ] Understand: 2-3 week timeline
- [ ] Understand: Week 1 = Brand awareness

### Every Day (Days 1-18)
- [ ] Read IMPLEMENTATION_PRIORITY.md (today's section)
- [ ] Read AI_PROMPT_TEMPLATES.md (today's prompt)
- [ ] Read specific code files mentioned
- [ ] Understand existing code
- [ ] Implement changes
- [ ] Test changes
- [ ] Mark complete

### When Stuck
- [ ] Re-read START_HERE.md
- [ ] Check NAVIGATION_MAP.md
- [ ] Read relevant section in design.md
- [ ] Read relevant section in GAP_ANALYSIS.md

---

## 🚫 What NOT to Read (Unless Needed)

**Don't read these unless specifically needed**:

- ❌ analysis.md (historical context, not needed for implementation)
- ❌ COMPLETE_PROJECT_SUMMARY.md (old summary, superseded by newer docs)
- ❌ QUICK_START.md (superseded by IMPLEMENTATION_PRIORITY.md)
- ❌ IMPLEMENTATION_GUIDE.md (superseded by IMPLEMENTATION_PRIORITY.md)
- ❌ frontend/ docs (only if doing frontend work)

**These are outdated or superseded by newer, better documents.**

---

## 🎯 Success Indicators

### You're doing it right if:
✅ You read START_HERE.md first
✅ You read the 5 orientation files before Day 1
✅ You're following the day-by-day sequence
✅ You're reading IMPLEMENTATION_PRIORITY.md every day
✅ You're using AI_PROMPT_TEMPLATES.md for context
✅ You're reading existing code before modifying
✅ You're testing each change

### You're doing it wrong if:
❌ You skipped START_HERE.md
❌ You jumped straight to design.md
❌ You're trying to read everything at once
❌ You're not following the day sequence
❌ You're building services that already exist
❌ You're not testing changes

---

## 📊 Reading Time Estimates

### Phase 1: Orientation (Day 0)
- START_HERE.md: 10 minutes
- VERIFICATION_SUMMARY.md: 5 minutes
- ARCHITECTURE_SUMMARY.md: 15 minutes
- EXISTING_SERVICES_VERIFIED.md: 20 minutes
- IMPLEMENTATION_PRIORITY.md: 15 minutes
**Total**: 65 minutes

### Phase 2: Daily Implementation (Days 1-18)
- Daily reading: 30-60 minutes per day
- Implementation: 4-6 hours per day
- Testing: 1-2 hours per day
**Total per day**: 6-9 hours

### Phase 3: Reference (As Needed)
- design.md: 10-30 minutes (search for specific section)
- GAP_ANALYSIS.md: 5-10 minutes (search for specific gap)
- Other docs: 5-15 minutes each

---

## 🗺️ Visual Reading Flow

```
START_HERE.md
     ↓
VERIFICATION_SUMMARY.md
     ↓
ARCHITECTURE_SUMMARY.md
     ↓
EXISTING_SERVICES_VERIFIED.md
     ↓
IMPLEMENTATION_PRIORITY.md
     ↓
┌────────────────────────────────┐
│     DAILY LOOP (Days 1-18)     │
│                                │
│  IMPLEMENTATION_PRIORITY.md    │
│           ↓                    │
│  AI_PROMPT_TEMPLATES.md        │
│           ↓                    │
│  Specific code files           │
│           ↓                    │
│  Implement & Test              │
│           ↓                    │
│  Next day ──────────────┐      │
│                         │      │
└─────────────────────────┘      │
                                 │
                                 ↓
                          Day 18 Complete!
```

---

## 🎓 Quick Start for AI Models

**If you're an AI model starting this project right now**:

1. Read this file (AI_READING_ORDER.md) - You're doing it! ✅
2. Read START_HERE.md (10 min)
3. Read VERIFICATION_SUMMARY.md (5 min)
4. Read ARCHITECTURE_SUMMARY.md (15 min)
5. Read EXISTING_SERVICES_VERIFIED.md (20 min)
6. Read IMPLEMENTATION_PRIORITY.md (15 min)
7. Start Day 1 implementation

**That's it! Simple and linear.**

---

**Last Updated**: March 30, 2026  
**Purpose**: Simple, linear reading order for AI models  
**Next Step**: Read START_HERE.md if you haven't already!
