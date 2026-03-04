# AI Implementation Prompt: Progressive Web App (PWA)

**Role**: You are a Senior Mobile Web Engineer specializing in PWA development and responsive design for Next.js.

**Task**: Transform the quiz platform's web-app into a Progressive Web App with offline support, installability, and mobile-optimized layouts.

## Core Requirements
1.  **PWA Setup**:
    - Install `next-pwa` or `@serwist/next` in `apps/web-app`.
    - Create `public/manifest.json` with app name "Quiz Platform", icons, theme color, standalone display mode.
    - Configure the service worker to cache: application shell, static assets, fonts.
    - Create an offline fallback page at `apps/web-app/src/app/offline.tsx`.

2.  **Install Prompt**:
    - Create a `useInstallPrompt` hook that captures the `beforeinstallprompt` event.
    - Show a custom "Add to Home Screen" banner component after the user's first exam completion.
    - Store dismiss state in localStorage to avoid re-prompting.

3.  **Responsive Design Fixes**:
    - Audit and fix the quiz selection page (`/quiz/new`) for mobile: stack cards vertically, full-width buttons.
    - Audit and fix the active exam page: question text full width, answers stack vertically, timer fixed at top.
    - Audit and fix the dashboard: charts in single column, stats cards as horizontal scroll.
    - Ensure all tap targets are minimum 48x48px.

4.  **Mobile Performance**:
    - Add `loading="lazy"` to all below-the-fold images.
    - Dynamic import chart components (Recharts) with `next/dynamic`.
    - Run Lighthouse mobile audit and fix all issues scoring below 90.

## Technical Stack Context
- **Framework**: Next.js 16 App Router.
- **Styling**: Tailwind CSS (responsive utilities).
- **Charts**: Recharts.
- **Image Optimization**: next/image already available.

## Prompt Instruction
"Install next-pwa, create the manifest.json and service worker config, build an offline fallback page, add the install prompt hook, and fix responsive layouts for the quiz selection, active exam, and dashboard pages. Run a Lighthouse mobile audit and address all issues."
