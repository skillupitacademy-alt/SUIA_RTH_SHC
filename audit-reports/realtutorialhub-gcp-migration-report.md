# RealTutorialHub Incorporation and GCP Migration Report

Generated: 2026-05-21 21:54:29 +05:30

## Scope

Assess how to incorporate `D:\onlinewebsites\realtutorialhub` into the current `D:\onlinewebsites\quiz-platform` ecosystem, determine what can be inferred about the current production hosting for `www.realtutorialhub.com`, and recommend a GCP migration path while keeping Cloudflare DNS.

## Implementation Status

Updated on 2026-05-21:

- Created `apps/realtutorialhub-site` from the standalone `D:\onlinewebsites\realtutorialhub` project.
- Registered it as pnpm workspace package `@quiz/realtutorialhub-site`.
- Kept it as a static-export Next.js app for the public marketing site.
- Added a small Node static server for Cloud Run runtime compatibility.
- Added `apps/realtutorialhub-site/Dockerfile` for Artifact Registry / Cloud Run deployment.
- Added `cloudbuild.realtutorialhub-site.yaml` to build, push, and deploy the Cloud Run service.
- Added the app to root `build:all` and `typecheck:all` filters.
- Updated `pnpm-lock.yaml` for the new workspace package.
- Verified:
  - `pnpm --filter @quiz/realtutorialhub-site build`
  - `pnpm --filter @quiz/realtutorialhub-site type-check`
  - local runtime smoke checks for `/`, `/courses/full-stack-java`, and `/Zero.webp` on port `3004`
- Docker CLI is installed locally, but Docker Desktop's Linux engine was not running, so local `docker build` validation could not be completed in this environment.
- Built and pushed the Cloud Run image through Cloud Build:
  - image: `asia-south1-docker.pkg.dev/project-48af6a2d-e8bb-46dd-a58/quiz-platform/realtutorialhub-site:90947e94`
  - digest: `sha256:18399ed64c8b283e25ba57f409495125f524be41b58ca190092c99a27699ef07`
- Deployed Cloud Run service:
  - service: `realtutorialhub-site`
  - region: `asia-south1`
  - revision: `realtutorialhub-site-00001-xmp`
  - URL: `https://realtutorialhub-site-plldp3atca-el.a.run.app`
  - public access: enabled through `roles/run.invoker` for `allUsers`
- Smoke tested deployed Cloud Run URL:
  - `/` returned `200 OK`
  - `/courses/full-stack-java` returned `200 OK`
  - `/Zero.webp` returned `200 OK`
- Cloud Build's default compute service account initially lacked Cloud Run deploy permissions. Added:
  - `roles/run.admin`
  - `roles/iam.serviceAccountUser`

Updated after shared marketing extraction:

- Refactored `apps/realtutorialhub-site` into a thin brand wrapper around `@quiz/marketing-site`.
- Rebuilt successfully with the shared marketing package.
- Redeployed through Cloud Build:
  - image: `asia-south1-docker.pkg.dev/project-48af6a2d-e8bb-46dd-a58/quiz-platform/realtutorialhub-site:shared-90947e94`
  - digest: `sha256:a906bf1b3ed8bcdbc2e65caeccc111026e0138b104fdd0d89ad6d927bb9a724b`
  - revision: `realtutorialhub-site-00002-grl`
  - traffic: `100%`
- Native Cloud Run domain mappings are not available in `asia-south1`, so Cloudflare Worker routing was used.
- Added Worker router `marketing-sites-gcp-router` with routes:
  - `www.realtutorialhub.com/*`
  - `realtutorialhub.com/*`
- Validated production hostnames through Cloudflare:
  - `https://www.realtutorialhub.com/` -> `200`, title `Real Tutorial Hub`
  - `https://realtutorialhub.com/` -> final URL `https://www.realtutorialhub.com/`
  - `https://www.realtutorialhub.com/courses/full-stack-java` -> `200`

## Current Local Projects

### `quiz-platform`

