# Windows Next.js Build Path Issue

## Symptom
- `npm run build` (or `turbo run build`) fails in sub‑packages (e.g., `admin‑app`, `api‑server`) with an error such as:
  ```
  Cannot find module '...node_modules\next\dist\bin\next'
  ```
- The error message often shows a corrupted Windows path (`...\nodt buildules/...`).
- The same command works fine in `web‑app`.

## Cause
- The failing sub‑packages had **stale local `node_modules`** directories containing a broken `.bin/next.cmd` shim.
- On Windows, the shim resolves the binary path incorrectly, producing the garbled path and causing the `next` binary to be not found.
- When the sub‑package uses the hoisted root `node_modules`, the shim works correctly.

## Fix
1. **Remove stale local `node_modules`** in the affected packages:
   ```
   rm -rf apps/admin-app/node_modules
   rm -rf apps/api-server/node_modules
   ```
2. Ensure the packages rely on the **root `node_modules`** (the monorepo hoists dependencies).
3. **Update build scripts** to use `npx` which resolves the binary reliably on Windows:
   ```json
   "scripts": {
     "dev": "node ../../node_modules/next/dist/bin/next dev -p <port>",
-    "build": "next build",
+    "build": "npx next build",
     "start": "next start",
     "lint": "next lint"
   }
   ```
4. Commit the changes and push.

## Preventive Measures
- Keep a single `node_modules` at the repository root; avoid installing inside individual apps.
- Use `npx` for binary scripts in a monorepo on Windows to avoid path‑resolution issues.
- Add a `.gitignore` rule to ignore `apps/*/node_modules` if they are not needed.
- Document this fix in the repository (e.g., this file) for future reference.
