export interface InventoryItem {
    journeyFile: string;
    codeMapped: string;
}

export interface FolderBreakdown {
    folder: string;
    count: number;
    purpose: string;
}

export interface FolderMapItem {
    intent: string;
    directory: string;
    keyFiles: string;
}

export interface ComponentAuditItem {
    component: string;
    purpose: string;
}

export const MASTER_FOLDER_MAP: FolderMapItem[] = [
    { intent: 'THE LAW', directory: 'docs/architecture/', keyFiles: 'PROJECT_MANIFESTO, SYSTEM_ARCHITECTURE, AGENT_CONSTITUTION' },
    { intent: 'THE LOGIC', directory: 'docs/specs/', keyFiles: 'CORE_PLATFORM_SPEC, ADMIN_PLATFORM_SPEC, INFRASTRUCTURE_SPEC' },
    { intent: 'THE UI', directory: 'docs/pages/', keyFiles: 'CORE_APP_JOURNEY, AUTH_JOURNEY, ADMIN_JOURNEY, EXAM_JOURNEY' },
    { intent: 'THE STATUS', directory: 'docs/execution/', keyFiles: 'CURRENT_STATE_REPORT, TASK_HISTORY, CURRENT_TASK_LOG' },
    { intent: 'THE RULES', directory: 'docs/ux/', keyFiles: 'UX_BASELINE' },
    { intent: 'THE PAST', directory: 'docs/archive/', keyFiles: 'EXECUTION_LOGS_ARCHIVE, WALKTHROUGH_ARCHIVE, AUDIT_REPORT_JAN24' },
];

export const INVENTORY_GROUPS = [
    {
        title: 'Governance & Constitution',
        description: 'The supreme laws and AI governance protocols.',
        items: [
            { journeyFile: 'AGENT_CONSTITUTION.md', codeMapped: '.agent/ (AI Governance)' },
            { journeyFile: 'PROJECT_MANIFESTO.md', codeMapped: 'docs/architecture/ (System Laws)' },
        ]
    },
    {
        title: 'System Architecture',
        description: 'High-level boundaries, design systems, and infrastructure.',
        items: [
            { journeyFile: 'SYSTEM_ARCHITECTURE.md', codeMapped: 'docs/architecture/ (System Boundary)' },
            { journeyFile: 'UX_BASELINE.md', codeMapped: 'docs/ux/ (Design System)' },
            { journeyFile: 'INFRASTRUCTURE_SPEC.md', codeMapped: 'packages/config, packages/types, packages/db' },
        ]
    },
    {
        title: 'Core Specifications',
        description: 'Detailed platform logic and operational specs.',
        items: [
            { journeyFile: 'CORE_PLATFORM_SPEC.md', codeMapped: 'docs/specs/ (Engine Logic)' },
            { journeyFile: 'ADMIN_PLATFORM_SPEC.md', codeMapped: 'docs/specs/ (Admin Logic)' },
        ]
    },
    {
        title: 'User Journeys (UI)',
        description: 'Frontend contracts mapped to application routes.',
        items: [
            { journeyFile: 'AUTH_JOURNEY.md', codeMapped: 'signup/, login/, onboarding/, AuthGuard.tsx' },
            { journeyFile: 'CORE_APP_JOURNEY.md', codeMapped: 'dashboard/, reports/, Sidebar.tsx, StatsCards.tsx' },
            { journeyFile: 'EXAM_JOURNEY.md', codeMapped: 'quiz/new, active-session, QuizSelection.tsx' },
            { journeyFile: 'ADMIN_JOURNEY.md', codeMapped: 'admin-app/ (Pages & ContentManager)' },
            { journeyFile: 'DOCS_VIEWER_JOURNEY.md', codeMapped: 'admin-app/ (DocsViewer, Turnstiles)' },
            { journeyFile: 'README.md', codeMapped: 'docs/ (Root Index)' },
            { journeyFile: '_PAGE_TEMPLATE.md', codeMapped: 'docs/pages/ (Standard Blueprint)' },
        ]
    },
    {
        title: 'Execution Status',
        description: 'Live audit logs and real-time state reports.',
        items: [
            { journeyFile: 'CURRENT_STATE_REPORT.md', codeMapped: 'docs/execution/ (Real-time Status)' },
            { journeyFile: 'TASK_HISTORY.md', codeMapped: 'docs/execution/ (Audit Log)' },
            { journeyFile: 'CURRENT_TASK_LOG.md', codeMapped: 'docs/execution/ (Active Session)' },
        ]
    },
    {
        title: 'Historical Archives',
        description: 'Evidence of past work and verification.',
        items: [
            { journeyFile: 'EXECUTION_LOGS_ARCHIVE.md', codeMapped: 'docs/archive/ (Historical)' },
            { journeyFile: 'WALKTHROUGH_ARCHIVE.md', codeMapped: 'docs/archive/ (Verification)' },
            { journeyFile: 'AUDIT_REPORT_JAN24.md', codeMapped: 'docs/archive/ (Audit)' },
            { journeyFile: 'WALKTHROUGH_DISCOVERY_ORCHESTRATOR.md', codeMapped: 'admin-app/ (Search & Filters)' },
        ]
    }
];

