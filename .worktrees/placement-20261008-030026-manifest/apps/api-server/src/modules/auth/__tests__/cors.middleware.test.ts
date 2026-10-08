import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { corsMiddleware } from '../cors.middleware';

describe('corsMiddleware', () => {
  it('allows the x-brand header during preflight for trusted origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://admin.realtutorialhub.com';

    const request = new NextRequest('https://api.realtutorialhub.com/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://admin.realtutorialhub.com',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,x-brand',
      },
    });
    const response = corsMiddleware(request, new NextResponse(null, { status: 204 }));

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://admin.realtutorialhub.com');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('x-brand');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });
});
