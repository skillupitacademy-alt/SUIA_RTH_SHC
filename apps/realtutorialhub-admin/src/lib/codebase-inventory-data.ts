
export interface CodeInventoryItem {
    name: string;
    type: 'Page' | 'Component' | 'API' | 'Service' | 'Config' | 'Layout';
    purpose: string;
}

// --------------------------------------------------------------------------------
// ADMIN APP SUB-SYSTEMS
// --------------------------------------------------------------------------------

export const ADMIN_AUTH_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/layout.tsx', type: 'Layout', purpose: 'Root layout defining global font, theme provider, and metadata.' },
    { name: 'app/page.tsx', type: 'Page', purpose: 'Redirector to login or dashboard based on session state.' },
    { name: 'app/login/page.tsx', type: 'Page', purpose: 'Secure admin authentication entry point.' },
    { name: 'app/forgot-password/page.tsx', type: 'Page', purpose: 'Password recovery request interface.' },
    { name: 'app/reset-password/page.tsx', type: 'Page', purpose: 'Final step of password recovery flow.' },
    { name: 'components/layout/AdminLayout.tsx', type: 'Layout', purpose: 'Authenticated admin shell structure.' },
];

export const ADMIN_DASHBOARD_INVENTORY: CodeInventoryItem[] = [
    { name: 'components/dashboard/RBACGovernancePanel.tsx', type: 'Component', purpose: 'Role-based access control visualization.' },
    { name: 'components/dashboard/SecurityHealthPanel.tsx', type: 'Component', purpose: 'Real-time security signals and alert monitoring.' },
    { name: 'components/dashboard/SystemAuditTerminal.tsx', type: 'Component', purpose: 'Terminal-style view of system logs.' },
    { name: 'components/dashboard/UserAnalyticsPanel.tsx', type: 'Component', purpose: 'Growth and retention metrics visualization.' },
    { name: 'components/dashboard/ContentReadinessBoard.tsx', type: 'Component', purpose: 'Kanban-style view of content lifecycle.' },
    { name: 'components/dashboard/LiveSessionsList.tsx', type: 'Component', purpose: 'Real-time monitoring of active user sessions.' },
];

export const ADMIN_CONTENT_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/questions/page.tsx', type: 'Page', purpose: 'Question Bank management interface.' },
    { name: 'app/questions/new/page.tsx', type: 'Page', purpose: 'Creation flow for new question entities.' },
    { name: 'app/questions/[id]/edit/page.tsx', type: 'Page', purpose: 'Editing interface for existing questions.' },
    { name: 'components/entry/BulkUploadPanel.tsx', type: 'Component', purpose: 'Interface for mass-uploading content via CSV/JSON.' },
    { name: 'components/entry/CascadingSelect.tsx', type: 'Component', purpose: 'Hierarchical dropdowns for Domain/Subject/Topic.' },
    { name: 'components/entry/QuestionEditor.tsx', type: 'Component', purpose: 'Rich form for editing question data.' },
    { name: 'components/questions/QuestionTable.tsx', type: 'Component', purpose: 'Main Question Bank data grid.' },
    { name: 'app/users/page.tsx', type: 'Page', purpose: 'User management interface.' },
    { name: 'components/users/UserTable.tsx', type: 'Component', purpose: 'Data grid for user management.' },
];

export const ADMIN_GOVERNANCE_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/governance/page.tsx', type: 'Page', purpose: 'The Cycle of Truth governance dashboard.' },
    { name: 'components/docs/DocsTabs.tsx', type: 'Component', purpose: 'Navigation for governance document categories.' },
    { name: 'components/docs/DocsViewer.tsx', type: 'Component', purpose: 'Main container for governance documentation.' },
    { name: 'components/docs/GovernanceInventory.tsx', type: 'Component', purpose: 'The Radar view of system artifacts.' },
    { name: 'components/docs/ConstitutionViewer.tsx', type: 'Component', purpose: 'High-fidelity viewer for digitized laws.' },
];

// --------------------------------------------------------------------------------
// WEB APP JOURNEYS
// --------------------------------------------------------------------------------

