export interface AdminActivityItem {
  id: string;
  title: string;
  detail: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  at: string;
}

export interface AdminStudentSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  batchId: string;
  batchName: string;
  attendancePct: number;
  paymentStatus: 'current' | 'due' | 'overdue';
  upcomingSessionAt: string;
}

export interface AdminStudentDetail extends AdminStudentSummary {
  counselor: string;
  enrollmentStage: 'enquired' | 'qualified' | 'admitted' | 'enrolled';
  attendanceHistory: Array<{ label: string; pct: number }>;
  payments: Array<{ installment: string; status: 'paid' | 'pending' | 'overdue'; amount: string; dueDate: string }>;
  batchHistory: Array<{ batchName: string; joinedAt: string; status: string }>;
}

export interface AdminEnquiryItem {
  id: string;
  userId: string;
  studentName: string;
  email: string;
  phone: string;
  program: string;
  status: 'new' | 'qualified' | 'admitted' | 'needs_followup';
  counsellor: string;
  createdAt: string;
}

export interface AdminEnquiryDetail extends AdminEnquiryItem {
  timeline: Array<{ label: string; at: string; note: string }>;
  notes: string[];
  nextStep: string;
}

export interface AdminBatchSummary {
  id: string;
  name: string;
  program: string;
  studentCount: number;
  facultyName: string;
  nextSessionAt: string;
  sessionTopic: string;
}

export interface AdminBatchDetail extends AdminBatchSummary {
  schedule: Array<{ day: string; topic: string; time: string }>;
  students: Array<{ id: string; name: string; attendancePct: number }>;
  assignedFaculty: string;
  capacity: number;
}

export interface AdminPaymentItem {
  id: string;
  studentName: string;
  installmentId: string;
  amount: string;
  dueDate: string;
  overdueDays: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentRef: string;
}

export interface AdminPlacementProfile {
  id: string;
  studentName: string;
  targetRole: string;
  location: string;
  matchScore: number;
  status: 'ready' | 'in_review';
  jobMatches: string[];
}

export interface AdminJobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  applicants: number;
}

export interface AdminAuditEntry {
  id: string;
  studentId: string;
  studentName: string;
  action: 'enrolled' | 'payment' | 'attendance';
  actor: string;
  platform: 'skillup-web' | 'skillup-admin' | 'faculty-app' | 'skillhubcore-admin';
  timestamp: string;
  before: Record<string, string | number | boolean | null>;
  after: Record<string, string | number | boolean | null>;
}

export const adminDashboardSummary = {
  totalStudents: 1284,
  activeBatches: 42,
  monthlyRevenue: 1820000,
  placementRate: 74,
};

export const skillupDomainId = '44444444-4444-4444-8444-444444444444';

export const adminActivityFeed: AdminActivityItem[] = [
  {
    id: 'activity-1',
    title: 'Student enrolled',
    detail: 'Nisha Patel joined React Full Stack - March 2026 after counselling approval.',
    tone: 'cyan',
    at: '2026-03-22T09:40:00+05:30',
  },
  {
    id: 'activity-2',
    title: 'Payment recorded',
    detail: 'Installment INV-2048 cleared for Aarav Shah with reference SKP-88410.',
    tone: 'emerald',
    at: '2026-03-22T10:15:00+05:30',
  },
  {
    id: 'activity-3',
    title: 'Admission saga advanced',
    detail: 'Counsellor qualified a new enquiry and created the payment plan for batch assignment.',
    tone: 'amber',
    at: '2026-03-22T11:05:00+05:30',
  },
];

