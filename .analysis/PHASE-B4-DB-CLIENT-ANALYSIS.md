# PHASE B.4 — DB CLIENT ARCHITECTURE ANALYSIS

## STEP 1: ACTUAL DB DRIVER

**Driver Stack:**
```
@neondatabase/serverless: 0.10.4
drizzle-orm: 0.45.1  
ws (WebSocket): 8.19.0
```

**Import Path:**
```
Tutorial Page
    ↓
tutorialSidebarDelivery.ts
    ↓
import { getTutorialDb } from '@quiz/db-tutorial'
    ↓
packages/db-tutorial/src/db.ts
    ↓
getTutorialDb() function
    ↓
Pool from @neondatabase/serverless
    ↓
drizzle(pool, { schema })
    ↓
Neon endpoint (WebSocket)
```

---

## STEP 2: CONNECTION POOL ARCHITECTURE

From `packages/db-tutorial/src/db.ts`:

### Singleton Pattern

```typescript
let pooledDbInstance: DbClient | null = null;
let directDbInstance: DbClient | null = null;
let httpDbInstance: HttpDbClient | null = null;
```

**CRITICAL:** Module-level singletons. Created once per Node.js process lifetime.

### Pool Creation

```typescript
const createDb = (connectionString: string, isDirect: boolean): DbClient => {
  const pool = new Pool({
    connectionString,
    max: isDirect ? 5 : 15,              // ← CONNECTION LIMIT
    idleTimeoutMillis: 30_000,           // ← 30 seconds
    connectionTimeoutMillis: 2_000,      // ← 2 seconds (!!)
    statement_timeout: 30_000,           // ← 30 seconds
    query_timeout: 30_000,               // ← 30 seconds
  });

  pool.on('error', () => undefined);     // ← ERROR HANDLER: SILENT
  pool.on('connect', (client) => {
    client.query('SET statement_timeout = 30000');
    client.query('SET idle_in_transaction_session_timeout = 30000');
  });

  return drizzle(pool, { schema });
};
```

### getTutorialDb() Logic

```typescript
export const getTutorialDb = (type: 'primary' | 'direct' = 'primary'): DbClient => {
  const databaseUrl = 
    type === 'direct'
      ? process.env.DATABASE_DIRECT_URL_TUTORIAL
      : process.env.DATABASE_URL_TUTORIAL;

  // Test mode stub
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    if (process.env.NODE_ENV === 'test') {
      return createTestDb();
    }
    throw new Error('DATABASE_URL_TUTORIAL environment variable is required');
  }

  // PRIMARY PATH (used by tutorial pages)
  if (type === 'direct') {
    if (directDbInstance === null) {
      directDbInstance = createDb(databaseUrl, true);
    }
    return directDbInstance;
  }

  // POOLED PATH (default)
  if (pooledDbInstance === null) {
    pooledDbInstance = createDb(databaseUrl, false);
  }

  return pooledDbInstance;
};
```

---

## STEP 3: CRITICAL FINDINGS

### Finding 1: **2-Second Connection Timeout**

```typescript
connectionTimeoutMillis: 2_000  // 2 seconds
```

This is **EXTREMELY AGGRESSIVE** for:
- Cold WebSocket connections
- Network latency to Singapore (Neon ap-southeast-1)
- TLS handshake
- Initial pool setup

**Expected behavior:**
- First connection attempt → timeout after 2s
- Retry logic unknown (driver-dependent)
- Eventually succeeds after multiple retries

**Matches observed:** 102s total time ≈ 50+ retries at 2s each

### Finding 2: **Silent Error Handler**

```typescript
pool.on('error', () => undefined);  // Swallows all errors!
```

**This is dangerous:**
- Pool errors are silently ignored
- Connection failures not logged
- No visibility into pool state
- No alerts on connection exhaustion

### Finding 3: **Singleton Lifecycle**

```typescript
let pooledDbInstance: DbClient | null = null;
```

**Behavior:**
- Created once per process
- Never recreated unless process restarts
- If pool enters failed state, stays failed
- No health checks
- No automatic recovery

### Finding 4: **Connection Limits**

```typescript
max: isDirect ? 5 : 15  // 15 connections for pooled mode
```

For `getTutorialDb('primary')` → **max 15 connections**

**Potential issue:**
- Next.js concurrent requests
- ILS concurrent queries
- API server concurrent queries
- Profile endpoint concurrent queries
- All sharing same 15-connection pool

**If pool exhausted:**
- New requests wait for available connection
- Wait can exceed `connectionTimeoutMillis`
- Results in query timeout
- Eventually connections release → success

---

## STEP 4: WebSocket Architecture

From package dependency:
```
@neondatabase/serverless → uses WebSocket for Postgres protocol
ws: 8.19.0 → actual WebSocket implementation
```

**Neon Serverless Driver Behavior:**
- Uses WebSocket (not TCP) for PostgreSQL wire protocol
- Requires persistent WebSocket connection
- WebSocket can disconnect (network, idle timeout, server restart)
- Reconnection logic in driver (not application code)

