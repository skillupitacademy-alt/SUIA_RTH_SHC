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
    hierarchy: [
        { rank: '1', source: '@docs/**', description: 'Absolute Source of Truth' },
        { rank: '2', source: 'Executable artifacts (SQL, migrations)', description: 'Immutable Truth' },
        { rank: '3', source: 'agent/**', description: 'Behavioral control only' },
        { rank: '4', source: 'Model reasoning', description: 'Lowest priority' },
    ],
    permissions: [
        { path: '@docs/**', read: '✅', write: '❌', notes: 'Read-only unless user says "update docs".' },
        { path: 'apps/**', read: '✅', write: '⚠️', notes: 'Write ONLY within requested scope.' },
        { path: 'packages/**', read: '✅', write: '⚠️', notes: 'Write ONLY for named modules.' },
        { path: 'agent/**', read: '✅', write: '✅', notes: 'Behavior & orchestration only.' },
        { path: 'SQL / Migrations', read: '✅', write: '❌', notes: 'Immutable unless user says "modify migration SQL".' },
    ],
    standards: [
        { principle: 'Scalability', description: 'Logic must support millions of users (stateless, pagination).' },
        { principle: 'Frontend', description: '"Visual WOW Factor" mandatory. Mobile-first (Tailwind).' },
        { principle: 'BFF Pattern', description: 'Minimize payloads. Aggregate APIs.' },
        { principle: 'Security', description: 'Zero Trust. RBAC. Automatic Sanitization.' },
        { principle: 'Database', description: 'Efficient indexing. No SELECT * on hot paths.' },
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
