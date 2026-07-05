# Monitoring Plan

Status: implementation templates. Review before starting on the VPS.

This directory defines the local monitoring stack for the Hostinger VPS. The stack binds Grafana, Prometheus, and Loki to `127.0.0.1` only, so dashboards are accessed through an SSH tunnel and are not publicly exposed.

## Goals

- Detect service outage quickly.
- Detect VPS resource exhaustion before user impact.
- Preserve enough logs for rollback and incident review.
- Keep Cloud Run rollback health visible during migration.
- Verify Cloudflare edge behavior after cutover.

## Documents

- `checks.md`: required synthetic and service checks.
- `alerts.md`: alert thresholds and severity levels.
- `logs.md`: log retention and review plan.
- `dashboards.md`: dashboard requirements.

## Stack

- Prometheus: metrics and alert rules.
- Grafana: dashboards.
- Loki: log storage.
- Promtail: Nginx and Docker log shipping.
- Node Exporter: VPS host metrics.
- cAdvisor: Docker container metrics.
- Blackbox Exporter: public endpoint probes.
- Nginx Prometheus Exporter: Nginx status metrics.

## Start

Run on the VPS after setting a strong password:

```bash
cd /opt/platform/apps/quiz-platform
export GRAFANA_ADMIN_PASSWORD='<store-in-password-manager>'
./infra/hostinger/scripts/monitoring-up.sh
```

Access locally from your workstation:

```bash
ssh -L 3009:127.0.0.1:3009 -L 9090:127.0.0.1:9090 root@72.61.115.49
```

Then open:

```text
http://127.0.0.1:3009
```

## Stop

```bash
./infra/hostinger/scripts/monitoring-down.sh
```
