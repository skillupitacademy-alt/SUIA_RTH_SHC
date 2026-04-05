import { describe, expect, it } from 'vitest';

import { resolveRequestBrand, resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders } from '../request-brand';

describe('resolveRequestBrandFromHeaders', () => {
  it('prefers the explicit x-brand header when present', () => {
    const headers = {
      get(name: string) {
        if (name === 'x-brand') return 'skillup';
        return null;
      },
    };

    expect(resolveRequestBrandFromHeaders(headers, 'api.realtutorialhub.com')).toBe('skillup');
  });

  it('does not derive brand from hostname fallback values', () => {
    const headers = {
      get() {
        return null;
      },
    };

    expect(resolveRequestBrandFromHeaders(headers, 'api.realtutorialhub.com')).toBeUndefined();
    expect(resolveRequestBrandFromHeaders(headers, 'api.skillupitacademy.com')).toBeUndefined();
  });
});

describe('resolveRequestBrand', () => {
  it('accepts only explicit brand keys', () => {
    expect(resolveRequestBrand('realtutorialhub')).toBe('realtutorialhub');
    expect(resolveRequestBrand('skillup')).toBe('skillup');
  });

  it('rejects hostname-like values', () => {
    expect(resolveRequestBrand('api.realtutorialhub.com')).toBeUndefined();
    expect(resolveRequestBrand('api.skillupitacademy.com')).toBeUndefined();
  });
});

describe('resolveRequestHostnameFromHeaders', () => {
  it('prefers the browser origin over the forwarded api host', () => {
    const headers = {
      get(name: string) {
        if (name === 'x-forwarded-host') return 'api.realtutorialhub.com';
        if (name === 'origin') return 'https://quiz.skillhubcore.in';
        return null;
      },
    };

    expect(resolveRequestHostnameFromHeaders(headers, 'api.realtutorialhub.com')).toBe('quiz.skillhubcore.in');
  });
});
