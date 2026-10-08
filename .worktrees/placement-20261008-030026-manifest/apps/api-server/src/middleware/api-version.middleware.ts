import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';

export const DEFAULT_VERSION = 'v1';
export const SUPPORTED_VERSIONS = ['v1'];

export function applyApiVersion(request: NextRequest, response: NextResponse) {
  const url = request.nextUrl;
  const pathParts = url.pathname.split('/');
  
  // Extract version from URL if present (e.g., /api/v1/...)
  let version = DEFAULT_VERSION;
  const pathVersion = pathParts.length > 2 ? pathParts[2] : null;
  if (pathParts[1] === 'api' && pathVersion !== null && SUPPORTED_VERSIONS.includes(pathVersion)) {
    version = pathVersion;
  } else {
    // Fallback to Accept-Version header
    const headerVersion = request.headers.get('Accept-Version');
    if (headerVersion !== null && headerVersion !== '' && SUPPORTED_VERSIONS.includes(headerVersion)) {
      version = headerVersion;
    }
  }
  
  response.headers.set('X-API-Version', version);
  
  return response;
}
