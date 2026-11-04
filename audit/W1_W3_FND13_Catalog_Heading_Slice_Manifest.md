# FND13 catalog heading follow-up manifest

Baseline 12adf398; RC-TRUTH-01. The program query includes nondeleted batches of all statuses. `apps/skillup-web/src/app/programs/page.tsx` currently labels the resulting set "Active learning tracks" and metadata "active" although no active-only predicate exists. Allowed production file: that page, adjacent existing mounted test. Use neutral catalog wording, preserve returned entries and status. Do not change access or data filtering. No network/browser execution; isolated mounted page with fail-closed fetch. Sol review required.

Verification: repository root, DB/cache/queue keys removed, programmatic Vitest `config: false`, jsdom, React plugin and explicit SkillUp `@` alias selecting `apps/skillup-web/src/lib/__tests__/truth-pages.test.tsx`: exit 0, 2 passed, fetch blocked. Mounted isolated components only; no physical service/browser. Whitespace check passed. IMPLEMENTED_UNVERIFIED.
