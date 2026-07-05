# Local Template Validation

Status: local validation record.

Date: 2026-07-05

## Scope

Validated the generated Hostinger templates locally without connecting to the VPS, modifying DNS, changing Cloudflare, or touching GCP.

## Checks Performed

### Docker Compose Availability

Command:

```powershell
docker compose version
```

Result:

```text
Docker Compose version v5.1.0
```

Non-blocking warning observed:

```text
WARNING: Error loading config file: open C:\Users\RealTutorialHub\.docker\config.json: Access is denied.
```

This warning did not prevent Compose from rendering configuration.

### Compose Config Render

Command:

```powershell
$env:HOSTINGER_ENV_FILE='..\env\.env.production.template'
docker compose --env-file infra\hostinger\env\.env.production.template `
  -f infra\hostinger\compose\docker-compose.yml `
  -f infra\hostinger\compose\docker-compose.production.yml `
  config
```

Result: Compose configuration rendered successfully.

## Important Notes

- The validation used the non-secret template environment file.
- Production secrets were not loaded.
- No images were built.
- No containers were started.
- No remote system was contacted.
- No DNS, Cloudflare, or GCP mutation occurred.

## Follow-Up Validation Needed On VPS

Run the same render check on Ubuntu 24.04 after copying the reviewed files:

```bash
HOSTINGER_ENV_FILE=/opt/platform/env/.env.production \
docker compose \
  --env-file /opt/platform/env/.env.production \
  -f infra/hostinger/compose/docker-compose.yml \
  -f infra/hostinger/compose/docker-compose.production.yml \
  config
```

Then run:

```bash
infra/hostinger/scripts/verify.sh
```

## Automated Local Check

The validation script added for repeatable local checks is:

```bash
infra/hostinger/validation/validate-templates.sh
```

On Windows workstations without WSL, use:

```powershell
.\infra\hostinger\validation\validate-templates.ps1
```
