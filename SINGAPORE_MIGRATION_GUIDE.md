# Singapore Region Migration Guide

Status: prepared in repo
Target region: `asia-southeast1`
Expected app-to-db improvement: about 50-70ms per DB-backed request

## Current state
- Cloud Run deployment workflow now targets `asia-southeast1`
- Artifact Registry image paths in workflow now target `asia-southeast1-docker.pkg.dev`
- Gateway config enables Cloudflare Smart Placement in [wrangler.toml](/d:/onlinewebsites/quiz-platform/services/api-gateway/wrangler.toml)
- Databases in `.env.local` already point to Neon Singapore hosts in `ap-southeast-1`

## Required execution steps
1. Create Artifact Registry in Singapore:
```bash
gcloud artifacts repositories create quiz-platform \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Quiz Platform Docker images - Singapore"
```

2. Push the workflow changes to `main`.

3. Let GitHub Actions deploy all Cloud Run services to `asia-southeast1`.

4. After deployment, get the new Singapore Cloud Run URLs:
```bash
gcloud run services list --region=asia-southeast1 --format='table(metadata.name,status.url)'
```

5. Update [wrangler.toml](/d:/onlinewebsites/quiz-platform/services/api-gateway/wrangler.toml) production upstream URLs to the new Singapore `run.app` URLs.

6. Deploy the production gateway.

## Services that will move
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

## Vendor notes
- Cloud Run: move to Singapore
- Artifact Registry: create new Singapore repo
- Cloudflare Workers: global, but Smart Placement can reduce backend latency
- Upstash Redis: recommended to recreate or move primary closer to Singapore
- QStash: Singapore is not currently available
- Upstash Vector: Singapore is not currently available
- Resend: Singapore is not currently available; Tokyo is the closest Asia sending region

## Verification after migration
1. Run service health checks against the Singapore Cloud Run deployments.
2. Verify gateway routes point to the new Singapore URLs.
3. Test:
   - admin login
   - user login
   - dashboard/API latency
   - report/export flows
4. Compare latency before and after migration.

## Rollback
1. Revert the workflow region/image-path changes.
2. Redeploy Cloud Run back to `asia-south1`.
3. Restore gateway upstream URLs to the prior Mumbai `run.app` targets.
