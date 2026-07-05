# Filesystem Layout

Status: planning instructions only.

## Target Layout

```text
/opt/platform
+-- apps/
+-- backups/
+-- compose/
+-- docker/
+-- env/
+-- logs/
+-- monitoring/
+-- nginx/
+-- operations/
+-- scripts/
+-- ssl/
```

## Purpose

| Path | Purpose |
| --- | --- |
| `/opt/platform/apps/` | Git checkout or application bundles. |
| `/opt/platform/compose/` | Reviewed Compose files if copied outside repo. |
| `/opt/platform/env/` | Production environment files. |
| `/opt/platform/logs/` | Nginx and operational logs. |
| `/opt/platform/nginx/` | Nginx config material. |
| `/opt/platform/operations/` | Operator notes and handoff files. |
| `/opt/platform/scripts/` | Approved operational scripts. |
| `/opt/platform/ssl/` | Cloudflare Origin Certificate files. |
| `/opt/platform/backups/` | Local config backups. |

## Directory Creation

Candidate command for review:

```bash
mkdir -p /opt/platform/{apps,backups,compose,docker,env,logs,monitoring,nginx,operations,scripts,ssl}
```
