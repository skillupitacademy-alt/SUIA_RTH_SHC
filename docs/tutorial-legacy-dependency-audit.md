# Tutorial Legacy System Dependency Audit

## Purpose

Audit all systems for dependencies on the deprecated `/api/tutorial/content/*` endpoints and `tutorial_content` table before final removal.

**Status**: ⏳ Pending Execution  
**Priority**: Medium (no immediate production impact)

---

## Audit Checklist

### 1. Frontend Code Audit

#### Search for Direct API Calls

```bash
# Search for legacy endpoint usage in frontend
grep -r "/api/tutorial/content" apps/realtutorialhub-web/src/
grep -r "/api/tutorial/content" apps/skillup-web/src/
grep -r "/api/tutorial/content" apps/faculty-app/src/
grep -r "tutorial/content" src/share-branding/
```

**Expected Result**: Only deprecated BFF routes should reference this endpoint.

**Action Items**:
- [ ] Verify no frontend components call `/api/tutorial/content/*` directly
- [ ] Check for any fetch/axios calls to legacy endpoint
- [ ] Review shared components in `src/share-branding/`

---

### 2. Backend Services Audit

#### Search for Service Layer Usage

```bash
# Search for TutorialService.getContent usage
grep -r "TutorialService" apps/api-server/src/
grep -r "getContent" apps/api-server/src/modules/tutorial-engine/
grep -r "tutorial_content" apps/api-server/src/
```

**Expected Result**: Only the deprecated route handler should use `TutorialService.getContent()`.

**Action Items**:
- [ ] Verify no other services call `TutorialService.getContent()`
- [ ] Check for any background jobs using legacy system
- [ ] Review cron jobs and scheduled tasks

---

### 3. Database Query Audit

#### Search for Direct Database Queries

```bash
# Search for tutorial_content table queries
grep -r "tutorialContent" packages/db-tutorial/
grep -r "tutorial_content" packages/db-tutorial/
grep -r "from(tutorialContent)" apps/
grep -r "select.*tutorial_content" apps/
```

**Expected Result**: Only schema definition and deprecated service should reference this table.

**Action Items**:
- [ ] Verify no repositories query `tutorial_content` table
- [ ] Check for any raw SQL queries
- [ ] Review Drizzle ORM queries

---

### 4. Admin Tools & CMS Audit

#### Search for Content Management Tools

```bash
# Search for admin/CMS tools
grep -r "content-manager" apps/
grep -r "tutorial.*admin" apps/
grep -r "cms" apps/
find apps/ -name "*admin*" -o -name "*cms*"
```

**Files to Review**:
- `apps/realtutorialhub-web/src/app/tools/content-manager/page.tsx`
- `apps/skillup-web/src/app/tools/content-manager/page.tsx`
- Any admin panels or content creation tools

**Action Items**:
- [ ] Check if content-manager uses legacy system
- [ ] Verify admin tools use `tutorial_sections` system
- [ ] Review content creation workflows

---

### 5. Scripts & Automation Audit

#### Search for Maintenance Scripts

```bash
# Search for scripts using legacy system
grep -r "tutorial/content" scripts/
grep -r "tutorial_content" scripts/
grep -r "tutorialContent" scripts/
ls scripts/*tutorial*.{js,ts,mjs}
```

**Scripts to Review**:
- `scripts/add-subtopic-content.js`
- `scripts/final-verification.ts`
- `scripts/verify-api-route-code.ts`
- Any migration or seeding scripts

**Action Items**:
- [ ] Verify scripts use `tutorial_sections` system
- [ ] Check for any data migration scripts
- [ ] Review seeding/fixture scripts

---

### 6. AI Generation Pipeline Audit

#### Search for AI Content Generation

```bash
# Search for AI generation code
grep -r "generate.*tutorial" apps/
grep -r "ai.*content" apps/
grep -r "openai" apps/ | grep -i tutorial
grep -r "anthropic" apps/ | grep -i tutorial
```

**Action Items**:
- [ ] Check if AI generation targets legacy system
- [ ] Verify AI pipeline uses `tutorial_sections` table
- [ ] Review content generation workflows

---

### 7. Analytics & Tracking Audit

#### Search for Analytics Code

```bash
# Search for analytics tracking
grep -r "analytics.*tutorial" apps/
grep -r "track.*tutorial" apps/
grep -r "event.*tutorial" apps/
```

**Action Items**:
- [ ] Verify analytics track correct endpoints
- [ ] Check for any legacy endpoint tracking
- [ ] Review event logging systems

---

### 8. SEO & Metadata Audit

