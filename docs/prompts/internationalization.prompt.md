# AI Implementation Prompt: Internationalization (i18n)

**Role**: You are a Senior Globalization Engineer specializing in multi-language Next.js applications.

**Task**: Implement full internationalization infrastructure in a Next.js quiz platform to support English, Hindi, Arabic, and Spanish.

## Core Requirements
1.  **Library Setup**:
    - Install `next-intl` in `apps/web-app` and `apps/admin-app`.
    - Configure the `next-intl` plugin in `next.config.ts`.
    - Set up locale detection: Browser `Accept-Language` header → user profile preference → fallback to `en`.
    - Configure supported locales: `['en', 'hi', 'ar', 'es']`.

2.  **String Extraction**:
    - Scan all TSX files in `apps/web-app/src/` and extract every hardcoded English string.
    - Create `messages/en.json` with dot-notation keys grouped by feature area.
    - Replace all hardcoded strings with `useTranslations()` calls in Client Components and `getTranslations()` in Server Components.

3.  **Formatting**:
    - Replace all `toLocaleDateString()`, `toLocaleTimeString()`, and manual date formatting with `next-intl`'s `useFormatter()`.
    - Replace all percentage/number displays with `Intl.NumberFormat`-based formatting.
    - Use ICU message format for pluralization.

4.  **RTL Support**:
    - Add dynamic `dir` attribute to `<html>` based on active locale.
    - Add Tailwind `rtl:` variant classes where needed (flex-row-reverse, text alignment, margins/padding).
    - Flip navigation arrows, progress bars, and sidebar position for RTL locales.

5.  **Locale Switcher**:
    - Add a language selector dropdown in the header/navigation of both apps.
    - Store user's locale preference in the `user_profiles` table (requires DB migration).
    - Persist selection across sessions.

## Technical Stack Context
- **Framework**: Next.js 16 App Router (RSC + Client Components).
- **Styling**: Tailwind CSS.
- **Database**: Drizzle ORM + Neon Postgres.
- **Email**: Resend (templates need locale variants).

## Prompt Instruction
"Install next-intl and configure it for the web-app. Extract all hardcoded strings from the quiz selection, dashboard, and exam interface into `messages/en.json`. Create a locale switcher in the header. Add a `preferredLocale` column to the `user_profiles` table via a Drizzle migration."
