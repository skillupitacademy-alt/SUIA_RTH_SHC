# Tutorial System Architecture Migration Guide

## Executive Summary

This document explains the current tutorial content architecture, the legacy system being deprecated, and the migration path forward.

**Status**: Production system is stable and working correctly.  
**Action Required**: None immediately - this is a documentation and deprecation phase.

---

## Current Production Architecture (✅ ACTIVE)

### System: Modular Tutorial Sections

**Database Table**: `tutorial_sections`  
**API Endpoints**: `/api/tutorial/sections/*`  
**Status**: ✅ Active, Complete, Powers Production

#### Architecture Overview

```
Frontend Page
  ↓
/start-learning/subtopic/[subtopicId]
  ↓
SubtopicNotesPageWrapper (useAPI=true)
  ↓
loadSubtopicNotesDataFromAPI()
  ↓
/api/tutorial/sections/[subtopicId] (BFF)
  ↓
Authentication (requireStudent)
  ↓
API Server: /api/tutorial/sections/[subtopicId]
  ↓
Database Query: tutorial_sections table
  ↓
PostgreSQL (tutorial_prod)
```

#### Key Features

- **Modular Design**: Each section type is stored separately
- **Section Types**: notes, layman, visual, real_life, technical, code, practice, assignment, project, quiz, summary, interview
- **Brand-Aware**: Supports realtutorialhub and skillup brands
- **Difficulty Levels**: simple, intermediate, expert, mixed
- **Status Management**: draft, generating, validating, pending_review, in_review, changes_requested, approved, deploying, deployed, archived
- **Complete Data**: All production subtopics have complete section data

#### Database Schema

```typescript
tutorial_sections {
  id: string (UUID)
  subtopicId: string (FK → tutorial_subtopics)
  sectionType: enum (notes, layman, visual, etc.)
  difficulty: enum (simple, intermediate, expert, mixed)
  content: jsonb (structured content)
  status: enum (approved, deployed, etc.)
  version: string
  language: string
  createdAt: timestamp
  updatedAt: timestamp
  publishedAt: timestamp
  deletedAt: timestamp
}
```

#### Production URLs Using This System

- `https://user.realtutorialhub.com/start-learning/subtopic/component-architecture`
- `https://user.realtutorialhub.com/start-learning/subtopic/whatisjavascript`
- `https://user.realtutorialhub.com/start-learning/subtopic/variable`

#### Verified Data Coverage

| Subtopic | Sections Count | Status |
|----------|---------------|--------|
| component-architecture | 10 | ✅ Complete |
| whatisjavascript | 3 | ✅ Complete |
| variable | 10 | ✅ Complete |

---

## Legacy System (⚠️ DEPRECATED)

### System: Monolithic Tutorial Content

**Database Table**: `tutorial_content`  
**API Endpoints**: `/api/tutorial/content/*`  
**Status**: ⚠️ Deprecated, Incomplete, Empty

#### Why It's Deprecated

1. **Empty Database**: `tutorial_content` table has 0 records for most subtopics
2. **Not Used in Production**: Production pages use `tutorial_sections` system
3. **Monolithic Design**: Less flexible than modular sections approach
4. **Incomplete Implementation**: Never fully populated with content

#### Architecture Overview

```
Legacy Flow (NOT USED IN PRODUCTION):
  ↓
/api/tutorial/content/[subtopicId] (BFF)
  ↓
Authentication
  ↓
API Server: /api/tutorial/content/[subtopicId]
  ↓
TutorialService.getContent()
  ↓
Database Query: tutorial_content table
  ↓
Returns 404 (table is empty)
  ↓
BFF preserves 404 status
```

#### Database Schema

```typescript
tutorial_content {
  id: string (UUID)
  subtopicId: string (FK → tutorial_subtopics)
  difficulty: enum
  content: jsonb (monolithic content)
  status: enum
  // ... other fields
}
```

#### Known Issues

1. **Empty Table**: 0 records for component-architecture, whatisjavascript, variable
2. **404 Errors**: Returns 404 for all queries (no data)
3. **Misleading Errors**: Previously masked 404 as 403 (now fixed)
4. **No Production Usage**: Not used by any production pages

