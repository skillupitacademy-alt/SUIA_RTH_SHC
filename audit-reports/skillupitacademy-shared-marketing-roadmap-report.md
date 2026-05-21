# SkillUp IT Academy Shared Marketing Roadmap Report

Generated: 2026-05-21

## Scope

Assess how to incorporate `D:\onlinewebsites\skillupitacademy` into the current `D:\onlinewebsites\quiz-platform` ecosystem for `www.skillupitacademy.com`, while avoiding migration of old PHP, Laravel, backend, React, or page code.

The intended direction is:

- Keep `www.realtutorialhub.com` and `www.skillupitacademy.com` as separate public brands.
- Share the same marketing layout, sections, content structure, course presentation, deployment process, and maintenance workflow.
- Keep only brand-specific identity different:
  - logo
  - primary color
  - secondary/accent color
  - metadata
  - domain/canonical URL

## Implementation Status

Updated on 2026-05-21:

- Created shared marketing package:
  - `packages/marketing-site`
  - shared home page layout
  - shared course page layout
  - shared marketing sections/data/components
  - shared brand config contract
- Refactored `apps/realtutorialhub-site` into a brand wrapper around `@quiz/marketing-site`.
- Created `apps/skillupitacademy-site` as a brand wrapper around the same shared marketing package.
- Copied only approved SkillUp brand assets:
  - full logo: `apps/skillupitacademy-site/public/brand/skillup-logo.png`
  - icon logo: `apps/skillupitacademy-site/public/brand/skillup-icon.jpg`
- Applied SkillUp brand tokens:
  - primary `#f54a8d`
  - secondary `#133282`
- Added Cloud Build config:
  - `cloudbuild.skillupitacademy-site.yaml`
- Verified locally:
  - `pnpm --filter @quiz/marketing-site type-check`
  - `pnpm --filter @quiz/realtutorialhub-site type-check`
  - `pnpm --filter @quiz/skillupitacademy-site type-check`
  - `pnpm --filter @quiz/realtutorialhub-site build`
  - `pnpm --filter @quiz/skillupitacademy-site build`
- Runtime smoke tested SkillUp local static server:
  - `/` returned `200 OK`
  - `/courses/full-stack-java` returned `200 OK`
  - `/brand/skillup-logo.png` returned `200 OK`
- Browser smoke tested SkillUp local site with Playwright:
  - page title: `SkillUp IT Academy`
  - no console errors after normalizing migrated image references
- Deployed SkillUp to Cloud Run through Cloud Build:
  - build id: `88472a18-da31-493c-8abf-4a10709fa836`
  - image: `asia-south1-docker.pkg.dev/project-48af6a2d-e8bb-46dd-a58/quiz-platform/skillupitacademy-site:skillup-shared-90947e94`
  - digest: `sha256:94cec08e51ea37383c1131f99a0a8bbd08685bac03f3e458eb2a1f66419c3791`
  - service: `skillupitacademy-site`
  - region: `asia-south1`
  - revision: `skillupitacademy-site-00001-bst`
  - URL: `https://skillupitacademy-site-plldp3atca-el.a.run.app`
  - traffic: `100%`
- Smoke tested deployed Cloud Run URL:
  - `/` returned `200 OK`
  - `/courses/full-stack-java` returned `200 OK`
  - `/brand/skillup-logo.png` returned `200 OK`

## Current SkillUp Local Project

Local path:

`D:\onlinewebsites\skillupitacademy`

The folder contains mixed legacy assets and code:

- `Authentication`
- `jwtauth`
- `_public_html`
- `src`
- old Create React App public build files
- backend/favicon artifacts

Per requirement, none of this code should be incorporated as application/page code.

Allowed assets to extract:

- Logo:
  - `D:\onlinewebsites\skillupitacademy\src\src\img\logo\logo.png`
  - duplicate built asset: `_public_html\static\media\logo.0a251bf3c35bc14360fb.png`
- Profile/logo variant:
  - `D:\onlinewebsites\skillupitacademy\src\src\img\PROFILE_SKILLUP_LOGO-02.jpg`
  - duplicate built asset: `_public_html\static\media\PROFILE_SKILLUP_LOGO-02.271bbc6f0eae98c17d60.jpg`

## SkillUp Brand Tokens

Extracted from local logo and CSS assets.

Implemented SkillUp IT Academy tokens:

- Primary: `#f54a8d`
- Secondary: `#133282`

Supporting observed logo color clusters:

- `#103080`
- `#002080`
- `#204090`
- `#f04080`
- `#f05090`

Use `#f54a8d` as the primary SkillUp brand color and `#133282` as the secondary brand blue. Avoid pulling the rest of the old palette into the new shared site unless a specific visual requirement appears.

## Current Public DNS and Hosting Signals

Checked on 2026-05-21.

### DNS

`www.skillupitacademy.com` resolves to Cloudflare proxy IPs:

- `104.21.12.64`
- `172.67.131.242`

`skillupitacademy.com` resolves to the same Cloudflare proxy IPs.

