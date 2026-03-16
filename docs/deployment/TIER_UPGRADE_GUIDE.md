# Deployment Tier Upgrade Guide

This guide explains how to move from free (manual-assist) to paid (full automation).

## What Improves With Paid Tier
- Rollback: manual -> automatic
- Monitoring: every 15 min -> every 5 min
- Alerts: GitHub Issues only -> Issues + Slack
- Canary promotion: manual -> automatic

## Upgrade Steps (2 steps only)
1. GitHub -> Settings -> Secrets -> Actions: change DEPLOYMENT_TIER to `paid`.
2. Add SLACK_WEBHOOK_URL secret (optional) for Slack alerts.

No code changes are required. All workflows auto-detect the tier change.
