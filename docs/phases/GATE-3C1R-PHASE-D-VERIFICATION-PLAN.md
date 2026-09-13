# Gate 3C.1R Phase D — Verification Plan

**Status:** IN PROGRESS  
**Mode:** Verification-only (no implementation)  
**Date:** September 12, 2026

---

## Repository Baseline

**Working Directory:** `E:\onlinewebsites\quiz-platform`  
**Branch:** `main`  
**Last Commit:** `d4c70869` (RSSB Look and Feel Version 4)  
**Working Tree:** Clean (modified files are documentation and cleanup scripts from B.2-R-6 series)

---

## Phase D Objective

Verify the existing frozen Phase C ILS contract through the real repository and runtime.

**NOT in scope:**
- New implementation
- Refactoring
- UBRC implementation
- R/Y/G threshold implementation  
- Dynamic aggregation
- Composer integration

**IN scope:**
- D1 telemetry lifecycle verification
- C1 telemetry lifecycle verification
- Generic/future block universality
- Session semantics
- Concurrent event handling
- Idempotency and retry behavior
- Zero-second active-time behavior
- Database isolation verification
- API → Service → Repository → Database path
- Database → Read API → DTO → ILSProvider path
- Production-readiness assessment

---

## Verification Matrix

### 1. Write → Read Lifecycle

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| D1 write path | Manual browser test | Event delivered to DB | PENDING |
| D1 read path | API + ILSProvider inspection | State reflected in UI | PENDING |
| C1 write path | Manual browser test | Event delivered to DB | PENDING |
| C1 read path | API + ILSProvider inspection | State reflected in UI | PENDING |
| Generic block write | Test with unknown block type | Universal path works | PENDING |
| Generic block read | Test with unknown block type | Read succeeds | PENDING |

### 2. Session Semantics

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Same session | Multiple events | Visits = 1 | PENDING |
| Different session | New browser session | Visits += 1 | PENDING |
| Session ID null handling | No session provided | Graceful handling | PENDING |
| Session transition | Session A → Session B | Correct increment | PENDING |

### 3. Concurrent Event Handling

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Duplicate event ID | Send same eventId twice | Idempotent (no double count) | PENDING |
| Parallel writes | Concurrent API calls | No lost updates | PENDING |
| Race condition | Simultaneous block events | Atomic operations | PENDING |

### 4. Lifecycle Events

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| First visit | New user, new page | Creates progress record | PENDING |
| Active time accumulation | Send multiple telemetry events | Time accumulates | PENDING |
| Block completion | Complete block | Recorded in completed_blocks | PENDING |
| Revision detection | Return after completion | Revision count increments | PENDING |

### 5. Idempotency and Retry

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Duplicate telemetry event | Retry with same eventId | Accepted, not double-counted | PENDING |
| Duplicate completion | Mark same block completed twice | Idempotent | PENDING |
| Network retry | Simulate failed request retry | Graceful handling | PENDING |

### 6. Zero-Second Active Time

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Zero-second event | Send activeTimeSec = 0 | Accepted, no error | PENDING |
| Visit without time | Visit block, no telemetry | Visit counted, time = 0 | PENDING |

### 7. Database Isolation

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| User isolation | Different users, same page/block | Separate records | PENDING |
| Page isolation | Same user, different pages | Separate navigation progress | PENDING |
| Block isolation | Same page, different blocks | Separate block states | PENDING |
| Version isolation | Same block, different versions | Separate block states | PENDING |

### 8. API Path Verification

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| POST /api/tutorial/ils/block/telemetry | cURL or browser | 200 OK, event recorded | PENDING |
| POST /api/tutorial/ils/block/complete | cURL or browser | 200 OK, completion recorded | PENDING |
| GET /api/tutorial/ils/navigation/:nodeId | cURL or browser | Returns current state | PENDING |

### 9. Read Path Verification

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Database query | Direct SQL | Raw data present | PENDING |
| Service layer | Repository method | Correct DTO | PENDING |
| API response | GET request | JSON matches schema | PENDING |
| ILSProvider parsing | Browser DevTools | Correct React state | PENDING |

### 10. Regression Verification

| Item | Test Method | Expected Result | Status |
|------|-------------|-----------------|--------|
| Existing RTH pages | Browse whatisjava (RTH) | No errors | PENDING |
| Existing SkillUp pages | Browse whatisjava (SkillUp) | No errors | PENDING |
| RSSB visibility | Open sidebar (both brands) | Metrics displayed | PENDING |
| LSNB visibility | Check left sidebar (both brands) | Lifecycle metrics shown | PENDING |

### 11. Production Readiness

| Item | Assessment | Findings | Status |
|------|------------|----------|--------|
| Error handling | Review error cases | Graceful degradation? | PENDING |
| Rate limiting | Check for abuse prevention | Present? | PENDING |
| Monitoring | Check logging/observability | Adequate? | PENDING |
| Performance | Check query efficiency | Optimized? | PENDING |
| Security | Check auth/validation | Secure? | PENDING |

---

## Verification Commands

### Repository Baseline
```bash
pwd
git branch --show-current
git status --short
git log -8 --oneline
```

### Locate Implementation
```bash
rg "ILSProvider|ActiveBlockContext|BlockTelemetryProvider" . \
  --glob '!node_modules' --glob '!dist'
```

### Find Tests
```bash
find . -name "*.test.tsx" -o -name "*.test.ts" | grep -i ils
```

### Run Tests
```bash
pnpm --filter @quiz/ui test ILSProvider
pnpm --filter @quiz/ui test ActiveBlock
```

### Database Verification
```bash
# After manual browser test, query DB:
psql $DATABASE_URL_TUTORIAL \
  -c "SELECT * FROM block_learning_state WHERE navigation_node_id = 'whatisjava' ORDER BY updated_at DESC LIMIT 5;"
  
psql $DATABASE_URL_TUTORIAL \
  -c "SELECT * FROM tutorial_navigation_progress WHERE navigation_node_id = 'whatisjava' ORDER BY updated_at DESC LIMIT 5;"
```

### API Verification
```bash
# GET navigation state
curl -X GET http://localhost:3000/api/tutorial/ils/navigation/whatisjava \
  -H "Cookie: <auth-cookie>"

# POST telemetry event
curl -X POST http://localhost:3000/api/tutorial/ils/block/telemetry \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "eventId": "test-event-001",
    "navigationNodeId": "whatisjava",
    "blockId": "test-block-id",
    "blockVersion": "D1",
    "activeTimeSec": 10
  }'
```

---

## Success Criteria

Phase D can be marked **GREEN** only if:

1. ✅ All write→read paths verified for D1, C1, and generic blocks
2. ✅ Session semantics proven correct
3. ✅ Concurrent handling proven safe
4. ✅ Idempotency verified
5. ✅ Database isolation proven
6. ✅ API paths working
7. ✅ Read path (DB → ILSProvider) proven
8. ✅ No regressions on existing pages
9. ✅ No production-readiness blockers identified
10. ✅ All tests passing

---

## Next Steps After Phase D

**If GREEN:**
- Identify next authorized gate from master plan
- Most likely: UBRC contract definition
- Then: UBRC implementation

**If RED or BLOCKED:**
- Document blockers
- Stop implementation
- Request authorization for fixes
- Re-run Phase D after fixes

---

## Execution Log

### 2026-09-12 16:30 — Session Start
- Repository baseline captured
- Working directory confirmed
- ILS implementation files located
- Verification plan created

### Next: Execute verification tests

---

**End of Plan**