Authoritative nameserver signal:

- `anita.ns.cloudflare.com`
- Cloudflare SOA contact: `dns.cloudflare.com`

### HTTP

`https://www.skillupitacademy.com/` returns:

- `301 Moved Permanently`
- `Location: https://skillupitacademy.com/`
- `Server: cloudflare`

`https://skillupitacademy.com/` returns:

- `200 OK`
- `Server: cloudflare`
- `cf-cache-status: DYNAMIC`
- no visible `x-vercel-*` headers

Live HTML indicates an old Create React App deployment:

- references `/static/js/main...js`
- references `/static/css/main...css`
- includes `You need to enable JavaScript to run this app.`
- title observed as `React App` on the live response

### Hosting Conclusion

The public SkillUp site is definitely behind Cloudflare.

From public DNS and headers alone, the origin cannot be confirmed because Cloudflare proxying hides the upstream. I found no public evidence proving Vercel is the origin. The live site looks like a static Create React App build behind Cloudflare, but the upstream could be Vercel, Cloudflare Pages, shared hosting, a VM, object storage, or another origin.

To confirm origin, check the Cloudflare DNS dashboard for:

- `www`
- apex `skillupitacademy.com`

If the hidden target is `cname.vercel-dns.com` or a Vercel-assigned CNAME, it is likely Vercel behind Cloudflare. If it points to `*.pages.dev`, it is Cloudflare Pages. If it points to shared hosting or an IP, it is a different origin.

## Recommended Architecture

Do not import legacy SkillUp pages/code.

Instead, refactor the new marketing system into a shared brand-driven architecture:

```text
apps/
  realtutorialhub-site/
    app/
    public/
    brand.config.ts
    package.json
    Dockerfile

  skillupitacademy-site/
    app/
    public/
    brand.config.ts
    package.json
    Dockerfile

packages/
  marketing-site/
    src/
      components/
      sections/
      layouts/
      data/
      brand-types.ts
```

Alternative lower-churn structure:

```text
apps/
  realtutorialhub-site/
    shared/
      components/
      sections/
      data/
    brand/
      realtutorialhub.ts
      skillupitacademy.ts
```

The cleaner long-term structure is a shared `packages/marketing-site` package, because both brands will use the same content and layout.

## Brand Configuration Model

Each site should supply a small brand config.

Example:

```ts
export const skillupBrand = {
  id: 'skillupitacademy',
  name: 'SkillUp IT Academy',
  domain: 'https://www.skillupitacademy.com',
  logo: '/brand/skillup-logo.png',
  colors: {
    primary: '#f54a8d',
    secondary: '#133282',
  },
  metadata: {
    title: 'SkillUp IT Academy',
    description: 'Learn real-world skills with SkillUp IT Academy',
  },
};
```

```ts
export const realTutorialHubBrand = {
  id: 'realtutorialhub',
  name: 'Real Tutorial Hub',
  domain: 'https://www.realtutorialhub.com',
  logo: '/brand/rth-logo.png',
  colors: {
    primary: '#d03f00',
    secondary: '#124fd6',
  },
  metadata: {
    title: 'Real Tutorial Hub',
    description: 'Learn real-world skills with Real Tutorial Hub',
  },
};
```

## Shared Content Strategy

The marketing content should be one shared content model used by both brands.

Shared:

- hero layout
- hero slides
- why-us section
- courses section
- learning path section
- skills section
- testimonials section
- contact section shape
- footer layout
- page animations and lazy loading
- Cloud Run/static export deployment pattern

Brand-specific:

- logo
- primary and secondary color
- site name
- metadata title/description
- canonical domain
- social/contact details if they differ
- favicon/icon set

This is the same principle already used in the broader shared-branding direction for RTH and SUIA learning/tutorial surfaces: shared experience, brand config at the edge.

## Roadmap

### Phase 1: Stabilize RealTutorialHub Site

Status: mostly done.

Current `apps/realtutorialhub-site` exists and is deployed to Cloud Run:

- Cloud Run service: `realtutorialhub-site`
- Region: `asia-south1`
- URL: `https://realtutorialhub-site-plldp3atca-el.a.run.app`

Implementation note:

1. Metadata is now brand-config driven.
2. Logo references are now brand-config driven.
3. Key brand colors are driven through CSS variables.
4. Reusable marketing sections now live in `packages/marketing-site`.
5. Static export plus Node static server remains the Cloud Run runtime pattern.

### Phase 2: Create Shared Marketing Package

Created `packages/marketing-site`.

Moved reusable pieces from `apps/realtutorialhub-site` into that package:

- `HeroSection`
- `NavBar`
- `WhyUs`
- `CourseCards`
- `LearningPath`
- `Skills`
- `Testimonials`
- `Contact`
- `Footer`
- shared data types
- shared section data
- shared CSS variable contract

The package should accept a `BrandConfig` and render the same layout for both brands.

### Phase 3: Refactor `realtutorialhub-site`