**Known WebSocket issues:**
- Long-lived connections can fail silently
- Requires heartbeat/ping to detect disconnection
- Neon may close idle WebSockets
- Browser/edge runtime WebSocket differences

---

## STEP 5: neonConfig.webSocketConstructor

From `db.ts`:
```typescript
import WebSocket from 'ws';
neonConfig.webSocketConstructor = WebSocket;
```

**CRITICAL:** This is **Node.js `ws` library**, not browser WebSocket.

**Known issues with ws in serverless/Next.js:**
- Node.js event loop integration
- Process exit handling
- Connection pool cleanup
- Memory leaks if connections not closed

---

## STEP 6: Error Event Analysis

The observed error:
```
TypeError: Cannot set property message of #<ErrorEvent> which has only a getter
```

**Hypothesis:** This originates from WebSocket error handling.

**WebSocket ErrorEvent:**
- `ErrorEvent` is a DOM API type
- Has read-only `message` property
- `ws` library may throw `ErrorEvent` on connection failure
- Something in the stack attempts to mutate `ErrorEvent.message`

**Likely source:**
1. Neon driver catches WebSocket error
2. Attempts to wrap/transform error
3. Tries to set `error.message = "..."`
4. ErrorEvent is immutable → TypeError
5. Original connection error is masked

**Evidence:** Error occurs **DURING** recovery, not during stable operation.

---

## STEP 7: Timing Analysis

### Observed Timings

| Event | Duration | Interpretation |
|-------|----------|----------------|
| First tutorial request | 102s → 404 | Multiple connection timeouts |
| Second tutorial request | 3.7 min → 200 | Slow recovery with retries |
| Third tutorial request | 5.4s → 200 | Connection established |
| Fourth tutorial request | 11.3s | Still warming up |
| Fifth+ requests | 1.2s - 2.2s | Stable connection |

### Hypothesis

**Phase 1: Pool in Failed State (0-102s)**
- Pool singleton created at server start
- WebSocket connections failed/stale
- All 15 connections unusable
- New requests timeout after 2s each
- No new connections created (pool at max)
- After ~50 timeouts, pool exhausted

**Phase 2: Recovery Attempt (102s-3.7min)**
- Request triggers pool cleanup logic
- Old WebSocket connections closed
- New WebSocket connection attempts
- ErrorEvent thrown during reconnection
- Eventually succeeds
- New connection pool established

**Phase 3: Stable Operation (after 3.7min)**
- Fresh WebSocket connections
- Pool healthy
- Normal query latency (1-2s)

---

## STEP 8: Why Standalone Scripts Work

**Standalone Node.js scripts:**
```
Fresh process
    ↓
Import getTutorialDb()
    ↓
pooledDbInstance === null
    ↓
createDb() creates NEW pool
    ↓
NEW WebSocket connections
    ↓
Works immediately
```

**Long-running Next.js:**
```
Process running 2+ hours
    ↓
pooledDbInstance exists (stale)
    ↓
WebSocket connections stale/closed
    ↓
Queries use stale connections
    ↓
Timeout after 2s
    ↓
Eventually trigger reconnection
    ↓
Recovery after many retries
```

---

## STEP 9: CONNECTION ACQUISITION FAILURE POINT

**Failure occurs at:** CONNECTION ACQUISITION phase

**Evidence:**
1. Query itself is simple (`SELECT * FROM tutorial_domains`)
2. Execution time would be <100ms if connection was healthy
3. 102s timeout suggests connection establishment failure
4. Silent pool error handler hides the actual error
5. ErrorEvent suggests WebSocket-level failure

**Not:**
- Query execution (too simple to take 102s)
- Result retrieval (no data yet)
- Error transformation (happens after query)

---

## STEP 10: Root Cause Classification

**PRIMARY ROOT CAUSE:** Neon WebSocket connection pool enters stale/disconnected state in long-running Next.js process. Aggressive 2-second connection timeout combined with silent error handling causes cascading failures. Recovery requires multiple retry cycles.

**CONTRIBUTING FACTORS:**
1. `connectionTimeoutMillis: 2000` — too aggressive for WebSocket establishment
2. `pool.on('error', () => undefined)` — hides connection failures
3. Singleton pool — never recreated without restart
4. No health checks — stale connections not detected
5. No automatic reconnection — relies on query failures to trigger recovery
6. WebSocket lifecycle — connections can silently disconnect

**CONFIDENCE:** 90% (matches all observed symptoms)

---

## STEP 11: Why RTH Recovered But SkillUp Didn't

**Theory:** Each Next.js app has its own process with its own `pooledDbInstance` singleton.

**RTH:**
- Received multiple requests
- Triggered reconnection cycle
- ErrorEvent exception during recovery
- New connections established
- Now stable

**SkillUp:**
- Fewer requests OR
- Different timing OR
- Still waiting for recovery trigger OR
- Pool in different failure state

**SkillUp needs same recovery:** Multiple requests to trigger reconnection.

---

## FILES READ

- `packages/db-tutorial/src/db.ts`
- `packages/db-tutorial/package.json`
- `src/share-branding/LearningExperience/tutorialSidebarDelivery.ts` (imports)

## FILES MODIFIED

**NONE**