#### Search for SEO Systems

```bash
# Search for SEO/metadata generation
grep -r "metadata.*tutorial" apps/
grep -r "seo.*tutorial" apps/
grep -r "sitemap" apps/ | grep -i tutorial
```

**Action Items**:
- [ ] Check if SEO systems use legacy endpoints
- [ ] Verify sitemap generation uses correct data
- [ ] Review metadata generation

---

### 9. Testing Code Audit

#### Search for Test Files

```bash
# Search for tests using legacy system
grep -r "tutorial/content" apps/**/__tests__/
grep -r "tutorial/content" apps/**/*.test.ts
grep -r "tutorial/content" apps/**/*.spec.ts
```

**Action Items**:
- [ ] Update tests to use `tutorial_sections` system
- [ ] Remove tests for deprecated endpoints (or mark as deprecated)
- [ ] Verify integration tests use correct endpoints

---

### 10. Documentation Audit

#### Search for Documentation References

```bash
# Search for documentation
grep -r "tutorial/content" docs/
grep -r "tutorial/content" README*.md
grep -r "tutorial_content" docs/
```

**Action Items**:
- [ ] Update API documentation
- [ ] Update developer guides
- [ ] Update README files

---

## Audit Execution Plan

### Step 1: Automated Search

Run all grep commands above and document findings:

```bash
# Create audit report
mkdir -p audit-reports
date > audit-reports/tutorial-legacy-audit-$(date +%Y%m%d).txt

# Run all searches
echo "=== Frontend Audit ===" >> audit-reports/tutorial-legacy-audit-$(date +%Y%m%d).txt
grep -r "/api/tutorial/content" apps/*/src/ >> audit-reports/tutorial-legacy-audit-$(date +%Y%m%d).txt

echo "=== Backend Audit ===" >> audit-reports/tutorial-legacy-audit-$(date +%Y%m%d).txt
grep -r "TutorialService" apps/api-server/src/ >> audit-reports/tutorial-legacy-audit-$(date +%Y%m%d).txt

# ... continue for all searches
```

### Step 2: Manual Review

For each finding:
1. Open the file
2. Understand the context
3. Determine if it's:
   - ✅ Already using modular system
   - ⚠️ Using legacy system (needs migration)
   - 📝 Documentation only (needs update)
   - 🗑️ Can be removed

### Step 3: Create Migration Tasks

For each legacy dependency found:
1. Create a task to migrate it
2. Estimate effort
3. Prioritize based on impact
4. Assign owner

### Step 4: Execute Migrations

Migrate dependencies in order:
1. High-impact, low-effort (quick wins)
2. High-impact, high-effort (critical)
3. Low-impact, low-effort (cleanup)
4. Low-impact, high-effort (defer or remove)

---

## Risk Assessment

### Low Risk (Safe to Remove)

- Deprecated BFF routes (already marked)
- Deprecated API routes (already marked)
- Test files for legacy system
- Documentation references

### Medium Risk (Audit Required)

- Admin/CMS tools
- Content generation scripts
- Analytics tracking
- SEO systems

### High Risk (Careful Review)

- Any production code paths
- User-facing features
- Payment/billing integrations
- Third-party integrations

---

## Success Criteria

Audit is complete when:

- [ ] All grep searches executed and documented
- [ ] All findings reviewed and categorized
- [ ] Migration tasks created for dependencies
- [ ] Risk assessment completed
- [ ] Stakeholders informed of findings
- [ ] Migration timeline established

---

## Post-Audit Actions

After audit completion:

1. **If No Dependencies Found**:
   - Proceed to Phase 5 (Final Removal)
   - Schedule endpoint deprecation
   - Plan database table archival

2. **If Dependencies Found**:
   - Create migration plan
   - Estimate migration effort
   - Schedule migration sprints
   - Defer Phase 5 until migrations complete

---

## Audit Report Template

```markdown
# Tutorial Legacy System Audit Report

**Date**: YYYY-MM-DD
**Auditor**: [Name]
**Status**: [In Progress / Complete]

## Summary

- Total files searched: X
- Dependencies found: Y
- High-risk dependencies: Z

## Findings

### Frontend Dependencies
- [ ] Finding 1: [Description]
- [ ] Finding 2: [Description]

### Backend Dependencies
- [ ] Finding 1: [Description]

### Scripts & Tools
- [ ] Finding 1: [Description]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Next Steps

1. [Action 1]
2. [Action 2]

## Timeline

- Migration start: [Date]
- Migration complete: [Date]
- Final removal: [Date]
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-09  
**Status**: Ready for Execution