export const adminStudents: AdminStudentSummary[] = [
  {
    id: 'student-1',
    userId: '11111111-1111-4111-8111-111111111111',
    name: 'Aarav Shah',
    email: 'aarav@example.com',
    batchId: 'batch-react-2026',
    batchName: 'React Full Stack - March 2026',
    attendancePct: 92,
    paymentStatus: 'current',
    upcomingSessionAt: '2026-03-23T18:30:00+05:30',
  },
  {
    id: 'student-2',
    userId: '22222222-2222-4222-8222-222222222222',
    name: 'Meera Iyer',
    email: 'meera@example.com',
    batchId: 'batch-node-2026',
    batchName: 'Node.js Backend - March 2026',
    attendancePct: 81,
    paymentStatus: 'due',
    upcomingSessionAt: '2026-03-23T20:00:00+05:30',
  },
  {
    id: 'student-3',
    userId: '33333333-3333-4333-8333-333333333333',
    name: 'Kabir Ahmed',
    email: 'kabir@example.com',
    batchId: 'batch-fullstack-2026',
    batchName: 'Full Stack Intensive - Cohort B',
    attendancePct: 68,
    paymentStatus: 'overdue',
    upcomingSessionAt: '2026-03-24T10:00:00+05:30',
  },
];

export const adminStudentDetails: AdminStudentDetail[] = [
  {
    ...adminStudents[0]!,
    counselor: 'Priya Nair',
    enrollmentStage: 'enrolled',
    attendanceHistory: [
      { label: 'Week 1', pct: 100 },
      { label: 'Week 2', pct: 92 },
      { label: 'Week 3', pct: 88 },
    ],
    payments: [
      { installment: 'Installment 1', status: 'paid', amount: 'INR 18,000', dueDate: '2026-03-05' },
      { installment: 'Installment 2', status: 'paid', amount: 'INR 18,000', dueDate: '2026-03-15' },
      { installment: 'Installment 3', status: 'pending', amount: 'INR 18,000', dueDate: '2026-04-05' },
    ],
    batchHistory: [
      { batchName: 'React Full Stack - March 2026', joinedAt: '2026-03-01', status: 'active' },
    ],
  },
  {
    ...adminStudents[1]!,
    counselor: 'Rohit Menon',
    enrollmentStage: 'qualified',
    attendanceHistory: [
      { label: 'Week 1', pct: 94 },
      { label: 'Week 2', pct: 80 },
      { label: 'Week 3', pct: 69 },
    ],
    payments: [
      { installment: 'Installment 1', status: 'paid', amount: 'INR 20,000', dueDate: '2026-03-07' },
      { installment: 'Installment 2', status: 'pending', amount: 'INR 20,000', dueDate: '2026-04-07' },
    ],
    batchHistory: [
      { batchName: 'Node.js Backend - March 2026', joinedAt: '2026-03-03', status: 'active' },
    ],
  },
  {
    ...adminStudents[2]!,
    counselor: 'Ananya Rao',
    enrollmentStage: 'admitted',
    attendanceHistory: [
      { label: 'Week 1', pct: 72 },
      { label: 'Week 2', pct: 68 },
      { label: 'Week 3', pct: 64 },
    ],
    payments: [
      { installment: 'Installment 1', status: 'overdue', amount: 'INR 16,500', dueDate: '2026-03-08' },
      { installment: 'Installment 2', status: 'pending', amount: 'INR 16,500', dueDate: '2026-04-08' },
    ],
    batchHistory: [
      { batchName: 'Full Stack Intensive - Cohort B', joinedAt: '2026-03-10', status: 'active' },
    ],
  },
];

export const adminEnquiries: AdminEnquiryItem[] = [
  {
    id: 'enquiry-1',
    userId: '55555555-5555-4555-8555-555555555555',
    studentName: 'Sara Khan',
    email: 'sara@example.com',
    phone: '+91 98765 43210',
    program: 'React Full Stack',
    status: 'new',
    counsellor: 'Priya Nair',
    createdAt: '2026-03-22T09:10:00+05:30',
  },
  {
    id: 'enquiry-2',
    userId: '66666666-6666-4666-8666-666666666666',
    studentName: 'Dev Verma',
    email: 'dev@example.com',
    phone: '+91 98765 43110',
    program: 'Node.js Backend',
    status: 'qualified',
    counsellor: 'Rohit Menon',
    createdAt: '2026-03-21T14:40:00+05:30',
  },
  {
    id: 'enquiry-3',
    userId: '77777777-7777-4777-8777-777777777777',
    studentName: 'Isha Bose',
    email: 'isha@example.com',
    phone: '+91 98765 43010',
    program: 'Applied AI',
    status: 'needs_followup',
    counsellor: 'Ananya Rao',
    createdAt: '2026-03-20T16:05:00+05:30',
  },
];

