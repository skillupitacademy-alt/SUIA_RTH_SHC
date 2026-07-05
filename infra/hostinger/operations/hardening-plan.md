# Hostinger Operations Hardening Plan

Status: next phase after retained-Worker origin cutover.

## Phase A: Monitoring

- Start Prometheus, Grafana, Loki, Promtail, Node Exporter, cAdvisor, and Blackbox Exporter.
- Bind dashboards to `127.0.0.1` only.
- Access dashboards through SSH tunnel.
- Confirm public endpoint probes and container metrics.

## Phase B: Security

- Rotate exposed Cloudflare and SSH credentials.
- Install Fail2Ban.
- Enable unattended security upgrades.
- Review SSH root/password policy.
- Confirm only ports `80`, `443`, and SSH are reachable.

## Phase C: Backups

- Run local configuration backup.
- Export Cloudflare DNS state.
- Export Worker configuration.
- Record where Neon, Upstash, R2, and Resend backups are managed.

## Phase D: Alerts

- Configure alert destination.
- Enable alerts for endpoint down, disk, memory, Docker unhealthy, and Nginx 5xx spikes.
- Test one non-production alert.

## Phase E: Observation

- Observe for 7-14 days.
- Keep `placement.skillhubcore.in` on Cloud Run until separately validated.
- Decommission GCP only after explicit approval.
