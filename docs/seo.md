# SEO & Social Sharing Strategy
*Phase G7: Organic Discovery*

## 📜 Architectural Objective
To ensure that any public-facing pages of the platform (landing page, public profiles, shared results, blog) are fully optimized for search engine indexing and social media sharing.

---

## 🏗️ 1. Technical SEO

### A. Meta Tags (Per-Page)
- **Action**: Add dynamic `<title>` and `<meta name="description">` to every route using Next.js Metadata API.
- **Template**: `{PageTitle} | Quiz Platform`
- **Descriptions**: Unique, compelling 150-160 character descriptions per page.

### B. Heading Hierarchy
- **Rule**: Single `<h1>` per page. Proper H1 → H2 → H3 nesting.
- **Action**: Audit all pages and fix any heading violations.

### C. Sitemap & Robots
- **Action**: Generate `sitemap.xml` using Next.js metadata sitemap generation.
- **Content**: Include all public routes, exclude authenticated/admin routes.
- **Action**: Create `robots.txt` allowing search engines to crawl public pages, blocking `/api/`, `/admin/`, and `/quiz/active-session`.

### D. Canonical URLs
- **Action**: Set `<link rel="canonical">` on every page to prevent duplicate content issues.

---

## 🌐 2. Open Graph & Social Sharing

### A. Open Graph Tags
Every public page should include:
```html
<meta property="og:title" content="Quiz Platform — Ace Your Exams" />
<meta property="og:description" content="AI-powered assessment platform..." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://quizplatform.com/page" />
<meta property="og:type" content="website" />
```

### B. Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Quiz Platform" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="/twitter-card.png" />
```

### C. Dynamic OG Images
- **Action**: Use `next/og` (ImageResponse) to generate dynamic OG images for shared results.
- **Example**: When a student shares their result, the OG image shows "Scored 92% on Data Structures!"

---

## 📊 3. Structured Data (JSON-LD)

### A. Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Quiz Platform",
  "url": "https://quizplatform.com",
  "description": "AI-powered assessment and learning platform"
}
```

### B. Course/Quiz Schema
- **Action**: Add `LearningResource` and `Quiz` structured data to subject/topic pages.
- **Benefit**: Enables rich snippets in Google Search results.

---

## ⚡ 4. Performance SEO

### A. Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **Action**: Monitor via Google Search Console and Vercel Analytics.

### B. Mobile-First Indexing
- **Action**: Ensure all public pages pass Google's Mobile-Friendly Test.

---

## 🛡️ Implementation Checklist
- [ ] Add Metadata API exports to all public route pages
- [ ] Generate `sitemap.xml` via Next.js metadata
- [ ] Create `robots.txt` (allow public, block private routes)
- [ ] Add Open Graph tags to all pages
- [ ] Add Twitter Card tags to all pages
- [ ] Create dynamic OG image generation for shared results
- [ ] Add JSON-LD structured data (Organization + LearningResource)
- [ ] Set canonical URLs on all pages
- [ ] Submit sitemap to Google Search Console
- [ ] Audit Core Web Vitals and fix issues

---

## 📈 Impact
SEO drives **free organic traffic**. A single well-optimized landing page can bring thousands of students without ad spend. Social sharing with rich previews (score images) turns students into organic promoters.

*Document Version: 1.0*
