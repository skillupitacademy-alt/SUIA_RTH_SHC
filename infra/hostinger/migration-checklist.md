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

- [x] Generate Nginx config.
- [x] Add Cloudflare Origin Certificate paths.
- [x] Add Cloudflare real IP handling.
- [x] Add WebSocket support.
- [x] Add security headers.
- [x] Add access and error log layout.

## Phase 4: Operational Scripts

- [x] Generate `build.sh`.
- [x] Generate `verify.sh`.
- [x] Generate `deploy.sh`.
- [x] Generate `rollback.sh`.
- [x] Generate `health.sh`.
- [x] Generate `backup.sh`.
- [x] Generate `restore.sh`.

## Phase 5: Monitoring

- [x] Define public HTTP checks.
- [x] Define internal container checks.
- [x] Define external dependency checks.
- [x] Define alert thresholds.
- [x] Define log retention plan.
- [x] Define dashboard requirements.

## Phase 6: VPS Bootstrap Planning

- [x] Add ordered enterprise bootstrap execution checklist.
- [x] Add VS Code Remote SSH workflow.
- [x] Add SSH key setup guide.
- [x] Add Codex remote operating rules.
- [x] Define Ubuntu 24.04 base preparation.
- [x] Define deploy user and permissions.
- [x] Define `/opt/platform` filesystem layout.
- [x] Define UFW and Hostinger firewall requirements.
- [x] Define Docker installation plan.
- [x] Define Cloudflare Origin Certificate placement.

## Phase 7: Staging Validation

- [ ] Provision VPS manually or with reviewed bootstrap.
- [ ] Install Docker and Nginx.
- [ ] Install Cloudflare Origin Certificate.
- [ ] Deploy containers to staging only.
- [ ] Validate health endpoints.
- [ ] Validate login and cookie flows.
- [ ] Validate API Worker behavior.
- [ ] Validate rollback path.

## Phase 8: Production Cutover

- [ ] Lower DNS TTL where applicable.
- [ ] Confirm Cloud Run remains healthy.
- [ ] Apply reviewed Cloudflare routing changes.
- [ ] Monitor logs, errors, CPU, memory, disk, and latency.
- [ ] Keep Cloud Run available for rollback.
- [ ] Decommission GCP only after a separate review.
