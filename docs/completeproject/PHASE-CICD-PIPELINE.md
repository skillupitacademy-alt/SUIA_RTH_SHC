# Phase 1.2: CI/CD Pipeline Blueprint
## docs/blueprints/PHASE-CICD-PIPELINE.md

> Applies to: entire monorepo
> Provider: GitHub Actions
> Deploy targets: Vercel (frontends), Railway (services), Cloudflare Workers (gateway)

---

## Part 1: Pipeline Architecture

```
On every push / PR:
  ┌─────────────────────────────────────────────┐
  │  PARALLEL JOBS (run simultaneously)          │
  │  lint → type-check → test → security-scan   │
  └──────────────────┬──────────────────────────┘
                     │ all pass
  ┌──────────────────▼──────────────────────────┐
  │  build (depends on all above)               │
  └──────────────────┬──────────────────────────┘
                     │ on main branch only
  ┌──────────────────▼──────────────────────────┐
  │  deploy (per changed service/app)            │
  │  Uses Turborepo affected detection           │
  └─────────────────────────────────────────────┘
```

---

## Part 2: Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint:all

  type-check:
    name: TypeScript
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck:all

  test:
    name: Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @platform/exam-service run test:coverage
      - run: pnpm --filter @platform/tutorial-service run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-reports
          path: |
            services/exam-service/coverage/
            services/tutorial-service/coverage/

  security-scan:
    name: Security
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Dependency audit
        run: pnpm audit --audit-level=high
      - name: Secret scanning (TruffleHog)
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test, security-scan]
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:all
      - name: Bundle size check
        run: |
          MAX_SIZE=500000  # 500KB
          for app in apps/student-app apps/tutorial-app; do
            SIZE=$(du -sb $app/.next/static | cut -f1)
            if [ $SIZE -gt $MAX_SIZE ]; then
              echo "Bundle too large: $app = ${SIZE}B (max ${MAX_SIZE}B)"
              exit 1
            fi
          done

  ci-success:
    name: CI Success
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - run: echo "All CI checks passed"
```

---

## Part 3: Per-Service Deploy Workflows

```yaml
# .github/workflows/deploy-exam-service.yml
name: Deploy Exam Service

on:
  push:
    branches: [main]
    paths:
      - 'services/exam-service/**'
      - 'packages/db-exam/**'
      - 'packages/types/**'
      - 'packages/events/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - name: Run DB migrations (exam-db)
        run: pnpm --filter @platform/db-exam run migrate
        env:
          DATABASE_EXAM_DIRECT_URL: ${{ secrets.DATABASE_EXAM_DIRECT_URL }}

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: exam-service

      - name: Smoke test
        run: |
          sleep 30
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://exam.api.realtutorialhub.com/healthz)
          if [ "$STATUS" != "200" ]; then
            echo "Smoke test failed: HTTP $STATUS"
            exit 1
          fi
```

```yaml
# .github/workflows/deploy-gateway.yml
name: Deploy API Gateway

on:
  push:
    branches: [main]
    paths:
      - 'services/api-gateway/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Deploy to Cloudflare Workers
        run: pnpm --filter @platform/api-gateway run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

```yaml
# .github/workflows/deploy-frontend-apps.yml
# Vercel auto-deploys from GitHub — just need preview check

name: Verify Preview Deployment

on:
  pull_request:

jobs:
  preview-check:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Vercel preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        id: vercel-preview
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300

      - name: Smoke test preview
        run: |
          URL="${{ steps.vercel-preview.outputs.url }}"
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${URL}")
          echo "Preview URL: $URL → HTTP $STATUS"
          if [ "$STATUS" != "200" ]; then exit 1; fi
```

---

## Part 4: GitHub Repository Settings

```yaml
# .github/CODEOWNERS
# Security-sensitive paths require review
/packages/auth/                    @platform-security-team
/services/payment-service/         @platform-security-team
/packages/db-exam/src/schema/      @platform-db-team
/packages/db-payment/src/schema/   @platform-db-team

# All other paths — default owner
*                                  @platform-team

# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
    open-pull-requests-limit: 10
    groups:
      security:
        applies-to: security-updates
        update-types: [patch, minor, major]
      next-framework:
        patterns: [next, react, react-dom]
      testing:
        patterns: [vitest, "@vitest/*", "@testing-library/*"]
    labels: [dependencies, automated]
    ignore:
      - dependency-name: next
        update-types: [version-update:semver-major]
      - dependency-name: react
        update-types: [version-update:semver-major]

  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
    labels: [ci]
```

---

## Part 5: Required GitHub Secrets

```
# Per environment (production):
DATABASE_EXAM_DIRECT_URL
DATABASE_TUTORIAL_DIRECT_URL
DATABASE_PEOPLE_DIRECT_URL
DATABASE_PAYMENT_DIRECT_URL
RAILWAY_TOKEN
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VERCEL_TOKEN
VERCEL_ORG_ID

# Per service (set in Railway dashboard, not GitHub):
JWT_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
INTERNAL_GATEWAY_SECRET
RESEND_API_KEY
RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET
STRIPE_SECRET_KEY
```

---

## Part 6: Verification

```
□ PR: lint + typecheck + tests run in parallel on every PR
□ PR: security scan catches committed secrets
□ Merge to main: only changed services are deployed
□ exam-service: DB migration runs before deployment
□ Cloudflare Gateway: deployed via wrangler in CI
□ Preview URL smoke test runs on every PR
□ Bundle size check fails CI if > 500KB
□ Dependabot creates weekly dependency PRs
□ CODEOWNERS enforces review on security-sensitive paths
□ All secrets stored in GitHub Secrets (never in code)
```

---

*Phase: CI/CD | Status: Ready*
