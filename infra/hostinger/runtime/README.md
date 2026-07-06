# Source-Free Runtime Bundle

This directory defines the Phase 3 VPS runtime shape. It is designed for a VPS that does not contain application source code.

## Target VPS Layout

```text
/opt/platform
├── compose/
│   ├── docker-compose.yml
│   └── docker-compose.production.yml
├── config/
├── env/
├── nginx/
├── scripts/
├── state/
├── logs/
└── backups/
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

## Deployment Flow

1. Build and push images outside the VPS:

```bash
REGISTRY_PREFIX="docker.io/your-user" IMAGE_TAG="<tag>" ./infra/hostinger/scripts/build-push-images.sh
```

2. Copy/sync only the runtime bundle to `/opt/platform`.

3. Pull and deploy on the VPS:

```bash
cd /opt/platform/scripts
HOSTINGER_SOURCE_FREE_RUNTIME=true \
REGISTRY_PREFIX="docker.io/your-user" \
IMAGE_TAG="<tag>" \
./deploy-pull-production.sh
```

## Compose Contract

`runtime/docker-compose.yml` contains only runtime image references and no `build:` sections. The deploy script pulls registry images, retags them as the local image names expected by Compose, then runs:

```bash
docker compose up -d --no-build
```

## Legacy Fallback

The old source-based VPS build path remains guarded and should only be used intentionally:

```bash
ALLOW_VPS_BUILD=true ./deploy-production.sh
```