export const GOVERNANCE_DATA = {
    overview: [
        { attribute: 'Version', details: 'v2.0' },
        { attribute: 'Scope', details: 'All Antigravity Agents' },
        { attribute: 'Applies To', details: 'Every model, every execution, every task' },
        { attribute: 'Priority', details: 'ABSOLUTE' },
        { attribute: 'Change Policy', details: 'User-only approval' },
    ],
    hierarchy: [
        { rank: '1', source: '@docs/**', description: 'Absolute Source of Truth' },
        { rank: '2', source: 'Executable artifacts (SQL, migrations)', description: 'Immutable Truth' },
        { rank: '3', source: 'agent/**', description: 'Behavioral control only' },
        { rank: '4', source: 'Model reasoning', description: 'Lowest priority' },
    ],
    hierarchyNote: 'Conflict Rule: Higher authority ALWAYS wins. Agent MUST STOP and ASK the user.',
    permissions: [
        { path: '@docs/**', read: '✅', write: '❌', notes: 'Read-only unless user says "update docs".' },
        { path: 'apps/**', read: '✅', write: '⚠️', notes: 'Write ONLY within requested scope.' },
        { path: 'packages/**', read: '✅', write: '⚠️', notes: 'Write ONLY for named modules.' },
        { path: 'agent/**', read: '✅', write: '✅', notes: 'Behavior & orchestration only.' },
        { path: 'SQL / Migrations', read: '✅', write: '❌', notes: 'Immutable unless user says "modify migration SQL".' },
    ],
    folderIntentMap: [
        { folder: 'THE LAW', intent: 'docs/architecture/', keyFiles: 'PROJECT_MANIFESTO, SYSTEM_ARCHITECTURE' },
        { folder: 'THE LOGIC', intent: 'docs/specs/', keyFiles: 'CORE_PLATFORM_SPEC, ADMIN_PLATFORM_SPEC, INFRASTRUCTURE_SPEC' },
        { folder: 'THE UI', intent: 'docs/pages/', keyFiles: 'CORE_APP_JOURNEY, AUTH_JOURNEY, ADMIN_JOURNEY, EXAM_JOURNEY' },
        { folder: 'THE STATUS', intent: 'docs/execution/', keyFiles: 'CURRENT_STATE_REPORT, TASK_HISTORY, CURRENT_TASK_LOG' },
        { folder: 'THE RULES', intent: 'docs/ux/', keyFiles: 'UX_BASELINE' },
        { folder: 'THE PAST', intent: 'docs/archive/', keyFiles: 'EXECUTION_LOGS_ARCHIVE, WALKTHROUGH_ARCHIVE, AUDIT_REPORT_JAN24' },
    ],
    stopConditions: [
        'Request contradicts @docs/**',
        'File location is ambiguous',
        'User implies a "Non-Goal" (e.g., self-healing migrations, automatic schema refactoring)',
    ],
    standards: [
        { principle: 'Scalability', description: 'Support millions of users (stateless, pagination)' },
        { principle: 'Frontend', description: '"Visual WOW Factor" mandatory, mobile-first (Tailwind)' },
        { principle: 'BFF Pattern', description: 'Minimize payloads, aggregate APIs' },
        { principle: 'Security', description: 'Zero Trust, RBAC, automatic sanitization' },
        { principle: 'Database', description: 'Efficient indexing, no SELECT * on hot paths' },
    ],
    changePolicy: [
        'Preserve intent',
        'Append-Only (prefer appending over rewriting)',
        'Traceability (add change logs if significant)',
    ],
    cycleOfTruth: [
        { step: '1', governs: 'Constitution → Manifesto', logs: '.agent/AGENT_CONSTITUTION.md, docs/architecture/PROJECT_MANIFESTO.md' },
        { step: '2', governs: 'Manifesto → Execution', logs: 'Architecture & spec files (SYSTEM_ARCHITECTURE, CORE_PLATFORM_SPEC, etc.)' },
        { step: '3', governs: 'Execution → Brain Log', logs: 'docs/execution/*.md' },
        { step: '4', governs: 'Brain Log → Docs', logs: 'docs/archive/*.md' },
    ]
};

