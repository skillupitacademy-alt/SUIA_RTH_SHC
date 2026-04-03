# Multi-Brand Authentication Architecture Specification

This directory contains the complete specification for implementing a multi-brand authentication architecture that separates Real Tutorial Hub (RTH) and SkillUp IT Academy while maintaining shared services.

---

## 🚀 **FOR AI MODELS: START HERE** 👇

### **→ Read [START_HERE.md](./START_HERE.md) first!**

This is your main entry point with step-by-step navigation for the entire implementation.

---

## 📚 Document Index

### Navigation & Entry Points
1. **START_HERE.md** - 🚀 MAIN ENTRY POINT FOR AI MODELS (Read this first!)
2. **AI_ACTION_PLAN_APRIL_2026.md** - 🤖 WHAT TO DO & WHAT NOT TO DO (AI model guide)
3. **IMPLEMENTATION_STATUS_APRIL_2026.md** - ✅ CURRENT STATUS (April 3, 2026 verification)
4. **AI_READING_ORDER.md** - 🤖 Simple numbered reading order for AI models
5. **NAVIGATION_MAP.md** - 🗺️ Visual navigation guide and reading flow
6. **DOCUMENT_AUDIT.md** - 📋 Complete file inventory and verification
7. **README.md** - This file (document index)

### Core Specification Documents
3. **ARCHITECTURE_SUMMARY.md** - High-level architecture overview
4. **analysis.md** - Current state analysis and problem statement
5. **requirements.md** - Detailed technical requirements and constraints
6. **design.md** - Complete architecture design and implementation details (2305 lines)
7. **tasks.md** - 45 implementation tasks with dependencies

### Implementation Guides
8. **IMPLEMENTATION_PRIORITY.md** - Day-by-day priority guide (PRIMARY - USE THIS!)
9. **AI_PROMPT_TEMPLATES.md** - Copy-paste ready prompts for AI assistants
10. ~~**IMPLEMENTATION_GUIDE.md**~~ - Old guide (SUPERSEDED by IMPLEMENTATION_PRIORITY.md)
11. ~~**QUICK_START.md**~~ - Old quick start (SUPERSEDED by IMPLEMENTATION_PRIORITY.md)

### Analysis & Verification Documents
12. **IMPLEMENTATION_STATUS_APRIL_2026.md** - ✅ CURRENT STATUS (April 3 code verification)
13. **GAP_ANALYSIS.md** - Gap analysis with code-vs-guideline section (April 3, 2026)
14. **EXISTING_SERVICES_VERIFIED.md** - Verification of existing services
15. **VERIFICATION_SUMMARY.md** - Historical verification (March 30, 2026)
16. **EXISTING_FEATURES_ANALYSIS.md** - Analysis of existing business features
17. **RTH_SKILLUP_COMPARISON.md** - Comparison of RTH vs SkillUp features
18. ~~**COMPLETE_PROJECT_SUMMARY.md**~~ - Old summary (SUPERSEDED)

### Frontend UI/UX Documents
18. **frontend/README.md** - Frontend documentation index
19. **frontend/01_DESIGN_PRINCIPLES.md** - Design principles and architecture
20. **frontend/02_EXISTING_ANALYSIS.md** - Analysis of existing UI/UX
21. **frontend/FIGMA_DESIGN_BRIEF.md** - Complete Figma design specifications
22. **frontend/INTEGRATION_SEQUENCE.md** - Frontend integration sequence
23. ~~**FRONTEND_UIUX_PRD.md**~~ - Old frontend PRD (MOVED to frontend/ folder)

---

## ⚠️ Superseded Files (Don't Use)

The following files are kept for historical reference but should NOT be used:

1. ~~**IMPLEMENTATION_GUIDE.md**~~ - Replaced by IMPLEMENTATION_PRIORITY.md
2. ~~**QUICK_START.md**~~ - Replaced by START_HERE.md + IMPLEMENTATION_PRIORITY.md
3. ~~**COMPLETE_PROJECT_SUMMARY.md**~~ - Replaced by VERIFICATION_SUMMARY.md
4. ~~**FRONTEND_UIUX_PRD.md**~~ - Replaced by frontend/ folder files

