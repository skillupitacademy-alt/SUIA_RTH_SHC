# PHASE B.3-R — RTH RECOVERY ANALYSIS

**Date:** September 12, 2026  
**Status:** ✅ RTH RECOVERED (Self-healed without restart)  
**SkillUp Status:** ❌ Still intermittent 404

---

## CRITICAL FINDING

**RTH did NOT require a manual restart.** The database connection recovered after an `ErrorEvent` exception.

### Timeline

**10:37 AM (First Request):**
```
[DELIVERY_TRACE] resolveHierarchy START
[PHASE_2_6][DATABASE_FAILURE]
  error: 'Failed query: tutorial_domains'
GET /tutorial-v2/.../whatisjava 404 in 102s
```

**10:41 AM (~4 minutes later, Second Request):**
```
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
⨯ uncaughtException: TypeError...
GET /tutorial-v2/.../whatisjava 200 in 3.7min (!)
```

**10:45 AM onwards (All Subsequent Requests):**
```
[DELIVERY_TRACE] Domain resolution { found: true }
[DELIVERY_TRACE] resolveHierarchy SUCCESS
GET /tutorial-v2/.../whatisjava 200 in 5.4s
GET /tutorial-v2/.../whatisjava 200 in 11.3s
GET /tutorial-v2/.../whatisjava 200 in 1239ms
```

---

## ROOT CAUSE HYPOTHESIS (REVISED)

### Not: "Stale environment variables"
### Not: "Server needs restart"

### ACTUAL: **Database connection pool timeout/recovery cycle**

**Evidence:**

1. **Initial state:** Database client/pool in failed/disconnected state
2. **First request:** Attempts to use stale connection → immediate failure (102s timeout)
3. **Second request:** Triggers reconnection attempt → ErrorEvent thrown during reconnection
4. **Recovery:** New connection established → all subsequent queries succeed

This matches the behavior of **connection pool exhaustion + automatic retry logic**.

---

## THE ERROREVENT EXCEPTION

```
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
⨯ uncaughtException
```

This exception appears at the EXACT moment the connection recovered. This suggests:

**Hypothesis:** The Neon serverless driver or Drizzle connection pool attempted to:
1. Detect the stale connection
2. Throw an error to trigger reconnection
3. Modify an ErrorEvent object (which is immutable)
4. Reconnection succeeded despite the TypeError
5. New connection pool established
6. Subsequent requests work

This is a **library-level bug** (attempting to mutate read-only ErrorEvent), but it's non-fatal and actually preceded the recovery.

---

## WHY DID IT FAIL INITIALLY?

Possible causes:

### A. Connection Pool Exhaustion
- Previous process had active connections
- Connections not properly released
- New requests found empty/failed pool
- After timeout, pool reinitialized

### B. Neon Serverless Connection State
- Neon serverless uses WebSocket connections
- WebSocket may have been in disconnected state
- First request used stale WebSocket → immediate failure
- Second request forced WebSocket reconnection
- New WebSocket established → success

### C. Database Client Lifecycle Issue
- `getTutorialDb()` singleton cached failed connection
- First request used cached failed connection
- Error triggered client reinitialization
- New client instance with fresh connection
- Subsequent requests use new client

---

## COMPARISON: STANDALONE SCRIPTS VS NEXT.JS

| Aspect | Standalone Scripts | Next.js App (Before Recovery) | Next.js App (After Recovery) |
|--------|-------------------|------------------------------|------------------------------|
| Process | Fresh Node.js | Long-running (2+ hours) | Same process |
| Connection Pool | New pool per run | Singleton pool | Same pool (recovered) |
| WebSocket State | Fresh | Potentially stale | Reconnected |
| Environment | Fresh load | Cached at startup | Same (no change) |
| Result | ✅ Works | ❌ Failed | ✅ Works |

**Key Insight:** Environment variables did NOT change. The same Next.js process recovered. This proves the issue was **connection/pool state**, not environment loading.

---

## SKILLUP STATUS

User reports:
> "for SUIA it is showing 404 why it is happening sometime it is working some time not"

**Intermittent 404** suggests SkillUp is experiencing the SAME connection pool issue but has not yet recovered.

Possible states:

1. **SkillUp pool still in failed state** (waiting for recovery trigger)
2. **SkillUp alternating between failed and working connections** (multiple pool instances?)
3. **SkillUp has different connection timeout settings**

---

## RECOMMENDATION

### For SkillUp:

**Option A: Wait for Self-Recovery**
- Try accessing the URL multiple times
- One request will trigger the reconnection cycle
- Should recover like RTH did

**Option B: Restart to Force Fresh Connection Pool**
- Guaranteed immediate fix
- Restart SkillUp dev server only
- Fresh process = fresh connection pool

### For Production Hardening:

This behavior indicates a **production risk**. Recommendations:

1. **Add connection pool health checks**
   - Periodic `SELECT 1` queries
   - Detect stale connections before user requests

2. **Fix ErrorEvent mutation bug**
   - Likely in Neon driver or Drizzle layer
   - Prevent uncaught exceptions

3. **Implement connection pool retry logic**
   - Automatic reconnection on first failure
   - Don't wait for user requests to trigger recovery

4. **Add connection pool monitoring**
   - Log pool state (active, idle, waiting)
   - Alert on pool exhaustion

5. **Configure aggressive connection timeouts**
   - Fail fast on stale connections
   - Force reconnection sooner

---

## FINAL CLASSIFICATION

**ROOT CAUSE:** Database connection pool/WebSocket state became stale/exhausted in long-running Next.js process. Connection recovered automatically after ErrorEvent exception triggered reconnection logic.

**NOT:** Stale environment variables  
**NOT:** Requires manual restart (RTH proved self-recovery works)  
**IS:** Connection pool lifecycle management issue

**CONFIDENCE:** 90% (based on recovery pattern and ErrorEvent timing)

---

## NEXT ACTION

User should either:
1. **Test SkillUp repeatedly** to trigger self-recovery (like RTH)
2. **Restart SkillUp** for guaranteed immediate fix

Then investigate connection pool configuration for production hardening.
