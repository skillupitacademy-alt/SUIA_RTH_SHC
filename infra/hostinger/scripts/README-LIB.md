# Deployment Library V3.2

`lib-deployment.sh` contains the reusable primitives used by `deploy-production.sh` and `rollback-deployment.sh`.

## Required Tools

- `docker`
- `docker compose`
- `jq`
- `git` for deployment commit and diff detection
- `sha256sum` for deployment checksums
- `awk` for deployment resource checks

Rollback does not require Git, `sha256sum`, or `awk`; it restores image manifests from deployment history.

## Main Responsibilities

- Load deployment configuration from `infra/hostinger/config/*.json`.
- Detect affected services with Turbo dry-run when available, then source-path fallback.
- Acquire a boot-aware JSON deployment lock.
- Fail closed on resource, health, smoke, Docker, Compose, and BuildKit failures.
- Resolve the smoke-test network from rendered Compose config when configured as `auto`.
- Run smoke tests from an ephemeral `curlimages/curl` container on the internal Docker network.
- Tag built images with immutable `deployment-<deployment-id>` tags.
- Write deployment state with Compose checksum, provenance, image manifest schema, and image manifest.
- Preserve deployment tags referenced by retained history records.
- Rotate deployment history and prune only safe image/build cache targets.

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

V3.2 rollback requires deployment history records with an `images` manifest. Older records remain useful for audit, but are not safe exact rollback targets.
