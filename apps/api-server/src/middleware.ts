
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We will use simple header check as a placeholder since full JWT verification 
// might require compatible edge-runtime libraries. 
// However, 'jose' is edge compatible.

export async function middleware(request: NextRequest) {
  // Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Exclude auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // OPTIONAL: Verify JWT here if desired, or let the individual route handlers 
  // verify it (or validte it via a shared service later).
  // For now, strict check on header existence is a good first step.
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