export const MANIFESTO_DATA = {
    docGovernance: [
        { rule: 'Global Placement', details: 'All .md files must live in semantic folders (no root docs/ placement).' },
        { rule: 'Journey Mapping', details: 'Page contracts must live under docs/pages/<journey>/.' },
        { rule: 'Domain Shared', details: 'Global rules (UX, Architecture) must live in domain folders.' },
    ],
    folderIntentGuide: [
        { folder: 'docs/architecture/', intent: 'Foundational Truth & Layout', keyFiles: 'MANIFESTO, ARCHITECTURE' },
        { folder: 'docs/specs/', intent: 'Technical Logic Consolidation', keyFiles: 'CORE, ADMIN, INFRA' },
        { folder: 'docs/pages/', intent: 'UI User Journey Maps', keyFiles: 'AUTH, CORE, EXAM, ADMIN' },
        { folder: 'docs/execution/', intent: 'Session Logs & State Reports', keyFiles: 'STATUS, HISTORY, LOGS' },
        { folder: 'docs/ux/', intent: 'Global Design & Filtering Rules', keyFiles: 'UX_BASELINE' },
    ],
    gitPushPolicy: [
        { policy: 'Local Commit Only', details: 'Commit frequently but DO NOT PUSH automatically.' },
        { policy: 'Push Approval', details: 'Only push to GitHub when explicitly requested by user.' },
        { policy: 'Vercel Safety', details: 'Prevents exceeding daily deployment limits (100/day).' },
    ],
    onboardingPrinciples: [
        { principle: 'Absolute Authority', description: 'AGENT_CONSTITUTION.md is the supreme law.' },
        { principle: 'Truth Source', description: 'Documentation defines truth; Model reasoning has lowest priority.' },
        { principle: 'Execution Safety', description: 'Agents execute but do NOT decide architectural changes.' },
    ],
    workflowMandate: [
        { step: '1', action: 'Define Contracts', detail: 'Update .md files BEFORE starting code execution.' },
        { step: '2', action: 'Governing Prompts', detail: 'Generate Antigravity prompts ONLY from existing contracts.' },
        { step: '3', action: 'Audit Log', detail: 'Every task must be logged in CURRENT_TASK_LOG.md.' },
    ]
};

export const ARCHITECTURE_DATA = {
    runtimeEngines: [
        { engine: 'Quiz Engine', purpose: 'Lifecycle and real-time state management for active sessions.' },
        { engine: 'Exam Engine', purpose: 'Session timing, question serving, and submission flow control.' },
        { engine: 'Answer Evaluation', purpose: 'Content-aware correctness check and state persistence logic.' },
        { engine: 'Scoring Engine', purpose: 'Multi-dimensional accuracy calculation and mastery analysis.' },
        { engine: 'Admin Engine', purpose: 'User discovery orchestrator and content lifecycle management.' },
    ],
    schemaMapping: [
        { file: 'auth.ts', tables: 'users, sessions, roles, audit_logs', intent: 'Identity & RBAC' },
        { file: 'domain.ts', tables: 'domains, subjects, topics, skills', intent: 'Curriculum Hierarchy' },
        { file: 'exam.ts', tables: 'exams, blueprints, results', intent: 'Runtime Persistence' },
        { file: 'question.ts', tables: 'questions, question_options', intent: 'Question Bank' },
    ],
    scoringLogic: [
        { metric: 'Total Score', logic: '(Total Correct / Total Count) * 100' },
        { metric: 'Mastery Breakdown', logic: 'Accuracy per Dimension (Topic, Subject, Difficulty)' },
        { metric: 'Growth Zones', logic: 'Identified where Accuracy < 70% in high-weight topics' },
    ],
    adminCoverage: [
        { panel: 'User Overview', tables: 'users, login_attempts' },
        { panel: 'Security Health', tables: 'audit_logs, refresh_tokens' },
        { panel: 'Question Health', tables: 'questions, domains, topics' },
    ]
};