Converted `apps/realtutorialhub-site` into a thin brand wrapper:

- imports shared marketing layout from `@quiz/marketing-site`
- provides `realTutorialHubBrand`
- keeps RTH assets in its own `public/brand`
- keeps RTH domain metadata

This keeps the already-deployed RTH site stable while proving the shared system works.

### Phase 4: Create `skillupitacademy-site`

Created `apps/skillupitacademy-site`.

Do not copy old PHP, Laravel, backend, or React page code.

Only copy:

- SkillUp logo
- favicon/icon assets if needed

Use:

- same shared marketing layout as RTH
- same content model as RTH
- SkillUp brand tokens:
  - primary `#f54a8d`
  - secondary `#133282`
- SkillUp logo asset
- SkillUp metadata and canonical URL

Suggested package name:

`@quiz/skillupitacademy-site`

Suggested port:

`3005`

Cloud Run service:

`skillupitacademy-site`

Deployed image:

`asia-south1-docker.pkg.dev/project-48af6a2d-e8bb-46dd-a58/quiz-platform/skillupitacademy-site:skillup-shared-90947e94`

### Phase 5: Deploy SkillUp to GCP

Completed deployment pattern:

1. Added Dockerfile for `apps/skillupitacademy-site`.
2. Added `cloudbuild.skillupitacademy-site.yaml`.
3. Built and pushed image through Cloud Build.
4. Deployed Cloud Run service in `asia-south1`.
5. Smoke tested:
   - `/`
   - one course route
   - logo asset
Completed after initial deployment:

6. Confirmed native Cloud Run domain mappings are not available in `asia-south1`.
7. Added Cloudflare Worker router `marketing-sites-gcp-router`.
8. Attached Worker routes:
   - `www.skillupitacademy.com/*`
   - `skillupitacademy.com/*`
   - `www.realtutorialhub.com/*`
   - `realtutorialhub.com/*`
9. Validated production hostnames through Cloudflare.

### Phase 6: Cloudflare Cutover

Previous SkillUp production behavior redirected:

`www.skillupitacademy.com` -> `skillupitacademy.com`

Implemented canonical setup:

- `www.skillupitacademy.com` is canonical.
- `skillupitacademy.com` redirects to `www.skillupitacademy.com`.

Implemented Cloudflare plan:

1. Kept existing Cloudflare-proxied hostnames.
2. Added Worker router because Cloud Run custom domain mappings are not supported in `asia-south1`.
3. Routed `www.skillupitacademy.com` to:
   - `https://skillupitacademy-site-581488566988.asia-south1.run.app`
4. Added apex redirect from `skillupitacademy.com` to `www.skillupitacademy.com`.
5. Validated:
   - `https://www.skillupitacademy.com/` -> `200`, title `SkillUp IT Academy`
   - `https://skillupitacademy.com/` -> final URL `https://www.skillupitacademy.com/`
   - `https://www.skillupitacademy.com/courses/full-stack-java` -> `200`
   - `https://www.skillupitacademy.com/brand/skillup-logo.png` -> `200`
   - `https://www.skillupitacademy.com/brand/skillup-icon.jpg` -> `200`

## Implementation Decision

Recommended path:

1. Keep `apps/realtutorialhub-site` as the first brand.
2. Extract a shared marketing package from it.
3. Create `apps/skillupitacademy-site` as a thin branded wrapper.
4. Copy only SkillUp logo/assets and brand colors.
5. Deploy SkillUp to Cloud Run.
6. Point Cloudflare to GCP through the shared Worker router.

This gives both brands one shared marketing system while preserving independent brand identity.

## Risks

- Cloudflare hides the current SkillUp origin, so Vercel status cannot be proven without Cloudflare dashboard access.
- Current SkillUp live site is old Create React App output; copying it would bring obsolete frontend structure. This should be avoided.
- Current `www` redirects to apex, but requested target is `www`. Canonical URL must be changed deliberately.
- RTH site currently has some inherited standalone metadata and should be cleaned up during shared package extraction.
- Shared content must be designed so brand wording stays neutral enough for both brands.

## Immediate Next Steps

1. Run Lighthouse checks against `https://www.skillupitacademy.com/`.
2. Monitor Cloudflare Worker errors and Cloud Run request logs.
3. Keep the old origin available until production traffic is stable.
4. If a no-Worker architecture is required later, move routing to a Google external HTTPS load balancer with serverless NEGs.

## References

- Current RTH Cloud Run URL: `https://realtutorialhub-site-plldp3atca-el.a.run.app`
- Current SkillUp production URL checked: `https://www.skillupitacademy.com/`
- Current SkillUp Cloud Run URL: `https://skillupitacademy-site-plldp3atca-el.a.run.app`
- Current Cloudflare Worker router: `marketing-sites-gcp-router`
- Google Cloud Run deployment docs: https://cloud.google.com/run/docs/deploying
- Google Cloud Run custom domain docs: https://cloud.google.com/run/docs/mapping-custom-domains
- Cloudflare DNS record docs: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
