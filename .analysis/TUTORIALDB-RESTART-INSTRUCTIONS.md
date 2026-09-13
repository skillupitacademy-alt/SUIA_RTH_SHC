# TUTORIALDB CONNECTION FIX — RESTART INSTRUCTIONS

**Date:** September 12, 2026  
**Issue:** Tutorial pages return 404 with "Failed query: tutorial_domains"  
**Root Cause:** Next.js dev servers have stale environment state after `.next` cache clear  
**Solution:** Restart both dev servers

---

## ✅ DIAGNOSIS COMPLETE

**All diagnostic tests passed:**
- ✅ Database is accessible
- ✅ `tutorial_domains` query works perfectly
- ✅ Environment variables are correct
- ✅ Full hierarchy data is intact
- ✅ Same configuration across RTH and SkillUp

**Problem:** Running Next.js dev servers need to reload environment variables.

---

## 🔄 RESTART PROCEDURE

### Step 1: Stop Both Servers

**Terminal running RTH (port 3003):**
```
Press Ctrl+C
```

**Terminal running SkillUp (port 3009):**
```
Press Ctrl+C
```

### Step 2: Restart RTH

```powershell
pnpm --filter @quiz/realtutorialhub-web dev
```

**Wait for:**
```
▲ Next.js 16.1.6
- Environments: .env.local
✓ Ready in Xs
```

### Step 3: Restart SkillUp

```powershell
pnpm --filter @quiz/skillup-web dev
```

**Wait for:**
```
▲ Next.js 16.1.6
- Environments: .env.local
✓ Ready in Xs
```

---

## 🧪 VERIFICATION

### Test 1: RTH Tutorial Page

**URL:**
```
http://realtutorialhub.localhost:3003/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**Expected Result:**
- ✅ Page loads (200 OK)
- ✅ Tutorial content visible
- ✅ LSNB sidebar visible
- ✅ No database errors in server logs

**Server Logs Should Show:**
```
[DELIVERY_TRACE] getPublishedTutorialPagePayload START
[DELIVERY_TRACE] resolveHierarchy START
[DELIVERY_TRACE] Domain resolution { found: true, domainName: 'Full Stack Development' }
[DELIVERY_TRACE] Subject resolution { found: true }
[DELIVERY_TRACE] Topic resolution { found: true }
[DELIVERY_TRACE] Subtopic resolution { found: true }
[DELIVERY_TRACE] resolveHierarchy SUCCESS
GET /tutorial-v2/.../whatisjava 200 in XXms
```

### Test 2: SkillUp Tutorial Page

**URL:**
```
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**Expected Result:** Same as RTH (200 OK, content loads)

---

## 🔍 IF RESTART DOESN'T WORK

### Check 1: Zombie Processes

```powershell
Get-Process -Name node | Where-Object { $_.Path -like "*quiz-platform*" }
```

If found, kill them:
```powershell
Stop-Process -Name node -Force
```

Then restart servers.

### Check 2: Database Connection Test

Run standalone test to confirm DB is still accessible:
```bash
node scripts/test-brand-tutorialdb-connection.mjs rth
node scripts/test-brand-tutorialdb-connection.mjs skillup
```

Both should show:
```
🟢 ALL TESTS PASSED
```

If tests FAIL, then we have a network/database issue (unlikely based on current evidence).

If tests PASS but page still fails, then Next.js has a deeper issue.

### Check 3: Port Conflicts

Ensure ports 3003 and 3009 are not being used by other processes:
```powershell
netstat -ano | findstr "3003"
netstat -ano | findstr "3009"
```

---

## 📊 WHAT CAUSED THIS?

**Sequence of Events:**

1. User ran: `rm -rf apps/*/.next` (cleared build caches)
2. Next.js lost some cached build state
3. Dev servers KEPT RUNNING with potentially stale environment
4. Database client may have been in corrupted state
5. Query fails even though config is correct

**Why Scripts Work But App Doesn't:**
- Scripts start fresh Node.js process → loads `.env.local` from disk ✅
- Running Next.js server → already has environment cached in memory ❌

**The Fix:**
- Restart = new process = fresh environment load ✅

---

## ✅ EXPECTED OUTCOME

After restart:
1. Tutorial pages load successfully (200 OK)
2. No database errors in logs
3. LSNB sidebar visible
4. Tutorial content rendered
5. You can proceed with RSSB testing

---

## 📝 NOTES

- No code changes needed
- No `.env` changes needed
- No database changes needed
- This is purely a runtime state issue
- Standard Next.js behavior after environment changes

---

## 🎯 AFTER SUCCESS

Once tutorial pages work, you can return to the original investigation:
- Test RSSB toggle button
- Verify RSSB data display
- Check if the docked layout implementation works correctly

The database foundation will be solid at that point.

---

**Full diagnostic report:** `.analysis/PHASE-B3-TUTORIALDB-DIAGNOSTIC-REPORT.md`
