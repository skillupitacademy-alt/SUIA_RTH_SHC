# Architecture Decisions: Deployment Framework V3

**Date**: 2026-07-06  
**Phase**: 1 (Deployment Metadata)  
**Status**: Implemented

This document explains every design decision, trade-off, and rationale for the Deployment Framework V3 configuration system.

## Context

The quiz-platform runs on:
- Hostinger VPS (2 vCPU, 8 GB RAM, 100 GB NVMe)
- Ubuntu 24.04
- Docker Compose with 10+ services
- Cloudflare Worker for routing
- Local Git workflow (no remote repository)
- Codex-assisted deployments

Previous deployment system (v2.0) had hardcoded service names scattered throughout scripts, making maintenance difficult and error-prone.

## Decision 1: JSON Configuration Over YAML

**Decision**: Use JSON for all configuration files.

**Rationale**:
1. **Shell compatibility**: `jq` provides robust JSON parsing in shell scripts
2. **Validation**: JSON has stricter syntax rules, catches errors early
3. **No dependencies**: JSON is universal, no additional parsers needed
4. **Proven**: Already using JSON for deployment state
5. **Performance**: `jq` is faster than YAML parsers for shell usage

**Alternatives Considered**:
- **YAML**: More human-readable but requires `yq` (less standard)
- **TOML**: Good for config but limited shell tooling
- **Shell variables**: Not structured, hard to validate

**Trade-offs**:
- Less readable than YAML (no comments in JSON proper)
- More verbose (quoted strings, no multi-line)
- **Mitigation**: Added top-level "description" fields, separate README

**Why JSON wins**: Native `jq` support, validation, compatibility.

## Decision 2: Three Separate Configuration Files

**Decision**: Split configuration into three files:
1. `deployment-config.json` - System behavior
2. `service-map.json` - Service definitions
3. `smoke-tests.json` - Validation tests

**Rationale**:
1. **Separation of concerns**: Each file has single responsibility
2. **Independent updates**: Change tests without touching service map
3. **Reusability**: smoke-tests.json could be used by monitoring
4. **Clarity**: Easier to find relevant configuration
5. **Validation**: Each file can be validated independently

**Alternatives Considered**:
- **Single monolithic file**: Simpler but harder to maintain
- **Per-service config**: Too granular, duplication
- **Config + overrides**: Unnecessary complexity for our scale

**Trade-offs**:
- More files to manage
- Need validation script
- **Mitigation**: Created validate-config.sh, clear README

**Why three files win**: Maintainability, clarity, independent validation.

## Decision 3: Complete Service Metadata in service-map.json

**Decision**: Each service includes:
```json
{
  "name": "service-name",
  "source_path": "apps/service-name",
  "compose_name": "service-name",
  "image_name": "service-name",
  "dependencies": ["packages/x"],
  "health_check_required": true
}
```

**Rationale**:
1. **Single source of truth**: All service info in one place
2. **Change detection**: `source_path` enables incremental builds
3. **Dependency awareness**: Rebuild dependents when shared packages change
4. **Health validation**: Know which services need health checks
5. **Docker integration**: compose_name and image_name for automation

**Alternatives Considered**:
- **Minimal config** (name only): Too limited, logic stays in scripts
- **Auto-discovery**: Fragile, assumes conventions
- **Separate dependency file**: Unnecessary split

**Trade-offs**:
- Redundancy when names match (most cases)
- Manual maintenance when adding services
- **Mitigation**: Clear README, validation script checks required fields

**Why complete metadata wins**: Enables full automation, explicit over implicit.

## Decision 4: Separate Health Checks and Smoke Tests

**Decision**: 
- Health checks: Docker Compose built-in HEALTHCHECK
- Smoke tests: HTTP endpoint validation in smoke-tests.json

**Rationale**:
1. **Different purposes**: 
   - Health checks: "Is container alive?"
   - Smoke tests: "Does application work end-to-end?"
2. **Different timing**: Health checks continuous, smoke tests post-deploy
3. **Different scope**: Health checks per-container, smoke tests cross-service
4. **Flexibility**: Can test external endpoints, complex scenarios

**Alternatives Considered**:
- **Only health checks**: Insufficient, doesn't test HTTP layer
- **Only smoke tests**: Misses container-level failures
- **Combined system**: Confusing, different purposes

**Trade-offs**:
- Two validation systems to maintain
- **Mitigation**: Both use JSON config, clear documentation

**Why separation wins**: Different purposes, better validation coverage.

## Decision 5: Smoke Tests Execute from Nginx Container

**Decision**: Run `wget` from nginx container rather than deployment script host.

**Rationale**:
1. **Network accuracy**: Tests internal Docker network (production routing)
2. **Security**: No need to expose health endpoints externally
3. **Reality check**: Tests same network path as Cloudflare Worker → Nginx → Service
4. **Consistency**: Same environment as production traffic

**Alternatives Considered**:
- **Host execution**: Would require exposed ports (security risk)
- **Separate test container**: Overhead, another moving part
- **curl from VPS**: Tests wrong network layer

**Trade-offs**:
- Dependency on nginx container running
- **Mitigation**: nginx starts first in Compose, always available

**Why nginx execution wins**: Tests production network path accurately.

## Decision 6: Resource Requirements as Configuration

**Decision**: Define minimum resources in deployment-config.json:
```json
{
  "minimum_disk_free_percent": 15,
  "minimum_memory_free_percent": 20,
  "maximum_cpu_load": 8.0,
  "minimum_inodes_free": 10000
}
```

**Rationale**:
1. **Prevents failures**: Catch resource issues before deployment starts
2. **Configurable**: Adjust thresholds without script changes
3. **Documented**: Clear what resources are required
4. **Maintainable**: Easy to tune based on experience

