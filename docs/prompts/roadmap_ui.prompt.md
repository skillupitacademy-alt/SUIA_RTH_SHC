# AI Implementation Prompt: Million User Roadmap UI

**Role**: You are a Lead Frontend Engineer specializing in Premium Admin Dashboards and Data Storytelling.

**Task**: Implement the "Million User Roadmap" interactive tab in the Admin Dashboard (`apps/admin-app/src/app/(authenticated)/page.tsx`).

## Core Requirements

### 1. The Tab Switched Interface
- Implement a `useState` for `activeTab` ("control" | "roadmap").
- Create a premium "Pill" switcher at the top of the Home Page. 
- **Style**: Use `glassmorphism` for the inactive state and high-contrast `#FF4B91` for the active state.

### 2. High-Fidelity Phase Cards
- Map over the 13 Hyper-Scale Phases.
- **Card Design**: 
    - Pure white background with `slate-100` subtle border.
    - Large Phase ID (e.g., "P09") in the top left.
    - Title in `Outfit` Black font.
    - A layman-friendly "Mission Summary" as the body text.
- **Micro-interactions**: Use `framer-motion` for a subtle hover lift and scale.

### 3. The Technical Blueprint Drawer
- Implement a side-drawer (Drawer/Sheet) using `@headlessui/react` or a custom Framer Motion component.
- **Drawer Content**:
    - **Header**: Icon, Title, and layman summary.
    - **Content Area**: A clean, scrollable markdown view of the technical strategy.
    - **AI Prompt Block**: A specialized section with a "Copy" button to retrieve the implementation prompt for that phase.

## Technical Stack Context
- **Framework**: Next.js App Router (Client Component).
- **Styling**: Tailwind CSS + Framer Motion.
- **Icons**: Lucide React.
- **Theme**: Force Light Mode (No dark backgrounds).

## Prompt Instruction
"Implement the Roadmap tab on the Admin home page. Create the `MillionUserRoadmap.tsx` component to render 13 interactive cards. Each card must open a sidebar drawer containing the phase's blueprint and AI prompt. Ensure the aesthetic matches the existing 'Executive Command Hub' style but follows a strictly light-themed professional look."
