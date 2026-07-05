# Dashboard Requirements

Status: planning reference only.

## VPS Dashboard

Required panels:

- CPU usage.
- Memory usage.
- Disk usage.
- Network throughput.
- Docker container status.
- Nginx 2xx/3xx/4xx/5xx counts.
- Nginx upstream response time.

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
