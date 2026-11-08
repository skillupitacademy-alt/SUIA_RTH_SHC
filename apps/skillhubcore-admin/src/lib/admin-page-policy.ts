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

export const PUBLIC_PAGE_PATHS = [
  '/',
  '/login',
  '/forbidden',
] as const;

/**
 * Normalizes a pathname: removes trailing slashes (except for exact '/')
 * and lowercases for uniform path evaluation.
 */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const trimmed = pathname.trim();
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  return withoutTrailing === '' ? '/' : withoutTrailing;
}

/**
 * Checks if a pathname matches a path or is a valid hierarchical child segment.
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
 * Determines whether a pathname is an exempt public page or framework asset.
 */
export function isPublicPath(pathname: string): boolean {
  const normPath = normalizePathname(pathname);

  // Exact public pages
  for (const publicPath of PUBLIC_PAGE_PATHS) {
    if (matchesPathOrChild(normPath, publicPath)) {
      return true;
    }
  }

  // Next.js internal and static assets
  if (
    normPath.startsWith('/_next') ||
    normPath.startsWith('/static') ||
    normPath === '/favicon.ico' ||
    normPath === '/robots.txt' ||
    normPath === '/sitemap.xml' ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)$/i.test(normPath)
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a pathname corresponds to an existing protected SHC Admin page or subroute.
 */
export function isProtectedAdminPage(pathname: string): boolean {
  const normPath = normalizePathname(pathname);

  // Never match public paths or API routes as protected pages
  if (isPublicPath(normPath) || normPath.startsWith('/api')) {
    return false;
  }

  for (const prefix of PROTECTED_PAGE_PREFIXES) {
    if (matchesPathOrChild(normPath, prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the granular RBAC permission required to view a protected page.
 * All protected pages require at minimum ADMIN_PANEL.
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

