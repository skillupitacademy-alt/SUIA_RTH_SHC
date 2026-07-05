# Filesystem Layout

Status: planning instructions only.

## Target Layout

```text
/opt/platform
+-- apps/
+-- compose/
+-- docker/
+-- env/
+-- logs/
+-- monitoring/
+-- nginx/
|   +-- certs/
+-- scripts/
+-- backups/
```

## Purpose

| Path | Purpose |
| --- | --- |
| `/opt/platform/apps/` | Git checkout or application bundles. |
| `/opt/platform/compose/` | Reviewed Compose files if copied outside repo. |
| `/opt/platform/env/` | Production environment files. |
| `/opt/platform/logs/` | Nginx and operational logs. |
| `/opt/platform/nginx/` | Nginx config and certificate mount material. |
| `/opt/platform/nginx/certs/` | Cloudflare Origin Certificate files. |
| `/opt/platform/scripts/` | Approved operational scripts. |
| `/opt/platform/backups/` | Local config backups. |

## Directory Creation

Candidate command for review:

```bash
mkdir -p /opt/platform/{apps,compose,docker,env,logs,monitoring,nginx/certs,scripts,backups}
```
