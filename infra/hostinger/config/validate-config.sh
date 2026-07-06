#!/usr/bin/env sh
# Validate Deployment Framework V3.1 configuration files.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR"
FAILED=0

info() { printf '%s\n' "$1"; }
ok() { printf 'OK  %s\n' "$1"; }
err() { printf 'ERR %s\n' "$1" >&2; FAILED=1; }

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    printf '%s\n' "ERR jq is required for Deployment Framework V3.1" >&2
    exit 1
  fi
}

validate_json() {
  local file="$1"
  if [ ! -f "$CONFIG_DIR/$file" ]; then
    err "$file not found"
    return
  fi
  if jq empty "$CONFIG_DIR/$file" >/dev/null 2>&1; then
    ok "$file is valid JSON"
  else
    err "$file is invalid JSON"
  fi
}

expect_version() {
  local file="$1"
  local version
  version=$(jq -r '.version // empty' "$CONFIG_DIR/$file")
  if [ "$version" = "3.1" ]; then
    ok "$file version is 3.1"
  else
    err "$file version is $version; expected 3.1"
  fi
}

validate_deployment_config() {
  local file="$CONFIG_DIR/deployment-config.json"
  jq -e '
    .deployment.state_directory and
    .deployment.history_retention and
    .deployment.lock_timeout_seconds and
    .deployment.build_timeout_seconds and
    .deployment.health_check_timeout_seconds and
    .resource_requirements.minimum_disk_free_percent and
    .resource_requirements.minimum_memory_free_percent and
    .resource_requirements.maximum_cpu_load and
    .resource_requirements.minimum_inodes_free and
    .docker.compose_project_name and
    .docker.deployment_tag_prefix and
    (.docker.keep_image_versions | type == "number") and
    (.docker.cleanup_builder_cache | type == "boolean") and
    (.change_detection.prefer_turbo_dry_run | type == "boolean") and
    .change_detection.turbo_task and
    (.change_detection.fallback_to_source_paths | type == "boolean")
  ' "$file" >/dev/null || err "deployment-config.json missing required V3.1 fields"
}

validate_service_map() {
  local file="$CONFIG_DIR/service-map.json"
  local invalid
  invalid=$(jq -r '
    .services
    | to_entries[]
    | select(
        (.value.name | type != "string") or
        (.value.source_path | type != "string") or
        (.value.compose_name | type != "string") or
        (.value.image_name | type != "string") or
        (.value.buildable | type != "boolean") or
        (.value.health_check_required | type != "boolean") or
        ((.value.buildable == true) and ((.value.package_name // "") == ""))
      )
    | .key
  ' "$file")

  if [ -n "$invalid" ]; then
    for service in $invalid; do
      err "service $service missing required V3.1 fields"
    done
  else
    ok "service-map.json service schema is valid"
  fi
}

validate_smoke_tests() {
  local file="$CONFIG_DIR/smoke-tests.json"
  local invalid
  invalid=$(jq -r '
    .tests
    | to_entries[]
    | select(
        (.value.name | type != "string") or
        (.value.method | type != "string") or
        (.value.url | type != "string") or
        (.value.expected_status | type != "number") or
        (.value.timeout_seconds | type != "number") or
        (.value.required | type != "boolean")
      )
    | .key
  ' "$file")

  if [ -n "$invalid" ]; then
    for test in $invalid; do
      err "smoke test $test missing required fields"
    done
  else
    ok "smoke-tests.json test schema is valid"
  fi

  jq -e '.runner.image and .runner.network' "$file" >/dev/null || err "smoke-tests.json runner config missing"
}

info "Validating Deployment Framework V3.1 configuration"
require_jq

for file in deployment-config.json service-map.json smoke-tests.json; do
  validate_json "$file"
  expect_version "$file"
done

validate_deployment_config
validate_service_map
validate_smoke_tests

if [ "$FAILED" -eq 0 ]; then
  ok "all configuration files are valid"
else
  err "configuration validation failed"
fi

exit "$FAILED"
