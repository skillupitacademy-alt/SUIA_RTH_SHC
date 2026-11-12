import { describe, expect, it } from 'vitest';

import { sanitizeLearnerRedirect } from '@/share-branding/auth/sanitizeLearnerRedirect';
import { isProtectedRoute } from '@/share-branding/middleware/authProxy';

describe('RTH sanitizeLearnerRedirect & retired route exclusions', () => {
  it.each([
    [null, '/dashboard'],
    [undefined, '/dashboard'],
    ['', '/dashboard'],
    ['https://evil.example/steal', '/dashboard'],
    ['//evil.example/steal', '/dashboard'],
    ['/\\evil.example', '/dashboard'],
    ['/login', '/dashboard'],
    ['/signup', '/dashboard'],
    ['/register', '/dashboard'],
    ['/forgot-password', '/dashboard'],
    ['/reset-password', '/dashboard'],
    ['/verify-email', '/dashboard'],
    ['/verify-success', '/dashboard'],
    ['/api', '/dashboard'],
    ['/api/tutorial/progress', '/dashboard'],
    ['/learn', '/dashboard'],
    ['/learn/full-stack/javascript/async-programming/promises', '/dashboard'],
    ['/student/learn', '/dashboard'],
    ['/student/learn/batch-1', '/dashboard'],
    ['/remediation', '/dashboard'],
    ['/remediation/history', '/dashboard'],
    ['/tutorial/assignments', '/dashboard'],
    ['/tutorial/assignments/full-stack/javascript/async-programming/promises', '/dashboard'],
    ['/%2f/evil.example', '/dashboard'],
    ['/%5c/evil.example', '/dashboard'],
  ])('rejects unsafe, auth-loop, API, or retired redirect %j -> %s', (input, expected) => {
    expect(sanitizeLearnerRedirect(input)).toBe(expected);
  });

  it.each([
    ['/dashboard', '/dashboard'],
    ['/start-learning', '/start-learning'],
    ['/tutorial', '/tutorial'],
    ['/tutorial-v2/full-stack/javascript/async-programming/promises/node-1?tab=notes#top', '/tutorial-v2/full-stack/javascript/async-programming/promises/node-1?tab=notes#top'],
    ['/student', '/student'],
    ['/student/my-batch', '/student/my-batch'],
  ])('preserves canonical internal learner destination %s', (input, expected) => {
    expect(sanitizeLearnerRedirect(input)).toBe(expected);
  });

  it('excludes retired learner page prefixes from authProxy protected-route interception so they return 404', () => {
    expect(isProtectedRoute('/student/learn')).toBe(false);
    expect(isProtectedRoute('/student/learn/deep')).toBe(false);
    expect(isProtectedRoute('/learn/full-stack')).toBe(false);
    expect(isProtectedRoute('/remediation')).toBe(false);
    expect(isProtectedRoute('/tutorial/assignments/full-stack/js/async/promises')).toBe(false);

    // Canonical protected routes remain protected
    expect(isProtectedRoute('/student')).toBe(true);
    expect(isProtectedRoute('/student/my-batch')).toBe(true);
    expect(isProtectedRoute('/tutorial-v2/full-stack/js/async/promises/1')).toBe(true);
    expect(isProtectedRoute('/api/tutorial/assignments/sub-1')).toBe(true);
    expect(isProtectedRoute('/api/tutorial/remediation')).toBe(true);
  });
});

