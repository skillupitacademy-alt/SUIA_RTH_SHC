# 🚀 User Dashboard PRD

## 1. Overview
The **User Dashboard** is the central command center for learners on the Quiz Platform. It provides a personalized, high-performance interface for tracking progress, identifying weak areas via AI-driven insights, and launching new learning missions.

### Goals
*   **Immediacy**: Allow users to resume or start exams within seconds of landing.
*   **Clarity**: Provide a clear snapshot of performance metrics (Accuracy, Mastery, Rank).
*   **Guidance**: Utilize the "Smart Tutor" to direct students to topics requiring attention.
*   **Engagement**: Premium, reactive UI that motivates continued learning.

---

## 2. User Components Breakdown

### 2.1. Welcome Header (Universal)
*   **Personalization**: Displays greeting with the user's name (e.g., "Welcome back, AJAY!").
*   **Primary Actions**:
    *   **Start Adaptive Mission**: Trigger the AI-driven adaptive exam engine.
    *   **Start New Exam**: Direct link to the exam selection/configuration page.
*   **Visuals**: High-contrast buttons with micro-animations (pulses on the Activity icon).

### 2.2. Executive Stats Grid (StatsGrid)
A 4-column responsive grid displaying core KPIs:
1.  **Exams Taken**: Cumulative count of completed assessments.
2.  **Average Score**: Overall accuracy percentage with a "Trend Delta" (e.g., +5% vs last 7 days).
3.  **Mastery Points**: Gamified points earned through correct answers and skill progression.
4.  **Global Rank**: Comparison against the total user base (unlocks after 5 exams).
*   **Trend Indicators**: Visual cues (TrendingUp/TrendingDown) showing progress relative to previous periods.

### 2.3. Smart Tutor Insights (TutorInsightCard)
The AI-powered guidance system:
*   **Topic Recommendations**: Categorizes topics into **Revise** (Low accuracy), **Practice** (Medium), or **Advance** (High).
*   **Explainability (Deep Dive)**: "Why?" toggle reveals specific mistake counts and detected weak subareas.
*   **Progress Visualization**: Topic-specific sparklines/charts showing accuracy over time.
*   **Study Integration**: Direct links to study guides and "Notes Viewer" for rapid review.
*   **Live Help CTA**: "Request Live Help" button to connect with subject experts for 1-on-1 guidance.
*   **Secure Inbox**: Notification bell for tutor replies and system alerts.

### 2.4. Activity Tracking (Recent Activity)
*   **Dynamic List**: Shows the most recent 3-5 exam sessions.
*   **States**:
    *   **In-Progress**: "Resume mission" link leading to the Exam HUD.
    *   **Completed**: Final score and link to the detailed Performance Report.
*   **Context**: Displays relative time (e.g., "2 hours ago") and status badges.

### 2.5. Navigation & Layout
*   **Sidebar**: Persistent desktop navigation with links to Exams, Reports, and Profile.
*   **MobileNav**: Optimized bottom-bar or drawer navigation for smaller screens.
*   **Authenticated Wrapper**: Ensures dashboard accessibility only for logged-in users with a valid session.

---

## 3. Layout & Information Architecture (Figma Ready)

### 3.1. Screen Regions
*   **Sidebar (Left, 280px)**: Persistent navigation. Top: Logo (Pink). Center: Navigation links (Dashboard, Exams, Reports). Bottom: User profile/Logout.
*   **Top Header (Global, 64px)**: Fixed. Right-aligned: Notification Bell (with unread badge), User Avatar, and optional "Global Search".
*   **Main Content Area (Fluid)**: Scrollable region with max-width (e.g., 1200px) centered. Large padding (p-10).

### 3.2. Visual Hierarchy (Z-Pattern)
1.  **Top Left (Dashboard Overview)**: Page title and Welcome string (Primary H1).
2.  **Top Right (CTA Group)**: "Start Adaptive Mission" (Black, Rounded) and "Start New Exam" (Primary, Rounded).
3.  **Hero Row (Stats Grid)**: High-level metrics for immediate impact. 4-column layout (1-column on mobile).
4.  **Main column (L/R Split)**:
    *   **Left Column (75%)**: Smart Tutor Insights (Large, multi-faceted card).
    *   **Right Column (25%)**: Recent Activity (Scrollable vertical list).

### 3.3. Responsive Breakpoints
*   **Desktop (>1024px)**: Full sidebar + 4-column StatsGrid + Two-column main content.
*   **Tablet (768px - 1023px)**: Hidden sidebar (Drawer) + 2-column StatsGrid + Single column main content.
*   **Mobile (<767px)**: Bottom Tab Bar navigation + 1-column StatsGrid + Scrollable vertical sections.

### 3.4. Component Anatomy (Design Tokens)
*   **Card Style**: Border (Slate-200), Radius (2rem), Shadow (sm, hover: xl).
*   **Typography**:
    *   **H1**: `text-3xl font-extrabold tracking-tight uppercase`
    *   **H3**: `text-xl font-bold tracking-tight uppercase`
    *   **Labels**: `text-[10px] font-black tracking-widest uppercase text-slate-400`
*   **Micro-animations**: Pulse on "Activity" icon, Hover scale (105%) on primary buttons.

---

## 4. Technical Requirements

### 4.1. Data Layer
*   **Endpoint**: `GET /api/dashboard/overview`
*   **Caching**: Utilizes React Query with a stale-time of 5 minutes for client-side data.
*   **Server-Side Rendering (SSR)**: Initial data pre-fetched on the server to prevent layout shift and improve LCP.

### 4.2. Performance & UX
*   **Dynamic Imports**: Heavy components like `TutorInsightCard` and `ProgressChart` are lazy-loaded to minimize initial JS bundle size.
*   **Skeleton Loading**: Seamless loading states for all card components.
*   **Zustand Selectors**: Optimized state consumption to prevent unnecessary re-renders during timer updates or activity changes.

---

## 5. Design Aesthetic
*   **Theme**: Modern "Glassmorphism" with subtle gradients.
*   **Color Palette**: 
    *   **Primary**: Pink-600 (Actionable elements).
    *   **Background**: Slate-50/Muted shades.
    *   **Accents**: Orange (AI/Tutor), Green (Success), Rose (Critical).
*   **Typography**: Bold, uppercase tracking for headers to give a "Command Center" feel.

---

## 6. Success Metrics
*   **CTR on "Start Mission"**: Percentage of users starting an exam from the dashboard.
*   **Tutor Engagement**: Number of times "Why?" or "Request Help" is clicked.
*   **Return Rate**: Engagement frequency of users returning to the dashboard.
