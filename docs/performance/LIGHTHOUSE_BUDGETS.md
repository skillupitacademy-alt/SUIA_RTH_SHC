# Lighthouse Performance Budgets

This project uses Lighthouse CI to enforce performance, accessibility, best practices, and SEO standards.

## Budget Thresholds

| Category | Web App (Student) | Admin App | Rationale |
|---|---|---|---|
| **Performance** | >= 70 | >= 65 | Web app is critical for UX; Admin has heavy dashboards. |
| **Accessibility** | >= 80 | >= 80 | Strict legal and usability compliance. |
| **Best Practices** | >= 80 | >= 80 | Security and coding standards. |
| **SEO** | >= 80 | >= 70 | Web app is public; Admin is private. |

## Running Locally

You can run the Lighthouse audits against a local server or a build:

```bash
# Web App only
pnpm lighthouse:web

# Admin App only
pnpm lighthouse:admin

# Both apps
pnpm lighthouse:all
```

LHCI will attempt to build and serve the application if configured in
`lighthouserc.json`. For CI, we use Vercel Preview URLs.

## Troubleshooting Failures

If the Lighthouse job fails in a PR:

1. **Check the PR Comment**: Look for the score table to see which page/category failed.
2. **View Full Report**: Click the "View" link in the table to open the detailed Lighthouse HTML report.
3. **Common Fixes**:
   - **Performance**: Optimize images, lazy-load heavy components, check bundle sizes.
   - **Accessibility**: Ensure buttons have labels, images have alt text, and color contrast is sufficient.
   - **SEO**: Ensure meta descriptions and heading hierarchies are correct.

## Modifying Budgets

If a budget is consistently failing and cannot be met due to legitimate
complexity, you may relax it in `apps/[app]/lighthouserc.json`. Document
the reason in the PR. Budgets are intended to be tightened as the
application matures.