export const ADMIN_SPEC_DATA = {
    authStrategy: [
        { layer: 'Isolation', principle: 'Admin sessions logically separated from public user sessions.' },
        { layer: 'Token Scoping', principle: 'Specific claims (role: admin) required; invalid for public user routes.' },
        { layer: 'Signup Restricted', principle: 'Public signup DISABLED. Restricted to internal invites only.' },
    ],
    modules: [
        { module: 'User Overview', purpose: 'Identity search and real-time activity signals.', logic: 'Discovery_Orchestrator' },
        { module: 'RBAC Governance', purpose: 'Role assignment and privilege escalation prevention.', logic: 'Audit History' },
        { module: 'Question Bank', purpose: 'Hierarchical 5-step wizard (Domain -> Subject -> Topic -> Ques).', logic: '30/30/40 Split' },
        { module: 'Exam Monitoring', purpose: 'Blueprint integrity audit and generation success logs.', logic: 'Deterministic JSON' },
    ],
    recoveryFlow: [
        { step: '1', action: 'Request Reset', target: '/forgot-password' },
        { step: '2', action: 'Verify Token', target: 'Email Service (Redacted)' },
        { step: '3', action: 'Set Password', target: '/reset-password (Admin App Context)' },
    ]
};

export const CORE_SPEC_DATA = {
    authServices: [
        { service: 'Password Service', responsibility: 'Bcrypt hashing and verification logic.' },
        { service: 'Token Service', responsibility: 'JWT sign/verify, expiration, and rotation.' },
        { service: 'Security Service', responsibility: 'Rate limiting and CSRF protection modules.' },
    ],
    blueprintRules: [
        { rule: 'Mixed (Enterprise)', value: 'Simple: 30%, Intermediate: 30%, Expert: 40%' },
        { rule: 'Specific Tier', value: '100% allocation to selected difficulty level.' },
        { rule: 'Integrity', value: 'No Duplicates; Deterministic shuffling; Shuffled within buckets.' },
    ],
    navigationEnforcement: [
        { hook: 'Back Button', behavior: 'Intercept via popstate; show logout warning modal.' },
        { hook: 'Cache Control', behavior: 'Disable cache; re-validate token on every mount.' },
    ]
};

export const UX_SPEC_DATA = {
    breakpoints: [
        { prefix: 'sm', width: '640px', usage: 'Mobile Landscape / Tablet' },
        { prefix: 'md', width: '768px', usage: 'Tablet Portrait / Laptop' },
        { prefix: 'lg', width: '1024px', usage: 'Desktop (Standard)' },
    ],
    interactionStates: [
        { state: 'Hover', visual: 'Opacity / Color Shift' },
        { state: 'Focus', visual: 'Ring-2 Glow (Accessibility)' },
        { state: 'Loading', visual: 'Spinner / Disabled State' },
    ],
    componentStandards: [
        { component: 'Cards', padding: 'p-4 (Mob) / p-6 (Desk)', border: 'Gray-100 (Light)' },
        { component: 'Tables', behavior: 'Sticky Headers; Scrollable on Mobile', state: 'Explicit Empty State' },
    ]
};

export const INFRA_DATA = {
    envConfig: [
        { Detection: 'Vercel Preview', Link: '*.vercel.app' },
        { Detection: 'Production', Link: 'Production API' },
        { Detection: 'Secrets (.env)', Status: 'Gitignored / Vercel Dashboard' },
    ],
    configInventory: [
        { file: 'package.json', purpose: 'Node v20.x, pnpm v9.15.4' },
        { file: 'turbo.json', purpose: 'Turbo 2.0 Tasks & Cache' },
        { file: '.npmrc', purpose: 'Hoisted Linker (Next.js Monorepo)' },
    ],
    deployment: [
        { project: 'Web App', root: 'apps/web-app', framework: 'Next.js' },
        { project: 'API Server', root: 'apps/api-server', framework: 'Next.js' },
        { project: 'Admin App', root: 'apps/admin-app', framework: 'Next.js' },
    ]
};

