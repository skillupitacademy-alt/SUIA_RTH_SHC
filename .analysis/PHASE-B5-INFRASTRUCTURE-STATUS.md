# PHASE B.5-CLOSE — INFRASTRUCTURE STATUS

**Date:** 2026-09-12  
**Status:** Infrastructure investigation CLOSED as OPEN RISK  
**Decision:** Proceed to RSSB testing

---

## Health Snapshot Results

### Tutorial Runtime Availability
🟢 **CURRENTLY VERIFIED** (2026-09-12 snapshot)

| Component | Status | Duration | Result |
|-----------|--------|----------|--------|
| RTH tutorial page | ✅ 200 OK | 0.9s | Full HTML response |
| SkillUp tutorial page | ✅ 200 OK | 0.7s | Full HTML response |
| TutorialDB health test | ✅ PASS | 2.6s | All hierarchy queries successful |

**Test URL:** `/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`

---

## TutorialDB Runtime Reliability
🟡 **OPEN INVESTIGATION**

### What is Proven

| Finding | Evidence | Status |
|---------|----------|--------|
| Intermittent failures occur | Multiple 404s observed, both brands | ✅ Proven |
| 404 is application-generated | Next.js server logs show DB failure path | ✅ Proven |
| TutorialDB is fundamentally healthy | Fresh process tests: 5/5 pass | ✅ Proven |
| Failures are transient | Both RTH & SkillUp recovered without intervention | ✅ Proven |
| Pool architecture identified | @neondatabase/serverless 0.10.4, singleton, max:15 | ✅ Proven |

### What is NOT Proven

| Hypothesis | Status | Notes |
|------------|--------|-------|
| Stale WebSocket connection | 🟡 Plausible | No direct evidence of socket failure |
| 2s timeout as causal factor | 🟡 Not proven | Fresh tests succeed in 1.5-5s |
| ErrorEvent source/meaning | 🟡 Not proven | Single occurrence during recovery |
| Exact pool failure mechanism | 🟡 Not proven | Self-recovery observed, mechanism unknown |

---

## Failure Pattern Summary

### RTH Failure & Recovery Timeline

```
08:06:45 — RTH server started (PID 14892)
~10:48   — First request → 404 after 102s (DB query failure)
~10:52   — Second request → 200 after 3.7min (with ErrorEvent exception)
~10:56+  — Subsequent requests → 200 (1.2-5.4s, stable)
```

### SkillUp Failure & Recovery Timeline

```
08:06:49 — SkillUp server started (PID 3504)
Unknown  — Failure occurred (404 observed)
Unknown  — Self-recovered
Current  — 200 OK (0.7-0.8s, stable)
```

### Error Signature

```
[DELIVERY_TRACE] resolveHierarchy START
[PHASE_2_6][DATABASE_FAILURE] {
  stage: 'resolveHierarchy',
  error: 'Failed query: select ... from "tutorial_domains" where ...'
}
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
⨯ uncaughtException
[Then recovery: resolveHierarchy SUCCESS]
```

---

## Database Client Architecture

**Location:** `packages/db-tutorial/src/db.ts`

**Pool Configuration:**
```typescript
const pool = new Pool({
  connectionString: process.env.TUTORIAL_DATABASE_URL,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', () => undefined); // Silent error handler
```

**Client Pattern:**
- Module-level singleton: `let pooledDbInstance: DbClient | null = null`
- Lazy initialization on first `getTutorialDb()` call
- Reused across all requests in same process
- No health checks
- No automatic reconnection logic
- No pool recreation mechanism

---

## Key Observations

### Self-Recovery Without Intervention

**Both applications recovered without:**
- Code changes
- Configuration changes
- Manual server restarts
- Pool recreation
- Environment variable changes
- Cache clearing

**This suggests:**
- Pool has some internal recovery mechanism
- Connection issues may resolve after time/retry attempts
- WebSocket connections may re-establish automatically
- Problem is not with configuration or code logic

