import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * BFF Route: User Profile Management
 * Pattern: UI → BFF → API Server → DB
 * 
 * Proxies profile requests to API server with authentication cookies + Authorization header
 */

export const dynamic = 'force-dynamic';

const API_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_SERVER_URL || 'http://localhost:3001';

/**
 * GET /api/profile
 * Fetch user profile from API server
 */
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    
    // 🔥 CRITICAL: Verify auth cookies exist
    console.log('[BFF] Profile GET - Cookie header:', cookieHeader ? 'EXISTS' : 'MISSING');
    console.log('[BFF] Profile GET - Cookie length:', cookieHeader?.length || 0);
    
    if (!cookieHeader) {
      console.error('[BFF] Profile GET - No auth cookie provided');
      return NextResponse.json(
        { error: 'No auth cookie', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 🔥 CRITICAL: Extract accessToken for Authorization header
    const accessToken = cookieHeader
      .split('; ')
      .find(c => c.startsWith('accessToken='))
      ?.split('=')[1];

    console.log('[BFF] Profile GET - Has accessToken:', !!accessToken);

    if (!accessToken) {
      console.error('[BFF] Profile GET - Missing accessToken in cookies');
      return NextResponse.json(
        { error: 'Missing auth token', message: 'Please log in again' },
        { status: 401 }
      );
    }
    
    console.log('[BFF] Profile GET - Forwarding to API server:', API_SERVER_URL);
    console.log('[BFF] Profile GET - Token length:', accessToken.length);
    
    const res = await fetch(`${API_SERVER_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
        'Authorization': `Bearer ${accessToken}`, // 🔥 CRITICAL FIX
        'x-portal-identity': 'user',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    console.log('[BFF] Profile GET - API Server response status:', res.status);

    const data = await res.json();
    console.log('[BFF] Profile GET - Response data keys:', Object.keys(data));

    // If profile doesn't exist yet, return empty profile structure
    if (res.status === 404) {
      console.log('[BFF] Profile not found (404)');
      return NextResponse.json(
        {
          error: 'Profile not found',
          message: 'Please complete onboarding first',
        },
        { status: 404 }
      );
    }

    // If unauthorized, return auth error
    if (res.status === 401 || res.status === 403) {
      console.error('[BFF] Profile GET - Auth failed:', res.status);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Please log in again',
        },
        { status: res.status }
      );
    }

    // If profile fetch successful, also get user email from /me endpoint
    if (res.ok && data) {
      console.log('[BFF] Profile GET - Success, fetching user email');
      
      try {
        const meRes = await fetch(`${API_SERVER_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'cookie': cookieHeader,
            'Authorization': `Bearer ${accessToken}`, // 🔥 CRITICAL FIX
            'x-portal-identity': 'user',
          },
          credentials: 'include',
          cache: 'no-store',
        });

        console.log('[BFF] Profile GET - /me response status:', meRes.status);

        if (meRes.ok) {
          const meData = await meRes.json();
          // Merge email from /me into profile response
          if (meData.user?.email) {
            console.log('[BFF] Profile GET - Merged email:', meData.user.email);
            const profileData = data.data || data;
            profileData.email = meData.user.email;
            
            return NextResponse.json(
              data.data ? { ...data, data: profileData } : profileData,
              {
                status: res.status,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
              }
            );
          }
        }
      } catch (meError) {
        console.warn('[BFF] Failed to fetch user email:', meError);
      }
    }

    console.log('[BFF] Profile GET - Returning response');
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[BFF] Profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update user profile via API server
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    
    // 🔥 CRITICAL: Verify auth cookies exist
    console.log('[BFF] Profile PATCH - Cookie header:', cookieHeader ? 'EXISTS' : 'MISSING');
    
    if (!cookieHeader) {
      console.error('[BFF] Profile PATCH - No auth cookie provided');
      return NextResponse.json(
        { error: 'No auth cookie', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 🔥 CRITICAL: Extract accessToken for Authorization header
    const accessToken = cookieHeader
      .split('; ')
      .find(c => c.startsWith('accessToken='))
      ?.split('=')[1];

    console.log('[BFF] Profile PATCH - Has accessToken:', !!accessToken);

    if (!accessToken) {
      console.error('[BFF] Profile PATCH - Missing accessToken in cookies');
      return NextResponse.json(
        { error: 'Missing auth token', message: 'Please log in again' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('[BFF] Profile PATCH - Update fields:', Object.keys(body));

    const res = await fetch(`${API_SERVER_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
        'Authorization': `Bearer ${accessToken}`, // 🔥 CRITICAL FIX
        'x-portal-identity': 'user',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    console.log('[BFF] Profile PATCH - API Server response status:', res.status);

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[BFF] Profile PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