export const JOURNEY_DATA = {
    folders: [
        { journey: 'Auth', path: 'docs/pages/auth/', content: 'Signup, Login, Recovery, Recovery Flow' },
        { journey: 'Admin', path: 'docs/pages/admin/', content: 'Governance Terminal, Discovery_Orchestrator' },
        { journey: 'Exams', path: 'docs/pages/exams/', content: 'Blueprint Config & Active Sessions' },
        { journey: 'Core', path: 'docs/pages/', content: 'Dashboard, Reports, Global Settings' },
    ]
};

export const HEALTH_DATA = {
    buildStability: [
        { item: 'Node Version', status: '20.x Locked' },
        { item: 'Package Manager', status: 'pnpm@9.15.4' },
        { item: 'Workspace Protocol', status: 'Active (workspace:*)' },
        { item: 'Turbo Engine', status: 'Turbo 2.0 (Verified)' },
    ],
    implementationAudit: [
        { layer: 'Infrastructure', status: '100%', notes: 'Monorepo, DB, CI/CD stabilized.' },
        { layer: 'Database', status: '100%', notes: 'Auth, Exam, Content, Blueprint schemas live.' },
        { layer: 'Backend', status: '90%', notes: 'Admin, Auth, Domain, Question services live.' },
        { layer: 'Frontend', status: '95%', notes: 'Admin high-fidelity governance live.' },
    ],
    risks: [
        { risk: 'Data Density', mitigation: 'Label thinning on 28D charts.' },
        { risk: 'Mobile Areas', mitigation: 'Margin management for bottom nav.' },
        { risk: 'Git Policy', mitigation: 'Local-commit-only mandate enforced.' },
    ]
};

