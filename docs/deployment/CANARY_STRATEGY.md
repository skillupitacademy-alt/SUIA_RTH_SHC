# Canary Deployment Strategy

The canary deployment workflow verifies each push to `main` across API, Web, and Admin before production promotion.

## How it Works

1. Trigger: Every push to `main`.
2. Sequential deployment:
   - API Server deploys first. If health checks fail, the workflow stops.
   - Web App deploys second. If root path returns non-200, the workflow stops.
   - Admin App deploys last. A failure creates a warning but does not block the workflow.
3. Smoke checks:
   - API: `/api/health/ready` and `/api/domains` must return 200.
   - Web/Admin: root path `/` must return 200.
4. Status feedback:
   - Success: commit status `canary-passed`.
   - Failure: commit status `canary-failed` and a GitHub Issue with preview URLs.

## Promotion to Production

### Free Tier (Current)
Promotion is manual after a passing canary:
1. Open Vercel Dashboard.
2. For each project (api, web, admin):
   - Go to Deployments.
   - Find the canary preview.
   - Promote to Production.

### Paid Tier (Automated)
Auto-promotion can be enabled by uncommenting the `vercel promote` lines in `.github/workflows/canary.yml`.

## Troubleshooting
If a canary fails:
1. Open the auto-generated GitHub Issue.
2. Visit the preview URL listed in the issue.
3. Review the GitHub Actions logs for the failing check.

## Notes
Free tier always requires manual promotion. Paid tier allows automation by uncommenting the promote lines.
