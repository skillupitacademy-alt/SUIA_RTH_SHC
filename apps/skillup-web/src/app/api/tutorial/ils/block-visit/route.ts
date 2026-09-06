/**
 * POST /api/tutorial/ils/block-visit
 * 
 * SkillUp BFF - Proxies to centralized API server for block visit recording
 * Phase 4.4: Block-level visit tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[ILS-DEBUG][BFF][block-visit] Request received', {
    method: request.method,
    url: request.url,
    hasSessionIdHeader: !!request.headers.get('x-session-id'),
    timestamp: new Date().toISOString()
  });
  
  try {
    // Authenticate user (SkillUp-specific)
    console.log('[ILS-DEBUG][BFF][block-visit] Calling requireStudentAuth()');
    const authResult = await requireStudentAuth(request);
    
    if (!authResult.ok) {
      console.warn('[ILS-DEBUG][BFF][block-visit][AUTH-FAILED]', {
        hasResponse: !!authResult.response,
        errorStatus: authResult.response?.status
      });
      return authResult.response;
    }
    
    console.log('[ILS-DEBUG][BFF][block-visit][AUTH-SUCCESS]', {
      userId: authResult.userId
    });
    
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
      console.log('[ILS-DEBUG][BFF][block-visit] Request body parsed', {
        hasBody: !!body,
        bodyKeys: body ? Object.keys(body as any) : []
      });
    } catch (error) {
      console.error('[ILS-DEBUG][BFF][block-visit][ERROR] Invalid JSON', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    // Call API server with brand context
    const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
    const url = `${apiUrl}/tutorial/ils/block-visit`;
    
    console.log('[ILS-DEBUG][BFF][block-visit] Forwarding to API server', {
      targetUrl: url,
      hasInternalSecret: !!process.env.INTERNAL_API_SECRET,
      hasInternalKey: !!process.env.INTERNAL_API_KEY,
      hasSessionId: !!request.headers.get('x-session-id'),
      brand: 'skillup',
      userId: authResult.userId
    });
    
    // Phase 4.4: Log proxy target for diagnostics
    console.log('[ILS_BLOCK_PROXY_TARGET]', JSON.stringify({
      brand: 'skillup',
      apiUrl,
      fullUrl: url,
      hasInternalApiUrl: !!process.env.INTERNAL_API_URL,
      hasGatewayUrl: !!process.env.GATEWAY_URL,
    }));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand': 'skillup',
        'X-User-ID': authResult.userId,
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
        'x-session-id': request.headers.get('x-session-id') || '', // Forward learning session ID
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    console.log('[ILS-DEBUG][BFF][block-visit] API server response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to record block visit' }));
      console.error('[ILS-DEBUG][BFF][block-visit][ERROR] API server returned error', {
        status: response.status,
        error
      });
      return NextResponse.json(
        { error: error.error || 'Block visit recording failed' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[ILS-DEBUG][BFF][block-visit][SUCCESS]', {
      hasData: !!data
    });
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[ILS-DEBUG][BFF][block-visit][ERROR] Exception caught:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
