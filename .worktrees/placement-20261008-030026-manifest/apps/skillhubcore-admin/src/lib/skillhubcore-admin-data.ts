export interface AdminAuditEntry {
  id: string;
  action: string;
  actor: string;
  platform: 'skillup' | 'skillhubcore' | 'placement' | 'admin';
  createdAt: string;
  details: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  status: 'active' | 'suspended';
  createdAt: string;
  lastActiveAt: string;
  platforms: string[];
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  plan: 'free' | 'premium' | 'combo' | 'training';
  status: 'active' | 'expired' | 'cancelled';
  platform: 'skillup' | 'skillhubcore';
  expiresAt: string;
  startedAt: string;
  features: string[];
}

export interface AdminEventLog {
  id: string;
  eventType: string;
  userName: string;
  userId: string;
  source: string;
  consumer: string;
  status: 'published' | 'consumed' | 'retrying' | 'failed';
  createdAt: string;
  details: string;
  payload: Record<string, unknown>;
}

export const adminAuditLogs: AdminAuditEntry[] = [
  { id: '1', action: 'Login', actor: 'Super Admin', platform: 'admin', createdAt: new Date().toISOString(), details: 'Admin logged in', before: {}, after: {} },
  { id: '2', action: 'Update Plan', actor: 'User 123', platform: 'skillhubcore', createdAt: new Date().toISOString(), details: 'Upgraded to Premium', before: { plan: 'free' }, after: { plan: 'premium' } },
];

export const adminUsers: AdminUser[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), platforms: ['skillup', 'skillhubcore'] },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active', createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), platforms: ['admin', 'skillup'] },
];

export const adminSubscriptions: AdminSubscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    userName: 'John Doe',
    plan: 'premium',
    status: 'active',
    platform: 'skillhubcore',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    startedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    features: ['unlimited_quizzes', 'personalized_roadmap'],
  },
];

export function findAdminUser(id: string): AdminUser | undefined {
  return adminUsers.find((u) => u.id === id);
}

export function findAdminSubscription(id: string): AdminSubscription | undefined {
  return adminSubscriptions.find((s) => s.id === id);
}

export const adminEventLog: AdminEventLog[] = [
  {
    id: 'evt-1',
    eventType: 'user.registered',
    userName: 'John Doe',
    userId: 'user-1',
    source: 'skillup-web',
    consumer: 'skillhubcore-service',
    status: 'consumed',
    createdAt: new Date().toISOString(),
    details: 'User registered via SkillUp',
    payload: { email: 'john@example.com' }
  }
];

export const adminMetricsSummary = {
  monthlyActiveUsers: 12500,
  monthlyRecurringRevenue: 450000,
  churnRate: 2.4,
  newUsers30d: 850,
  subscriptionConversionRate: 12.5,
  processingLagSeconds: 0.5,
  qstashEvents24h: 4500,
};

export const adminDashboardSummary = {
  platformDistribution: [
    { platform: 'skillup', count: 8500 },
    { platform: 'skillhubcore', count: 4000 },
  ],
  subscriptionDistribution: [
    { plan: 'free', count: 10000 },
    { plan: 'premium', count: 2000 },
    { plan: 'combo', count: 500 },
  ],
};

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPlatform(platform: string): string {
  const platforms: Record<string, string> = {
    skillup: 'SkillUp',
    skillhubcore: 'SkillHubCore',
    placement: 'Placement',
    admin: 'Admin',
  };
  return platforms[platform] || platform;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
