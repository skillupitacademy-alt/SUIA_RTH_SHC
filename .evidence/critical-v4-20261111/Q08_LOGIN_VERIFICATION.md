# Q08 SHC login verification

Verified on 11 November 2026 against local main at f245e11ee5584018a0f751080595192325e74ee6 with the existing uncommitted login fix. Local HTTP origin was http://skillhubcore.localhost:3007. The browser used headless Chromium through Playwright Test 1.62.1.

## Result

PASS for the focused local credential-submission verification. Six browser tests passed with zero failures, skips or retries. Three login unit tests also passed. SHC Admin type-check returned exit 0.

| Scenario | Expected behavior | Actual behavior | Result |
| --- | --- | --- | --- |
| JavaScript disabled | Server-rendered form uses POST /login. Email, password and submit remain disabled. | Real HTML form and all disabled states verified in Chromium. | PASS |
| Hydration scripts delayed | Credential controls remain disabled before application scripts execute, then enable after hydration. | Script interception held hydration. Disabled controls and screenshot verified, then controls enabled after script release. | PASS |
| Native submission after deliberately enabling controls | Native browser submission sends credentials in a POST body to /login, without credential query parameters. | Chromium submitted exactly one form-encoded POST. Its synthetic email/password were present only in the body. | PASS |
| Hydrated submit button | Exactly one JSON POST to /api/auth/login, followed by the existing internal redirect. | POST body, count and attempted /questions navigation verified. | PASS |
| Hydrated Enter key | Same body-only JSON POST behavior as the submit button. | Exactly one JSON POST and internal redirect verified. | PASS |
| Backend diagnostic failure | Fixed public error without exposing the upstream diagnostic. | Mocked HTTP 500 produced the safe message. Diagnostic canary was absent from the rendered page. | PASS |

Every browser scenario observed request URLs and referrers, frame navigation URLs, browser console messages and browser exceptions for synthetic credential canaries. All exposure assertions passed. The observer also rejected email/password query parameters.

The native fallback test intentionally overrode disabled controls through browser automation to exercise the second defense, the form's POST method. The browser intercepted the resulting synthetic POST before it reached the server. Hydrated login replies were mocked at the network boundary. The real local page, SSR markup, client scripts, hydration and browser form/keyboard behavior executed. No real account authentication or production credential submission was needed for this client submission defect. Successful protected-page admission, backend credential validation and general Scope B acceptance are separate evidence scopes.

## Source and tests

- apps/skillhubcore-admin/src/app/(public)/login/page.tsx contains the existing hydration-disabled controls, native POST /login, JSON POST handler, fixed error messages and internal redirect sanitizer use. Its production source was preserved during this focused verification.
- apps/skillhubcore-admin/src/app/(public)/login/__tests__/login-submission.test.tsx verifies SSR disabled controls, hydrated JSON submission and safe error messages. Next navigation, auth store and fetch are mocked.
- tests/e2e/shc-login-security.spec.ts was strengthened in this verification. It now requires an actual server-rendered form, delays scripts explicitly, tests the native fallback despite forced enablement, checks both button and Enter submission, and observes browser-log/navigation exposure.

## Commands and evidence

Unit command executed from the repository root.

```powershell
pnpm --filter @quiz/skillhubcore-admin exec vitest run "src/app/(public)/login/__tests__/login-submission.test.tsx" --pool=threads --maxWorkers=1 --no-file-parallelism
```

Result was 3 passed, exit 0. Previous worker-startup failures remain historical failed attempts and are superseded for this file by this executed result.

Browser command used the CLI belonging to the installed @playwright/test package to avoid the previously observed mixed-runner issue.

```powershell
$env:SHC_ADMIN_URL='http://skillhubcore.localhost:3007'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='.evidence/critical-v4-20261111/q08-playwright.json'
node node_modules\@playwright\test\cli.js test tests/e2e/shc-login-security.spec.ts --project=chromium --workers=1 --retries=0 --reporter=line,json --output=.evidence/critical-v4-20261111/q08-browser-results
```

Result was 6 passed, exit 0. Machine-readable report, console output and exit-code file are q08-playwright.json, q08-playwright.log and q08-playwright-exit.txt beside this report. The earlier timeout artifact is retained as history.

```powershell
pnpm --filter @quiz/skillhubcore-admin type-check
git diff --check
```

Both returned exit 0.

Screenshots were saved and visually inspected under .evidence/screenshots/critical-v4-20261111.

- q08-no-javascript.png
- q08-before-hydration.png
- q08-safe-login-error.png

## Governance

Changes remain uncommitted. No database operations, deployment, migrations or canonical acceptance-ledger changes were performed. The canonical ledger SHA256 remains 7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e. Other critical handoff items retain their existing pending status. This report qualifies only the local Q08 client submission defect and its error-message regression.