export const WEB_CORE_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/layout.tsx', type: 'Layout', purpose: 'Root layout with global styles and providers.' },
    { name: 'app/login/page.tsx', type: 'Page', purpose: 'Student authentication entry.' },
    { name: 'app/signup/page.tsx', type: 'Page', purpose: 'New student registration.' },
    { name: 'components/auth/AuthForms.tsx', type: 'Component', purpose: 'Login and Signup form logic.' },
    { name: 'components/auth/AuthGuard.tsx', type: 'Component', purpose: 'Route protection for authenticated users.' },
    { name: 'components/layout/AppShell.tsx', type: 'Layout', purpose: 'Main authenticated application frame.' },
];

export const WEB_STUDENT_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/dashboard/page.tsx', type: 'Page', purpose: 'Student dashboard overview.' },
    { name: 'app/dashboard/settings/page.tsx', type: 'Page', purpose: 'User profile and preference settings.' },
    { name: 'app/onboarding/page.tsx', type: 'Page', purpose: 'Initial user setup flow.' },
    { name: 'components/onboarding/OnboardingWizard.tsx', type: 'Component', purpose: 'Multi-step form for profile completion.' },
    { name: 'components/dashboard/Sidebar.tsx', type: 'Component', purpose: 'Main desktop navigation side bar.' },
    { name: 'components/dashboard/StatsCards.tsx', type: 'Component', purpose: 'Summary KPI cards for the dashboard.' },
];

export const WEB_EXAM_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/quiz/new/page.tsx', type: 'Page', purpose: 'Exam configuration wizard.' },
    { name: 'app/quiz/active-session/page.tsx', type: 'Page', purpose: 'The live exam taking environment.' },
    { name: 'components/quiz/QuizSelection.tsx', type: 'Component', purpose: 'Configuration UI for new exams.' },
    { name: 'components/quiz/ExamInterface.tsx', type: 'Component', purpose: 'Core exam taking UI loop.' },
    { name: 'app/dashboard/my-exams/page.tsx', type: 'Page', purpose: 'List of configured or historical exams.' },
];

export const WEB_REPORTS_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/reports/active-report/page.tsx', type: 'Page', purpose: 'Immediate post-exam results.' },
    { name: 'app/reports/[id]/page.tsx', type: 'Page', purpose: 'Detailed historical exam report.' },
    { name: 'components/reports/PerformanceBreakdown.tsx', type: 'Component', purpose: 'Detailed analysis of exam performance.' },
    { name: 'components/reports/ResultSummary.tsx', type: 'Component', purpose: 'High-level score and outcome summary.' },
];

// --------------------------------------------------------------------------------
// API SERVICE LAYER
// --------------------------------------------------------------------------------

export const API_ADMIN_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/api/admin/domains/route.ts', type: 'API', purpose: 'CRUD operations for Domains.' },
    { name: 'app/api/admin/subjects/route.ts', type: 'API', purpose: 'CRUD operations for Subjects.' },
    { name: 'app/api/admin/topics/route.ts', type: 'API', purpose: 'CRUD operations for Topics.' },
    { name: 'app/api/admin/questions/route.ts', type: 'API', purpose: 'CRUD operations for Questions.' },
    { name: 'app/api/admin/users/route.ts', type: 'API', purpose: 'User management API.' },
];

export const API_AUTH_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/api/auth/login/route.ts', type: 'API', purpose: 'User login handler.' },
    { name: 'app/api/auth/signup/route.ts', type: 'API', purpose: 'User registration handler.' },
    { name: 'app/api/auth/me/route.ts', type: 'API', purpose: 'Current session user retrieval.' },
];

export const API_QUIZ_INVENTORY: CodeInventoryItem[] = [
    { name: 'app/api/quiz/start/route.ts', type: 'API', purpose: 'Initialize a new exam session.' },
    { name: 'app/api/quiz/submit/route.ts', type: 'API', purpose: 'Submit full exam for grading.' },
    { name: 'app/api/quiz/answer/route.ts', type: 'API', purpose: 'Record single answer submission.' },
];

export const API_SERVICES_INVENTORY: CodeInventoryItem[] = [
    { name: 'modules/admin-engine/admin.engine.ts', type: 'Service', purpose: 'Core logic for admin operations.' },
    { name: 'modules/auth/auth.service.ts', type: 'Service', purpose: 'Authentication business logic.' },
    { name: 'modules/exam-engine/exam.engine.ts', type: 'Service', purpose: 'Logic for exam generation.' },
    { name: 'modules/scoring-engine/scoring.engine.ts', type: 'Service', purpose: 'Exam grading calculation.' },
    { name: 'config/index.ts', type: 'Config', purpose: 'Central configuration loader.' },
];
