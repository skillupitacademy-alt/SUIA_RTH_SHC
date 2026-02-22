# CI Pre-flight Checklist

Use this before pushing or triggering CI to keep the workflow green.

1) **pnpm version**
   - Source of truth: `packageManager` in `package.json` (currently `pnpm@9.15.4`).
   - Workflow auto-reads this; if you bump pnpm, update `package.json` (and lockfile) only.

2) **ESLint config**
   - No hard‑coded paths; `.eslintrc.json` uses relative `project` only.

3) **Node version**
   - Workflow pins Node 20. If you develop on a different Node, update the workflow to match.

4) **Secrets / Env**
   - Ensure required env vars for build/test are present in GitHub Actions (not just locally/Vercel).

5) **Lockfile integrity**
   - Run: `pnpm install --frozen-lockfile` (do not edit the lockfile by hand).

6) **Cache guards**
   - Leave the pnpm version guard in the workflow.

7) **CI tasks locally**
   - Run: `pnpm lint:all`
   - Run: `pnpm typecheck:all`
   - Run: `pnpm build:all`

8) **Git hygiene**
   - `git status` is clean; no untracked or unstaged changes.

If you bump pnpm or Node later, update `package.json` (and the workflow if Node changes). Otherwise, the pipeline should stay green.

## Optional: Pause Vercel deploys while CI stabilizes
- In Vercel project settings → Deployments → Ignored Build Step, choose “Don’t build anything” (or a custom step that exits 0) to skip deploys on push.
- Revert to “Automatic” when ready to resume deployments.
