export interface InventoryItem {
    journeyFile: string;
    codeMapped: string;
}

export interface FolderBreakdown {
    folder: string;
    count: number;
    purpose: string;
}

export const FRONTEND_INVENTORY: InventoryItem[] = [
    { journeyFile: 'AUTH_JOURNEY.md', codeMapped: 'signup/, login/, onboarding/, AuthGuard.tsx' },
    { journeyFile: 'CORE_APP_JOURNEY.md', codeMapped: 'dashboard/, reports/, Sidebar.tsx, StatsCards.tsx' },
    { journeyFile: 'EXAM_JOURNEY.md', codeMapped: 'quiz/new, active-session, QuizSelection.tsx' },
    { journeyFile: 'ADMIN_JOURNEY.md', codeMapped: 'admin-app/** (Pages & key components like ContentManager)' },
    { journeyFile: 'INFRASTRUCTURE_SPEC.md', codeMapped: 'packages/config, packages/types' },
];

export const FOLDER_BREAKDOWN: FolderBreakdown[] = [
    { folder: 'pages/', count: 14, purpose: 'Frontend Page Contracts (Auth, Dashboard, Exams)' },
    { folder: 'walkthroughs/', count: 6, purpose: 'Verification Logs & Artifacts' },
    { folder: 'specs/', count: 3, purpose: 'Core Technical Specs (Admin, Core, Infra)' },
    { folder: 'execution/', count: 3, purpose: 'Status Reports (Current State, Task Logs)' },
    { folder: 'architecture/', count: 2, purpose: 'System Truth (Manifesto, Architecture)' },
    { folder: 'ux/', count: 2, purpose: 'Global Design Rules' },
    { folder: 'archive/', count: 1, purpose: 'Historical Execution Logs' },
    { folder: 'audits/', count: 1, purpose: 'Project Audit Report' },
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
    'execution/CURRENT_STATE_REPORT.md': 'Real-time audit of project health, build stability, and feature completeness.',
    'execution/TASK_HISTORY.md': 'A historical record of all completed milestones for long-term auditability.',
    'execution/CURRENT_TASK_LOG.md': 'Active execution log for the current session and terminal activities.',
    'ux/UX_BASELINE.md': 'Foundational design rules for filtering, density, and interactive elements.',
    '../../.agent/AGENT_CONSTITUTION.md': 'The supreme law governing AI behavior, engineering standards, and execution safety.'
};
