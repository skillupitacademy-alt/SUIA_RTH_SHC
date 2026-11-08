import { describe, expect, it } from 'vitest';

import { resolveRequestBrand, resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders, resolveStrictRefreshBrandFromHeaders } from '../request-brand';

describe('resolveStrictRefreshBrandFromHeaders', () => {
  it('returns missing_brand when neither x-brand nor x-platform is present', () => {
    const headers = { get: () => null };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ error: 'missing_brand' });
  });

  it('returns missing_brand when headers are empty or whitespace', () => {
    const headers = { get: (name: string) => (name === 'x-brand' ? '   ' : null) };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ error: 'missing_brand' });
  });

  it('rejects shared as invalid_brand', () => {
    const headers = { get: (name: string) => (name === 'x-brand' ? 'shared' : null) };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ error: 'invalid_brand' });
  });

  it('rejects conflicting x-brand and x-platform', () => {
    const headers = {
      get: (name: string) => {
        if (name === 'x-brand') return 'realtutorialhub';
        if (name === 'x-platform') return 'skillup';
        return null;
      },
    };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ error: 'conflicting_brand' });
  });

  it('resolves canonical skillup brand', () => {
    const headers = { get: (name: string) => (name === 'x-brand' ? 'skillup' : null) };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ brand: 'skillup' });
  });

  it('resolves canonical realtutorialhub brand', () => {
    const headers = { get: (name: string) => (name === 'x-platform' ? 'realtutorialhub' : null) };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ brand: 'realtutorialhub' });
  });

  it('resolves matching x-brand and x-platform', () => {
    const headers = {
      get: (name: string) => {
        if (name === 'x-brand') return 'skillup';
        if (name === 'x-platform') return 'skillup';
        return null;
      },
    };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ brand: 'skillup' });
  });

  it('rejects unknown or invalid brand string', () => {
    const headers = { get: (name: string) => (name === 'x-brand' ? 'unknown-portal' : null) };
    expect(resolveStrictRefreshBrandFromHeaders(headers)).toEqual({ error: 'invalid_brand' });
  });
});

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
