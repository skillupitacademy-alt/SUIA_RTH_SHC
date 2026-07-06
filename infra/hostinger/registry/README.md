# Registry-Based Deployment Phase 2

This is the default Phase 2 production deployment path. It moves Docker builds away from the Hostinger VPS.

## Flow

```text
Windows PC or CI
  build Docker images
  push versioned images to registry

Hostinger VPS
  pull versioned images
  retag pulled images as local Compose images
  docker compose up --no-build
```

The old VPS-build path is guarded. `deploy-production.sh` now refuses to build on the VPS unless `ALLOW_VPS_BUILD=true` is explicitly set for an emergency or fallback deployment.

## Registry Choice

Any Docker-compatible registry works:

- Docker Hub: `docker.io/<username>`
- GitHub Container Registry: `ghcr.io/<owner>`
- Private registry: `<registry-host>/<namespace>`

Set:

```bash
export REGISTRY_PREFIX="docker.io/your-user"
```

or:

```bash
export REGISTRY_PREFIX="ghcr.io/your-org"
```

Do not commit registry passwords or tokens.

## Build and Push From Local Machine or CI

Login first:

```bash
docker login
```

Then build and push all buildable services:

```bash
cd infra/hostinger/scripts
REGISTRY_PREFIX="docker.io/your-user" ./build-push-images.sh
```

Build and push selected services:

```bash
REGISTRY_PREFIX="docker.io/your-user" ./build-push-images.sh api-server skillup-web
```

Use an explicit tag:

```bash
REGISTRY_PREFIX="docker.io/your-user" IMAGE_TAG="20260706-001" ./build-push-images.sh
```

If local Compose build args require environment values, set:

```bash
export HOSTINGER_ENV_FILE="/path/to/local/registry-build.env"
```

## Pull and Deploy on VPS

Login on the VPS if the registry is private:

```bash
docker login
```

Pull and deploy the pushed tag:

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/scripts
REGISTRY_PREFIX="docker.io/your-user" IMAGE_TAG="<tag>" ./deploy-pull-production.sh
```

Deploy selected services:

```bash
REGISTRY_PREFIX="docker.io/your-user" IMAGE_TAG="<tag>" ./deploy-pull-production.sh api-server skillup-web
```

## Legacy VPS Build Fallback

Use this only when registry deployment is unavailable and you intentionally accept build CPU load on the VPS:

```bash
ALLOW_VPS_BUILD=true ./deploy-production.sh
```

## Rollback

Rollback still uses `rollback-deployment.sh`. Registry deployments write the same deployment state and image manifest format as VPS-build deployments.

## Notes

- The VPS does not run `docker compose build` in this path.
- Pulled images are retagged to the local image names expected by the existing Compose project.
- Deployment tags referenced by retained history are preserved during cleanup.
