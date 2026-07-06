# Architecture Decisions: Deployment Framework V3.1

**Date**: 2026-07-06
**Status**: Implemented

This document records the current decisions behind the Hostinger VPS deployment framework.

## Context

The platform runs on a Hostinger VPS with Docker Compose, Nginx, Cloudflare Worker routing, Neon, Upstash, and R2. Deployment is local-Git driven and executed on the VPS. The framework must be deterministic, auditable, and safe to run under operational pressure.

## Decision 1: JSON Configuration

Deployment behavior is configured with JSON files:

- `deployment-config.json`
- `service-map.json`
- `smoke-tests.json`

`jq` is mandatory. The scripts fail before mutation if `jq` is missing or JSON validation fails.

**Reason**: JSON plus `jq` gives deterministic shell parsing. Optional parser fallbacks are too risky for deployment state and rollback manifests.

## Decision 2: Three Configuration Files

The configuration is split by responsibility:

- Deployment behavior and thresholds.
- Service metadata.
- HTTP smoke tests.

**Reason**: Separate files reduce coupling and make reviews easier.

## Decision 3: Service Map Avoids Duplicated Dependency Graphs

`service-map.json` stores service identity, source path, Compose name, image name, package name, buildability, and health requirement. It does not duplicate package dependency arrays.

**Reason**: Turbo already owns the monorepo package graph. Duplicating dependencies in deployment JSON becomes stale.

## Decision 4: Turbo Affected Detection First

When possible, deployment uses Turbo dry-run output to map affected workspace packages to services. If Turbo is unavailable, source-path fallback is used. Shared package changes with no Turbo output rebuild all buildable services.

**Reason**: This balances correctness and availability. The fallback is conservative.

## Decision 5: Fail-Closed Validation

The framework aborts on:

- Missing required tools.
- Invalid JSON.
- Insufficient disk, memory, CPU, or inode availability.
- Docker, Compose, or BuildKit failure.
- Required health check failure.
- Required smoke test failure.

**Reason**: Production deployment should not continue after failed validation.

## Decision 6: Boot-Aware Deployment Lock

The lock file stores PID, hostname, boot ID, process start ticks, and acquisition time.

**Reason**: PID reuse and VPS reboots can make simple PID locks unsafe.

## Decision 7: Health Uses Docker Inspect

Health checks use container IDs and `docker inspect`. Services with no Docker HEALTHCHECK are accepted only if their container is running.

**Reason**: This avoids brittle parsing of Compose display output.

## Decision 8: Smoke Tests Use an Ephemeral Curl Runner

Smoke tests run from `curlimages/curl` on the internal Docker network configured in `smoke-tests.json`.

**Reason**: Nginx should not be assumed to contain test utilities such as `wget` or `curl`.

## Decision 9: Immutable Deployment Image Tags

Every built service image is tagged as:

```text
<image-name>:deployment-<deployment-id>
```

The deployment state records image name, tag, image ID, and optional repo digest.

**Reason**: Rollback must refer to exact artifacts, not Docker image list order.

## Decision 10: Exact Image Rollback

Rollback reads a selected deployment history file, verifies every recorded image tag and image ID, retags those exact images as `:latest`, restarts the affected services, and runs health and smoke validation.

**Reason**: "Previous image" based on `docker images` ordering is unsafe and nondeterministic.

## Decision 11: Deployment State Is Outside Git

Deployment state is stored under `/opt/platform/state`, with retained history records.

**Reason**: State is VPS-specific runtime evidence, not source code. Git remains the source for scripts and configuration.

## Decision 12: Cleanup Is Conservative

Cleanup prunes dangling images and only prunes builder cache when explicitly enabled in configuration. Immutable deployment tags are retained according to `keep_image_versions`.

**Reason**: Aggressive cleanup can destroy rollback artifacts.

## Decision 13: Old Entrypoints Are Disabled

Older V3.0 backup entrypoints are retained only as stubs that exit and point operators to `deploy-production.sh`.

**Reason**: Leaving old runnable scripts would preserve unsafe interactive bypass behavior.

## Operational Guarantees

- Deployments are data-driven and avoid hardcoded service lists.
- Validation happens before service mutation.
- Required failures abort instead of prompting to continue.
- Rollback is image-manifest based, not Git based.
- The deployment state contains commit, deployment ID, Compose checksum, duration, and image manifest.
