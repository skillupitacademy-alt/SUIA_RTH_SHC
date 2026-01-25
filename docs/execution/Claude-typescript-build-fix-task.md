# Claude TypeScript Build Fix Task

## Purpose

Fix Vercel build failure caused by missing TypeScript declaration files for authentication dependencies.

This task ensures:

* Deterministic CI/CD builds
* Immutable dependency model
* Monorepo-safe architecture
* Enterprise-grade build stability

---

## Problem

Vercel build fails with:

```
Type error: Could not find a declaration file for module 'jsonwebtoken'
```

Root cause:

* Runtime packages exist (`jsonwebtoken`, `bcrypt`)
* TypeScript strict mode enabled
* Missing dev type definitions

---

## Architectural Rule

> CI/CD must never mutate dependencies.
> Builds must be deterministic.
> Dependencies must come from repository + lockfile only.

---

## Execution Instructions (For Antigravity Agent)

### Step 1 — Install Missing Types at Workspace Root

```bash
pnpm add -D @types/jsonwebtoken @types/bcrypt @types/node -w
```

---

### Step 2 — Verify Runtime Dependencies

Ensure `apps/api-server/package.json` contains:

```json
"dependencies": {
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x"
}
```

No `@types/*` packages should be inside app-level package.json files.

---

### Step 3 — Fix vercel.json (if exists)

Replace with:

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

❌ Remove any `cd`, `pnpm add`, or dynamic install commands.

---

### Step 4 — Regenerate Lockfile

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### Step 5 — Commit

```bash
git add .
git commit -m "fix(types): add missing auth type definitions"
git push
```

---

## Validation Criteria

### Local

```bash
pnpm build
```

Must pass without TS errors.

### Vercel

Build logs must show:

```
✓ Compiled successfully
✓ Running TypeScript
✓ Build completed
Deploying outputs...
```

---

## Enterprise Compliance

| Principle            | Status |
| -------------------- | ------ |
| Deterministic builds | ✅      |
| Immutable CI         | ✅      |
| Monorepo-safe        | ✅      |
| Turbo-safe           | ✅      |
| pnpm-safe            | ✅      |
| Vercel-safe          | ✅      |
| Production-grade     | ✅      |

---

## Why This Fix Is Correct

* No runtime mutation
* No CI hacks
* No dynamic installs
* Lockfile driven
* Reproducible builds
* Enterprise DevOps compliant

---

## Explicit Prohibition

❌ Do NOT install deps in buildCommand
❌ Do NOT modify filesystem during CI
❌ Do NOT use `cd` in vercel.json
❌ Do NOT patch dependencies dynamically

---

## Outcome

After execution:

* TypeScript builds succeed
* Vercel deployments succeed
* Monorepo pipeline stable
* Auth service compiles
* CI/CD deterministic

---

## Classification

Task Type: Build Stability
Scope: CI/CD + Type System
Layer: Infrastructure + Toolchain
Priority: Critical
Risk: Low

---

End of Task
