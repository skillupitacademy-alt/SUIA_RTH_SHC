# Deployment Configuration V3.1

This directory contains the data-driven configuration for the Hostinger VPS production deployment framework.

## Files

### deployment-config.json

Controls deployment behavior:

- State directory, history retention, and lock timeout.
- Build and health timeout values.
- Minimum disk, memory, CPU, and inode requirements.
- Docker BuildKit, image retention, and cleanup settings.
- Change detection settings for Turbo dry-run and source-path fallback.

### service-map.json

Defines every Compose service known to the deployment framework.

Important fields:

- `source_path`: Repository path for source-path fallback detection.
- `compose_name`: Docker Compose service name.
- `image_name`: Local image name used for immutable deployment tags.
- `package_name`: Workspace package name used by Turbo affected detection.
- `buildable`: Whether deployment scripts should build the service.
- `health_check_required`: Whether the service must pass health checks.

Example:

```json
{
  "api-server": {
    "name": "api-server",
    "source_path": "apps/api-server",
    "compose_name": "api-server",
    "image_name": "quiz-platform-api-server",
    "package_name": "@quiz/api-server",
    "buildable": true,
    "health_check_required": true
  }
}
```

### smoke-tests.json

Defines post-restart HTTP smoke tests.

Important fields:

- `url`: Internal Docker network URL.
- `expected_status`: Required HTTP status code.
- `timeout_seconds`: Per-test timeout.
- `required`: Whether failure aborts deployment.

Smoke tests run from the configured ephemeral curl runner on the internal Docker network. They do not depend on test tooling inside the Nginx container.

## Validation

```bash
cd infra/hostinger/config
./validate-config.sh
```

The deployment scripts also validate JSON files before mutating services.

## Adding a Service

1. Add the service to `service-map.json`.
2. Add a required or optional smoke test to `smoke-tests.json`.
3. Validate the JSON configuration.
4. Run `../scripts/deploy-production.sh` during an approved deployment window.

## V3.1 Safety Model

- `jq` is mandatory.
- Resource checks fail closed.
- Health checks fail closed.
- Required smoke tests fail closed.
- Docker images are tagged with immutable `deployment-<deployment-id>` tags.
- Rollback uses the exact image manifest stored in deployment history.
- Package dependency detection is delegated to Turbo instead of duplicating dependency graphs in JSON.

## Version History

- v3.1: Mandatory jq, Turbo affected detection, exact image rollback manifests, fail-closed validation.
- v3.0: Initial data-driven deployment configuration.
- v2.0: Smart incremental deployment with jq.
- v1.0: Basic deployment script.
