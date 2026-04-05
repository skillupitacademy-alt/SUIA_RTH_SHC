# Brand-Agnostic Component Architecture

## Overarching Philosophy

The `quiz-platform` Next.js monorepo utilizes a **Brand-Agnostic Component Architecture**. Instead of building separate UI components for RealTutorialHub and SkillUp IT Academy, all frontend pages and elements are built as singular, reusable templates inside `src/share-branding/`. 

The individual Next.js applications (`apps/realtutorialhub-web` and `apps/skillup-web`) act purely as **Consumers**. Their only job is to import the shared templates and feed them their respective brand-specific configuration data.

This ensures 100% layout consistency, eliminates duplicated code, and makes massive cross-brand updates a single-file operation.

---

## The Four Pillars

### 1. Shared Presentation Layer (`src/share-branding/`)
All new pages (Dashboards, Exam Engines, About Pages) must be built here. Do not build UI directly inside the `apps/` folders unless absolutely unique to a single brand.
* **Rule:** A shared component must be extremely flexible and accept a `config` prop of type `BrandConfig`.

### 2. Data-Driven Branding (`brandConfig.ts`)
Brand identities are completely decoupled from the UI. `brandConfig.ts` contains the JSON configurations defining the DNA of each brand (Colors, Terminology, Copywriting, Logos).
* **Rule:** Do not hardcode brand-specific names (e.g., "AI Tutor") inside your `.tsx` components. If text changes depending on the brand, add a new property to `BrandConfig`.

### 3. Hybrid Style Injection mechanism
Tailwind CSS relies on static string extraction during build time. It cannot compile dynamic classes at runtime (meaning `className={"bg-[" + config.primaryColor + "]"}` **will fail**).
* **Rule:** Use Tailwind for all structural css (flex, padding, borders, shadows, `text-sm`, `font-bold`).
* **Rule:** Use React inline styles to dynamically inject brand-critical identifiers (background colors, text colors) over the structure: `<div className="rounded-xl shadow-lg" style={{ backgroundColor: config.primaryColor }}>`

### 4. Monorepo App Consumption
To render a page, simply import the completed component and the specific brand configuration into the target application's route (`page.tsx`).

---

## Step-by-Step Developer Guide

### Step 1: Define the variables in `brandConfig.ts`
If your new page requires new brand-specific text (e.g. a specialized Dashboard greeting), add it to the `BrandConfig` interface first.

```ts
export interface BrandConfig {
  // ... existing config
  dashboardGreeting: string; // New!
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

### Step 2: Build the Component in `src/share-branding/`
Create your specialized feature using the architecture guidelines.

```tsx
// src/share-branding/DashboardPage.tsx
import React from 'react';
import { BrandConfig } from './brandConfig';

export default function DashboardPage({ config }: { config: BrandConfig }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        {/* STRUCTURAL Tailwind classes + INLINE dynamic colors */}
        <h1 
           className="text-4xl font-bold mb-4" 
           style={{ color: config.primaryColor }}
        >
          {config.dashboardGreeting}
        </h1>
        
        <button 
           className="text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-1"
           style={{ backgroundColor: config.secondaryColor }}
        >
           Begin Session
        </button>
    </div>
  );
}
```

### Step 3: Consume the Page in the Applications
Hop into the actual routing layers of the Next.js apps and connect the dots.

**RealTutorialHub (`apps/realtutorialhub-web/src/app/dashboard/page.tsx`):**
```tsx
import DashboardPage from '@/share-branding/DashboardPage';
import { rthConfig } from '@/share-branding/brandConfig';

export default function Page() {
  return <DashboardPage config={rthConfig} />;
}
```

**SkillUp IT Academy (`apps/skillup-web/src/app/dashboard/page.tsx`):**
```tsx
import DashboardPage from '@/share-branding/DashboardPage';
import { skillUpConfig } from '@/share-branding/brandConfig';

export default function Page() {
  return <DashboardPage config={skillUpConfig} />;
}
```

---

## Summary of Hard Rules 🚨
1. **NO HARDCODING LOGOS/NAMES:** Never write "SkillUp" or "RTH" directly into a shared `.tsx` file.
2. **NO DYNAMIC TAILWIND COLORS:** Never attempt to generate Tailwind color utility classes dynamically (`text-${config.primaryColor}`). It will purge and break silently. Always use `style={{ color: config.primaryColor }}`.
3. **NO DIRECT APP UI:** If it can be shared, it must be built in `share-branding`. The routing `page.tsx` files should rarely exceed 15 lines of code.
4. **NO OPACITY TRANSITIONS ON TEXT:** DevAxe accessibility mathematically fails text components fading from `opacity: 0` to `opacity: 1` over solid backgrounds. Use Transform (`y`, `scale`) animations, but ensure `opacity: 1` is natively rendered from the first millisecond to guarantee perfect `4.5:1` WCAG math scores. 
