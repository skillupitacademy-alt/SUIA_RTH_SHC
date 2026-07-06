# Source-Free Runtime Bundle

This directory defines the Phase 3 VPS runtime shape. It is designed for a VPS that does not contain application source code.

## Target VPS Layout

```text
/opt/platform
|-- compose/
|   |-- docker-compose.yml
|   `-- docker-compose.production.yml
|-- config/
|-- env/
|-- nginx/
|-- scripts/
|-- state/
|-- logs/
|-- backups/
`-- manifest.json
```

The VPS should not need:

```text
apps/
packages/
services/
pnpm-lock.yaml
turbo.json
source Dockerfiles
```

## Five-Step Deployment

1. Build images outside the VPS and save them to an archive:

```powershell
.\infra\hostinger\scripts\build-save-images.ps1 -ImageTag "<tag>"
```

2. Package the runtime bundle:

```bash
./infra/hostinger/scripts/package-runtime-bundle.sh
```

3. Copy the `.tar.gz` and `.sha256` files to the VPS, then verify:

```bash
sha256sum -c hostinger-runtime-<version>.tar.gz.sha256
```

4. Extract into `/opt/platform` and restore real env/cert files.

5. Load and deploy:

```bash
cd /opt/platform/scripts
IMAGE_ARCHIVE="/opt/platform/releases/quiz-platform-images-<tag>.tar" IMAGE_TAG="<tag>" ./deploy-load-production.sh
```

## Bundle Contents

- Runtime Compose files with `image:` only and no `build:` sections.
- Deployment scripts.
- Deployment config.
- Nginx config.
- Empty runtime directories for env, state, logs, and backups.
- `manifest.json` with bundle version, source commit, creation time, and schema.

## Legacy Fallback

The old source-based VPS build path remains guarded and should only be used intentionally:

```bash
ALLOW_VPS_BUILD=true ./deploy-production.sh
```
