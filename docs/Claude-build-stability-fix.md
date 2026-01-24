# Claude Build Stability & CI/CD Fix Task

## Purpose

Stabilize the Quiz Platform monorepo build pipeline across local, CI/CD, and Vercel by fixing toolchain-level instability caused by pnpm v10 + Node >=22 incompatibility.

This task enforces a production-grade, enterprise-stable toolchain configuration.

---

## Root Cause Summary

Build failures are caused by **pnpm v10 + Node >=22 + undici fetch layer conflicts** in serverless environments (Vercel build images), producing errors like:

```
ERR_PNPM_META_FETCH_FAIL
Value of "this" must be of type URLSearchParams
```

This is an infrastructure/toolchain bug, not an application or monorepo bug.

---

## Target Stable Toolchain

| Layer   | Version           |
| ------- | ----------------- |
| Node.js | 20.x (LTS stable) |
| pnpm    | 9.15.4            |
| Turbo   | 2.x               |
| Next.js | 16.x              |

---

## Implementation Steps

### 1) Lock Node Version (Root package.json)

```json
"engines": {
  "node": "20.x"
}
```

❌ Do NOT use:

```json
"node": ">=22"
```

---

### 2) Lock pnpm Version (Root package.json)

```json
"packageManager": "pnpm@9.15.4"
```

❌ Do NOT use pnpm v10.x

---

### 3) Add `.npmrc` (Root Level)

Create file `.npmrc`:

```txt
node-linker=hoisted
strict-peer-dependencies=false
```

---

### 4) Fix Build Scripts (CRITICAL)

❌ REMOVE `npx` usage from all app build scripts

#### apps/web-app/package.json

```json
"build": "next build"
```

#### apps/admin-app/package.json

```json
"build": "next build"
```

#### apps/api-server/package.json

```json
"build": "next build"
```

Why: `npx` causes live registry fetches during build → instability + cache bypass + CI failures.

---

### 5) Lock Dependency State

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

Commit:

```bash
git add .
git commit -m "fix: stabilize toolchain (node20 + pnpm9 + build system)"
git push
```

---

## Vercel Configuration (MANDATORY)

Apply to **each project**:

### Settings → General → Build & Development

| Field            | Value          |
| ---------------- | -------------- |
| Framework        | Next.js        |
| Install Command  | `pnpm install` |
| Build Command    | `pnpm build`   |
| Node Version     | `20.x`         |
| Output Directory | `.next`        |

---

## Expected Outcome

After implementation:

✅ pnpm install stable
✅ No ERR_INVALID_THIS
✅ No registry fetch failures
✅ No undici errors
✅ Turbo stable
✅ Monorepo builds
✅ Admin/Web/API deploy correctly
✅ Vercel CI stable
✅ Production-grade pipeline

---

## Enterprise Guarantee

This fix removes **toolchain instability**, not application logic.

This creates a:

* Deterministic build pipeline
* Reproducible CI
* Stable dependency resolution
* Production-grade deployment system

---

## Classification

Type: Infrastructure Stability Task
Layer: DevOps / Toolchain / CI-CD
Priority: Critical
Scope: Global Monorepo

---

## Success Criteria

Build Logs Must Show:

* No pnpm meta fetch errors
* No ERR_INVALID_THIS
* No registry retry loops
* Clean dependency resolution
* Successful build + deploy

---

## Status Flag

This task must be executed before:

* AI Experience Layer
* Analytics AI Engine
* Recommendation Engine
* ML Model Integration
* Real-time personalization

Because CI/CD stability is a **hard prerequisite** for AI-layer development.

---

# End of Task
