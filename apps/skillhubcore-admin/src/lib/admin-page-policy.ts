import { PERMISSIONS, type Permission } from '@quiz/auth/rbac';

/**
 * All 32 canonical protected page prefixes in SHC Admin.
 * Sourced mechanically from the 32 page.tsx files under (admin) and (authenticated).
 */
export const PROTECTED_PAGE_PREFIXES = [
  '/audit',
  '/certificate-generator',
  '/certificate-preview',
  '/content-generation/layman-architecture',
  '/dashboard',
  '/events',
  '/marketing',
  '/metrics',
  '/subscriptions',
  '/tools/project-llm',
  '/tools/tutorial-block-composer',
  '/tools/tutorial-left-sidebar',
  '/tools/tutorial-page-content',
  '/users',
  '/factory/question-generator',
  '/questions',
] as const;

/**
 * Complete mechanically-verified route template inventory of all 32 protected pages.
 */
export const CANONICAL_PROTECTED_ROUTES = [
  '/audit',
  '/certificate-generator',
  '/certificate-preview',
  '/content-generation/layman-architecture',
  '/dashboard',
  '/events',
  '/marketing',
  '/metrics',
  '/subscriptions',
  '/subscriptions/[id]',
  '/tools/project-llm',
  '/tools/project-llm/candidate-upload',
  '/tools/project-llm/compliance-brief',
  '/tools/project-llm/create',
  '/tools/project-llm/explorer',
  '/tools/project-llm/external-ai-handoff',
  '/tools/project-llm/integration-certification',
  '/tools/project-llm/matrix',
  '/tools/project-llm/mix-match',
  '/tools/project-llm/registry',
  '/tools/project-llm/specification-review',
  '/tools/project-llm/workflow-details',
  '/tools/tutorial-block-composer',
  '/tools/tutorial-left-sidebar',
  '/tools/tutorial-page-content',
  '/users',
  '/users/[userId]',
  '/factory/question-generator',
  '/factory/question-generator/review',
  '/questions',
  '/questions/new',
  '/questions/[id]/edit',
] as const;

export const PUBLIC_PAGE_PATHS = [
  '/',
  '/login',
  '/forbidden',
] as const;

/**
 * Normalizes a pathname: strips query strings / hash, removes trailing slashes
 * (except for exact '/'), and lowercases for uniform path evaluation.
 */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleanPath = pathname.split('?')[0].split('#')[0].trim();
  const withoutTrailing = cleanPath.replace(/\/+$/, '');
  return withoutTrailing === '' ? '/' : withoutTrailing.toLowerCase();
}

/**
 * Checks if a pathname matches a target path or is a valid hierarchical child segment.
 * Ensures `/questions-evil` does NOT match `/questions`.
 */
export function matchesPathOrChild(pathname: string, targetPath: string): boolean {
  const normPath = normalizePathname(pathname);
  const normTarget = normalizePathname(targetPath);

  if (normTarget === '/') {
    return normPath === '/';
  }

  return normPath === normTarget || normPath.startsWith(`${normTarget}/`);
}

/**
 * Checks if a pathname falls under any protected admin page prefix.
 * This takes strict precedence over file extensions and public asset heuristics.
 */
export function isUnderProtectedPrefix(pathname: string): boolean {
  const normPath = normalizePathname(pathname);
  for (const prefix of PROTECTED_PAGE_PREFIXES) {
    if (matchesPathOrChild(normPath, prefix)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines whether a pathname is an exempt public page or framework asset.
 * Protected page prefixes (and any dynamic sub-paths like /users/account.js)
 * are NEVER treated as public paths or public assets.
 */
export function isPublicPath(pathname: string): boolean {
  const normPath = normalizePathname(pathname);

  // Protected paths and API routes are never public paths
  if (normPath.startsWith('/api') || isUnderProtectedPrefix(normPath)) {
    return false;
  }

  // Exact public page routes
  for (const publicPath of PUBLIC_PAGE_PATHS) {
    if (normPath === publicPath) {
      return true;
    }
  }

  // Next.js internal build assets
  if (normPath.startsWith('/_next/')) {
    return true;
  }

  // Static well-known root metadata files
  if (
    normPath === '/favicon.ico' ||
    normPath === '/robots.txt' ||
    normPath === '/sitemap.xml'
  ) {
    return true;
  }

  // Static public directories and fonts
  if (
    normPath.startsWith('/static/') ||
    normPath.startsWith('/images/') ||
    normPath.startsWith('/assets/') ||
    normPath.startsWith('/fonts/')
  ) {
    return true;
  }

  // Root-level images/icons only (not nested under application routes)
  if (/^\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(normPath)) {
    return true;
  }

  return false;
}

/**
 * Determines whether a pathname corresponds to an existing protected SHC Admin page or dynamic subroute.
 * Dynamic paths like `/users/account.js` or `/subscriptions/example.js` are protected.
 */
export function isProtectedAdminPage(pathname: string): boolean {
  const normPath = normalizePathname(pathname);

  // Never match API routes as pages (they are guarded by API boundaries)
  if (normPath.startsWith('/api')) {
    return false;
  }

  // Check against all protected prefixes
  return isUnderProtectedPrefix(normPath);
}

/**
 * Returns the granular RBAC permission required to view a protected page.
 * All protected pages require at minimum ADMIN_PANEL.
 * Sensitive domains enforce granular permissions.
 */
export function getRequiredPagePermission(pathname: string): Permission {
  const normPath = normalizePathname(pathname);

  if (matchesPathOrChild(normPath, '/marketing')) {
    return PERMISSIONS.ANALYTICS_VIEW;
  }

  if (matchesPathOrChild(normPath, '/users')) {
    return PERMISSIONS.USER_MANAGE;
  }

  return PERMISSIONS.ADMIN_PANEL;
}
