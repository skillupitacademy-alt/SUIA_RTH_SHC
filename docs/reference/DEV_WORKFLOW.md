# Quiz Platform – Standard Dev & Debug Workflow

This short checklist is the agreed way to work on this repo so every change is predictable, reproducible, and easy to review.

## 1) Plan the change
- Identify the scope and files you will touch.
- Note any env vars or feature flags you rely on.

## 2) Code in small batches
- Make a focused set of edits.
- Prefer isolated, composable components and pure functions.
- Avoid global state changes unless required.

## 3) Validate after each batch
Run the fast checks in this order (from repo root):
```
pnpm lint:all
pnpm typecheck:all
pnpm build:all    # before commit or PR
```
- If lint/typecheck/build fail, fix immediately; do not pile on more code.
- Re-run lint after each new code batch to keep the tree clean.

## 4) Handle API fetches defensively
- Always check `res.ok`; throw or set error state on non-OK.
- Use `credentials: 'include'` when auth cookies are needed.
- Show a user-facing error state (not just a spinner).

## 5) UI resiliency
- Avoid whole-page blockers; use per-section loading/error/empty states.
- Guard optional data with optional chaining and null checks.
- Keep independent widgets (e.g., repair tools) loading in parallel.

## 6) Logging & errors
- Log errors with enough context (route/params/status) but avoid PII.
- Surface meaningful messages to users (Unauthorized, Offline, etc.).

## 7) Git hygiene
- Stage only relevant files: `git add <paths>`
- Write concise commit messages: `<type>(scope): summary`
- Before committing: ensure `pnpm lint:all`, `pnpm typecheck:all`, `pnpm build:all` are clean.

## 8) Post-change sanity
- Manually sanity-check critical flows the change touches.
- For auth-protected routes, verify 401/403 behavior is graceful.

## 9) Env & config
- Document any new env vars in README/ENV docs.
- Keep thresholds/configs in env or config files when they may change without code deploys.

Follow this loop for every change to keep the codebase stable and review-friendly.***