**For AI Models**: Ignore these files. Use the replacements listed above.

---

## 🎯 Quick Start

### For AI Models (RECOMMENDED PATH) 🤖
**→ Read [START_HERE.md](./START_HERE.md) - Your complete navigation guide!**

Recommended reading sequence:
1. **START_HERE.md** - Main entry point
2. **NAVIGATION_MAP.md** - Document structure
3. **ARCHITECTURE_SUMMARY.md** - Target architecture
4. **requirements.md** - Technical requirements
5. **GAP_ANALYSIS.md** - Code-vs-guideline comparison
6. **VERIFICATION_SUMMARY.md** - Verified implementation status
7. **IMPLEMENTATION_PRIORITY.md** - Day-by-day execution plan

Important:
- In **GAP_ANALYSIS.md**, scroll to `CODE VS GUIDELINE GAP ANALYSIS (April 3, 2026)`.
- Treat that section as the primary convergence report between spec and code.

### For Project Managers
1. Read **VERIFICATION_SUMMARY.md** - See what already exists (47% done!)
2. Read **IMPLEMENTATION_PRIORITY.md** - Understand the 2-3 week timeline
3. Review **GAP_ANALYSIS.md** - See what needs to be built

### For Developers
1. Read **START_HERE.md** - Get oriented (recommended!)
2. Read **ARCHITECTURE_SUMMARY.md** - Understand the architecture
3. Read **EXISTING_SERVICES_VERIFIED.md** - See what code already exists
4. Read **IMPLEMENTATION_PRIORITY.md** - Start with Week 1 Day 1 tasks
5. Use **AI_PROMPT_TEMPLATES.md** - Get AI assistance for implementation
6. Read **frontend/README.md** - Understand frontend requirements (NEW!)

### For Designers
1. Read **frontend/FIGMA_DESIGN_BRIEF.md** - Complete Figma specifications (NEW!)
2. Read **frontend/01_DESIGN_PRINCIPLES.md** - Design principles (NEW!)
3. Read **frontend/02_EXISTING_ANALYSIS.md** - Existing UI/UX analysis (NEW!)
4. Create Figma designs following the brief
5. Export design tokens and components

## 🎉 Implementation Status (April 3, 2026)

### ✅ PRODUCTION READY - All Critical Components Verified!

**Latest Verification**: April 3, 2026 (Direct code inspection)

**Status**: The multi-brand authentication architecture is FULLY IMPLEMENTED and matches the target design.

### What's Verified as Working
- ✅ **Identity Bridge** - shadowUserId/originalUserId enforced in all tokens
- ✅ **Token Structure** - All apps validate identity bridge claims
- ✅ **Platform Isolation** - Cross-brand access properly restricted
- ✅ **RBAC** - Role-based access control working
- ✅ **Admin Auth** - Separate admin tokens (admin_accessToken)
- ✅ **Header Forwarding** - Consistent identity propagation
- ✅ **No Token Fallbacks** - Shared services reject tokens without claims

### Optional Enhancements (Not Blocking)
- 🟢 Two-factor authentication (2FA)
- 🟢 OAuth/Social login
- 🟢 Enhanced API documentation
- 🟢 GDPR compliance features
- 🟢 Security penetration testing

### Key Documents
- **IMPLEMENTATION_STATUS_APRIL_2026.md** - Complete verification report (READ THIS!)
- **GAP_ANALYSIS.md** - Code vs guideline comparison (April 3 section)
- **VERIFICATION_SUMMARY.md** - Historical verification (March 30)

## 🏗️ Architecture Overview

### Brand Separation
- RTH users authenticate on **user.realtutorialhub.com**
- SkillUp users authenticate on **user.skillupitacademy.com**
- Both brands share services on **skillhubcore.in**