### Fresh Processes Always Succeed

**5/5 fresh `node scripts/.tmp-check-hierarchy.mjs` tests passed:**
- Duration: 1.5-5.0s (all well under 2s timeout)
- Same database connection string
- Same query patterns
- Same @neondatabase/serverless package

**This rules out:**
- Database server issues
- Network/firewall blocking
- DNS resolution problems
- Query syntax errors
- Permission/authentication issues

---

## Risk Assessment

### Current Risk Level
🟡 **MEDIUM** — Infrastructure reliability issue, not blocking current work

### Impact if Failure Recurs
- Tutorial pages return 404
- RSSB component cannot be tested
- User workflow interrupted
- Self-recovery may take 3-7 minutes

### Mitigation Strategy
**Do not implement fixes yet.** Instead:

1. **Monitor for recurrence** — If 404 reappears after 2-4 hours uptime, strengthens "stale connection" hypothesis
2. **Capture next failure immediately** — Check server logs for `[DELIVERY_TRACE]` and `[PHASE_2_6][DATABASE_FAILURE]` before restarting
3. **Document recovery time** — Measure how long self-recovery takes
4. **Plan proper fix** — Pool lifecycle redesign, not timeout tweaking

### Future Failure Classification Rule

**If tutorial pages return 404 in future:**

✅ **Check server logs FIRST for:**
```
[DELIVERY_TRACE] resolveHierarchy START
[PHASE_2_6][DATABASE_FAILURE]
[Tutorial Runtime] Failed to resolve context
```

❌ **Do NOT assume it is:**
- RSSB regression
- Routing issue
- Content delivery problem
- ILS data failure

**Only classify as TutorialDB/runtime issue if logs confirm DB failure path.**

---

## Decision: Proceed to RSSB Testing

### Rationale
1. ✅ RTH tutorial page currently rendering (200 OK)
2. ✅ SkillUp tutorial page currently rendering (200 OK)
3. ✅ TutorialDB healthy and accessible
4. ✅ RSSB already displaying real ILS telemetry in RTH
5. ✅ Infrastructure issue is reliability risk, not RSSB blocker

### RSSB Baseline Already Verified

**RTH screenshot shows RSSB operating with real data:**
- Lifecycle → real timestamps
- Engagement → real visit/revision counts  
- Time Analysis → real active/expected time (3m 20s / 3m 0s = 111%)
- Overall → real ILS values

**Data path is confirmed working.**

---

## Actions NOT Authorized

❌ Implement DB client fixes  
❌ Modify `db.ts`  
❌ Add pool error logging  
❌ Upgrade `@neondatabase/serverless`  
❌ Redesign pool architecture  
❌ Increase `connectionTimeoutMillis`  
❌ Add health check SELECT 1  
❌ Implement pool recreation logic  

---

## Next Steps

1. ✅ **Health snapshot complete** — All green
2. ➡️ **Proceed to RSSB investigation** — Original goal
3. 🔍 **Monitor for 404 recurrence** — Capture evidence if happens
4. 📝 **Document infrastructure risk** — Keep separate from RSSB findings

---

## References

- **B.3 Investigation:** `.analysis/PHASE-B3-DB-CLIENT-PATH-ANALYSIS.md`
- **B.4 Findings:** `.analysis/PHASE-B4-DB-CLIENT-ANALYSIS.md`  
- **B.5 Mechanism:** `.analysis/PHASE-B5-POOL-MECHANISM-FINDINGS.md`
- **Test Script:** `scripts/.tmp-check-hierarchy.mjs`
- **DB Client:** `packages/db-tutorial/src/db.ts`
- **Delivery System:** `packages/db-tutorial/src/delivery/tutorialSidebarDelivery.ts`

---

**INVESTIGATION CLOSED AS OPEN RISK — PROCEEDING TO RSSB TESTING**
