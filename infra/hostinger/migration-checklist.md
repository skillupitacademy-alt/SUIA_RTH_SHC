# Hostinger Migration Checklist

Status: planning checklist only.

## Phase 1: Planning

- [x] Define migration constraints.
- [x] Generate domain routing matrix.
- [x] Choose `asia-southeast1` as the migration scope.
- [x] Create ADRs for core architecture decisions.
- [x] Create environment variable template.
- [x] Create verification checklist.
- [ ] Review API routing model.
- [ ] Review root/apex domain scope.
- [ ] Review whether `asia-south1` marketing services remain excluded.

## Phase 2: Compose Design

- [x] Generate Docker Compose files.
- [x] Define internal networks.
- [x] Define service health checks.
- [x] Define volumes.
- [x] Verify no app container publishes public ports.

## Phase 3: Nginx Design

- [ ] Generate Nginx config.
- [ ] Add Cloudflare Origin Certificate paths.
- [ ] Add Cloudflare real IP handling.
- [ ] Add WebSocket support.
- [ ] Add security headers.
- [ ] Add access and error log layout.

## Phase 4: Operational Scripts

- [ ] Generate `build.sh`.
- [ ] Generate `verify.sh`.
- [ ] Generate `deploy.sh`.
- [ ] Generate `rollback.sh`.
- [ ] Generate `health.sh`.
- [ ] Generate `backup.sh`.
- [ ] Generate `restore.sh`.

## Phase 5: Staging Validation

- [ ] Provision VPS manually or with reviewed bootstrap.
- [ ] Install Docker and Nginx.
- [ ] Install Cloudflare Origin Certificate.
- [ ] Deploy containers to staging only.
- [ ] Validate health endpoints.
- [ ] Validate login and cookie flows.
- [ ] Validate API Worker behavior.
- [ ] Validate rollback path.

## Phase 6: Production Cutover

- [ ] Lower DNS TTL where applicable.
- [ ] Confirm Cloud Run remains healthy.
- [ ] Apply reviewed Cloudflare routing changes.
- [ ] Monitor logs, errors, CPU, memory, disk, and latency.
- [ ] Keep Cloud Run available for rollback.
- [ ] Decommission GCP only after a separate review.