export const adminEnquiryDetails: AdminEnquiryDetail[] = [
  {
    ...adminEnquiries[0]!,
    nextStep: 'Qualify and create the admission plan',
    timeline: [
      { label: 'Enquiry received', at: '2026-03-22T09:10:00+05:30', note: 'Submitted from landing page form.' },
      { label: 'Counsellor review', at: '2026-03-22T09:45:00+05:30', note: 'Initial fit looks strong for the March cohort.' },
    ],
    notes: ['Interested in weekend batches', 'Requested scholarship information'],
  },
  {
    ...adminEnquiries[1]!,
    nextStep: 'Final admission and payment plan creation',
    timeline: [
      { label: 'Enquiry received', at: '2026-03-21T14:40:00+05:30', note: 'Listed a backend focus and 6 month goal.' },
      { label: 'Qualification call', at: '2026-03-21T16:00:00+05:30', note: 'Ready for admission after fee discussion.' },
    ],
    notes: ['Prefers EMI structure', 'Can join weekday evening batch'],
  },
  {
    ...adminEnquiries[2]!,
    nextStep: 'Follow up for availability and budget',
    timeline: [
      { label: 'Enquiry received', at: '2026-03-20T16:05:00+05:30', note: 'Requested AI track details.' },
      { label: 'Callback attempted', at: '2026-03-21T11:20:00+05:30', note: 'No answer, follow-up queued.' },
    ],
    notes: ['Asked about placement support', 'Needs afternoon callback'],
  },
];

export const adminBatches: AdminBatchSummary[] = [
  {
    id: 'batch-react-2026',
    name: 'React Full Stack - March 2026',
    program: 'Web Development',
    studentCount: 30,
    facultyName: 'Neha Kapoor',
    nextSessionAt: '2026-03-23T18:30:00+05:30',
    sessionTopic: 'State orchestration and API boundaries',
  },
  {
    id: 'batch-node-2026',
    name: 'Node.js Backend - March 2026',
    program: 'Backend Engineering',
    studentCount: 28,
    facultyName: 'Rohit Menon',
    nextSessionAt: '2026-03-23T20:00:00+05:30',
    sessionTopic: 'Transaction handling and retries',
  },
  {
    id: 'batch-ai-2026',
    name: 'Applied AI - Evening Track',
    program: 'Applied AI',
    studentCount: 24,
    facultyName: 'Ananya Rao',
    nextSessionAt: '2026-03-24T19:00:00+05:30',
    sessionTopic: 'Prompt review and rubric scoring',
  },
];

export const adminBatchDetails: AdminBatchDetail[] = [
  {
    ...adminBatches[0]!,
    assignedFaculty: 'Neha Kapoor',
    capacity: 32,
    students: [
      { id: 'student-1', name: 'Aarav Shah', attendancePct: 92 },
      { id: 'student-4', name: 'Nisha Patel', attendancePct: 88 },
      { id: 'student-5', name: 'Tanya Singh', attendancePct: 84 },
    ],
    schedule: [
      { day: 'Monday', topic: 'Hooks and state', time: '6:30 PM' },
      { day: 'Wednesday', topic: 'API integration', time: '6:30 PM' },
      { day: 'Friday', topic: 'Project studio', time: '6:30 PM' },
    ],
  },
  {
    ...adminBatches[1]!,
    assignedFaculty: 'Rohit Menon',
    capacity: 30,
    students: [
      { id: 'student-2', name: 'Meera Iyer', attendancePct: 81 },
      { id: 'student-6', name: 'Arjun Mehta', attendancePct: 78 },
      { id: 'student-7', name: 'Fatima Ali', attendancePct: 86 },
    ],
    schedule: [
      { day: 'Tuesday', topic: 'Transactions', time: '8:00 PM' },
      { day: 'Thursday', topic: 'Queues and workers', time: '8:00 PM' },
      { day: 'Saturday', topic: 'Project clinic', time: '8:00 PM' },
    ],
  },
  {
    ...adminBatches[2]!,
    assignedFaculty: 'Ananya Rao',
    capacity: 28,
    students: [
      { id: 'student-3', name: 'Kabir Ahmed', attendancePct: 68 },
      { id: 'student-8', name: 'Rhea Jose', attendancePct: 74 },
      { id: 'student-9', name: 'Sandeep Rao', attendancePct: 70 },
    ],
    schedule: [
      { day: 'Monday', topic: 'Prompt basics', time: '7:00 PM' },
      { day: 'Wednesday', topic: 'Evaluation patterns', time: '7:00 PM' },
      { day: 'Friday', topic: 'Portfolio review', time: '7:00 PM' },
    ],
  },
];

