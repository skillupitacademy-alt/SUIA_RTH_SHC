# Dashboard profile AbortError correction — 2026-11-08

Baseline: local `main` merge `8ba756413a7889e9473fe3bf86520f2beb43474a`.
The owner reports all three brand logins, dashboards and existing components working,
with a console AbortError originating from `fetchBackendAuthState` on learner dashboards.

The shared helper used an unconditional three-second abort timer, started before
asynchronous request context preparation. Failed fetch paths did not clear that timer.
After retries, logging the actual AbortError via console.error exposed its fetch stack
despite the dashboard's existing optional-profile fallback. The precise live latency
cause was not reproduced; development route compilation is a possible contributor.

Correction in `src/share-branding/auth/serverAuthState.ts`:

- Prepare the gateway URL and cookies before starting the request deadline.
- Permit 15 seconds per development attempt; retain 3 seconds outside development.
- Clear each deadline in finally, including denial, body-read and transport failures.
- Keep bounded retries, immediate null on 401 and existing caller-owned authentication.
- Return no invented identity on failure; log sanitized warning summaries rather than
  an expected abort stack, private profile fields or private backend response bodies.

Verification:

- Guarded isolated Vitest: `src/share-branding/auth/__tests__/serverAuthState.test.ts`,
  1 file / 7 passed, exit 0. Covers gateway cookie forwarding/no-store, no cookies,
  immediate 401, slow request-context preparation, four-second development response,
  bounded hung requests and transient transport recovery with timer cleanup.
- TypeScript compiler API strict standalone check of the helper: zero diagnostics,
  exit 0. This excludes generated Next application routes and is not an app typecheck.
- `pnpm --filter @quiz/skillup-web exec tsc --noEmit`: shell exit 1, inner tsc exit 2;
  diagnostics in generated `.next/types/app/api/faculty/route.ts` and programs route
  for optional request argument signatures.
- `pnpm --filter @quiz/realtutorialhub-web exec tsc --noEmit`: shell exit 1, inner tsc
  exit 2; syntax diagnostics in generated `.next/dev/types/routes.d.ts`.
- No diagnostic identified the changed helper. No clean baseline comparison was run,
  so the generated failures are disclosed rather than claimed independently proven
  pre-existing. No generated files were deleted or source routes altered to hide them.

No browser login was independently repeated in this fix. No auth settings, secrets,
databases, migrations or SHC Admin code changed. Genuine upstream outages still produce
warnings and the existing no-profile fallback; this patch does not certify upstream
health or authorize broader architecture/W4 acceptance.