- Monorepo using pnpm workspaces and Turbo.
- Node engine: `20.x`.
- Already contains `apps/realtutorialhub-web`, `apps/realtutorialhub-quiz`, `apps/realtutorialhub-admin`, `apps/api-server`, shared packages, and Cloud Run-oriented Dockerfiles.
- `apps/realtutorialhub-web` already has:
  - `Dockerfile`
  - `next.config.mjs`
  - `output: 'standalone'` when `CLOUD_RUN_BUILD=true`
  - Cloud Run runtime port `3003`
  - dependencies on shared packages such as `@quiz/api-client`, `@quiz/auth`, `@quiz/db-tutorial`, `@quiz/ui`, `@quiz/observability`
  - deployment notes referencing an earlier Cloud Run redeploy for `user.realtutorialhub.com`

### `realtutorialhub`

- Standalone Next.js 16 app using npm and `package-lock.json`.
- Current `next.config.ts` uses:
  - `output: "export"`
  - `images.unoptimized: true`
- This means it is currently configured as a static export site, suitable for static hosting or CDN-backed hosting.
- Contains approximately:
  - 160 app/component/lib source files
  - 130 public assets, mostly `.webp`
- Public/live page content for `www.realtutorialhub.com` matches this standalone marketing site. The live HTML includes text such as `Zero Coding -> Dream Tech Job in 6 Months` and assets like `/Zero.webp`, which are present in the standalone app.

## Current Public DNS and Hosting Signals

Checked on 2026-05-21.

### DNS

`www.realtutorialhub.com` resolves to Cloudflare proxy IPs:

- `172.67.166.175`
- `104.21.11.170`

`realtutorialhub.com` resolves to the same Cloudflare proxy IPs.

Authoritative nameservers are Cloudflare:

- `anita.ns.cloudflare.com`
- Cloudflare SOA contact: `dns.cloudflare.com`

### HTTP headers

`https://www.realtutorialhub.com/` returns:

- `HTTP/1.1 200 OK`
- `Server: cloudflare`
- `cf-cache-status: EXPIRED`
- `Cache-Control: public, max-age=0, must-revalidate`
- no visible `x-vercel-*` headers

### Hosting conclusion

The site is definitely behind Cloudflare. From public DNS and headers alone, the origin cannot be confirmed because Cloudflare proxying hides the origin target.

There is no public evidence in the checked DNS or headers proving Vercel is the origin. If this were directly configured for Vercel without Cloudflare proxy masking, `www` commonly points to a Vercel CNAME target. Here, DNS only exposes Cloudflare IPs.

To confirm the actual origin, check the Cloudflare dashboard DNS record for `www` and apex:

- If `www` target is `cname.vercel-dns.com` or a Vercel-assigned CNAME, it is likely Vercel behind Cloudflare.
- If the target is `*.pages.dev`, it is Cloudflare Pages.
- If the target is a storage bucket, static host, VM, or custom IP, it is another origin.
- If records are proxied, temporarily switching to DNS-only on a staging subdomain is safer than exposing production origin.

## Incorporation Options

### Option A: Incorporate as a new monorepo app

Recommended if the standalone site should remain the public marketing site at `www.realtutorialhub.com`.

Plan:

1. Create or repurpose `apps/realtutorialhub-site`.
2. Move the standalone app's `app`, `components`, `lib`, `public`, `tailwind.config.js`, and static export settings into that app.
3. Convert package management from npm to pnpm workspace.
4. Rename the app package to something like `@quiz/realtutorialhub-site`.
5. Add a Cloud Run Dockerfile or Cloud Storage/Firebase Hosting deploy target depending on whether static export is retained.
6. Keep `apps/realtutorialhub-web` as the learner/tutorial portal, not the public marketing site.

Pros:

- Preserves the current live site behavior.
- Lowest risk for the `www` migration.
- Keeps marketing site separate from logged-in/tutorial app.

Cons:

- Another app to maintain.
- Some shared UI/data migration still needed.

### Option B: Merge into existing `apps/realtutorialhub-web`

Recommended only if the public marketing homepage and the learner/tutorial portal should become one app.

Plan:

1. Move standalone marketing routes into `apps/realtutorialhub-web/src/app`.
2. Migrate components into `src/components/marketing` or `src/share-branding`.
3. Move public assets into `apps/realtutorialhub-web/public`.
4. Replace the current `RTHLanding` homepage or mount the marketing site under a route such as `/marketing`.
5. Resolve Tailwind version differences and CSS conflicts.

Pros:

- One RealTutorialHub web service.
- Easier shared auth/navigation/API integration.

