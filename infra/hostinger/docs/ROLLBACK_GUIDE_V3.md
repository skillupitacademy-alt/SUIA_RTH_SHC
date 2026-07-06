# Rollback Guide V3.1

V3.1 rollback is Docker image based, but it does not infer rollback images from Docker image ordering. It restores the exact immutable image tags recorded in the deployment history JSON.

## Quick Start

```bash
cd /opt/platform/apps/quiz-platform/infra/hostinger/scripts
./rollback-deployment.sh
```

To select a deployment without the interactive list:

```bash
./rollback-deployment.sh --deployment-id 20260706-153000
```

## How V3.1 Rollback Works

Every deployment writes:

- `/opt/platform/state/deployment.json`
- `/opt/platform/state/history/<deployment-id>.json`
- An `images` manifest with `image_name`, immutable deployment tag, image ID, and optional repo digest.

Rollback then:

1. Selects a target deployment history file.
2. Verifies every required image tag still exists locally.
3. Verifies recorded image IDs when available.
4. Retags the exact target images as `:latest`.
5. Restarts only the services recorded in the target image manifest.
6. Runs Docker health checks.
7. Runs required smoke tests.
8. Updates current deployment state with rollback metadata.

If image verification, health checks, or required smoke tests fail, rollback exits non-zero. V3.1 does not accept partial rollback and does not prompt to continue after failed validation.

## Safety Properties

- Exact image restore from deployment history.
- No Git checkout on the VPS.
- No "second image in docker images" assumption.
- No partial rollback acceptance.
- Shared deployment lock prevents concurrent deploy and rollback.
- Required health and smoke checks are fail-closed.

## Requirements

- `docker`
- `docker compose`
- `jq`
- `sha256sum`
- Deployment history created by V3.1 or later.

Older V3.0 history entries may not contain an `images` manifest. Those entries cannot be used for exact V3.1 rollback.

## Manual Verification

Inspect the current deployment:

```bash
jq . /opt/platform/state/deployment.json
```

List rollback-capable history records:

```bash
for file in /opt/platform/state/history/*.json; do
  jq -r 'select(.images != null) | "\(.deployment_id) \(.commit_short) \(.timestamp)"' "$file"
done
```

Verify a recorded image manually:

```bash
jq -r '.images["api-server"]' /opt/platform/state/history/<deployment-id>.json
docker image inspect quiz-platform-api-server:deployment-<deployment-id>
```

## Troubleshooting

### Missing image manifest

The selected history file was created before V3.1. Choose a newer deployment or perform a forward redeploy.

### Missing rollback image

The required immutable deployment tag was pruned. Choose another deployment target or rebuild/deploy from the desired source state.

### Image ID mismatch

The local tag no longer points to the recorded image. Do not continue automatically. Investigate local image mutation or restore the image from backup.

### Health or smoke tests fail

The script stops after restarting services with the target images. Review:

```bash
docker compose ps
docker compose logs --tail=200 <service>
```

Then either run another rollback target or run `./deploy-production.sh` to redeploy the current source state.

## Version History

- V3.1: Exact image manifest rollback, fail-closed validation.
- V3.0: Image tagging with unsafe image-order rollback assumption.
- V2.0: Manual Docker image rollback.
- V1.0: Git-based rollback, removed for VPS workflow safety.
