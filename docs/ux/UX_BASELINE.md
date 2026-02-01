# 📐 UX/UI Baseline & Global Standards

This document establishes the non-negotiable design, responsiveness, and interaction standards for the Quiz Platform.

---

## 1. Responsive Breakpoints
The platform uses the standard **Tailwind CSS** breakpoint system.

| Prefix | Minimum Width | Device Class |
| :--- | :--- | :--- |
| `base` | 0px | Mobile Portrait |
| `sm` | 640px | Mobile Landscape / Tablet |
| `md` | 768px | Tablet Portrait / Small Laptop |
| `lg` | 1024px | Desktop (Standard) |
| `xl` | 1280px | Large Screens |
| `2xl` | 1536px | Extra Large Screens |

### 📱 Mobile-First Mandate
- **All layouts** must be designed for `base` (mobile) first.
- **Testing**: Everything must work on a 375px wide viewport (iPhone SE).
- **Navigation**:
  - `sm` and below: Use Hamburger Menu or Bottom Navigation.
  - `md` and up: Use Sidebar or Top Bar.

---

## 2. Global Typography
- **Font Family**: Inter, Sans-serif.
- **Scale**:
  - H1: `text-2xl` (Mobile) / `text-3xl` (Desktop)
  - H2: `text-xl` (Mobile) / `text-2xl` (Desktop)
  - Body: `text-sm` (Mobile) / `text-base` (Desktop)
  - Micro: `text-xs`

---

## 3. Global Interaction States
- **Hover**: All clickable elements must have a visual `:hover` state (opacity, color shift).
- **Active/Focus**: Inputs must show a `ring-2` focus state for accessibility.
- **Disabled**: Must reduce opacity (`opacity-50`) and set `cursor-not-allowed`.
- **Loading**: Buttons must show a spinner or `isLoading` state, preventing double-clicks.

---

## 4. Component Standards

### Cards (Dashboard/Lists)
- **Padding**: `p-4` (Mobile) / `p-6` (Desktop).
- **Shadow**: `shadow-sm` (Default) / `shadow-md` (Hover).
- **Border**: `border border-gray-100` (Light) / `border-gray-800` (Dark).

### Lists & Tables
- **Mobile**: Stacked cards or horizontal scroll.
- **Desktop**: Full table with headers.
- **Empty States**: Must provide actionable next steps ("Create your first exam").
- **Tables**: Must be scrollable on mobile, with sticky headers if possible.

---

## 5. Data & Time Filtering
*Source: DATA_TIME_FILTERING.md*

### Supported Ranges
- **7 Days**: Default window.
- **30 Days**: Extended window.
- **Custom**: Calendar-based selection.

### Behavioral Rules
- **Authoritative Filtering**: Selected range passes to backend API.
- **No Silent Fallbacks**: "No data" state must be explicit.
- **State Sync**: Active filter MUST reflect in URL or Store.

### Interface Rules
- **Visible Selection**: Highlight active range.
- **Integrity**: 7D/30D toggles must remain always visible.
- **Labels**: Use relative labels (`Today`, `Yesterday`) for recent items (<7 days).

## 6. Admin Control Center Standards
The "Discovery_Orchestrator" pattern defines the standard for high-density administrative filtering.

### Filter Bar Layout
- **Structure**: Horizontal grid (`1` col mobile, `4` cols xl).
- **Styling**: `p-6` padding, `border-primary/10`, `rounded-[2.5rem]`, white background with shadow.
- **Inputs**: `bg-slate-50` with `rounded-2xl`. No borders; use `focus:ring-2` for state.

### Identity & Status
- **Search**: Debounced (500ms) across name and email.
- **Verification**: Verified identities MUST display a `CheckCircle` icon in green (`#22c55e`).
- **Activity**: Pulsating indicators for `Online` (ping effect), static for `Idle`/`Offline`.
- **Status Labels**: Uppercase, tracked (`tracking-widest`), font-black.

## 7. Loading Standards
The platform uses a unified, high-fidelity loading indicator to ensure visual consistency and professional density.

### The ZLoader Standard
- **Visual**: A `border-4` spin indicator with a `slate-100` background ring and `#FF4B91` (Primary Pink) active segment.
- **Component**: `ZLoader.tsx` is the sole authorized component for loading states. Use of raw CSS spinners or Lucide icons for loading is prohibited.
- **Implementation**:
  - **Inline**: Use `size="xs"` or `size="sm"` for buttons and dropdowns.
  - **Component Level**: Use `size="md"` for table rows or card contents.
  - **Page Level**: Use `size="lg"` or `size="xl"` for splash screens and major transitions.
- **Typography**: Optional descriptive text (e.g., "Authenticating...") should use `font-black` and `tracking-widest` for high visibility.

## Quality of Experience
- **Enhancement allowed**: UI/UX may be enhanced for clarity, usability, and visual delight.
- **No Degradation**: UI/UX features MUST NOT be removed or degraded unless explicitly instructed by the user.