Cons:

- Higher regression risk.
- Current `apps/realtutorialhub-web` has a different product role and existing shared-branding architecture.
- Static export config from the standalone app conflicts with the dynamic Cloud Run app model.

## Recommended Architecture

Use Option A first:

- `www.realtutorialhub.com` -> marketing/public site from standalone `realtutorialhub`
- `user.realtutorialhub.com` or `learn.realtutorialhub.com` -> existing `apps/realtutorialhub-web`
- `quiz.realtutorialhub.com` -> `apps/realtutorialhub-quiz`
- `admin.realtutorialhub.com` -> `apps/realtutorialhub-admin`
- `api.realtutorialhub.com` -> `apps/api-server` or API gateway

This matches the current ecosystem better than merging everything into one app immediately.

## GCP Deployment Path

### For fastest migration of current `www`

Because the standalone app is configured with `output: "export"`, deploy it as a static site first:

1. Build the static export.
2. Upload generated static output to a GCP-backed static hosting target.
3. Put Cloud CDN or HTTPS Load Balancer in front if needed.
4. Point Cloudflare DNS to the GCP endpoint.

This is the lowest operational cost and best match for the current standalone config.

### For consistency with the monorepo Cloud Run ecosystem

Containerize it and deploy to Cloud Run:

1. Add it to the monorepo workspace.
2. Change `next.config` from static export to standalone server output, unless static export remains intentional.
3. Add a Dockerfile following the existing `apps/realtutorialhub-web/Dockerfile` pattern.
4. Build image with Cloud Build.
5. Push to Artifact Registry.
6. Deploy to Cloud Run.
7. Map `www.realtutorialhub.com` to the Cloud Run service through Cloudflare DNS.

Existing repo support:

- `scripts/cloudbuild-docker-image.yaml` already supports generic Docker builds with `_DOCKERFILE` and `_IMAGE`.
- Several apps already have Cloud Run-compatible Dockerfiles.

Example target image naming:

`asia-south1-docker.pkg.dev/<PROJECT_ID>/quiz-platform/realtutorialhub-site:latest`

Example Cloud Run service:

`realtutorialhub-site`

Suggested region:

`asia-south1`, if the rest of the platform is deployed there.

## Cloudflare Cutover Plan

Implemented path:

1. Deployed the GCP service and tested the Cloud Run URL.
2. Confirmed native Cloud Run custom domain mappings are blocked in `asia-south1`.
3. Added Cloudflare Worker router `marketing-sites-gcp-router`.
4. Routed `www.realtutorialhub.com` to:
   - `https://realtutorialhub-site-581488566988.asia-south1.run.app`
5. Redirected apex `realtutorialhub.com` to `www.realtutorialhub.com`.
6. Validated production traffic through Cloudflare.
7. Monitor `cf-cache-status`, 4xx/5xx rates, Core Web Vitals, Worker errors, and Cloud Run request logs.
8. Keep the old origin available for rollback until traffic is stable.

## Main Risks

- Cloudflare hides the current origin, so Vercel status cannot be proven without dashboard access.
- The standalone app has many uncommitted changes and deleted/replaced public assets. Incorporate from the current working tree only if those changes are intentional.
- Standalone app uses npm while the monorepo uses pnpm.
- Standalone app uses Tailwind 4 style config, while the existing monorepo app uses Tailwind 3 in `apps/realtutorialhub-web`.
- Standalone app has `output: "export"` while the monorepo Cloud Run apps use standalone server output.
- Current standalone metadata still says `Create Next App` in `app/layout.tsx`, which should be fixed before production migration.
- Some source comments display mojibake characters, suggesting encoding cleanup is needed.

## Recommended Next Steps

1. Run Lighthouse checks against `https://www.realtutorialhub.com/`.
2. Monitor Cloudflare Worker errors and Cloud Run request logs.
3. Keep the previous origin available until production traffic is stable.
4. If a no-Worker architecture is required later, move routing to a Google external HTTPS load balancer with serverless NEGs.

## References

- Google Cloud Run container deployment: https://cloud.google.com/run/docs/deploying
- Google Cloud Run custom domain mapping: https://docs.cloud.google.com/run/docs/mapping-custom-domains
- Vercel custom domain setup: https://vercel.com/docs/domains/set-up-custom-domain