export const BRAIN_LOG_DATA = {
    overview: [
        { attribute: 'Date', details: '2026-01-28' },
        { attribute: 'Operation', details: 'Consolidation & Cleanup' },
        { attribute: 'Agent', details: 'Antigravity' },
        { attribute: 'Goal', details: 'Reduce documentation fragmentation, improve discoverability' },
    ],
    batches: [
        { batch: '1', action: 'Architecture Consolidation', created: 'docs/architecture/SYSTEM_ARCHITECTURE.md', merged: 'runtime-engine-architecture.md, DATABASE_ERD.md, SCORING_ENGINE_SPEC.md' },
        { batch: '2', action: 'Manifesto Creation', created: 'docs/architecture/PROJECT_MANIFESTO.md', merged: 'PROJECT_INSTRUCTIONS.md, PROJECT_BOOTSTRAP.md, NEW_SESSION_CHECKLIST.md' },
        { batch: '3', action: 'Specification Consolidation', created: 'docs/specs/ADMIN_PLATFORM_SPEC.md', merged: 'ADMIN_DASHBOARD_EXECUTION.md, ADMIN_AUTHENTICATION.md, ADMIN_PASSWORD_PLAN.md, ADMIN_DASHBOARD_SPEC.md' },
        { batch: '3', action: 'Specification Consolidation', created: 'docs/specs/CORE_PLATFORM_SPEC.md', merged: 'AUTH_SYSTEM_EXECUTION.md, DOMAIN_SERVICES_EXECUTION.md, EXAM_ENGINE_EXECUTION.md, email-delivery.md, EXAM_BLUEPRINT_GENERATION.md, AUTH_ERROR_AND_SESSION_HANDLING.md' },
        { batch: '3', action: 'Specification Consolidation', created: 'docs/specs/INFRASTRUCTURE_SPEC.md', merged: 'Scaffold Monorepo Next.js App.md, LOCKFILE_FIX.md' },
        { batch: '4', action: 'Status Reporting', created: 'docs/execution/CURRENT_STATE_REPORT.md', merged: 'IMPLEMENTATION_STATUS.md, TASK_IMPLEMENTATION_MAPPING.md, CURRENT_PROJECT_HANDOFF.md' },
        { batch: '5', action: 'Archiving', created: 'docs/archive/EXECUTION_LOGS_ARCHIVE.md', merged: '10+ historical task logs (Claude era)' },
        { batch: '6', action: 'Batch 2 Consolidation', created: '—', merged: 'Merged docs/platform/* into INFRASTRUCTURE_SPEC.md. Deleted docs/admin, docs/platform.' },
        { batch: '7', action: 'Page Contract Consolidation', created: 'docs/pages/auth/AUTH_JOURNEY.md', merged: 'Merged 5 auth files' },
        { batch: '7', action: 'Page Contract Consolidation', created: 'docs/pages/admin/ADMIN_JOURNEY.md', merged: 'Merged 2 admin files' },
        { batch: '7', action: 'Page Contract Consolidation', created: 'docs/pages/exams/EXAM_JOURNEY.md', merged: 'Merged 2 exam files' },
        { batch: '8', action: 'Aggressive Consolidation', created: '—', merged: 'Merged DATA_TIME_FILTERING.md into UX_BASELINE.md' },
        { batch: '8', action: 'Aggressive Consolidation', created: '—', merged: 'Merged dashboard.md, reports.md, settings.md into CORE_APP_JOURNEY.md' },
        { batch: '9', action: 'Agent Directory Cleanup', created: 'AGENT_CONSTITUTION.md (v2.0)', merged: 'Unified v1.0 and v1.1, deleted v1.1' },
        { batch: '10', action: 'Audit Phase (Redundancy Removal)', created: '—', merged: 'Removed duplicate content across specs, normalized data' },
        { batch: '11', action: 'Final Polish', created: '—', merged: 'Moved PROJECT_AUDIT_REPORT to Archive, deleted docs/audits/ folder, reset CURRENT_TASK_LOG' },
        { batch: '12', action: 'Gold Standard Definition', created: 'Updated AGENT_CONSTITUTION.md', merged: 'Reflected final folder intent map (Law/Logic/UI/Status/Rules/Past)' },
        { batch: '14', action: 'Full Codebase Traceability', created: '—', merged: 'Mapped schema files, root configs, env files, backend services to logical specs' },
        { batch: '15', action: 'Frontend Traceability Audit', created: '—', merged: 'Mapped .tsx files to user journey documents (AUTH_JOURNEY.md, CORE_APP_JOURNEY.md, etc.)' },
        { batch: '16', action: 'Constitution & Inventory Refinement', created: '—', merged: 'Refactored AGENT_CONSTITUTION.md into ConstitutionViewer.tsx, grouped 50+ artifacts logically' },
        { batch: '17', action: 'Exam Entry UX Reliability', created: '—', merged: 'Upgraded QuizSelectionConsole.tsx with rich error banners and handled contextual redirects.' },
    ],
    impact: [
        { metric: 'File Count Reduction', result: '~60 → ~30' },
        { metric: 'Data Loss', result: '0% (All content appended/merged)' },
        { metric: 'Logical Structure Enforced', result: 'Yes (specs/, architecture/, archive/)' },
        { metric: 'Page Contracts Organized', result: 'By User Journey sequences' },
        { metric: 'Normalized Data', result: '100% (No duplicate facts)' },
        { metric: 'Physical-to-Logical Mapping', result: '100% Achieved' },
        { metric: 'Governance Visual Parity', result: '100% Achieved (Cycle of Truth)' },
    ],
    futureUsage: [
        { type: 'New Task', start: 'PROJECT_MANIFESTO → CURRENT_STATE_REPORT', reference: 'Current status & goals' },
        { type: 'Architectural Reference', start: 'SYSTEM_ARCHITECTURE.md, specs/*.md', reference: 'System design & specs' },
        { type: 'Debugging / Historical Context', start: 'archive/EXECUTION_LOGS_ARCHIVE.md', reference: 'Past execution logs & walkthroughs' },
    ],
    structureSummary: [
        { folder: 'docs/architecture/', purpose: 'THE LAW — Foundational docs' },
        { folder: 'docs/specs/', purpose: 'THE LOGIC — Platform specs' },
        { folder: 'docs/pages/', purpose: 'THE UI — User journey maps' },
        { folder: 'docs/execution/', purpose: 'THE STATUS — Current state & logs' },
        { folder: 'docs/ux/', purpose: 'THE RULES — UX baseline' },
        { folder: 'docs/archive/', purpose: 'THE PAST — Historical logs' },
    ]
};