export const adminPayments: AdminPaymentItem[] = [
  {
    id: 'payment-1',
    studentName: 'Aarav Shah',
    installmentId: 'inv-2048',
    amount: 'INR 18,000',
    dueDate: '2026-03-15',
    overdueDays: 0,
    status: 'paid',
    paymentRef: 'SKP-88410',
  },
  {
    id: 'payment-2',
    studentName: 'Meera Iyer',
    installmentId: 'inv-2061',
    amount: 'INR 20,000',
    dueDate: '2026-03-08',
    overdueDays: 14,
    status: 'overdue',
    paymentRef: 'SKP-88411',
  },
  {
    id: 'payment-3',
    studentName: 'Kabir Ahmed',
    installmentId: 'inv-2072',
    amount: 'INR 16,500',
    dueDate: '2026-03-10',
    overdueDays: 12,
    status: 'pending',
    paymentRef: 'SKP-88412',
  },
];

export const adminPlacementProfiles: AdminPlacementProfile[] = [
  {
    id: 'placement-1',
    studentName: 'Aarav Shah',
    targetRole: 'Frontend Engineer',
    location: 'Remote',
    matchScore: 92,
    status: 'ready',
    jobMatches: ['ui-engineer-at-zenlabs', 'frontend-developer-at-nimbus'],
  },
  {
    id: 'placement-2',
    studentName: 'Meera Iyer',
    targetRole: 'Backend Engineer',
    location: 'Bengaluru',
    matchScore: 84,
    status: 'in_review',
    jobMatches: ['nodejs-engineer-at-cloudio', 'platform-engineer-at-kraft'],
  },
  {
    id: 'placement-3',
    studentName: 'Kabir Ahmed',
    targetRole: 'AI Associate',
    location: 'Hyderabad',
    matchScore: 79,
    status: 'in_review',
    jobMatches: ['ml-ops-at-brainwave', 'ai-intern-at-astral'],
  },
];

export const adminJobPostings: AdminJobPosting[] = [
  {
    id: 'job-1',
    title: 'Frontend Engineer',
    company: 'ZenLabs',
    location: 'Remote',
    skills: ['React', 'TypeScript', 'Testing Library'],
    applicants: 22,
  },
  {
    id: 'job-2',
    title: 'Backend Engineer',
    company: 'Cloudio',
    location: 'Bengaluru',
    skills: ['Node.js', 'Postgres', 'Queues'],
    applicants: 18,
  },
  {
    id: 'job-3',
    title: 'AI Associate',
    company: 'BrainWave',
    location: 'Hyderabad',
    skills: ['Python', 'LLM prompting', 'Evaluation'],
    applicants: 15,
  },
];

