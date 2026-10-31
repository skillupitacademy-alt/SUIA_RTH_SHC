import { requireAdminRequest } from '@/lib/admin-route-guard';
import { NextRequest, NextResponse } from 'next/server';
import { requestVerificationBackend } from '@/lib/project-llm/api/backendRequest';

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
 * Exported handlers verify the SHC admin principal and mutation origin locally.
 * FastAPI must additionally enforce workflow ownership and operation permissions.
 *
 * TRUSTED-ADMIN WORKER MODEL:
 * The Project AI execution worker operates under a trusted-admin candidate model.
 * Upstream 5xx exceptions are sanitized to 502 PROJECT_AI_BACKEND_ERROR with private, no-store headers
 * to prevent internal error and path leakage.
 */

/**
 * Shared request handler for all HTTP methods.
 * Extracts JWT from cookies and proxies the request to FastAPI.
 */
async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const requestId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-correlation-id') ||
    crypto.randomUUID();

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
    const backendOptions = {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-request-id': requestId,
        // Only forward Content-Type if the original request had it
        // (don't force application/json for multipart/form-data uploads)
        ...(request.headers.get('content-type') && {
          'Content-Type': request.headers.get('content-type')!,
        }),
      },
      body,
    };

    const verificationRequest = request.method === 'POST' && (
      backendPath === 'candidates/upload' ||
      /\/(qualify|execute|verify-composer|verify-learner-runtime)$/.test(backendPath)
    );
    const response = verificationRequest
      ? await requestVerificationBackend(targetUrl, backendOptions)
      : await fetch(targetUrl, backendOptions);

    // Sanitize upstream 5xx errors to prevent leaking internal execution state
    if (response.status >= 500) {
      console.error('[PROJECT_LLM_ADAPTER] Upstream 5xx error', {
        method: request.method,
        status: response.status,
        route: '/api/project-llm/[...path]',
        requestId,
      });
      return NextResponse.json(
        { error: 'PROJECT_AI_BACKEND_ERROR', requestId },
        { status: 502, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // Parse and return the FastAPI response
    const responseText = typeof response.text === 'string' ? response.text : await response.text();

    // Try to parse as JSON; fallback to raw text
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (response.status >= 400) {
      console.error('[PROJECT_LLM_ADAPTER] Upstream request failed', {
        method: request.method,
        status: response.status,
        route: '/api/project-llm/[...path]',
        requestId,
      });
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    // Network or fetch error (backend unreachable)
    console.error('[PROJECT_LLM_ADAPTER] Backend request failed', { requestId, err });
    return NextResponse.json(
      { error: 'PROJECT_AI_BACKEND_ERROR', requestId },
      { status: 502, headers: { 'Cache-Control': 'private, no-store' } }
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
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  return handleRequest(request, context);
}

/**
 * POST handler
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  return handleRequest(request, context);
}

/**
 * PUT handler
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  return handleRequest(request, context);
}

/**
 * DELETE handler
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  return handleRequest(request, context);
}
