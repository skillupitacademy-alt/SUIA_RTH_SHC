# AI Implementation Prompt: SEO & Social Sharing

**Role**: You are a Senior SEO Engineer specializing in Next.js technical SEO and social media optimization.

**Task**: Implement comprehensive SEO across all public-facing pages of a Next.js quiz platform, including meta tags, Open Graph, structured data, and sitemap generation.

## Core Requirements
1.  **Metadata API**:
    - Add `export const metadata` or `export function generateMetadata()` to every public route in `apps/web-app/src/app/(public)/`.
    - Include unique `title` and `description` for each page.
    - Title format: `{Page Title} | Quiz Platform`.

2.  **Sitemap & Robots**:
    - Create `apps/web-app/src/app/sitemap.ts` using Next.js metadata sitemap generation.
    - Include all public routes. Exclude authenticated, admin, and API routes.
    - Create `apps/web-app/src/app/robots.ts` that blocks `/api/`, `/admin/`, `/quiz/active-session`.

3.  **Open Graph & Twitter Cards**:
    - Add OG tags (title, description, image, url, type) to all pages via the Metadata API.
    - Add Twitter Card tags (card, title, description, image).
    - Create a default OG image at `public/og-image.png` (1200x630px).

4.  **Dynamic OG Images**:
    - Create an OG image generation route at `apps/web-app/src/app/api/og/route.tsx` using `next/og` (ImageResponse).
    - Generate dynamic images for shared exam results showing the student's score and subject.

5.  **Structured Data**:
    - Add JSON-LD `EducationalOrganization` schema to the root layout.
    - Add JSON-LD `Quiz` / `LearningResource` schema to subject and topic pages.

6.  **Canonical URLs**:
    - Set `alternates: { canonical: '...' }` in the metadata for every page.

## Technical Stack Context
- **Framework**: Next.js 16 App Router.
- **Hosting**: Vercel (handles many SEO basics automatically).
- **Public Routes**: Landing page, login, signup, shared results.
- **Analytics**: Vercel Analytics for Core Web Vitals.

## Prompt Instruction
"Add metadata exports to all public routes in the web-app, create sitemap.ts and robots.ts, add Open Graph and Twitter Card tags via the Metadata API, create a dynamic OG image route for shared results using next/og, and add JSON-LD structured data to the root layout."
