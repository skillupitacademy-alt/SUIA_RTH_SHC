# Dashboard Requirements

Status: implementation reference.

## VPS Dashboard

Required panels:

- CPU usage.
- Memory usage.
- Disk usage.
- Network throughput.
- Docker container status.
- Nginx 2xx/3xx/4xx/5xx counts.
- Nginx upstream response time.
- Public endpoint probe status.
- TLS certificate age where available.

## Application Dashboard

Required panels:

- API health.
- Login error rate.
- Quiz/exam flow errors.
- Tutorial flow errors.
- Admin app errors.
- Placement app errors.
- Queue and background job status if enabled.

## Migration Dashboard

During cutover, show:

- Cloud Run rollback endpoints.
- VPS endpoints.
- Cloudflare edge status.
- Worker error rate.
- DNS propagation state where available.

## Provisioning

Datasource provisioning is defined in:

```text
infra/hostinger/monitoring/grafana/provisioning/datasources/datasources.yml
```

Dashboard JSON files can be added under `infra/hostinger/monitoring/grafana/provisioning/dashboards/` in a later phase.
