# CLAUDE PRODUCT EXPERIENCE IMPLEMENTATION TASK
# Platform: Quiz Platform (realtutorialhub.com)
# Phase: Product Experience Layer (UI + UX + Orchestration)
# Execution Mode: Enterprise Product Engineering
# Stack: Next.js + TypeScript + Tailwind + shadcn/ui + Zustand + Vercel

## GLOBAL CONTEXT
This project follows:
- PRD.md
- TRD.md
- System Architecture Document
- Security Architecture Document
- AI Architecture Document
- Platform Roadmap
- Engineering Principles & Optimization Playbook
- Auth & Identity Blueprint
- Domain Modeling Docs
- Data Layer Docs
- Core Runtime Engine Docs
- Admin Governance Docs
- All agent files:
  - architect-agent.md
  - backend-agent.md
  - frontend-agent.md
  - devops-agent.md
  - qa-agent.md
  - docs-agent.md
  - ai-agent.md
  - build-workflow.md

Claude must follow:
- SOLID
- DRY
- KISS
- YAGNI
- Clean Architecture
- Domain-Driven Design (DDD)
- Separation of concerns
- Component isolation
- Accessibility standards (WCAG)
- Performance-first UI
- SEO-first structure
- Lighthouse optimization
- Mobile-first design
- Responsive architecture
- Production UX standards
- Scalable design system
- Platform consistency

---

# 🎯 TASK OBJECTIVE
Build the **full Product Experience Layer** for the platform.

This is the user-facing system:
- onboarding
- authentication UX
- dashboards
- quiz flows
- exam flows
- reports
- analytics
- admin UX
- governance UX
- runtime UI orchestration

---

# 🎨 THEME SYSTEM (MANDATORY)

Implement a **global theme toggle system** with 2 enterprise color themes:

## Theme A (Default)
Primary:  #F54A8D  
Secondary:#133382  

## Theme B (Alternative)
Primary:  #063347  
Secondary:#F0561D  

### Requirements:
- Global theme provider
- Persistent theme (localStorage)
- System preference detection
- Runtime toggle
- Tailwind integration
- CSS variable based
- shadcn theme compatibility
- Component-level theming
- Dark/Light adaptive mapping
- Accessible contrast ratios
- Smooth transitions
- Animation-safe switching

---

# 🧭 APPLICATIONS

## apps/web-app (User Platform)

### Implement:

### 1) Global Layout System
- App shell
- Header
- Footer
- Sidebar
- Mobile navigation
- Theme toggle
- User menu
- Role-aware navigation

---

### 2) Onboarding Flow
- Welcome screen
- Role selection
- Profile setup
- Preferences setup
- Learning goals
- Difficulty awareness
- Personalization hooks

---

### 3) Auth Experience
- Login UI
- Signup UI
- Password reset
- Email verification UI (when enabled)
- Secure redirects
- Session awareness
- Auth guards

---

### 4) Dashboard UI
- Performance overview
- Progress tracking
- Exam history
- Analytics cards
- Strength/weakness widgets
- Improvement suggestions
- Trends visualization

---

### 5) Quiz Flow UI
- Domain selection
- Subject selection
- Topic selection
- Multi-select UI
- Difficulty display
- Exam rules display
- Start exam flow

---

### 6) Exam UI
- Timer system
- Question rendering
- MCQ layout
- Code-option MCQ layout
- Navigation controls
- Progress bar
- Save state
- Auto-submit
- Resume UI
- Network recovery UI

---

### 7) Result & Report UI
- Score display
- Topic breakdown
- Difficulty breakdown
- Skill mapping
- Strength visualization
- Weakness mapping
- Mastery charts
- Improvement suggestions
- Download report
- Share report

---

### 8) Analytics UI
- Trends
- Performance graphs
- History views
- Comparative analytics
- Growth curves

---

# 🧱 apps/admin-app (Admin Platform)

### Implement:

### 1) Admin Layout
- Admin shell
- Secure routing
- Role isolation
- Admin navigation
- Governance UI

---

### 2) Admin Dashboard
- Platform metrics
- User analytics
- Exam analytics
- Content analytics
- Risk indicators

---

### 3) Content Management UI
- Domain manager
- Subject manager
- Topic manager
- Question manager
- Option editor
- Validation UI
- Preview system

---

### 4) Governance UI
- Moderation flows
- Approval pipelines
- Audit viewer
- Compliance logs
- Admin actions tracking

---

# 🧠 STATE MANAGEMENT

Implement:
- Global state store
- Auth store
- Theme store
- Quiz state
- Exam state
- Session state
- Dashboard state
- Admin state

Use:
- Zustand
- Context only where required
- Server state separation
- Cache optimization
- SSR safety

---

# 📐 ROUTING ARCHITECTURE

Implement:
- Public routes
- Protected routes
- Role-based routing
- Admin isolation routing
- Error boundaries
- Loading states
- Not-found pages
- Suspense boundaries

---

# ⚡ PERFORMANCE

Implement:
- Code splitting
- Lazy loading
- Dynamic imports
- Prefetching
- Edge optimization
- CDN readiness
- Lighthouse optimization
- Core Web Vitals optimization
- SEO metadata
- Image optimization
- Font optimization

---

# 🧪 QA

Implement:
- UI tests
- accessibility tests
- responsiveness tests
- visual regression readiness
- performance benchmarks

---

# 📚 DOCUMENTATION

Generate:
- UI architecture docs
- Component hierarchy diagrams
- Routing maps
- Theme system docs
- State management docs
- UX flows
- Interaction diagrams

---

# 🧠 EXECUTION RULES FOR CLAUDE

Claude must:
- Build real UI components
- Implement real routing
- Implement real layouts
- Use production patterns
- Avoid mock UI
- Avoid placeholder flows
- Follow modular design
- Respect monorepo structure
- Respect platform layering
- Respect security boundaries
- Respect scalability
- Respect accessibility
- Respect performance
- Respect theme consistency
- Implement toggle theme properly
- Ensure full UI cohesion

---

# ✅ FINAL OUTPUT EXPECTED

- Web app UI system
- Admin app UI system
- Global theme system
- Theme toggle implemented
- Color themes implemented
- Layout systems built
- Quiz UX implemented
- Exam UX implemented
- Report UX implemented
- Dashboard UX implemented
- Admin UX implemented
- Routing system
- State management system
- Performance optimizations
- Docs generated
