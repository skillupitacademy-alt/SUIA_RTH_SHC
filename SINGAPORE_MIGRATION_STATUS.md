# Singapore Migration Status

Migration started: April 4, 2026
Cloud Run region: `asia-southeast1`
Status: completed

## Completed

- Created Singapore Artifact Registry:
  - `asia-southeast1-docker.pkg.dev/project-48af6a2d-e8bb-46dd-a58/quiz-platform`
- Updated Cloud Run deployment workflow to Singapore
- Enabled Cloudflare Smart Placement
- Deployed all 10 Cloud Run services to Singapore
- Updated Cloudflare gateway production upstreams to Singapore service URLs
- Verified public admin login after cutover

## Key commits

- `c96a7538` `feat: migrate Cloud Run from Mumbai to Singapore for 50-70ms latency improvement`
- `0f537904` `chore(gateway): point production upstreams to singapore`

## Current Singapore Cloud Run services

- `quiz-api-server`
- `quiz-web-app`
- `quiz-admin-app`
- `realtutorialhub-web`
- `skillup-web`
- `skillup-admin`
- `faculty-app`
- `skillhubcore-admin`
- `skillhub-placement`
- `skillhubcore-service`

## Verification summary

Passed:
- `https://api.realtutorialhub.com/api/health/live`
- `https://user.realtutorialhub.com/`
- `https://admin.realtutorialhub.com/`
- `https://user.skillupitacademy.com/api/healthz`
- `https://admin.skillupitacademy.com/api/healthz`
- `https://faculty.skillupitacademy.com/api/healthz`
- `https://api.skillhubcore.in/healthz`
- public admin login for `admin@test.com`
- public admin session lookup after login

Observed note:
- `https://api.realtutorialhub.com/api/health/ready` returned `404` during post-cutover checks, so the verification script now uses `health/live` instead.

## Follow-up

- Monitor latency and error rates for 24-48 hours
- Move Upstash Redis closer to Singapore if not already there
- Clean up old Mumbai resources after the migration is considered stable
