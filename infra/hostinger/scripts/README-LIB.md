# Deployment Library V3.1

`lib-deployment.sh` contains the reusable primitives used by `deploy-production.sh` and `rollback-deployment.sh`.

## Required Tools

- `docker`
- `docker compose`
- `jq`
- `sha256sum` for deployment
- `awk` for deployment resource checks

Deployment also requires `git` for commit and diff detection. Rollback does not require Git, `sha256sum`, or `awk` because it restores image manifests from deployment history and does not calculate new deployment state checksums.

V3.1 treats `jq` as mandatory. Deployment and rollback fail before mutation when required tools or JSON configuration are invalid.

## Main Responsibilities

- Load deployment configuration from `infra/hostinger/config/*.json`.
- Detect affected services with Turbo dry-run when available, then source-path fallback.
- Acquire a boot-aware JSON deployment lock.
- Fail closed on disk, memory, CPU, inode, Docker, Compose, and BuildKit checks.
- Wait for health with `docker inspect`.
- Run smoke tests from an ephemeral `curlimages/curl` container on the internal Docker network.
- Tag built images with immutable `deployment-<deployment-id>` tags.
- Write deployment state with compose checksum and image manifest.
- Rotate deployment history and prune only safe image/build cache targets.

## Important V3.1 Decisions

### jq is required

Earlier drafts treated `jq` as optional. That made JSON behavior inconsistent. V3.1 requires `jq` so service maps, smoke tests, state, and rollback manifests are parsed consistently.

### Health checks are fail-closed

The library returns non-zero when required health checks fail. The orchestrators do not offer an interactive bypass.

### Smoke tests use a runner container

Smoke tests run with:

```bash
docker run --rm --network quiz_platform_internal curlimages/curl:8.11.1 ...
```

This avoids assuming the Nginx container has `wget` or any test tooling installed.

### Rollback uses exact image manifests

Deployments record image metadata in state. Rollback verifies and restores those exact tags. It does not use Docker image list order.

## Usage

Deployment:

```bash
./deploy-production.sh
```

Rollback:

```bash
./rollback-deployment.sh
./rollback-deployment.sh --deployment-id <deployment-id>
```

## Compatibility

V3.1 rollback requires V3.1 deployment history records with an `images` manifest. Older records remain useful for audit, but are not safe exact rollback targets.
