# 🚨 AI FIX PROMPT — ONBOARDING → DASHBOARD REDIRECT LOOP

---

# 🎯 PROBLEM

Current behavior:

```text
Login → Onboarding → Submit → URL shows /dashboard → Redirect → /onboarding ❌
```

Expected:

```text
Login → Onboarding → Submit → Dashboard (stay) ✅
```

---

# 🧠 ROOT CAUSE (ALREADY CONFIRMED)

Backend is correct:

* ✅ Onboarding API → 200
* ✅ DB → `is_onboarded = true`
* ✅ `/api/auth/me` → `onboarded: true`

---

## ❌ Problem is FRONTEND

```text
🔥 Frontend is using stale session state
```

---

# 🧩 OBJECTIVE

Fix **frontend session synchronization** so that:

```text
Latest /me state is ALWAYS used after onboarding
```

---

# 🧩 PART 1 — FIX ONBOARDING SUBMIT FLOW (CRITICAL)

---

## AFTER:

```ts
POST /api/onboarding
```

---

## MUST ADD:

```ts
await fetch('/api/onboarding', {
  method: 'POST',
  credentials: 'include',
  cache: 'no-store',
  body: JSON.stringify(data)
});

// 🔥 CRITICAL — FORCE SESSION REFRESH
await fetch('/api/auth/me', {
  credentials: 'include',
  cache: 'no-store'
});

// 🔥 FORCE UI UPDATE
router.refresh();
router.replace('/dashboard');
```

---

## ❌ IF MISSING

```text
Old state remains → redirect loop
```

---

# 🧩 PART 2 — FIX ALL `/me` FETCH CALLS

---

## FIND ALL:

```ts
fetch('/api/auth/me')
```

---

## REPLACE WITH:

```ts
fetch('/api/auth/me', {
  credentials: 'include',
  cache: 'no-store'
});
```

---

## ❌ WRONG

```ts
fetch('/api/auth/me') // no credentials
```

---

## IMPACT

```text
No cookies → wrong user state → onboarding loop
```

---

# 🧩 PART 3 — FIX NEXT.JS CACHING (MANDATORY)

---

## IN BFF ROUTE:

```ts
export const dynamic = 'force-dynamic';
```

---

## RESPONSE MUST INCLUDE:

```ts
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  }
});
```

---

## ❌ IF CACHED

```text
Old onboarded=false returned → redirect loop
```

---

# 🧩 PART 4 — FIX REDIRECT CONDITION (VERY IMPORTANT)

---

## FIND:

```ts
if (!user?.onboarded)
```

---

## ❌ THIS IS WRONG

```ts
undefined → treated as false → redirect ❌
```

---

## ✅ REPLACE WITH:

```ts
if (user && user.onboarded === false) {
  router.replace('/onboarding');
}
```

---

# 🧩 PART 5 — REMOVE WRONG STATE SOURCES

---

## ENSURE NOT USING:

```text
❌ localStorage
❌ cookies for onboarding state
❌ stale React state
❌ initial SSR props without refresh
```

---

## ONLY SOURCE OF TRUTH:

```text
/api/auth/me
```

---

# 🧩 PART 6 — DEBUG (MANDATORY)

---

## ADD IN DASHBOARD / AUTH LOADER:

```ts
console.log('[AUTH_STATE]', user);
```

---

## EXPECT AFTER ONBOARDING:

```json
{
  "onboarded": true
}
```

---

## ❌ IF YOU SEE:

```json
{
  "onboarded": false
}
```

👉 FRONTEND IS USING STALE DATA

---

# 🧩 PART 7 — NEXT.JS APP ROUTER FIX (IMPORTANT)

---

## IF USING LAYOUT / LOADER:

### ADD:

```ts
export const dynamic = 'force-dynamic';
```

---

## OR:

```ts
export const revalidate = 0;
```

---

# 🧩 PART 8 — FINAL FLOW VALIDATION

---

## AFTER FIX:

---

### ✅ STEP 1

```text
Login → /me → onboarded: false
```

---

### ✅ STEP 2

```text
Submit onboarding → 200
```

---

### ✅ STEP 3

```text
/me → onboarded: true
```

---

### ✅ STEP 4

```text
Redirect → /dashboard
```

---

### ❌ SHOULD NOT

```text
Redirect → /onboarding again
```

---

# 🏁 FINAL OUTPUT FORMAT

---

### Onboarding API

* working? yes/no

---

### /api/auth/me

* returns onboarded=true? yes/no

---

### Frontend Refetch

* implemented? yes/no

---

### Cache Disabled

* yes/no

---

### Redirect Logic Correct

* yes/no

---

# 🎯 FINAL VERDICT

---

* ❌ BROKEN STATE SYNC
* ⚠️ PARTIAL FIX
* ✅ FULLY FIXED

---

# 🧠 FINAL PRINCIPLE

```text
Backend truth is correct
Frontend must REFRESH to see truth
```

---
