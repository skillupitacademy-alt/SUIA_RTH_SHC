# FND15 composer verification announcement truth slice manifest

Baseline 373cdd9b; new source-backed issue / RC-TRUTH-01 / RC-PLLM-01. Active Project LLM `integration-certification/page.tsx` calls `projectLlmClient.verifyComposerWorktree`, but its live status announcement substitutes PASS when response status is absent and calls a displayed hash signed without signature evidence. Exact allowed production file: that page. Change only the announcement to report returned nonempty status and evidence hash when present, otherwise unavailable, without claiming signature. Do not alter verification result, gate state, backend, authorization or workflow. Typecheck and targeted lint; no new test for the wording-only reversible correction, actual caller execution remains unverified. Sol review required.


Verification: from `apps/skillhubcore-admin`, `pnpm exec tsc --noEmit` and `$env:ESLINT_USE_FLAT_CONFIG='false'; pnpm exec eslint 'src/app/(admin)/tools/project-llm/integration-certification/page.tsx'` each exited 0. `git diff --check` passed. Actual verification client and announcement were not mounted/executed; no service/browser run. IMPLEMENTED_UNVERIFIED.
