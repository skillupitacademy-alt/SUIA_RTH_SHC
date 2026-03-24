import { headers } from 'next/headers';

export type SkillUpAdminPortalRole = 'admin' | 'counsellor' | 'guest';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const COUNSELLOR_ROLES = new Set(['counsellor']);

export async function getSkillUpAdminRoles() {
  const headerStore = await headers();
  const rawRoles = headerStore.get('x-user-roles') ?? '';

  return rawRoles
    .split(',')
    .map((role: string) => role.trim())
    .filter((role: string) => role.length > 0);
}

export async function getSkillUpAdminRole(): Promise<SkillUpAdminPortalRole> {
  const roles = await getSkillUpAdminRoles();
  if (roles.some((role) => ADMIN_ROLES.has(role))) {
    return 'admin';
  }

  if (roles.some((role) => COUNSELLOR_ROLES.has(role))) {
    return 'counsellor';
  }

  return 'guest';
}

export function canAccessFinance(role: SkillUpAdminPortalRole) {
  return role === 'admin';
}

export function canAccessOperations(role: SkillUpAdminPortalRole) {
  return role !== 'guest';
}
