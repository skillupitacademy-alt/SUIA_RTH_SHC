# SKILLUP INTERMITTENT 404 DIAGNOSTIC

**Status:** ❌ Intermittent failure  
**Pattern:** "Sometime working, sometime not"  
**RTH Status:** ✅ Self-recovered (no restart needed)

---

## HYPOTHESIS

SkillUp is experiencing the **same connection pool state issue** as RTH, but has not yet self-recovered.

---

## DIAGNOSTIC QUESTIONS

### 1. What exactly is "intermittent"?

**Pattern A: Request-level intermittency**
- Request 1: 404
- Request 2: 200
- Request 3: 404
- Request 4: 200

→ Suggests: **Multiple connection pool instances**, alternating between healthy and failed

**Pattern B: Time-based intermittency**
- Period 1 (5 min): All 404
- Period 2 (2 min): All 200
- Period 3 (10 min): All 404

→ Suggests: **Connection pool cycling**, recovering temporarily then failing again

**Pattern C: Random intermittency**
- Mostly 404 with occasional 200
- No clear pattern

→ Suggests: **Race condition** in connection pool initialization

### 2. Are you seeing the same ErrorEvent exception?

Check SkillUp server logs for:
```
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
⨯ uncaughtException
```

If YES: Recovery attempt in progress (like RTH)  
If NO: Different failure mode

### 3. Is SkillUp showing [DATABASE_FAILURE] in logs?

For 404 requests, check if logs show:
```
[PHASE_2_6][DATABASE_FAILURE] {
  stage: 'resolveHierarchy',
  error: 'Failed query: tutorial_domains'
}
```

If YES: Same database connection failure as RTH had  
If NO: Different issue (routing, auth, etc.)

---

## COMPARISON TABLE

| App | Initial State | After ~4 min | Current State |
|-----|--------------|-------------|---------------|
| **RTH** | ❌ 404 (DATABASE_FAILURE) | ✅ 200 (self-recovered) | ✅ Stable 200 |
| **SkillUp** | ❌ 404 (intermittent) | ? | ❌ Still failing |

---

## RECOMMENDED ACTIONS (IN ORDER)

### Action 1: Try SkillUp URL Multiple Times

Access the SkillUp tutorial URL 5-10 times rapidly:
```
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**Expected:** One of these requests will trigger the ErrorEvent exception and force reconnection (like RTH did).

**Watch for:** 
- Initial 404s
- Sudden long response time (3-4 minutes)
- ErrorEvent exception in logs
- Then stable 200s

### Action 2: Check SkillUp Server Logs

While attempting Action 1, monitor SkillUp terminal for:

**Signs of recovery:**
```
TypeError: Cannot set property message of #<ErrorEvent>
⨯ uncaughtException
[DELIVERY_TRACE] Domain resolution { found: true }
GET /tutorial-v2/.../whatisjava 200
```

**Signs of persistent failure:**
```
[PHASE_2_6][DATABASE_FAILURE]
GET /tutorial-v2/.../whatisjava 404
```

### Action 3: If Self-Recovery Fails After 10 Attempts

**Then restart SkillUp:**
```powershell
# Stop SkillUp (Ctrl+C in SkillUp terminal)
pnpm --filter @quiz/skillup-web dev
```

This will force fresh connection pool initialization.

---

## WHY RTH RECOVERED BUT SKILLUP HASN'T

Possible explanations:

### Theory A: Request Timing
- RTH received requests that triggered recovery
- SkillUp hasn't received the "right" request pattern yet
- Solution: Send more requests (Action 1)

### Theory B: Different Connection Pool Config
- SkillUp may have different timeout settings
- Recovery cycle takes longer
- Solution: Wait or restart

### Theory C: Port/Process Specific Issue
- SkillUp's port 3009 process has deeper issue
- Connection pool in corrupted state
- Solution: Restart required

---

## TEST PLAN

**Step 1:** Access SkillUp URL 10 times (with page refresh between each)

**Step 2:** Document the pattern:
- How many 404s?
- How many 200s?
- Any ErrorEvent exceptions?
- Any DATABASE_FAILURE logs?

**Step 3:** Based on pattern:

**If ANY 200s appear:** Connection pool is recovering → keep trying  
**If ALL 404s with DATABASE_FAILURE:** Same as RTH initially → keep trying to trigger recovery  
**If ALL 404s WITHOUT DATABASE_FAILURE:** Different issue → need deeper investigation

---

## EXPECTED OUTCOME

**Most Likely:** SkillUp will self-recover like RTH did after enough request attempts.

**If Not:** Restart SkillUp for guaranteed fix, then investigate why self-recovery didn't work.

---

## PRODUCTION IMPLICATIONS

This intermittent behavior is **NOT acceptable for production**. Root cause must be fixed:

1. Connection pool health checks
2. Automatic reconnection logic
3. Fix ErrorEvent mutation bug
4. Connection pool monitoring/alerts
5. Aggressive connection timeouts

See: `.analysis/PHASE-B3-R-RTH-RECOVERY-ANALYSIS.md` for detailed recommendations.