### Database Architecture
- **rth_prod** - RTH users and brand-specific data
- **skillup_prod** - SkillUp users and brand-specific data
- **people_prod** - Shadow users for shared services

### User Identity Bridge
- Brand users (RTH/SkillUp) → Shadow users (people_prod)
- Shadow users access shared services (quiz, tutorial, placement)
- One brand user = One shadow user
- Foreign keys in shared services reference shadow users

## 📋 Implementation Phases

### Week 1: Brand Awareness (5-7 days)
- Add brand-specific email templates
- Add brand parameter to email verification
- Add brand parameter to password reset
- Add brand isolation to RBAC
- Add brand tracking to account lockout
- Add brand-specific session endpoints

### Week 2: Identity Bridge & Migration (5-7 days)
- Implement Identity Bridge service
- Create data migration scripts
- Test migration on staging
- Add multi-brand health checks

### Week 3: Testing & Documentation (3-5 days)
- Run security tests (OWASP)
- Create API documentation
- Enhance audit trail
- Deploy to production

## 📊 Progress Tracking

### Completed
- [x] Architecture design
- [x] Requirements analysis
- [x] Task breakdown
- [x] Gap analysis
- [x] Existing services verification
- [x] Implementation priority guide

### In Progress
- [ ] Week 1: Brand awareness
- [ ] Week 2: Identity Bridge & migration
- [ ] Week 3: Testing & documentation

### Not Started
- [ ] Production deployment
- [ ] User acceptance testing
- [ ] Post-launch monitoring

## 🔑 Key Decisions

### Authentication
- Separate auth services for RTH and SkillUp
- JWT tokens with brand claim
- Cross-domain SSO for shared services
- Progressive account lockout (5→15min, 10→1hr, 20→24hr)

### Database
- Separate databases per brand (rth_prod, skillup_prod)
- Shared database for shadow users (people_prod)
- Foreign keys reference shadow users, not brand users

### Business Logic
- Both brands use same batch scheduling infrastructure
- Only difference: Instructor type (AI tutor vs Physical faculty)
- All enquiry, admission, payment, faculty features already exist

## 📞 Support & Resources

### Key Files to Modify (Week 1)
- `apps/api-server/src/modules/email/EmailService.ts`
- `apps/api-server/src/modules/auth/signup.service.ts`
- `apps/api-server/src/modules/auth/password-recovery.service.ts`
- `services/skillhubcore-service/src/middleware/verify-jwt.ts`
- `apps/api-server/src/modules/auth/security.service.ts`

### Key Files to Create (Week 2)
- `packages/identity-bridge/src/bridge.service.ts`
- `scripts/migrate-existing-users.ts`
- `scripts/validate-migration.ts`
- `scripts/rollback-migration.ts`

### Documentation References
- FAANG Compliance: `docs/completeproject/window 2/FAANG-COMPLIANCE-WINDOW2-WINDOW3.md`
- Existing Features: `packages/db-people/src/schema/index.ts`

## ✅ Success Criteria

### Functional
- ✅ RTH users can register/login on user.realtutorialhub.com
- ✅ SkillUp users can register/login on user.skillupitacademy.com
- ✅ Both brands can access shared services
- ✅ Shadow users created for all brand users
- ✅ Cross-brand admin access prevented

### Non-Functional
- ✅ All existing users migrated successfully
- ✅ No data loss during migration
- ✅ Login latency < 500ms (p95)
- ✅ Identity Bridge latency < 100ms (p95)
- ✅ Security tests passed (OWASP Top 10)

## 📈 Next Steps

1. **Review verification findings** with team
2. **Approve revised timeline** (2-3 weeks)
3. **Start Week 1 Day 1** - Email templates
4. **Follow IMPLEMENTATION_PRIORITY.md** for daily tasks

---

**Last Updated**: March 30, 2026  
**Status**: Ready to implement  
**Timeline**: 2-3 weeks  
**Confidence**: High (47% already done)
