import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Project LLM API Route Adapter
 *
 * This Next.js API route acts as a thin proxy layer between the SkillHubCore Admin
 * frontend and the Project AI FastAPI backend. It extracts the admin JWT from cookies
 * and forwards it to FastAPI in the Authorization header.
 *
 * AUTHENTICATION FLOW:
 * 1. Frontend makes authenticated request to /api/project-llm/[...path]
 * 2. This adapter extracts JWT from cookies (accessToken or admin_accessToken)
 * 3. Request is forwarded to FastAPI with Authorization: Bearer <token>
 * 4. FastAPI validates the JWT and handles all authorization logic
 *
 * CRITICAL: This adapter does NOT verify tokens or check permissions locally.
 * All JWT validation and authorization is delegated to the FastAPI backend.
 *
 * UNVERIFIED ASSUMPTIONS (require end-to-end testing):
 * 1. Token compatibility: Admin tokens signed with ADMIN_JWT_SECRET may or may not
 *    be accepted by FastAPI's JWT validation; this has not been tested end-to-end.
 * 2. Backend URL: PROJECT_AI_BACKEND env var is assumed to point to the correct
 *    FastAPI service; not yet confirmed in staging.
 * 3. Token claims: Admin token is assumed to contain the userId and roles claims
 *    FastAPI expects; not yet verified.
 * 4. Role assignment: Admin users may not hold the contract_admin role required
 *    by FastAPI endpoints; FastAPI will enforce this and return 403.
 */

/**
 * Shared request handler for all HTTP methods.
 * Extracts JWT from cookies and proxies the request to FastAPI.
 */
async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  // Extract JWT from cookies (same names set by login route)
  const token =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('admin_accessToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Build target URL for FastAPI backend
    const params = await context.params;
    const pathSegments = params.path || [];
    const backendBase =
      process.env.PROJECT_AI_BACKEND || 'http://localhost:8000';

    // Construct full URL with path and query parameters
    const backendPath = pathSegments.join('/');
    const url = new URL(request.url);
    const queryString = url.search; // Includes '?' prefix if params exist

    const targetUrl = `${backendBase}/${backendPath}${queryString}`;

    // Prepare request body for POST/PUT
    let body: string | undefined;
    if (request.method === 'POST' || request.method === 'PUT') {
      body = await request.text();
    }

    // Forward request to FastAPI with Authorization header
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        // Only forward Content-Type if the original request had it
        // (don't force application/json for multipart/form-data uploads)
        ...(request.headers.get('content-type') && {
          'Content-Type': request.headers.get('content-type')!,
        }),
      },
      body,
    });

    // Parse and return the FastAPI response
    const responseText = await response.text();

    // Try to parse as JSON; fallback to raw text
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    // Network or fetch error (backend unreachable)
    console.error('[PROJECT_LLM_ADAPTER] Backend request failed:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 503 }
    );
  }
}

/**
 * GET handler
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context);
}

/**
 * POST handler
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context);
}

/**
 * PUT handler
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context);
}

/**
 * DELETE handler
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, context);
}
