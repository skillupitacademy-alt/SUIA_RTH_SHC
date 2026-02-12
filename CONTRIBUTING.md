# Contributing & Coding Standards for quiz-platform

This repo is lint-, type-, and build-gated across **all three apps** (web-app, admin-app, api-server). Follow these rules to ensure your code passes locally, in CI, and on Vercel.

## Required local commands (run before every PR/push)
- **Lint (fails on warnings):** `pnpm lint:all`
- **Type-check all apps:** `pnpm typecheck:all`
- **Build all apps:** `pnpm build:all`

Each app also has scoped commands if you’re working on one package:
- Web: `pnpm --filter @quiz/web-app lint | type-check | build`
- Admin: `pnpm --filter @quiz/admin-app lint | type-check | build`
- API: `pnpm --filter @quiz/api-server lint | type-check | build`

## CI/Vercel alignment
- GitHub Actions CI runs: install → `lint:all` → `typecheck:all` → `build:all`.
- Vercel projects should use per-app commands:
  - Web: `pnpm --filter @quiz/web-app build`, output `apps/web-app/.next`
  - Admin: `pnpm --filter @quiz/admin-app build`, output `apps/admin-app/.next`
  - API: `pnpm --filter @quiz/api-server build`, output `apps/api-server/.next`
- Install command everywhere: `pnpm install --frozen-lockfile`
- Lint is executed with `--max-warnings=0`; any warning fails the pipeline.

## ESLint/TypeScript rules you must design for
- **No `any`:** `@typescript-eslint/no-explicit-any` is error. Define DTOs, use Drizzle `$inferSelect/$inferInsert` for DB types, and narrow `unknown` errors.
- **Strict boolean checks:** `@typescript-eslint/strict-boolean-expressions` is error. Always handle null/empty explicitly:
  - Strings: `if (!token || token.trim() === '') return ...`
  - Numbers: `if (value != null && !Number.isNaN(value)) { ... }`
  - Arrays/objects: check `.length` or required props, not truthiness.
- **Type/value imports:** `@typescript-eslint/consistent-type-imports` enforced. Example:
  ```ts
  import type { NextRequest } from 'next/server';
  import { NextResponse } from 'next/server';
  ```
- **No floating promises:** `await` or `void fn().catch(console.error)` for fire-and-forget.
- **Console:** blocked in lint; remove or replace with proper logging. (`--max-warnings=0`)
- **Complexity:** `complexity` error at 20. Split large functions early.
- **File size:** `max-lines` warning at 500; extract helpers if you approach it.
- **No unused vars/imports:** Use `_` prefix only when intentionally unused.
- **No dangerous eval/dynamic requires:** `no-eval`, `no-implied-eval`, `security/detect-non-literal-require` are errors.

## Coding patterns to start from
- **Route handler template (Next.js / API):**
  ```ts
  import type { NextRequest } from 'next/server';
  import { NextResponse } from 'next/server';

  type Body = { id: string };

  export async function POST(req: NextRequest) {
    const { id }: Body = await req.json();
    if (!id || id.trim() === '') return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
      const result = await service.doThing(id);
      return NextResponse.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  ```

- **Async call with safe error handling:**
  ```ts
  try {
    const data = await api.fetch(input);
    // ...
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    logger.error({ message, input });
    throw e;
  }
  ```

- **Boolean guards:**
  ```ts
  const hasName = typeof name === 'string' && name.trim() !== '';
  if (!hasName) return fail('Name required');
  ```

- **Arrays/objects:**
  ```ts
  if (!items || items.length === 0) return [];
  if (!obj || typeof obj !== 'object' || !('id' in obj)) return;
  ```

- **Fire-and-forget with safety:**
  ```ts
  void audit.log(event).catch(console.error);
  ```

## When adding new code
- Define request/response types first; avoid `any`.
- Keep functions small; if complexity climbs, extract helpers or services.
- Avoid shared mutable state; prefer pure helpers and typed parameters.
- For UI (Next.js):
  - No `dangerouslySetInnerHTML` unless sanitized.
  - Keep hooks dependency arrays accurate; avoid console logging in components.

## Quick pre-PR checklist
- [ ] `pnpm lint:all`
- [ ] `pnpm typecheck:all`
- [ ] `pnpm build:all`
- [ ] No new `any`, no unchecked nullish logic, no console.
- [ ] Large functions/files refactored or justified.

Following this checklist keeps contributions aligned with the strict lint/type/build gates already enforced in CI and Vercel.
