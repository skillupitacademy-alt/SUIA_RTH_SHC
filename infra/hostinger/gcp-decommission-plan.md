# GCP Decommission Plan

Status: future planning artifact. Do not execute during migration phases.

## Rule

Do not decommission GCP until the VPS stack has been stable for an approved observation period.

## Candidate Observation Period

- Minimum: 7 days.
- Preferred: one billing and traffic cycle if budget allows.

## Decommission Review Checklist

- [ ] Production traffic is fully served by VPS/Cloudflare target design.
- [ ] Cloud Run services are no longer receiving production traffic.
- [ ] Rollback window has expired.
- [ ] Backups and restore procedures are proven.
- [ ] Monitoring coverage is sufficient.
- [ ] Cost impact is understood.
- [ ] Owners approve deletion.

## Resources To Review Later

- Cloud Run services.
- Artifact Registry images.
- Cloud Build triggers/configs.
- GitHub Actions workflows.
- Secret Manager secrets.
- IAM roles related only to old deployment.
- Logs and metrics retention.

## Explicit Non-Goal

This document does not authorize deletion. It exists so decommissioning is deliberate and separately reviewed.
