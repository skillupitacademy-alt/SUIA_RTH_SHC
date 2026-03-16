import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';

import { applyBffCacheHeaders } from '../bff-cache';

function makeResponse() {
  return NextResponse.json({ ok: true });
}

describe('applyBffCacheHeaders', () => {
  it('applies BFF_AGGREGATE cache headers', () => {
    const response = applyBffCacheHeaders(makeResponse(), 'BFF_AGGREGATE');

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, s-maxage=300, stale-while-revalidate=60'
    );
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  it('applies BFF_PRIVATE cache headers', () => {
    const response = applyBffCacheHeaders(makeResponse(), 'BFF_PRIVATE');

    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Authorization, Cookie');
  });

  it('applies BFF_NOCACHE cache headers', () => {
    const response = applyBffCacheHeaders(makeResponse(), 'BFF_NOCACHE');

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
    expect(response.headers.get('Vary')).toBeNull();
  });
});
