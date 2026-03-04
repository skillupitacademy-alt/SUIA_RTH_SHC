# Progressive Web App & Mobile Experience
*Phase G5: Mobile-First Assessment*

## 📜 Architectural Objective
To transform the web app into a Progressive Web App (PWA) that provides an app-like experience on mobile devices — including offline shell loading, home screen installation, and responsive design across all screen sizes.

---

## 🏗️ 1. PWA Foundation

### A. Web App Manifest
- **Action**: Create `public/manifest.json` with:
  - App name, short name, description
  - Icons (192x192, 512x512 PNG)
  - Theme color and background color matching brand palette
  - Display mode: `standalone` (app-like, no browser chrome)
  - Start URL: `/dashboard`
  - Orientation: `any` (support both portrait and landscape)

### B. Service Worker
- **Strategy**: Cache-first for static assets, network-first for API calls.
- **Action**: Use `next-pwa` or Workbox to generate a service worker that:
  1. Caches the application shell (HTML, CSS, JS)
  2. Caches static assets (fonts, images, icons)
  3. Provides offline fallback page ("You're offline — reconnect to continue your exam")
  4. Does NOT cache API responses (exam data must always be fresh)

### C. Install Prompt
- **Action**: Detect the `beforeinstallprompt` event and show a custom "Add to Home Screen" banner for mobile users.
- **Timing**: Show after the student completes their first exam (proven engagement).

---

## 📱 2. Responsive Design Audit

### A. Breakpoints
| Breakpoint | Width | Target Device |
|---|---|---|
| `xs` | < 480px | Small phones |
| `sm` | 480-640px | Standard phones |
| `md` | 640-768px | Large phones, small tablets |
| `lg` | 768-1024px | Tablets |
| `xl` | 1024px+ | Desktops |

### B. Critical Pages Audit
- **Quiz Selection**: Stack topic cards vertically on mobile. Full-width buttons.
- **Active Exam**: Question text takes full width. Answer options stack vertically. Timer stays fixed at top.
- **Dashboard**: Charts stack in single column. Stats cards become scrollable horizontal strip.
- **Reports**: PDF-like layout switches to mobile-friendly card layout.
- **Admin Dashboard**: Data tables become card-based on mobile. Sidebar becomes hamburger menu.

### C. Touch Optimization
- **Tap Targets**: All interactive elements minimum 48x48px (Google's recommendation).
- **Swipe**: Support swipe-left/right to navigate between exam questions.
- **Pull-to-Refresh**: Add pull-to-refresh on dashboard and results pages.

---

## 📴 3. Offline Resilience

### A. Offline Shell
- **Action**: When offline, serve the cached application shell with a "You're offline" banner.
- **Exam in Progress**: If connection drops mid-exam, queue answers in IndexedDB (see Scaling Phase 5).
- **Auto-Reconnect**: When connection returns, automatically sync queued answers.

### B. Offline Detection
- **Action**: Use `navigator.onLine` + `online`/`offline` events to show/hide a persistent connection status indicator.

---

## 🎨 4. Mobile Performance

### A. Critical Rendering Path
- **Action**: Inline critical CSS for above-the-fold content.
- **Lazy Loading**: Defer chart libraries (Recharts) and PDF viewer until needed.
- **Image Optimization**: Use `next/image` with responsive sizes and WebP/AVIF format.

### B. Performance Targets (Mobile)
| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

---

## 🛡️ Implementation Checklist
- [ ] Create `public/manifest.json` with app metadata
- [ ] Generate PWA icons (192x192, 512x512)
- [ ] Configure Service Worker with next-pwa or Workbox
- [ ] Create offline fallback page
- [ ] Add "Install App" prompt for mobile users
- [ ] Responsive audit: Quiz selection page
- [ ] Responsive audit: Active exam page
- [ ] Responsive audit: Dashboard page
- [ ] Responsive audit: Reports page
- [ ] Responsive audit: Admin dashboard
- [ ] Touch target size audit (48x48px minimum)
- [ ] Add swipe navigation for exam questions
- [ ] Mobile performance testing (Lighthouse audit)

---

## 📈 Impact
Over **60% of students in developing countries** access educational content primarily through mobile phones. A PWA gives them an app-like experience without the overhead of an app store listing, and offline support ensures exams aren't interrupted by unreliable networks.

*Document Version: 1.0*