---

## Migration Status

### Phase 1: Stabilize Production System ✅ COMPLETE

**Completed Actions**:
- ✅ Enhanced BFF error handling with proper status code preservation
- ✅ Added structured logging for observability
- ✅ Added deprecation warnings to legacy endpoints
- ✅ Added HTTP headers: `X-Deprecated: true`, `X-Deprecation-Message`
- ✅ Added `_deprecation` field to JSON responses

**Files Modified**:
- `apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts`
- `apps/skillup-web/src/app/api/tutorial/content/[subtopicId]/route.ts`
- `apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts`

### Phase 2: Soft Deprecation ✅ COMPLETE

**Completed Actions**:
- ✅ Added `@deprecated` JSDoc comments to all legacy routes
- ✅ Added console warnings when legacy endpoints are called
- ✅ Added migration path documentation in code comments
- ✅ Added deprecation headers to HTTP responses

### Phase 3: Documentation 🔄 IN PROGRESS

**Current Action**:
- 🔄 Creating this architecture migration guide

### Phase 4: Dependency Audit ⏳ PENDING

**Required Actions**:
- ⏳ Audit all systems for hidden dependencies on `/api/tutorial/content/*`
- ⏳ Check admin CMS tools
- ⏳ Check AI generation jobs
- ⏳ Check internal scripts
- ⏳ Check analytics pipelines
- ⏳ Check SEO systems

**Audit Checklist**:
```bash
# Search for legacy endpoint usage
grep -r "/api/tutorial/content" apps/
grep -r "tutorial/content" scripts/
grep -r "tutorial_content" packages/

# Check database queries
grep -r "tutorialContent" apps/
grep -r "tutorial-content" apps/
```

### Phase 5: Final Removal ⏳ FUTURE

**Future Actions** (Only after Phase 4 audit confirms no dependencies):
- ⏳ Remove `/api/tutorial/content/*` endpoints
- ⏳ Remove `TutorialService.getContent()` method
- ⏳ Remove `tutorial_content` table (or mark as archived)
- ⏳ Remove related repositories/services
- ⏳ Update all documentation

---

## Developer Guidelines

### ✅ DO: Use Modular System

```typescript
// Correct: Use tutorial sections API
const response = await fetch(`/api/tutorial/sections/${subtopicId}`, {
  credentials: 'include',
  cache: 'no-store'
});

const data = await response.json();
// Returns: { sections: { notes: {...}, layman: {...}, ... } }
```

### ❌ DON'T: Use Legacy System

```typescript
// Deprecated: Do not use tutorial content API
const response = await fetch(`/api/tutorial/content/${subtopicId}`);
// Returns: 404 (table is empty)
```

### Frontend Integration

```typescript
// Correct approach
import { loadSubtopicNotesDataFromAPI } from '@/share-branding/subtopicNotesDataAPI';

const data = await loadSubtopicNotesDataFromAPI(brand, subtopicId);
// This internally calls /api/tutorial/sections/*
```

### Adding New Content

When adding new tutorial content, use the modular sections system:

1. Insert into `tutorial_sections` table
2. Set `sectionType` to appropriate type (notes, layman, etc.)
3. Set `status` to 'approved' or 'deployed'
4. Set `difficulty` to 'simple', 'intermediate', or 'expert'
5. Content will automatically appear in production

---

## API Comparison

### Modular System (✅ Use This)

**Endpoint**: `GET /api/tutorial/sections/:subtopicId`

**Query Parameters**:
- `sectionType` (optional): Filter by specific section type
- `difficulty` (optional): Filter by difficulty level (default: 'simple')

**Response Format**:
```json
{
  "subtopicId": "component-architecture",
  "subtopicName": "Component Architecture",
  "difficulty": "simple",
  "sections": {
    "notes": { /* structured content */ },
    "layman": { /* structured content */ },
    "visual": { /* structured content */ },
    "real_life": { /* structured content */ },
    "technical": { /* structured content */ },
    "code": { /* structured content */ },
    "practice": { /* structured content */ },
    "assignment": { /* structured content */ },
    "project": { /* structured content */ },
    "quiz": { /* structured content */ }
  },
  "totalSections": 10
}
```

