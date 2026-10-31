# Learner Runtime Verification: 2026-10-31

## Verified

- Existing learner page: `/tutorial-v2/full-stack-development/backend-development/python/complete-python-5b1cfc3d/whatispython`.
- Headless authenticated learner smoke: page 200; Introduction I1, Definition D1, Code C1 rendered; ILS navigation and visit 200; both sidebars visible; no failed API responses, page errors, or console errors.
- Screenshot: `.evidence/screenshots/learner-runtime-smoke-1793432673179.png`.
- Real remote PostgreSQL fixture round-trip: preflight, committed block injection, and exact original-document restoration passed. Authored Python content was read-only during that round-trip.
- 104 focused Python tests passed. SkillUp fixture auth/progress route tests: 9 passed.

## Defects Fixed

- Progress proxy normalized API prefixes and forwarded the internal API key after learner authentication. The previous request produced a 401 while the newer ILS routes worked.
- Fixture tokens use the learner audience, SkillUp platform claims, and a configured UUID identity.
- Fixture auth remains disabled on deployed production services. Production-mode builds are supported only with an explicit isolated-preview guard and secret.
- The learner browser runner observes real visit responses and fails on missing sidebars. It no longer assumes a progress event happened.
- Cookies are passed to the ephemeral browser runner through stdin, not embedded in its temporary source file.
- Stepper 5/6 progress follows backend events, not elapsed-time estimates.

## Local Configuration

The approved remote tutorial database is selected explicitly for fixture writes. It is not represented as a local database or a separate test database.

Generated configuration and the fixture catalog live in ignored `.project-ai/learner-runtime.env` and `.project-ai/learner-fixtures.json`. They must never be committed. No user passwords are stored in these files.

Reconfigure idempotently from `services/project-ai`:

```powershell
python -m app.verification.fixture_setup --env-file ../../.env.local --allow-fixture-writes --provision --ils-api-url http://localhost:3000/api
```

The reserved fixture hierarchy is separate from real authored content. Each run restores the fixture document and deletes the dedicated fixture learner's progress on fixture pages. The empty fixture scaffolding remains available for subsequent runs.

## Evidence Boundary

The live Python smoke is a diagnostic, not certification of a newly uploaded candidate. A candidate must still pass the isolated preview on its exact placement commit and bind the candidate/manifest hashes and screenshot digest. Unit tests and live-workspace smoke results must never be substituted for that gate.
