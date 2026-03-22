export interface FacultyBatchSummary {
  id: string;
  name: string;
  track: string;
  studentCount: number;
  nextSessionAt: string;
  nextSessionTopic: string;
  progress: number;
}

export interface FacultyDashboardSummary {
  myBatches: number;
  sessionsToday: number;
  openHelpRequests: number;
  pendingProjectReviews: number;
  pendingSessionRequests: number;
}

export interface HelpRequestItem {
  id: string;
  studentName: string;
  subtopic: string;
  question: string;
  status: 'open' | 'in_progress' | 'resolved';
  requestedAt: string;
  resolvedAt: string | null;
}

export interface ProjectReviewItem {
  id: string;
  studentName: string;
  projectName: string;
  status: 'needs_review';
  submittedAt: string;
  checklist: Array<{ label: string; passed: boolean }>;
  aiFeedback: string;
}

export interface SessionRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  subtopic: string;
  doubtText: string;
  status: 'pending' | 'accepted';
  scheduledAt: string;
  batchName: string;
}

export interface AttendanceStudent {
  id: string;
  name: string;
  rollNumber: string;
}

export const facultyDashboardSummary: FacultyDashboardSummary = {
  myBatches: 4,
  sessionsToday: 6,
  openHelpRequests: 12,
  pendingProjectReviews: 8,
  pendingSessionRequests: 5,
};

export const facultyBatches: FacultyBatchSummary[] = [
  {
    id: 'batch-react-2026',
    name: 'React Full Stack - March 2026',
    track: 'Web Development',
    studentCount: 30,
    nextSessionAt: '2026-03-22T18:30:00+05:30',
    nextSessionTopic: 'State orchestration and API boundaries',
    progress: 64,
  },
  {
    id: 'batch-node-2026',
    name: 'Node.js Backend - March 2026',
    track: 'Backend Engineering',
    studentCount: 28,
    nextSessionAt: '2026-03-22T20:00:00+05:30',
    nextSessionTopic: 'Transaction handling and retries',
    progress: 58,
  },
  {
    id: 'batch-fullstack-2026',
    name: 'Full Stack Intensive - Cohort B',
    track: 'Product Engineering',
    studentCount: 32,
    nextSessionAt: '2026-03-23T10:00:00+05:30',
    nextSessionTopic: 'Project review panel',
    progress: 71,
  },
  {
    id: 'batch-ai-2026',
    name: 'AI Applications - Evening Batch',
    track: 'Applied AI',
    studentCount: 24,
    nextSessionAt: '2026-03-23T19:00:00+05:30',
    nextSessionTopic: 'Prompt quality checkpoints',
    progress: 43,
  },
];

export const facultyHelpRequests: HelpRequestItem[] = [
  {
    id: 'help-req-1',
    studentName: 'Aarav Shah',
    subtopic: 'Promises and async flow',
    question: 'I cannot tell when to use Promise.all vs await in sequence.',
    status: 'open',
    requestedAt: '2026-03-22T08:10:00+05:30',
    resolvedAt: null,
  },
  {
    id: 'help-req-2',
    studentName: 'Meera Iyer',
    subtopic: 'Database transactions',
    question: 'Why does my bulk insert fail when one record is invalid?',
    status: 'in_progress',
    requestedAt: '2026-03-22T09:25:00+05:30',
    resolvedAt: null,
  },
  {
    id: 'help-req-3',
    studentName: 'Kabir Ahmed',
    subtopic: 'Error boundaries',
    question: 'Should the fallback UI live in the page or shared component?',
    status: 'open',
    requestedAt: '2026-03-22T10:05:00+05:30',
    resolvedAt: null,
  },
];

export const facultyProjectReviews: ProjectReviewItem[] = [
  {
    id: 'project-sub-1',
    studentName: 'Aarav Shah',
    projectName: 'Quiz Builder Dashboard',
    status: 'needs_review',
    submittedAt: '2026-03-22T07:50:00+05:30',
    aiFeedback: 'AI flagged the workflow as promising but needs a manual review for approval.',
    checklist: [
      { label: 'Uses repository pattern', passed: true },
      { label: 'Validates inputs with Zod', passed: true },
      { label: 'Handles edge cases', passed: false },
      { label: 'Includes tests', passed: true },
    ],
  },
  {
    id: 'project-sub-2',
    studentName: 'Meera Iyer',
    projectName: 'Attendance Sync Service',
    status: 'needs_review',
    submittedAt: '2026-03-22T08:40:00+05:30',
    aiFeedback: 'Needs manual approval because the UI flow touches critical learning state.',
    checklist: [
      { label: 'Bulk write is atomic', passed: true },
      { label: 'Idempotent submission', passed: true },
      { label: 'Meeting link validation', passed: true },
      { label: 'Copy is accessible', passed: false },
    ],
  },
  {
    id: 'project-sub-3',
    studentName: 'Kabir Ahmed',
    projectName: 'Remediation Insights Board',
    status: 'needs_review',
    submittedAt: '2026-03-22T09:35:00+05:30',
    aiFeedback: 'Looks ready for approval once a human confirms the final workflow.',
    checklist: [
      { label: 'Pino logging used', passed: true },
      { label: 'Soft deletes preserved', passed: true },
      { label: 'Event publication wired', passed: true },
      { label: 'Error state polished', passed: true },
    ],
  },
];

export const facultySessionRequests: SessionRequestItem[] = [
  {
    id: 'session-req-1',
    studentId: 'a1111111-1111-4111-8111-111111111111',
    studentName: 'Aarav Shah',
    subtopic: 'Promises and async flow',
    doubtText: 'Can we go over Promise.all error handling in real code?',
    status: 'pending',
    scheduledAt: '2026-03-22T17:30:00+05:30',
    batchName: 'React Full Stack - March 2026',
  },
  {
    id: 'session-req-2',
    studentId: 'b2222222-2222-4222-8222-222222222222',
    studentName: 'Meera Iyer',
    subtopic: 'Database transactions',
    doubtText: 'I need a walkthrough of locking and transaction retries.',
    status: 'pending',
    scheduledAt: '2026-03-22T18:00:00+05:30',
    batchName: 'Node.js Backend - March 2026',
  },
];

export const facultyAttendanceRoster = Array.from({ length: 30 }, (_, index): AttendanceStudent => {
  const seat = index + 1;
  return {
    id: `student-${String(seat).padStart(2, '0')}`,
    name: `Student ${String(seat).padStart(2, '0')}`,
    rollNumber: `SK${String(seat).padStart(3, '0')}`,
  };
});

export function findBatchById(batchId: string) {
  return facultyBatches.find((batch) => batch.id === batchId);
}

export function findSessionRequestById(requestId: string) {
  return facultySessionRequests.find((request) => request.id === requestId);
}

export function findHelpRequestById(requestId: string) {
  return facultyHelpRequests.find((request) => request.id === requestId);
}

export function findProjectReviewById(submissionId: string) {
  return facultyProjectReviews.find((submission) => submission.id === submissionId);
}
