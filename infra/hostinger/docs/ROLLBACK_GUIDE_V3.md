# Rollback Guide V3.2

V3.2 rollback restores the exact immutable image tags recorded in deployment history. It does not infer rollback images from Docker image ordering.

## Quick Start

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/scripts
./rollback-deployment.sh
```

To select a deployment without the interactive list:

```bash
./rollback-deployment.sh --deployment-id 20260706-153000
```

## How Rollback Works

Every deployment writes:

- `/opt/platform/state/deployment.json`
- `/opt/platform/state/history/<deployment-id>.json`
- An image manifest with schema version, image name, immutable deployment tag, image ID, and optional repo digest.

Rollback then:

1. Selects a target deployment history file.
2. Verifies every required image tag still exists locally.
3. Verifies repo digest when present and locally available.
4. Falls back to image ID verification when digest is unavailable.
5. Retags the exact target images as `:latest`.
6. Restarts only the services recorded in the target image manifest.
7. Runs Docker health checks and required smoke tests.
8. Updates current deployment state with rollback metadata.

If image verification, health checks, or required smoke tests fail, rollback exits non-zero. V3.2 does not accept partial rollback and does not prompt to continue after failed validation.

## Requirements

- `docker`
- `docker compose`
- `jq`
- Deployment history created by V3.1 or later with an `images` manifest.

## Manual Verification

```bash
jq . /opt/platform/state/deployment.json
```

```bash
for file in /opt/platform/state/history/*.json; do
  jq -r 'select(.images != null) | "\(.deployment_id) \(.commit_short) \(.timestamp)"' "$file"
done
```

```bash
jq -r '.images["api-server"]' /opt/platform/state/history/<deployment-id>.json
docker image inspect quiz-platform-api-server:deployment-<deployment-id>
```

## Troubleshooting

### Missing image manifest

The selected history file was created before exact image rollback was introduced. Choose a newer deployment or perform a forward redeploy.

### Missing rollback image

The required immutable deployment tag is not available locally. Choose another deployment target or restore the image from backup.

### Digest or image ID mismatch

The local tag no longer points to the recorded image. Do not continue automatically. Investigate local image mutation or restore the image from backup.

### Health or smoke tests fail

Review:

```bash
docker compose ps
docker compose logs --tail=200 <service>
```

Then run another rollback target or run `./deploy-production.sh` to redeploy the current source state.

## Version History

- V3.2: Digest-aware verification and history-aware deployment tag retention.
- V3.1: Exact image manifest rollback, fail-closed validation.
- V3.0: Image tagging with unsafe image-order rollback assumption.
- V2.0: Manual Docker image rollback.
- V1.0: Git-based rollback, removed for VPS workflow safety.
