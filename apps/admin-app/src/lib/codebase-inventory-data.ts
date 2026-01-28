
export interface CodeInventoryItem {
    name: string;
    type: 'Page' | 'Component' | 'API' | 'Service' | 'Config' | 'Layout';
    purpose: string;
}

export const ADMIN_APP_INVENTORY: CodeInventoryItem[] = [
    // App Router
    { name: 'app/layout.tsx', type: 'Layout', purpose: 'Root layout defining global font, theme provider, and metadata.' },
    { name: 'app/page.tsx', type: 'Page', purpose: 'Redirector to login or dashboard based on session state.' },
    { name: 'app/forgot-password/page.tsx', type: 'Page', purpose: 'Password recovery request interface.' },
    { name: 'app/governance/page.tsx', type: 'Page', purpose: 'The Cycle of Truth governance dashboard.' },
    { name: 'app/login/page.tsx', type: 'Page', purpose: 'Secure admin authentication entry point.' },
    { name: 'app/questions/page.tsx', type: 'Page', purpose: 'Question Bank management interface.' },
    { name: 'app/questions/new/page.tsx', type: 'Page', purpose: 'Creation flow for new question entities.' },
    { name: 'app/questions/[id]/edit/page.tsx', type: 'Page', purpose: 'Editing interface for existing questions.' },
    { name: 'app/reset-password/page.tsx', type: 'Page', purpose: 'Final step of password recovery flow.' },
    { name: 'app/users/page.tsx', type: 'Page', purpose: 'User management and role assignment table.' },
    
    // Components - Dashboard
    { name: 'components/dashboard/RBACGovernancePanel.tsx', type: 'Component', purpose: 'Role-based access control visualization.' },
    { name: 'components/dashboard/SecurityHealthPanel.tsx', type: 'Component', purpose: 'Real-time security signals and alert monitoring.' },
    { name: 'components/dashboard/SystemAuditTerminal.tsx', type: 'Component', purpose: 'Terminal-style view of system logs.' },
    { name: 'components/dashboard/UserAnalyticsPanel.tsx', type: 'Component', purpose: 'Growth and retention metrics visualization.' },
    { name: 'components/dashboard/ContentReadinessBoard.tsx', type: 'Component', purpose: 'Kanban-style view of content lifecycle.' },
    { name: 'components/dashboard/LiveSessionsList.tsx', type: 'Component', purpose: 'Real-time monitoring of active user sessions.' },
    
    // Components - Docs
    { name: 'components/docs/DocsTabs.tsx', type: 'Component', purpose: 'Navigation for governance document categories.' },
    { name: 'components/docs/DocsViewer.tsx', type: 'Component', purpose: 'Main container for governance documentation.' },
    { name: 'components/docs/GovernanceInventory.tsx', type: 'Component', purpose: 'The Radar view of system artifacts.' },
    
    // Components - Entry
    { name: 'components/entry/BulkUploadPanel.tsx', type: 'Component', purpose: 'Interface for mass-uploading content via CSV/JSON.' },
    { name: 'components/entry/CascadingSelect.tsx', type: 'Component', purpose: 'Hierarchical dropdowns for Domain/Subject/Topic.' },
    { name: 'components/entry/QuestionEditor.tsx', type: 'Component', purpose: 'Rich form for editing question data.' },
    { name: 'components/entry/SelectionFields.tsx', type: 'Component', purpose: 'Reusable form field inputs.' },
    
    // Components - Layout
    { name: 'components/layout/AdminLayout.tsx', type: 'Layout', purpose: 'Authenticated admin shell structure.' },
    
    // Components - Questions
    { name: 'components/questions/DomainTable.tsx', type: 'Component', purpose: 'Management table for top-level Domains.' },
    { name: 'components/questions/SubjectTable.tsx', type: 'Component', purpose: 'Management table for Subjects.' },
    { name: 'components/questions/TopicTable.tsx', type: 'Component', purpose: 'Management table for Topics.' },
    { name: 'components/questions/SubtopicTable.tsx', type: 'Component', purpose: 'Management table for Subtopics.' },
    { name: 'components/questions/SkillTable.tsx', type: 'Component', purpose: 'Management table for Skills.' },
    { name: 'components/questions/QuestionTable.tsx', type: 'Component', purpose: 'Main Question Bank data grid.' },
    
    // Components - Users
    { name: 'components/users/UserTable.tsx', type: 'Component', purpose: 'Data grid for user management and actions.' }
];

