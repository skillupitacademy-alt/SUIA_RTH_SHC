# Hostinger Migration Rollback

Status: prepared for review. Use only during an approved production rollback.

These files support restoring Cloudflare Worker and DNS behavior if the Hostinger cutover needs to be reversed.

## Files

- `rollback-cloudflare.ps1`: orchestrates Worker and DNS rollback steps.
- `rollback-worker.ps1`: redeploys a selected Worker rollback ref or the current local Worker config.
- `rollback-dns.ps1`: restores DNS records from a Cloudflare state export.
- `rollback-gcp.md`: documents GCP rollback targets and decommission guardrails.

## Required Inputs

- `CLOUDFLARE_API_TOKEN` in the local shell for DNS rollback.
- Wrangler authentication or a valid `CLOUDFLARE_API_TOKEN` for Worker deploy.
- A Cloudflare state export under `infra/hostinger/cloudflare/state-exports/`.
- An explicit rollback decision from the operator.

## Recommended Order

1. Stop new DNS batch changes.
2. Capture a fresh Cloudflare export.
3. Roll back the Worker if frontend route removal or API origin routing caused the issue.
4. Roll back DNS only for affected frontend batches.
5. Validate Cloud Run rollback targets and public login flows.

## Safety

All PowerShell scripts are dry-run by default and require `-Apply` for mutation.

Do not run rollback scripts while a forward cutover script is active.
