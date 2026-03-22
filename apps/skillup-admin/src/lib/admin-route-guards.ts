import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ROLES = new Set(['admin', 'super_admin']);

export function getRequestRoles(request: NextRequest): string[] {
  const rawRoles = request.headers.get('x-user-roles') ?? request.headers.get('x-skillhubcore-roles') ?? '';
  return rawRoles
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

export function requireAdminAccess(request: NextRequest) {
  const roles = getRequestRoles(request);
  if (roles.some((role) => ALLOWED_ROLES.has(role))) {
    return null;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function roleSummary(request: NextRequest) {
  return getRequestRoles(request).join(',');
}