export const COMPONENT_INVENTORY: ComponentAuditItem[] = [
    { component: 'ContentManager.tsx', purpose: 'Centralized orchestrator for question bank hierarchy and data integrity.' },
    { component: 'QuestionEditor.tsx', purpose: 'Dynamic form engine for rich-text question creation and metadata tagging.' },
    { component: 'DocsViewer.tsx', purpose: 'The primary governance interface for high-fidelity documentation rendering.' },
    { component: 'MarkdownRenderer.tsx', purpose: 'Premium "AI-Style" content engine with pure-light executive formatting.' },
    { component: 'GovernanceInventory.tsx', purpose: 'Interactive "Radar" board providing macro-level project audit views.' },
    { component: 'CascadingSelect.tsx', purpose: 'High-performance hierarchy selection with real-time dependency filtering.' },
    { component: 'AdminStats.tsx', purpose: 'Enterprise analytics dashboard for platform-wide health monitoring.' },
    { component: 'DomainTable.tsx', purpose: 'Governance board for managing primary subject area classifications.' },
];

export const FOLDER_BREAKDOWN: FolderBreakdown[] = [
    { folder: 'pages/', count: 7, purpose: 'Frontend Page Contracts (Auth, Dashboard, Exams)' },
    { folder: 'archive/', count: 3, purpose: 'Historical Execution Logs & Evidence' },
    { folder: 'specs/', count: 3, purpose: 'Core Technical Specs (Admin, Core, Infra)' },
    { folder: 'execution/', count: 3, purpose: 'Status Reports (Current State, Task Logs)' },
    { folder: 'architecture/', count: 2, purpose: 'System Truth (Manifesto, Architecture)' },
    { folder: 'ux/', count: 1, purpose: 'Global Design Rules' },
    { folder: 'sql/', count: 1, purpose: 'Database Migrations & SQL References' },
    { folder: 'docs/', count: 1, purpose: 'Main Documentation Entry Point (README)' },
];

export const TASK_HISTORY_DATA = [
    { date: '2026-02-07', task: 'Exam Entry UX Reliability', status: 'COMPLETED', summary: 'Implemented Launch Failure banners and contextual redirects for invalid exam session links.' },
    { date: '2026-01-28', task: 'Question Bank CRUD Implementation', status: 'COMPLETED', summary: 'Implemented full CRUD suite for Domains, Subjects, Topics, Subtopics, and Skills with cascading logical validation.' },
    { date: '2026-01-28', task: 'Proactive Core Digitization', status: 'COMPLETED', summary: 'Proactively digitized PROJECT_MANIFESTO and SYSTEM_ARCHITECTURE into executive-grade viewers.' },
    { date: '2026-01-28', task: 'Brain Log Digitization', status: 'COMPLETED', summary: 'Digitized BRAIN_LOG_RESTRUCTURE.md into high-fidelity React tables mirroring the visual spec.' },
    { date: '2026-01-28', task: 'Logical Inventory Grouping', status: 'COMPLETED', summary: 'Restructured inventory tables into logical feature-based subgroups for improved discoverability.' },
    { date: '2026-01-28', task: 'Constitution Alignment', status: 'COMPLETED', summary: 'Aligned digitized constitution tables with visual spec (Overview, STOP Conditions, Cycle of Truth).' },
    { date: '2026-01-28', task: 'Governance Constitution Digitization', status: 'COMPLETED', summary: 'Digitized AGENT_CONSTITUTION.md into structured React tables for the Governance Dashboard.' },
    { date: '2026-01-28', task: 'Universal Admin Filtering', status: 'COMPLETED', summary: 'Implemented real-time search and filtering across all Admin Question Bank tables and Dashboards.' },
    { date: '2026-01-28', task: 'AI-Engine Driven Filtering', status: 'COMPLETED', summary: 'Implemented Discovery_Orchestrator for User Management and tabular Documentation rendering.' },
    { date: '2026-01-28', task: 'Executive UI/UX Overhaul', status: 'COMPLETED', summary: 'Redesigned Governance tab to Executive White theme and restored original Question Bank UI.' },
    { date: '2026-01-28', task: 'Admin Governance Dashboard', status: 'COMPLETED', summary: 'Implemented high-fidelity documentation viewer with vertical stack layout and Cycle of Truth integration.' },
    { date: '2026-01-27', task: 'FAANG Standards Mandate', status: 'COMPLETED', summary: 'Updated AGENT_CONSTITUTION.md with SDE-3 level engineering and scalability requirements.' },
    { date: '2026-01-27', task: 'Enterprise Dashboard Reorg', status: 'COMPLETED', summary: 'Rebuilt Admin Dashboard with horizontal header, Platform Control sidebar, and pink theme.' },
    { date: '2026-01-27', task: 'Database Schema Sync', status: 'COMPLETED', summary: 'Resolved relational integrity errors and standardized subtopic_id column naming.' },
    { date: '2026-01-27', task: 'Admin Live Dashboard', status: 'COMPLETED', summary: 'Implemented real-time session tracking, optimized for millions of concurrent users.' },
    { date: '2026-01-26', task: 'Admin Authentication', status: 'COMPLETED', summary: 'Added AdminAuthService, Admin Login Route, and Page Contracts.' },
];