**Alternatives Considered**:
- **Hardcoded in script**: Inflexible, hidden assumptions
- **No checks**: Risk of failed deployments, disk full errors
- **Auto-calculate**: Complex, unpredictable

**Trade-offs**:
- May need adjustment per environment
- **Mitigation**: Conservative defaults, clear documentation

**Why configuration wins**: Flexibility, visibility, maintainability.

## Decision 7: Deployment Triggers as Feature Flags

**Decision**: Explicit boolean flags for deployment behaviors:
```json
{
  "rebuild_all_on_shared_change": true,
  "rebuild_all_on_root_config_change": true,
  "restart_all_on_env_change": true,
  "restart_nginx_on_config_change": true
}
```

**Rationale**:
1. **Explicit**: Clear what triggers what action
2. **Configurable**: Can disable for testing/debugging
3. **Self-documenting**: No need to read script logic
4. **Safe defaults**: Opt for safety (rebuild all)

**Alternatives Considered**:
- **Hardcoded behavior**: Inflexible
- **Complex rules engine**: Over-engineering
- **Auto-detection only**: Not always correct

**Trade-offs**:
- Boolean flags can't express complex rules
- **Mitigation**: Chosen flags cover 99% of cases

**Why feature flags win**: Clarity, safety, flexibility.

## Decision 8: Version 3.0 for Breaking Change

**Decision**: Jump from v2.0 to v3.0 for configuration introduction.

**Rationale**:
1. **Semantic versioning**: Major change in architecture
2. **Breaking change**: Old scripts won't work with new config
3. **Clear signal**: New system, not incremental improvement
4. **Forward compatibility**: Room for 3.x iterations

**Alternatives Considered**:
- **v2.1**: Understates the change magnitude
- **v1.0**: Already taken by original system
- **No version**: Impossible to track compatibility

**Trade-offs**:
- Version inflation (skip 2.x series)
- **Mitigation**: Document version history clearly

**Why 3.0 wins**: Accurate semantic versioning, clear breaking change.

## Decision 9: State Directory Outside Repository

**Decision**: Store deployment state at `/opt/platform/state` (not in Git).

**Rationale**:
1. **VPS-specific**: State is per-environment, not code
2. **No Git pollution**: History stays in history, not version control
3. **Persistent**: Survives repository updates via Codex
4. **Separation**: Infrastructure state separate from application code
5. **Already established**: v2.0 pattern, maintain continuity

**Alternatives Considered**:
- **In repository**: Would pollute version control
- **In /var**: Not application-specific enough
- **In /tmp**: Would be deleted

**Trade-offs**:
- State not backed up with code
- **Mitigation**: History retention (30 deployments), backup state file

**Why /opt/platform/state wins**: Clean separation, persistence, established pattern.

## Decision 10: Keep 30 Deployment History Records

**Decision**: Retain last 30 deployments in history directory.

**Rationale**:
1. **Audit trail**: ~1 month of deployments (1/day average)
2. **Rollback window**: Can investigate recent deployments
3. **Disk usage**: ~30 KB for 30 JSON files (negligible)
4. **Performance**: List/cleanup fast with 30 files
5. **Operational**: Covers typical incident investigation window

**Alternatives Considered**:
- **7 days**: Too short for incident investigation
- **90 days**: Unnecessary, rarely need older history
- **Unlimited**: Disk waste, slow cleanup

**Trade-offs**:
- May not cover long-term audit needs
- **Mitigation**: System logs capture long-term history

**Why 30 wins**: Balances audit needs with simplicity and disk usage.

## Key Principles Applied

### 1. Data-Driven Over Hardcoded
Every service name, path, URL comes from JSON. Scripts are generic loops.

### 2. Explicit Over Implicit
Clear configuration over "clever" auto-detection. Predictable behavior.

### 3. Safe Defaults
When in doubt, rebuild more than necessary. Safety over speed.

### 4. Single Source of Truth
Each fact stored once. service-map.json is authoritative for services.

### 5. Fail Fast
Validation upfront. Don't start deployment with invalid config.

### 6. Observable
All configuration human-readable. Easy to inspect current settings.

### 7. Maintainable
Adding a service: edit 2 JSON files, no script changes.

### 8. Recoverable
State files, history, backups. Can always understand what was deployed.

## Future Considerations

### What's Deferred to Later Phases

**Phase 2-5 decisions**:
- Deployment locking mechanism (Phase 4)
- Image versioning strategy (Phase 5)
- Rollback implementation (Phase 5)
- Function library organization (Phase 2)

**Intentionally not addressed**:
- Multi-environment support (single VPS only)
- Remote state storage (local only)
- Notification system (out of scope)
- Metrics collection (monitoring separate concern)

### When to Revisit These Decisions

**Trigger for reevaluation**:
1. **Scale change**: 20+ services → consider auto-discovery
2. **Multi-environment**: Staging + prod → rethink state storage
3. **Team growth**: 5+ developers → consider CI/CD integration
4. **Complexity**: If JSON config becomes unwieldy → consider alternatives

## Validation

All decisions validated through:
1. ✅ JSON syntax validation (PowerShell ConvertFrom-Json)
2. ✅ validate-config.sh script passes
3. ✅ README.md documents all fields
4. ✅ This document explains all choices

## Conclusion

Phase 1 establishes a **data-driven**, **maintainable**, **observable** configuration foundation. All deployment logic will be driven by these JSON files, eliminating hardcoded service names and enabling safe, incremental improvements in future phases.

**Next**: Phase 2 will extract reusable functions into lib-deployment.sh using these configuration files.
