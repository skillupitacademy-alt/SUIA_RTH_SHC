# HOW TO RUN PHASE 2B.18 STEP 1.3 E2E TESTS

## PREREQUISITES

1. **Feature Flag Enabled** (in `.env.local`):
   ```bash
   NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true
   ```

2. **Dev Server Running**:
   ```bash
   cd apps/skillup-web
   pnpm dev
   ```
   
   Server should start at: `http://skillup.localhost:3009`

3. **Database Access**:
   - Tests use production database with real fixtures
   - Java tutorial "What is Java?" (whatisjava) must be published

## RUN TESTS

### First Execution: E/F/G/H Combined Test ONLY (Chromium)

```bash
npx playwright test tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts \
  --grep "E/F/G/H" \
  --project=chromium
```

**Expected Duration:** 3-5 minutes  
**What It Tests:**
- E. Automatic completion at 168-second threshold (REAL ILS)
- F. Completion persists in backend
- G. Page refresh preserves completion
- H. Duplicate ILS updates → single POST
- L. Correct identity in completion request

### After First Pass: Run Wiring Tests

```bash
npx playwright test tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts \
  --grep "Wiring Certification" \
  --project=chromium
```

**Expected Duration:** <1 minute  
**What It Tests:**
- A. Orchestrator mounted in Tutorial Page
- B. Published blocks rendered
- C. Feature disabled → no completion activity

### Full Certification Suite

After individual tests pass, run complete suite:

```bash
npx playwright test tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts \
  --project=chromium
```

**Note:** I/J/K tests are skipped pending fixture discovery and flag-OFF server setup.

## EXPECTED OUTPUT

### Successful E/F/G/H Test Logs

```
[E2E] Starting combined lifecycle test (E/F/G/H)
[E2E] Navigated to D1 block
[E2E] Initial state: { activeTimeSec: 0, isCompleted: false, blockIdentity: {...} }
[E2E] Waiting 10 seconds to verify ILS accumulation...
[E2E] After 10s, activeTimeSec: 8
[E2E] ✓ Real ILS accumulation verified
[E2E] Waiting for 168-second threshold...
[E2E] ILS activeTimeSec: 45/168
[E2E] ILS activeTimeSec: 90/168
[E2E] ILS activeTimeSec: 135/168
[E2E] ILS activeTimeSec: 170/168
[E2E] ✓ Threshold reached
[E2E] Waiting for completion API call...
[E2E] Completion request #1: { navigationNodeId: "whatisjava", blockId: "...", blockVersion: "D1", ... }
[E2E] ✓ Completion API called
[E2E] ✓ Single completion POST (H verified)
[E2E] ✓ Correct identity (L verified)
[E2E] ✓ Completion persisted in ILS state (F verified)
[E2E] Refreshing page...
[E2E] ✓ Completion persists after refresh (G verified)
[E2E] ✓ No duplicate completion after refresh
[E2E] Triggering additional ILS updates...
[E2E] ✓ Duplicate ILS updates → single POST (H verified)
[E2E] ✓✓✓ Complete lifecycle certified (E/F/G/H)
```

### Test Pass Confirmation

```
✓ tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts
  ✓ Phase 2B.18 Step 1.3 - E2E Certification (Real ILS)
    ✓ E/F/G/H. Complete instructional block lifecycle (180000ms)

1 passed (3.5m)
```

## TROUBLESHOOTING

### Test Fails: activeTimeSec Not Increasing

**Problem:** `data-ils-active-time-sec` stays at 0  
**Cause:** ILS not tracking active time  
**Fix:** Verify BlockTelemetryProvider is mounted and heartbeat is running

### Test Fails: Completion API Not Called

**Problem:** No POST to `/api/tutorial/ils/blocks/complete`  
**Cause:** Orchestrator not enabled or threshold not reached  
**Fix:** 
1. Verify `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=true` in .env.local
2. Check browser console for orchestrator logs
3. Verify real activeTimeSec reaches 168 seconds

### Test Fails: Timeout Waiting for Threshold

**Problem:** Test times out before reaching 168 seconds  
**Cause:** ILS accumulation slower than expected or browser tab backgrounded  
**Fix:**
1. Keep browser window visible and focused during test
2. Increase poll timeout in helper function
3. Check for JavaScript errors in browser console

### Test Fails: Identity Mismatch

**Problem:** Completion request has wrong blockId or navigationNodeId  
**Cause:** Fixture constants don't match database  
**Fix:** Re-run `scripts/analyze-tutorial-e2e-fixture.mjs` and update fixture constants

## DEBUGGING

### Enable Verbose Logging

```bash
DEBUG=pw:api npx playwright test ... --headed
```

### Watch Test in Browser

```bash
npx playwright test ... --headed --debug
```

### Inspect ILS State Manually

1. Navigate to: `http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava`
2. Open browser DevTools Console
3. Inspect content container:
   ```javascript
   document.querySelector('[data-auto-completion-enabled="true"]').getAttribute('data-ils-active-time-sec')
   ```
4. Watch it increment over time

### Check Completion API Manually

1. Open Network tab
2. Filter by `/blocks/complete`
3. Wait for 168 seconds of active time
4. Verify POST request appears
5. Inspect request payload

## NEXT STEPS AFTER E/F/G/H PASS

1. **Search for I/J Fixtures:**
   ```bash
   # Assessment block
   node scripts/analyze-tutorial-e2e-fixture.mjs whatisjava --type=assessment
   
   # Null expectedTimeSec block
   node scripts/analyze-tutorial-e2e-fixture.mjs whatisjava --nullExpectedTime
   ```

2. **Implement K Test (Flag-OFF):**
   - Stop server
   - Set `NEXT_PUBLIC_ENABLE_AUTO_COMPLETION=false`
   - Restart server on different port or separate terminal
   - Run K test to verify no completion

3. **Full Chromium Certification:**
   ```bash
   npx playwright test tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts \
     --project=chromium
   ```

4. **Multi-Browser Certification (Optional):**
   ```bash
   npx playwright test tests/e2e/phase-2b18-step-1.3-instructional-completion.spec.ts
   ```
   Runs in: Chromium, Firefox, WebKit

## CERTIFICATION DECLARATION

**DO NOT** declare Step 1.3 certified until:
- ✓ E/F/G/H test passes in Chromium
- ✓ Real ILS activeTimeSec verified to increase
- ✓ Real completion API called and verified
- ✓ Real persistence validated via page refresh
- ✓ Identity verification passes (L gate)
- ✓ Duplicate prevention verified (H gate)

**THEN** document results and proceed to:
- Search for I/J fixtures or document unavailable
- Implement K test with flag-OFF server
- Final certification report

---

**Status:** READY FOR EXECUTION  
**Commit:** 492c860b  
**Implementation:** COMPLETE  
**Certification:** PENDING BROWSER TEST RESULTS