export const CURRENT_TASK_DATA = {
    status: 'IDLE',
    items: [
        'Question Bank CRUD Suite (Domains, Subjects, Topics, Subtopics, Skills) 100% COMPLETED.',
        'Hierarchical Cascading Logic (useAdminHierarchy) live.',
        'Documentation Streaming API fully operational.',
        'All high-fidelity governance tables in parity with spec.'
    ]
};

export const FILE_PURPOSE_MAP: Record<string, string> = {
    'architecture/PROJECT_MANIFESTO.md': 'The governing document for project standards, documentation placement, and engineering philosophy.',
    'architecture/SYSTEM_ARCHITECTURE.md': 'High-level technical architecture, including service boundaries and data flow diagrams.',
    'specs/CORE_PLATFORM_SPEC.md': 'Detailed technical specification for the primary Quiz Platform engine and rules.',
    'specs/ADMIN_PLATFORM_SPEC.md': 'Operational specification for administrative controls and oversight systems.',
    'specs/INFRASTRUCTURE_SPEC.md': 'Infrastructure-as-code and deployment pipeline specifications.',
    'pages/CORE_APP_JOURNEY.md': 'Primary user path through the core quiz application experience.',
    'pages/auth/AUTH_JOURNEY.md': 'Lifecycle and security flows for user authentication and onboarding.',
    'pages/admin/ADMIN_JOURNEY.md': 'Administrative workflows including content management and system monitoring.',
    'pages/exams/EXAM_JOURNEY.md': 'The end-to-end student assessment journey, from selection to completion.',
    'pages/admin/DOCS_VIEWER_JOURNEY.md': 'Contract for the documentation viewer and governance radar implementation.',
    'pages/README.md': 'Directory-level overview for the User Journey documentation folder.',
    'pages/_PAGE_TEMPLATE.md': 'A standardized blueprint for creating consistent journey documentation across the project.',
    'README.md': 'The primary technical entry point and root-level index for the documentation system.',
    'execution/CURRENT_STATE_REPORT.md': 'Real-time audit of project health, build stability, and feature completeness.',
    'execution/TASK_HISTORY.md': 'A historical record of all completed milestones for long-term auditability.',
    'execution/CURRENT_TASK_LOG.md': 'Active execution log for the current session and terminal activities.',
    'ux/UX_BASELINE.md': 'Foundational design rules for filtering, density, and interactive elements.',
    'archive/EXECUTION_LOGS_ARCHIVE.md': 'Archive of terminal outputs and agent activities from previous versions.',
    'archive/WALKTHROUGH_ARCHIVE.md': 'Historical evidence of feature verification and visual sign-offs.',
    'archive/AUDIT_REPORT_JAN24.md': 'Comprehensive project audit performed in January 2024.',
    '../../.agent/AGENT_CONSTITUTION.md': 'The supreme law governing AI behavior, engineering standards, and execution safety.'
};
