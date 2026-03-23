export type SkillupProgram = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  description: string;
  audience: string;
  summary: string;
  highlights: string[];
};

export type SkillupSession = {
  id: string;
  date: string;
  title: string;
  mode: 'online' | 'offline' | 'hybrid';
  status: 'completed' | 'upcoming' | 'cancelled';
  recording?: string;
};

export type SkillupInstallment = {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue';
  paymentRef?: string;
};

export type SkillupJobMatch = {
  id: string;
  company: string;
  title: string;
  location: string;
  match: number;
};

export const skillupPrograms: SkillupProgram[] = [
  {
    id: 'full-stack-web',
    slug: 'full-stack-web',
    name: 'Full Stack Developer',
    duration: '6 months',
    description: 'HTML, CSS, TypeScript, React, Next.js, APIs, deployment, and interview prep.',
    audience: 'Students targeting product engineering roles',
    summary: 'Build production-ready web apps and interview-ready projects.',
    highlights: ['Frontend foundations', 'Next.js app architecture', 'API integration', 'Deployment readiness'],
  },
  {
    id: 'data-analytics',
    slug: 'data-analytics',
    name: 'Data Analyst',
    duration: '4 months',
    description: 'SQL, spreadsheets, dashboards, reporting, and business communication.',
    audience: 'Learners building reporting and insight skills',
    summary: 'Turn datasets into clear business insights and reports.',
    highlights: ['SQL analysis', 'Dashboard storytelling', 'Spreadsheet workflows', 'Stakeholder reporting'],
  },
  {
    id: 'cloud-ops',
    slug: 'cloud-ops',
    name: 'Cloud Support',
    duration: '5 months',
    description: 'Linux, networking, monitoring, incident response, and cloud workflows.',
    audience: 'Students preparing for support and operations roles',
    summary: 'Operate, monitor, and support modern cloud systems confidently.',
    highlights: ['Linux basics', 'Monitoring and incidents', 'Networking essentials', 'Cloud operations'],
  },
];

export function findSkillupProgramBySlug(slug: string) {
  return skillupPrograms.find((program) => program.slug === slug);
}

export const skillupHeroStats = [
  { label: 'Programs', value: '12' },
  { label: 'Active learners', value: '1,840' },
  { label: 'Placement rate', value: '74%' },
  { label: 'Faculty mentors', value: '38' },
];

export const skillupFacultyShowcase = [
  {
    name: 'Asha Iyer',
    title: 'Full Stack Mentor',
    description: 'Guides front-end and API delivery with weekly code review sessions.',
  },
  {
    name: 'Rahul Mehta',
    title: 'Data and BI Coach',
    description: 'Focuses on dashboards, SQL drills, and employer-ready reporting habits.',
  },
  {
    name: 'Neha Shah',
    title: 'Cloud Support Lead',
    description: 'Teaches deployment, observability, and production incident management.',
  },
];

export const studentDashboardSummary = {
  name: 'Aarav Patel',
  batchName: 'SkillUp FS-24 Morning',
  facultyName: 'Asha Iyer',
  attendancePercent: 86,
  progressPercent: 68,
  paymentDue: 18000,
  nextSessionAt: '2026-03-24T09:30:00+05:30',
  upcomingSessions: 3,
  placementMatches: 6,
};

export const studentSessions: SkillupSession[] = [
  {
    id: 'session-1',
    date: '2026-03-24T09:30:00+05:30',
    title: 'React state patterns and component design',
    mode: 'offline',
    status: 'upcoming',
  },
  {
    id: 'session-2',
    date: '2026-03-22T09:30:00+05:30',
    title: 'REST API integration and error handling',
    mode: 'online',
    status: 'completed',
    recording: 'https://learn.skillupitacademy.com/recordings/rest-api-integration',
  },
  {
    id: 'session-3',
    date: '2026-03-20T09:30:00+05:30',
    title: 'Project review and feedback clinic',
    mode: 'hybrid',
    status: 'completed',
    recording: 'https://learn.skillupitacademy.com/recordings/project-review',
  },
  {
    id: 'session-4',
    date: '2026-03-18T09:30:00+05:30',
    title: 'JavaScript async control flow',
    mode: 'online',
    status: 'completed',
    recording: 'https://learn.skillupitacademy.com/recordings/async-control-flow',
  },
];

export const studentAttendanceHistory = [
  { date: 'Mon 18 Mar', state: 'present', note: 'On time for class' },
  { date: 'Tue 19 Mar', state: 'present', note: 'Completed in-class task' },
  { date: 'Wed 20 Mar', state: 'late', note: 'Joined after 10 minutes' },
  { date: 'Thu 21 Mar', state: 'present', note: 'Pair-programming session' },
  { date: 'Fri 22 Mar', state: 'present', note: 'Reviewed assignment feedback' },
  { date: 'Sat 23 Mar', state: 'absent', note: 'Planned leave' },
];

export const studentInstallments: SkillupInstallment[] = [
  {
    id: 'inst-1',
    label: 'Admission fee',
    dueDate: '2026-01-15',
    amount: 15000,
    status: 'paid',
    paymentRef: 'PAY-1001',
  },
  {
    id: 'inst-2',
    label: 'Training fee - month 2',
    dueDate: '2026-02-15',
    amount: 15000,
    status: 'paid',
    paymentRef: 'PAY-1002',
  },
  {
    id: 'inst-3',
    label: 'Training fee - month 3',
    dueDate: '2026-03-10',
    amount: 18000,
    status: 'overdue',
  },
  {
    id: 'inst-4',
    label: 'Placement support fee',
    dueDate: '2026-04-10',
    amount: 12000,
    status: 'due',
  },
];

export const studentPlacementProfile = {
  roleGoal: 'Frontend Developer',
  resumeStatus: 'Ready for review',
  profileCompletion: 82,
  interviewCount: 4,
  skills: ['React', 'Next.js', 'TypeScript', 'REST APIs', 'Testing'],
};

export const studentJobMatches: SkillupJobMatch[] = [
  { id: 'job-1', company: 'BrightStack', title: 'Junior Frontend Engineer', location: 'Bengaluru', match: 94 },
  { id: 'job-2', company: 'Northwind Labs', title: 'Product Engineer Intern', location: 'Remote', match: 89 },
  { id: 'job-3', company: 'BlueOrbit', title: 'Web Developer Associate', location: 'Pune', match: 87 },
];

export const studentBatchDetails = {
  name: 'SkillUp FS-24 Morning',
  faculty: 'Asha Iyer',
  currentTopic: 'React state patterns',
  nextSession: '2026-03-24T09:30:00+05:30',
  studentCount: 28,
  schedule: [
    { day: 'Mon', time: '09:30 AM', topic: 'React components', mode: 'offline' },
    { day: 'Wed', time: '09:30 AM', topic: 'API integration', mode: 'online' },
    { day: 'Fri', time: '09:30 AM', topic: 'Project review', mode: 'hybrid' },
  ],
  materials: ['React component guide', 'API error handling notes', 'Project review rubric'],
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`));
}

export function isOverdue(dueDate: string): boolean {
  return new Date(`${dueDate}T00:00:00`).getTime() < new Date('2026-03-22T00:00:00+05:30').getTime();
}
