# Alert Plan

Status: planning reference only.

## Severity Levels

| Severity | Meaning | Example |
| --- | --- | --- |
| P1 | User-facing outage | Public frontend or API unavailable. |
| P2 | Degraded production behavior | High error rate, elevated latency, one critical service unhealthy. |
| P3 | Capacity or maintenance warning | Disk, CPU, or memory nearing threshold. |

## Suggested Thresholds

| Signal | Warning | Critical |
| --- | ---: | ---: |
| Disk usage | 75% | 90% |
| Memory usage | 80% for 10 minutes | 90% for 5 minutes |
| CPU load | 75% for 15 minutes | 90% for 10 minutes |
| Public HTTP availability | one failed check | three failed checks |
| 5xx rate | 2% for 5 minutes | 5% for 5 minutes |
| TLS certificate age | review at 30 days before expiry | urgent at 7 days before expiry |

## Required Alert Destinations

Choose later:

- email
- Telegram/Slack/Discord
- Sentry alerts
- Cloudflare notifications
- uptime provider notifications

Do not enable noisy alerts until thresholds are reviewed.
