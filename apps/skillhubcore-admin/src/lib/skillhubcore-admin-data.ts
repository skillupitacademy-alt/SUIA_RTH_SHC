export type AdminPlatform = 'skillup' | 'realtutorialhub' | 'skillhubcore';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin' | 'super_admin';
  platforms: AdminPlatform[];
  subscription: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastActiveAt: string;
};

export type AdminSubscription = {
  id: string;
  userId: string;
  userName: string;
  plan: 'free' | 'premium' | 'combo' | 'training';
  platform: AdminPlatform;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: string;
  expiresAt: string;
  features: string[];
};

export type AdminAuditLog = {
  id: string;
  actor: string;
  action: string;
  platform: AdminPlatform | 'all';
  createdAt: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  details: string;
};

export const adminDashboardSummary: {
  totalUsers: number;
  activeSubscriptions: number;
  activeSessions: number;
  platformDistribution: Array<{ platform: AdminPlatform; count: number }>;
  subscriptionDistribution: Array<{ plan: string; count: number }>;
} = {
  totalUsers: 18420,
  activeSubscriptions: 13210,
  activeSessions: 2481,
  platformDistribution: [
    { platform: 'skillup', count: 5180 },
    { platform: 'realtutorialhub', count: 10320 },
    { platform: 'skillhubcore', count: 2920 },
  ],
  subscriptionDistribution: [
    { plan: 'free', count: 7240 },
    { plan: 'premium', count: 3480 },
    { plan: 'combo', count: 5030 },
    { plan: 'training', count: 2670 },
  ],
};

export const adminUsers: AdminUser[] = [
  {
    id: 'user-1',
    name: 'Asha Menon',
    email: 'asha@example.com',
    role: 'super_admin',
    platforms: ['skillhubcore', 'realtutorialhub'],
    subscription: 'combo',
    status: 'active',
    createdAt: '2025-09-12T08:15:00+05:30',
    lastActiveAt: '2026-03-23T09:12:00+05:30',
  },
  {
    id: 'user-2',
    name: 'Rahul Iyer',
    email: 'rahul@example.com',
    role: 'admin',
    platforms: ['skillhubcore', 'skillup'],
    subscription: 'training',
    status: 'active',
    createdAt: '2025-11-03T10:40:00+05:30',
    lastActiveAt: '2026-03-22T19:44:00+05:30',
  },
  {
    id: 'user-3',
    name: 'Neha Sharma',
    email: 'neha@example.com',
    role: 'faculty',
    platforms: ['skillup'],
    subscription: 'premium',
    status: 'active',
    createdAt: '2025-12-19T13:30:00+05:30',
    lastActiveAt: '2026-03-23T07:31:00+05:30',
  },
  {
    id: 'user-4',
    name: 'Vikram Patel',
    email: 'vikram@example.com',
    role: 'student',
    platforms: ['realtutorialhub'],
    subscription: 'free',
    status: 'suspended',
    createdAt: '2025-12-29T17:05:00+05:30',
    lastActiveAt: '2026-03-20T15:22:00+05:30',
  },
];

export const adminSubscriptions: AdminSubscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    userName: 'Asha Menon',
    plan: 'combo',
    platform: 'skillhubcore',
    status: 'active',
    startedAt: '2025-09-12T08:15:00+05:30',
    expiresAt: '2026-09-12T08:15:00+05:30',
    features: ['notes', 'exam', 'ai_tutor', 'live_training', 'internship', 'placement'],
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    userName: 'Rahul Iyer',
    plan: 'training',
    platform: 'skillup',
    status: 'active',
    startedAt: '2025-11-03T10:40:00+05:30',
    expiresAt: '2026-11-03T10:40:00+05:30',
    features: ['live_training', 'internship', 'placement'],
  },
  {
    id: 'sub-3',
    userId: 'user-3',
    userName: 'Neha Sharma',
    plan: 'premium',
    platform: 'skillup',
    status: 'expired',
    startedAt: '2025-12-19T13:30:00+05:30',
    expiresAt: '2026-02-19T13:30:00+05:30',
    features: ['notes', 'exam', 'ai_tutor'],
  },
  {
    id: 'sub-4',
    userId: 'user-4',
    userName: 'Vikram Patel',
    plan: 'free',
    platform: 'realtutorialhub',
    status: 'cancelled',
    startedAt: '2025-12-29T17:05:00+05:30',
    expiresAt: '2026-01-29T17:05:00+05:30',
    features: ['notes'],
  },
];

export const adminAuditLogs: AdminAuditLog[] = [
  {
    id: 'audit-1',
    actor: 'Asha Menon',
    action: 'user.role_changed',
    platform: 'skillhubcore',
    createdAt: '2026-03-23T08:20:00+05:30',
    before: { role: 'student' },
    after: { role: 'faculty' },
    details: 'Promoted a learner to faculty for batch support coverage.',
  },
  {
    id: 'audit-2',
    actor: 'Rahul Iyer',
    action: 'subscription.upgraded',
    platform: 'skillup',
    createdAt: '2026-03-22T17:04:00+05:30',
    before: { plan: 'premium' },
    after: { plan: 'combo' },
    details: 'Changed a subscription after payment confirmation.',
  },
  {
    id: 'audit-3',
    actor: 'System',
    action: 'auth.login',
    platform: 'all',
    createdAt: '2026-03-23T09:01:00+05:30',
    before: null,
    after: { success: true },
    details: 'Super admin login succeeded with TOTP re-auth.',
  },
];

export const adminSessionSummary = [
  { label: 'Active sessions', value: 2481 },
  { label: 'Users online', value: 1370 },
  { label: 'Alerts today', value: 9 },
];

export function findAdminUser(userId: string): AdminUser | undefined {
  return adminUsers.find((user) => user.id === userId);
}

export function findAdminSubscription(subscriptionId: string): AdminSubscription | undefined {
  return adminSubscriptions.find((subscription) => subscription.id === subscriptionId);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPlatform(platform: AdminPlatform | 'all'): string {
  return platform === 'all'
    ? 'All'
    : platform === 'skillhubcore'
      ? 'SkillHubCore'
      : platform === 'skillup'
        ? 'SkillUp'
        : 'RealTutorialHub';
}
