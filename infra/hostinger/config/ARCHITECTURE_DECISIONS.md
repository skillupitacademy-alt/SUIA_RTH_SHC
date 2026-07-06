# Architecture Decisions: Deployment Framework V3.2

**Date**: 2026-07-06
**Status**: Implemented

This document records the current decisions behind the Hostinger VPS deployment framework.

## Context

The platform runs on a Hostinger VPS with Docker Compose, Nginx, Cloudflare Worker routing, Neon, Upstash, and R2. Deployment is local-Git driven and executed on the VPS. The framework must be deterministic, auditable, and safe to run under operational pressure.

## Current Decisions

### JSON Configuration

Deployment behavior is configured with JSON files and parsed with mandatory `jq`. The scripts fail before mutation if `jq` is missing or JSON validation fails.

### Separate Configuration Files

The configuration is split into deployment behavior, service metadata, and HTTP smoke tests.

### Turbo Owns Dependency Detection

`service-map.json` maps services to workspace package names, but it does not duplicate package dependency arrays. Turbo dry-run output is the first source for affected package detection. If Turbo output is unavailable or its JSON schema does not contain a `packages` array, the framework logs a fallback and uses conservative source-path behavior.

### Fail-Closed Validation

Deployment aborts on missing tools, invalid JSON, insufficient resources, Docker failures, health failures, or required smoke-test failures. There is no interactive bypass after failed validation.

### Boot-Aware Deployment Lock

The lock file stores PID, hostname, boot ID, process start ticks, and acquisition time to reduce PID-reuse and reboot risks.

### Docker Inspect Health

Health checks use container IDs and `docker inspect`. Services with no Docker HEALTHCHECK are accepted only if their container is running.

### Dynamic Smoke-Test Network

Smoke tests run from `curlimages/curl` on the internal Docker network. When `runner.network` is `auto`, the network is resolved from rendered Compose config, with a Compose-project fallback.

### Immutable Deployment Tags

Every built service image is tagged as:

```text
<image-name>:deployment-<deployment-id>
```

The deployment state records image name, tag, image ID, optional repo digest, and an image-manifest schema version.

### Exact Image Rollback

Rollback reads a selected deployment history file, verifies every recorded image tag, verifies repo digest when present and available locally, falls back to image ID when digest is unavailable, retags exact images as `:latest`, restarts affected services, and runs validation.

### Deployment Provenance

Deployment state records hostname, operator, Git branch, workspace path, Compose project, Docker version, and Compose version.

### Conservative Cleanup

Cleanup prunes dangling images and optional builder cache only. Deployment tags are kept according to `keep_image_versions`, and tags referenced by retained deployment history are never removed.

### Old Entrypoints Are Disabled

Older V3.0 backup entrypoints are retained only as stubs that exit and point operators to `deploy-production.sh`.

## Operational Guarantees

- Deployments are data-driven and avoid hardcoded service lists.
- Validation happens before service mutation.
- Required failures abort instead of prompting to continue.
- Rollback is image-manifest based, not Git based.
- Deployment state contains commit, deployment ID, Compose checksum, duration, provenance, image manifest schema, and image manifest.
