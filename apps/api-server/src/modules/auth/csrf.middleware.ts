import { NextRequest, NextResponse } from 'next/server';

export async function csrfProtection(request: NextRequest) {
  // Simple CSRF protection: check Origin/Referer for mutation requests
  const method = request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isMutation) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // In production, compare against allowed domains
    const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    if (origin && !allowed.some(a => origin.startsWith(a)) && !origin.includes(host || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  return null;
}