**Status Codes**:
- `200`: Success
- `404`: Subtopic not found
- `401`: Authentication required
- `500`: Server error

### Legacy System (⚠️ Deprecated)

**Endpoint**: `GET /api/tutorial/content/:subtopicId`

**Response Format**:
```json
{
  "error": "Tutorial content not found",
  "_deprecation": "This endpoint is deprecated. Use /api/tutorial/sections/* instead.",
  "_recommendation": "The tutorial_content table is incomplete. Use tutorial_sections system."
}
```

**Status Codes**:
- `404`: Content not found (table is empty)
- `401`: Authentication required
- `500`: Server error

**Deprecation Headers**:
- `X-Deprecated: true`
- `X-Deprecation-Message: Use /api/tutorial/sections/* instead`

---

## Rollback Strategy

If issues arise with the modular system:

1. **Immediate Rollback**: Not needed - legacy system is already non-functional
2. **Data Recovery**: All data is in `tutorial_sections` table (no data loss risk)
3. **Endpoint Restoration**: Legacy endpoints remain available (just deprecated)
4. **Zero Production Impact**: Production pages never used legacy system

---

## Monitoring & Observability

### Logs to Monitor

**Modular System (Production)**:
```
[RTH Tutorial Sections] Request received for: component-architecture
[RTH Tutorial Sections] User authenticated: user-123
[RTH Tutorial Sections] Calling API server: https://...
[RTH Tutorial Sections] API response status: 200
[RTH Tutorial Sections] Success, returning data
```

**Legacy System (Deprecated)**:
```
[RTH Tutorial Content - DEPRECATED] Request for: component-architecture
[RTH Tutorial Content] ⚠️  DEPRECATION WARNING: Use /api/tutorial/sections/* instead
[RTH Tutorial Content] API response status: 404
[RTH Tutorial Content] This likely means tutorial_content table is empty
```

### Metrics to Track

- **Modular System Success Rate**: Should be ~100%
- **Legacy System Usage**: Should trend toward 0
- **404 Errors on Legacy**: Expected (table is empty)
- **Production Page Load Times**: Should remain stable

---

## FAQ

### Q: Why maintain the legacy system if it's empty?

**A**: Safe deprecation strategy. We keep it available but warn developers, allowing time to audit for hidden dependencies before final removal.

### Q: Will removing legacy endpoints break anything?

**A**: Unknown until Phase 4 audit is complete. That's why we're doing soft deprecation first.

### Q: Can we populate the tutorial_content table instead?

**A**: Not recommended. The modular `tutorial_sections` system is superior:
- More flexible (separate sections)
- Already complete (all data exists)
- Powers production (proven stable)
- Better for CMS (granular editing)

### Q: What if a page still uses the legacy endpoint?

**A**: It will receive a 404 with deprecation warnings. The response includes guidance to migrate to `/api/tutorial/sections/*`.

### Q: How do I know which system a page uses?

**A**: Check the frontend code:
- Uses `loadSubtopicNotesDataFromAPI()` → Modular system ✅
- Uses `loadTutorialData()` → Static files (not DB)
- Calls `/api/tutorial/content/*` → Legacy system ⚠️

---

## Contact & Support

For questions about this migration:
- Review this document
- Check code comments in deprecated files
- Look for `@deprecated` tags in JSDoc
- Monitor console warnings in development

---

## Appendix: Database Verification Scripts

### Check Tutorial Sections Data

```bash
# Run database verification
$env:DATABASE_URL_TUTORIAL = 'postgresql://...'
npx tsx scripts/check-tutorial-content-db.ts
```

### Check Multiple Subtopics

```bash
# Compare sections vs content systems
npx tsx scripts/check-multiple-subtopics-db.ts
```

### Forensic Audit

```bash
# Deep audit of both systems
node scripts/tutorial-content-deep-audit.mjs
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-09  
**Status**: Phase 3 (Documentation) Complete
