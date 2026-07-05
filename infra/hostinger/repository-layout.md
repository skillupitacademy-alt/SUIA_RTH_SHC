# Hostinger Repository Layout

Status: planning template only.

## Target VPS Layout

```text
/opt/platform
+-- apps/
+-- compose/
+-- docker/
+-- env/
+-- logs/
+-- monitoring/
+-- nginx/
+-- scripts/
+-- backups/
```

## Target Repository Layout

```text
infra/
+-- hostinger/
    +-- README.md
    +-- ADR/
    +-- env/
    |   +-- .env.production.template
    |   +-- variables.md
    +-- operations/
    |   +-- backup.md
    |   +-- disaster-recovery.md
    |   +-- restart.md
    |   +-- restore.md
    |   +-- rollback.md
    |   +-- upgrade.md
    +-- repository-layout.md
    +-- migration-checklist.md
    +-- verification-checklist.md
```

## Later Phase Directories

These directories are intentionally not generated with runnable configuration in Phase 1:

- `infra/hostinger/compose/`
- `infra/hostinger/nginx/`
- `infra/hostinger/scripts/`
- `infra/hostinger/cloudflare/`
- `infra/hostinger/monitoring/`

They should be added only after the routing matrix and ADRs are reviewed.
