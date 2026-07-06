# Deployment Configuration V3

**Phase 1 Complete** - Data-Driven Deployment Framework

This directory contains the configuration files for the production deployment system. All deployment logic is driven by these JSON files rather than hardcoded in scripts.

## Configuration Files

### 1. deployment-config.json

Main deployment configuration controlling system behavior.

**Key sections:**
- `deployment`: State management, timeouts, history retention
- `resource_requirements`: Minimum system resources before deployment
- `docker`: BuildKit, Compose settings, image cleanup
- `shared_paths`: Paths that trigger full rebuild
- `deployment_triggers`: When to rebuild/restart services

**Example:**
```json
{
  "deployment": {
    "state_directory": "/opt/platform/state",
    "history_retention": 30,
    "lock_timeout_seconds": 1800
  }
}
```

### 2. service-map.json

Complete mapping of all services in the platform.

**Each service defines:**
- `name`: Service identifier
- `source_path`: Repository path (e.g., `apps/api-server`)
- `compose_name`: Docker Compose service name
- `image_name`: Docker image name
- `dependencies`: Package dependencies that trigger rebuild
- `health_check_required`: Whether to wait for health check

**Example:**
```json
{
  "api-server": {
    "name": "api-server",
    "source_path": "apps/api-server",
    "compose_name": "api-server",
    "image_name": "api-server",
    "dependencies": ["packages/auth", "packages/db"],
    "health_check_required": true
  }
}
```

### 3. smoke-tests.json

HTTP endpoint tests to validate deployment.

**Each test defines:**
- `name`: Human-readable test name
- `method`: HTTP method (GET, POST, etc.)
- `url`: Internal Docker network URL
- `expected_status`: Expected HTTP status code
- `timeout_seconds`: Test timeout
- `required`: Whether test failure aborts deployment
- `execute_from`: Which container runs the test

**Example:**
```json
{
  "api-server": {
    "name": "API Server Health",
    "method": "GET",
    "url": "http://api-server:3000/api/health/live",
    "expected_status": 200,
    "required": true,
    "execute_from": "nginx"
  }
}
```

## Validation

Validate all configuration files:

```bash
cd infra/hostinger/config
chmod +x validate-config.sh
./validate-config.sh
```

Requirements:
- `jq` installed (apt-get install jq)
- All JSON files present
- Valid JSON syntax
- Required fields present

## Design Principles

### Data-Driven
**NO** hardcoded service names in deployment scripts. Everything comes from JSON configuration.

**Before (hardcoded):**
```bash
if echo "$CHANGED_FILES" | grep -q "^apps/api-server/"; then
  SERVICES_TO_BUILD="$SERVICES_TO_BUILD api-server"
fi
```

**After (data-driven):**
```bash
for service in $(jq -r '.services | keys[]' service-map.json); do
  SOURCE_PATH=$(jq -r ".services[\"$service\"].source_path" service-map.json)
  if echo "$CHANGED_FILES" | grep -q "^$SOURCE_PATH/"; then
    SERVICES_TO_BUILD="$SERVICES_TO_BUILD $service"
  fi
done
```

### Maintainable
- Add new service: Edit service-map.json only
- Add new smoke test: Edit smoke-tests.json only
- Change timeouts: Edit deployment-config.json only
- NO script changes required

### Observable
All configuration is human-readable JSON with clear field names and descriptions.

## Adding a New Service

1. Add to `service-map.json`:
```json
"new-service": {
  "name": "new-service",
  "source_path": "apps/new-service",
  "compose_name": "new-service",
  "image_name": "new-service",
  "dependencies": ["packages/ui"],
  "health_check_required": true
}
```

2. Add smoke test to `smoke-tests.json`:
```json
"new-service": {
  "name": "New Service Health",
  "method": "GET",
  "url": "http://new-service:3012/health",
  "expected_status": 200,
  "required": true,
  "execute_from": "nginx"
}
```

3. Validate:
```bash
./validate-config.sh
```

4. Deploy:
```bash
../scripts/deploy-production.sh
```

The deployment system automatically detects and builds the new service.

## Version History

- **v3.0** - Data-driven configuration (Phase 1)
- **v2.0** - Smart incremental deployment with jq
- **v1.0** - Basic deployment script

## Next Phases

- **Phase 2**: Reusable function library (lib-deployment.sh)
- **Phase 3**: Refactor deploy-production.sh to use library
- **Phase 4**: Deployment hardening (locks, resource checks)
- **Phase 5**: Docker image-based rollback framework

## Architecture Decisions

See `ARCHITECTURE_DECISIONS.md` for detailed explanations of:
- Why JSON over YAML
- Why data-driven over hardcoded
- Field naming conventions
- Version strategy
- Trade-offs and alternatives considered
