# Rollback Runbook

Use this runbook to restore production stability if a deployment introduces critical bugs or downtime.

## When to Roll Back
Initiate a rollback if:
- Error rate > 5% in Sentry.
- Exam submissions are failing.
- Authentication is broken.
- Data corruption is suspected.

## Rollback Procedure (GitHub Actions)
1. Go to the Actions tab in GitHub.
2. Select the Rollback Deployment workflow.
3. Click Run workflow.
4. Configure inputs:
   - Reason: Mandatory explanation.
   - Target App: all, api, web, or admin.
   - Target URL: Optional. If empty, rolls back to the previous deployment.

### Free Tier (Manual Assist)
The workflow creates a Manual Rollback issue per targeted app.
1. Follow the issue link to the Vercel dashboard.
2. Promote the last stable deployment.
3. Close the issue once healthy.

### Paid Tier (Automated)
The workflow executes rollback automatically via Vercel CLI.

## Manual Vercel Rollback (Emergency)
If GitHub Actions is down, use Vercel directly:
- API: https://vercel.com/team_Lk0sFRq1NFdIPDTgA9zfGY4f/quiz-platform-api-server/deployments
- Web: https://vercel.com/team_Lk0sFRq1NFdIPDTgA9zfGY4f/quiz-platform-web-app/deployments
- Admin: https://vercel.com/team_Lk0sFRq1NFdIPDTgA9zfGY4f/quiz-platform-admin-app/deployments

## Post-Rollback Checklist
- [ ] Verify health monitor shows green.
- [ ] Check Sentry error rate returning to baseline.
- [ ] Notify the team.
- [ ] Write a postmortem within 24 hours.
- [ ] Root cause fix in separate PR.