export const adminAuditLog: AdminAuditEntry[] = [
  {
    id: 'audit-1',
    studentId: 'student-1',
    studentName: 'Aarav Shah',
    action: 'enrolled',
    actor: 'Priya Nair',
    platform: 'skillup-admin',
    timestamp: '2026-03-22T09:40:00+05:30',
    before: { stage: 'qualified', batchId: null, paymentStatus: 'due' },
    after: { stage: 'enrolled', batchId: 'batch-react-2026', paymentStatus: 'current' },
  },
  {
    id: 'audit-2',
    studentId: 'student-2',
    studentName: 'Meera Iyer',
    action: 'payment',
    actor: 'Finance Desk',
    platform: 'skillup-admin',
    timestamp: '2026-03-22T10:15:00+05:30',
    before: { installment: 'inv-2061', status: 'pending', amount: 'INR 20,000' },
    after: { installment: 'inv-2061', status: 'paid', amount: 'INR 20,000' },
  },
  {
    id: 'audit-3',
    studentId: 'student-3',
    studentName: 'Kabir Ahmed',
    action: 'attendance',
    actor: 'Neha Kapoor',
    platform: 'faculty-app',
    timestamp: '2026-03-22T11:05:00+05:30',
    before: { attendancePct: 64, sessionId: 'session-14' },
    after: { attendancePct: 68, sessionId: 'session-14' },
  },
  {
    id: 'audit-4',
    studentId: 'student-4',
    studentName: 'Nisha Patel',
    action: 'attendance',
    actor: 'Rohit Menon',
    platform: 'faculty-app',
    timestamp: '2026-03-22T14:05:00+05:30',
    before: { attendancePct: 88, sessionId: 'session-16' },
    after: { attendancePct: 92, sessionId: 'session-16' },
  },
];

const paymentReceiptsByReference = new Map<string, AdminPaymentItem>();

export function findAdminStudent(id: string) {
  return adminStudentDetails.find((student) => student.id === id);
}

export function findAdminEnquiry(id: string) {
  return adminEnquiryDetails.find((enquiry) => enquiry.id === id);
}

export function findAdminBatch(id: string) {
  return adminBatchDetails.find((batch) => batch.id === id);
}

export function filterAdminAuditLog(filters: {
  student?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  return adminAuditLog.filter((entry) => {
    if (filters.student !== undefined && filters.student.length > 0) {
      const term = filters.student.toLowerCase();
      const matchesStudent = entry.studentName.toLowerCase().includes(term) || entry.studentId.toLowerCase().includes(term);
      if (!matchesStudent) return false;
    }

    if (filters.action !== undefined && filters.action.length > 0 && entry.action !== filters.action) {
      return false;
    }

    if (filters.from !== undefined && filters.from.length > 0 && new Date(entry.timestamp).getTime() < new Date(filters.from).getTime()) {
      return false;
    }

    if (filters.to !== undefined && filters.to.length > 0) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      if (new Date(entry.timestamp).getTime() > end.getTime()) {
        return false;
      }
    }

    return true;
  });
}

export function serializeAdminAuditCsv(entries: AdminAuditEntry[]) {
  const rows = [
    'id,studentId,studentName,action,actor,platform,timestamp,before,after',
    ...entries.map((entry) =>
      [
        entry.id,
        entry.studentId,
        entry.studentName,
        entry.action,
        entry.actor,
        entry.platform,
        entry.timestamp,
        JSON.stringify(entry.before).split('"').join('""'),
        JSON.stringify(entry.after).split('"').join('""'),
      ]
        .map((value) => `"${value}"`)
        .join(',')
    ),
  ];

  return rows;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function recordPaymentReceipt(input: {
  paymentRef: string;
  studentName: string;
  installmentId: string;
  amount: number;
  dueDate: string;
  paidAt: string;
}) {
  const existing = paymentReceiptsByReference.get(input.paymentRef);
  if (existing !== undefined) {
    return { record: existing, idempotent: true as const };
  }

  const record: AdminPaymentItem = {
    id: `payment-${paymentReceiptsByReference.size + 4}`,
    studentName: input.studentName,
    installmentId: input.installmentId,
    amount: formatCurrency(input.amount),
    dueDate: input.dueDate,
    overdueDays: 0,
    status: 'paid',
    paymentRef: input.paymentRef,
  };
  paymentReceiptsByReference.set(input.paymentRef, record);
  return { record, idempotent: false as const, paidAt: input.paidAt };
}
