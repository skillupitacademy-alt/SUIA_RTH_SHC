import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@quiz/auth/rbac';
import {
  isProtectedAdminPage,
  isPublicPath,
  normalizePathname,
  matchesPathOrChild,
  getRequiredPagePermission,
  PROTECTED_PAGE_PREFIXES,
  PUBLIC_PAGE_PATHS,
} from '../admin-page-policy';

describe('Admin Page Policy — Route Inventory & Classification', () => {
  const all32CanonicalProtectedPages = [
    // 27 (admin) pages
    '/audit',
    '/certificate-generator',
    '/certificate-preview',
    '/content-generation/layman-architecture',
    '/dashboard',
    '/events',
    '/marketing',
    '/metrics',
    '/subscriptions',
    '/subscriptions/sub-uuid-1234',
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
    '/users/user-uuid-5678',
    // 5 (authenticated) pages
    '/factory/question-generator',
    '/factory/question-generator/review',
    '/questions',
    '/questions/new',
    '/questions/question-uuid-999/edit',
  ];

  it('classifies all 32 canonical SHC Admin pages as protected', () => {
    expect(all32CanonicalProtectedPages).toHaveLength(32);
    for (const page of all32CanonicalProtectedPages) {
      expect(isProtectedAdminPage(page), `Page ${page} must be protected`).toBe(true);
      expect(isPublicPath(page), `Page ${page} must NOT be public`).toBe(false);
    }
  });

  it('classifies public routes as public and not protected', () => {
    const publicPages = ['/', '/login', '/forbidden'];
    for (const page of publicPages) {
      expect(isPublicPath(page), `Page ${page} must be public`).toBe(true);
      expect(isProtectedAdminPage(page), `Page ${page} must NOT be protected`).toBe(false);
    }
  });

  it('exposes complete prefixes and public paths constants', () => {
    expect(PROTECTED_PAGE_PREFIXES.length).toBe(16);
    expect(PUBLIC_PAGE_PATHS).toContain('/login');
    expect(normalizePathname('/dashboard/')).toBe('/dashboard');
    expect(matchesPathOrChild('/questions/1', '/questions')).toBe(true);
    expect(matchesPathOrChild('/questions-evil', '/questions')).toBe(false);
  });

  it('enforces strict segment boundaries and rejects lookalike evil prefixes', () => {
    // Lookalike paths with shared string prefixes must NOT match protected prefix
    expect(isProtectedAdminPage('/questions-evil')).toBe(false);
    expect(isProtectedAdminPage('/questions_bypass')).toBe(false);
    expect(isProtectedAdminPage('/dashboard-fake')).toBe(false);
    expect(isProtectedAdminPage('/audit-exploit')).toBe(false);
    expect(isProtectedAdminPage('/marketing-unauth')).toBe(false);

    // Lookalike public paths must NOT acquire public exemption
    expect(isPublicPath('/login-extra')).toBe(false);
    expect(isPublicPath('/login_bypass')).toBe(false);
    expect(isPublicPath('/forbidden-extra')).toBe(false);
  });

  it('classifies static and framework asset paths as public and exempt', () => {
    const assets = [
      '/_next/static/chunks/main.js',
      '/_next/static/css/app.css',
      '/_next/image?url=logo.png',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/static/images/hero.png',
      '/assets/theme.css',
      '/fonts/inter.woff2',
    ];
    for (const asset of assets) {
      expect(isPublicPath(asset), `Asset ${asset} must be public`).toBe(true);
      expect(isProtectedAdminPage(asset), `Asset ${asset} must NOT be protected`).toBe(false);
    }
  });

  it('assigns correct granular RBAC permissions per page family', () => {
    // Marketing family -> ANALYTICS_VIEW
    expect(getRequiredPagePermission('/marketing')).toBe(PERMISSIONS.ANALYTICS_VIEW);
    expect(getRequiredPagePermission('/marketing/subpage')).toBe(PERMISSIONS.ANALYTICS_VIEW);

    // User management family -> USER_MANAGE
    expect(getRequiredPagePermission('/users')).toBe(PERMISSIONS.USER_MANAGE);
    expect(getRequiredPagePermission('/users/user-123')).toBe(PERMISSIONS.USER_MANAGE);

    // All other protected pages -> ADMIN_PANEL
    expect(getRequiredPagePermission('/dashboard')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/questions')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/questions/new')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/audit')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/metrics')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/tools/tutorial-block-composer')).toBe(PERMISSIONS.ADMIN_PANEL);
    expect(getRequiredPagePermission('/factory/question-generator')).toBe(PERMISSIONS.ADMIN_PANEL);
  });
});

