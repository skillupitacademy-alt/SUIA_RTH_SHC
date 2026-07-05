# GCP Rollback Guardrails

Status: rollback reference only. Do not decommission GCP until the Hostinger cutover has been stable for the approved observation window.

## Purpose

GCP remains the rollback platform during and immediately after the Hostinger cutover.

Do not delete, disable, or scale down Cloud Run services until:

- frontend DNS cutover is complete
- API Worker-to-VPS behavior is stable
- login smoke tests pass for all brands
- Cloudflare and VPS logs show no sustained errors
- the operator approves decommissioning separately

## Cloud Run Rollback Targets

Region: `asia-southeast1`

| Service | Role |
| --- | --- |
| `faculty-app` | SkillUp faculty frontend |
| `quiz-admin-app` | RealTutorialHub admin frontend |
| `quiz-api-server` | RealTutorialHub and SkillUp API |
| `quiz-web-app` | Shared quiz frontend |
| `realtutorialhub-web` | RealTutorialHub user/tutorial frontend |
| `skillhub-placement` | Placement app, excluded from current cutover |
| `skillhubcore-admin` | SkillHubCore admin frontend |
| `skillhubcore-service` | SkillHubCore API |
| `skillup-admin` | SkillUp admin frontend |
| `skillup-web` | SkillUp user frontend |

## Rollback Validation

Before rollback, confirm Cloud Run targets still answer:

```powershell
cmd /c gcloud.cmd run services list --region asia-southeast1
```

After rollback, validate:

- public frontend pages load through Cloudflare
- API hostnames remain Worker-routed
- login works for RealTutorialHub user
- login works for SkillUp user
- login works for SkillHubCore admin
- Hostinger VPS remains running for investigation

## Decommission Hold

Do not remove these GCP resources during rollback:

- Cloud Run services
- Cloud Build triggers
- Artifact Registry images
- Secret Manager secrets
- Cloud Storage build buckets
- IAM roles used by the existing deployment path

Decommissioning belongs to a later phase after 24-48 hours of stable production traffic or whatever observation window the operator approves.
