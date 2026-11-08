import { describe, expect, it } from 'vitest';
import { sanitizeRedirectUrl } from '../sanitize-redirect';

describe('sanitizeRedirectUrl', () => {
  it('returns fallback for empty, null, or undefined input', () => {
    expect(sanitizeRedirectUrl(null)).toBe('/dashboard');
    expect(sanitizeRedirectUrl(undefined)).toBe('/dashboard');
    expect(sanitizeRedirectUrl('')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('   ')).toBe('/dashboard');
  });

  it('preserves valid internal paths', () => {
    expect(sanitizeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('/questions')).toBe('/questions');
    expect(sanitizeRedirectUrl('/tools/project-llm/matrix')).toBe('/tools/project-llm/matrix');
  });

  it('preserves query strings and hashes without destructive decoding', () => {
    expect(sanitizeRedirectUrl('/questions?filter=cat%20dog&search=a%26b')).toBe(
      '/questions?filter=cat%20dog&search=a%26b'
    );
    expect(sanitizeRedirectUrl('/tools?page=2#tab-settings')).toBe('/tools?page=2#tab-settings');
  });

  it('rejects external absolute URLs', () => {
    expect(sanitizeRedirectUrl('https://evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('http://evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('https://evil.com/dashboard')).toBe('/dashboard');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeRedirectUrl('//evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('///evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('//evil.com/login')).toBe('/dashboard');
  });

  it('rejects backslash bypass vectors', () => {
    expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('\\\\evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('/dashboard\\evil.com')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('\\evil.com')).toBe('/dashboard');
  });

  it('rejects pseudo-protocols and script schemes', () => {
    expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
    expect(sanitizeRedirectUrl('vbscript:msgbox(1)')).toBe('/dashboard');
  });

  it('supports custom fallback path', () => {
    expect(sanitizeRedirectUrl('https://evil.com', '/fallback')).toBe('/fallback');
    expect(sanitizeRedirectUrl(null, '/login')).toBe('/login');
  });
});
