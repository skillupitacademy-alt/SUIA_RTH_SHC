import type { UserProfile } from '../types';

type RawSkillHubUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  platforms?: string[];
  subscriptions?: string[];
  isAdmin?: boolean;
  onboarded?: boolean;
};

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

function resolveRole(rawRole: unknown, roles: string[]): UserProfile['role'] {
  if (roles.includes('super_admin') || rawRole === 'super_admin') {
    return 'super_admin';
  }

  if (roles.includes('admin') || rawRole === 'admin') {
    return 'admin';
  }

  if (roles.includes('infrastructure') || rawRole === 'infrastructure') {
    return 'infrastructure';
  }

  return 'user';
}

export function normalizeSkillHubUser(user: RawSkillHubUser, fallbackEmail = ''): UserProfile {
  const roles = toStringArray(user.roles);
  const subscriptions = toStringArray(user.subscriptions);
  const role = resolveRole(user.role, roles);
  const isAdmin = user.isAdmin === true || ADMIN_ROLES.has(role);
  const onboarded = user.onboarded === true || subscriptions.length > 0;

  return {
    id: isNonEmptyString(user.id) ? user.id : fallbackEmail,
    name: isNonEmptyString(user.name) ? user.name : (isNonEmptyString(user.email) ? user.email : fallbackEmail),
    email: isNonEmptyString(user.email) ? user.email : fallbackEmail,
    role,
    isAdmin,
    onboarded,
  };
}
