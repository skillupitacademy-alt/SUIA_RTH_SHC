# Template Validation

Status: non-destructive validation tooling.

This directory contains local checks for the Hostinger migration templates. These checks do not connect to the VPS, mutate DNS, call Cloudflare APIs, or change GCP.

## Files

- `validate-templates.sh`: local static validation for Compose and required template files.
- `validate-templates.ps1`: Windows PowerShell equivalent for local validation.
- `local-template-validation.md`: record of an initial local validation run.

## Intended Use

From the repository root:

```bash
infra/hostinger/validation/validate-templates.sh
```

On Windows:

```powershell
.\infra\hostinger\validation\validate-templates.ps1
```

The script checks:

- Docker Compose can render the Hostinger Compose configuration.
- Only `nginx` publishes public ports.
- Required Nginx template files exist.
- Required Cloudflare planning docs exist.
- Required bootstrap and operations docs exist.

It uses `infra/hostinger/env/.env.production.template`; no production secrets are required.