export const WEB_APP_INVENTORY: CodeInventoryItem[] = [
    // App Router
    { name: 'app/layout.tsx', type: 'Layout', purpose: 'Root layout with global styles and providers.' },
    { name: 'app/page.tsx', type: 'Page', purpose: 'Landing page (redirects to login/dashboard).' },
    { name: 'app/dashboard/page.tsx', type: 'Page', purpose: 'Student dashboard overview.' },
    { name: 'app/dashboard/my-exams/page.tsx', type: 'Page', purpose: 'List of configured or historical exams.' },
    { name: 'app/dashboard/settings/page.tsx', type: 'Page', purpose: 'User profile and preference settings.' },
    { name: 'app/login/page.tsx', type: 'Page', purpose: 'Student authentication entry.' },
    { name: 'app/onboarding/page.tsx', type: 'Page', purpose: 'Initial user setup flow.' },
    { name: 'app/quiz/active-session/page.tsx', type: 'Page', purpose: 'The live exam taking environment.' },
    { name: 'app/quiz/new/page.tsx', type: 'Page', purpose: 'Exam configuration wizard.' },
    { name: 'app/reports/active-report/page.tsx', type: 'Page', purpose: 'Immediate post-exam results.' },
    { name: 'app/reports/[id]/page.tsx', type: 'Page', purpose: 'Detailed historical exam report.' },
    { name: 'app/signup/page.tsx', type: 'Page', purpose: 'New student registration.' },
    
    // Components - Auth
    { name: 'components/auth/AuthForms.tsx', type: 'Component', purpose: 'Login and Signup form logic.' },
    { name: 'components/auth/AuthGuard.tsx', type: 'Component', purpose: 'Route protection for authenticated users.' },
    
    // Components - Dashboard
    { name: 'components/dashboard/MobileNav.tsx', type: 'Component', purpose: 'Responsive navigation for mobile devices.' },
    { name: 'components/dashboard/ProgressChart.tsx', type: 'Component', purpose: 'Visualizer for student progress metrics.' },
    { name: 'components/dashboard/Sidebar.tsx', type: 'Component', purpose: 'Main desktop navigation side bar.' },
    { name: 'components/dashboard/StatsCards.tsx', type: 'Component', purpose: 'Summary KPI cards for the dashboard.' },
    
    // Components - Layout
    { name: 'components/layout/AppShell.tsx', type: 'Layout', purpose: 'Main authenticated application frame.' },
    { name: 'components/layout/Footer.tsx', type: 'Layout', purpose: 'Application footer.' },
    { name: 'components/layout/Header.tsx', type: 'Layout', purpose: 'Application header.' },
    
    // Components - Onboarding
    { name: 'components/onboarding/OnboardingWizard.tsx', type: 'Component', purpose: 'Multi-step form for profile completion.' },
    
    // Components - Quiz
    { name: 'components/quiz/ExamInterface.tsx', type: 'Component', purpose: 'Core exam taking UI loop.' },
    { name: 'components/quiz/QuizSelection.tsx', type: 'Component', purpose: 'Configuration UI for new exams.' },
    
    // Components - Reports
    { name: 'components/reports/PerformanceBreakdown.tsx', type: 'Component', purpose: 'Detailed analysis of exam performance.' },
    { name: 'components/reports/ResultSummary.tsx', type: 'Component', purpose: 'High-level score and outcome summary.' },
    
    // Components - UI
    { name: 'components/ui/ThemeToggle.tsx', type: 'Component', purpose: 'Dark/Light mode switcher.' },
    { name: 'components/providers/ThemeProvider.tsx', type: 'Component', purpose: 'Context provider for theme state.' }
];

export const API_SERVER_INVENTORY: CodeInventoryItem[] = [
    // Routes - Admin
    { name: 'app/api/admin/domains/route.ts', type: 'API', purpose: 'CRUD operations for Domains.' },
    { name: 'app/api/admin/subjects/route.ts', type: 'API', purpose: 'CRUD operations for Subjects.' },
    { name: 'app/api/admin/topics/route.ts', type: 'API', purpose: 'CRUD operations for Topics.' },
    { name: 'app/api/admin/subtopics/route.ts', type: 'API', purpose: 'CRUD operations for Subtopics.' },
    { name: 'app/api/admin/skills/route.ts', type: 'API', purpose: 'CRUD operations for Skills.' },
    { name: 'app/api/admin/questions/route.ts', type: 'API', purpose: 'CRUD operations for Questions.' },
    { name: 'app/api/admin/users/route.ts', type: 'API', purpose: 'User management API.' },
    
    // Routes - Auth
    { name: 'app/api/auth/login/route.ts', type: 'API', purpose: 'User login handler.' },
    { name: 'app/api/auth/signup/route.ts', type: 'API', purpose: 'User registration handler.' },
    { name: 'app/api/auth/me/route.ts', type: 'API', purpose: 'Current session user retrieval.' },
    
    // Routes - Quiz
    { name: 'app/api/quiz/start/route.ts', type: 'API', purpose: 'Initialize a new exam session.' },
    { name: 'app/api/quiz/submit/route.ts', type: 'API', purpose: 'Submit full exam for grading.' },
    { name: 'app/api/quiz/answer/route.ts', type: 'API', purpose: 'Record single answer submission.' },
    
    // Modules
    { name: 'modules/admin-engine/admin.engine.ts', type: 'Service', purpose: 'Core logic for admin operations and search.' },
    { name: 'modules/auth/auth.service.ts', type: 'Service', purpose: 'Authentication business logic.' },
    { name: 'modules/exam-engine/exam.engine.ts', type: 'Service', purpose: 'Logic for exam generation and management.' },
    { name: 'modules/question/question.service.ts', type: 'Service', purpose: 'Question retrieval and management logic.' },
    { name: 'modules/scoring-engine/scoring.engine.ts', type: 'Service', purpose: 'Exam grading and score calculation.' },
    { name: 'config/index.ts', type: 'Config', purpose: 'Central configuration loader.' }
];
