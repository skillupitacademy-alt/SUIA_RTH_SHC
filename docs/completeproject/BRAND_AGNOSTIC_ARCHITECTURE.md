# Brand-Agnostic Component Architecture

## Overarching Philosophy

The `quiz-platform` Next.js monorepo uses a **Brand-Agnostic Component Architecture**. All pages are built once inside `src/share-branding/` and rendered for both **RealTutorialHub** and **SkillUp IT Academy** by injecting brand-specific configuration data.

The individual Next.js apps (`apps/realtutorialhub-web` and `apps/skillup-web`) are purely **Consumers** — their only job is to import shared templates and pass the correct brand config. This ensures 100% layout consistency and makes cross-brand updates a single-file operation.

---

## Single Source of Truth: `brandConfig.ts`

All brand data lives in **one file**:

```
src/share-branding/brandConfig.ts
```

This unified config exports:
- `BrandConfig` — the interface defining all possible brand properties
- `rthConfig` — RealTutorialHub's data object
- `skillUpConfig` — SkillUp IT Academy's data object
- `brands` — a `Record<'rth' | 'skillup', BrandConfig>` for gateway context injection

**Before adding any new page**, if it needs brand-specific text or color, add the new property here first.

---

## The Two Rendering Patterns

The architecture uses **two complementary patterns** depending on the page type:

### Pattern A — Props-based (Root Pages `/`)
Used by `LandingPage.tsx` and any future standalone root pages.

```tsx
// src/share-branding/DashboardPage.tsx
import { BrandConfig } from './brandConfig';

export default function DashboardPage({ config }: { config: BrandConfig }) {
  return (
    <div style={{ backgroundColor: config.primaryColor }}>
      <h1>{config.name}</h1>
    </div>
  );
}
```

Consumed in the app routing layer:
```tsx
// apps/realtutorialhub-web/src/app/dashboard/page.tsx
import DashboardPage from '@/share-branding/DashboardPage';
import { rthConfig } from '@/share-branding/brandConfig';

export default function Page() {
  return <DashboardPage config={rthConfig} />;
}
```

### Pattern B — Context-based (Gateway Pages `/start-learning/*`)
Used by the `PostLandingPage` system and any future multi-component page flows.

Components call `useBrand()` instead of receiving props:
```tsx
// src/share-branding/PostLandingPage/app/components/MySection.tsx
'use client';
import { useBrand } from '../context/BrandContext';

export function MySection() {
  const brand = useBrand();
  return <div style={{ color: brand.primaryColor }}>{brand.name}</div>;
}
```

The gateway `page.tsx` wraps the whole page in `BrandProvider`:
```tsx
// apps/realtutorialhub-web/src/app/start-learning/page.tsx
import { BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { brands } from '@/share-branding/brandConfig';
import LandingPage from '@/share-branding/PostLandingPage/app/pages/LandingPage';

export default function Page() {
  return (
    <BrandProvider brand={brands.rth}>
      <LandingPage />
    </BrandProvider>
  );
}
```

**When to use which:**
- Simple single-file page → **Pattern A (Props)**
- Complex multi-component page with many child components → **Pattern B (Context)**

---

## Step-by-Step: Creating a New Page for Both Brands

### Step 1 — Add brand-specific variables to `brandConfig.ts`
```ts
// src/share-branding/brandConfig.ts
export interface BrandConfig {
  // ... existing fields
  dashboardGreeting: string; // NEW
}

export const rthConfig: BrandConfig = {
  // ... existing data
  dashboardGreeting: 'Welcome to your AI-powered Dashboard',
};

export const skillUpConfig: BrandConfig = {
  // ... existing data
  dashboardGreeting: 'Your Mentor-led Dashboard is ready',
};
```

### Step 2 — Build the shared component in `src/share-branding/`
```tsx
// src/share-branding/DashboardPage.tsx
import { BrandConfig } from './brandConfig';

export default function DashboardPage({ config }: { config: BrandConfig }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <h1 className="text-4xl font-bold" style={{ color: config.primaryColor }}>
        {config.dashboardGreeting}
      </h1>
      <button
        className="text-white px-8 py-3 rounded-full font-bold"
        style={{ backgroundColor: config.primaryColor }}
      >
        Begin Session
      </button>
    </div>
  );
}
```

### Step 3 — Wire it up in both apps (≤ 5 lines each)
```tsx
// apps/realtutorialhub-web/src/app/dashboard/page.tsx
import DashboardPage from '@/share-branding/DashboardPage';
import { rthConfig } from '@/share-branding/brandConfig';
export default function Page() { return <DashboardPage config={rthConfig} />; }
```
```tsx
// apps/skillup-web/src/app/dashboard/page.tsx
import DashboardPage from '@/share-branding/DashboardPage';
import { skillUpConfig } from '@/share-branding/brandConfig';
export default function Page() { return <DashboardPage config={skillUpConfig} />; }
```

**Result:** One component, two brands, zero duplication.

---

## Current Implemented Page Map

| URL Pattern | Shared Component | Pattern | Status |
|-------------|-----------------|---------|--------|
| `/` | `src/share-branding/LandingPage.tsx` | Props (A) | ✅ Live |
| `/start-learning` | `src/share-branding/PostLandingPage/` | Context (B) | ✅ Live |
| `/dashboard` | `src/share-branding/DashboardPage.tsx` | Props (A) | 🔲 Planned |
| `/programs` | `src/share-branding/ProgramsPage.tsx` | Props (A) | 🔲 Planned |
| `/login` | `src/share-branding/LoginPage.tsx` | Props (A) | 🔲 Planned |

---

## Hard Rules 🚨

1. **NO HARDCODING BRAND NAMES/COLORS** in shared `.tsx` files. Every brand-specific value must come from `config.*` or `brand.*`.
2. **NO DYNAMIC TAILWIND COLORS** — `text-${config.primaryColor}` will silently break at build. Always use `style={{ color: config.primaryColor }}`.
3. **NO UI IN APP ROUTING FILES** — `page.tsx` files should never exceed ~10 lines. They only import and mount shared components.
4. **ONE SOURCE OF TRUTH** — All brand data lives in `src/share-branding/brandConfig.ts`. Never define brand values anywhere else.
5. **NO OPACITY ANIMATIONS ON TEXT** — Use transform animations (`y`, `scale`) only. Text must render at `opacity: 1` from frame one for WCAG contrast compliance.
6. **BREAKPOINT PREFIX FIRST IN TAILWIND** — Always `sm:hover:scale-105` not `hover:sm:scale-105`. Responsive prefix always leads.
