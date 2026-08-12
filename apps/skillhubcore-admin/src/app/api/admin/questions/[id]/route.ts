import type { NextRequest } from 'next/server';

import { FALLBACK_API_BASE_SKILLHUBCORE, proxyUpstreamRequest } from '@/share-branding/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function proxyQuestionRequest(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyUpstreamRequest(request, {
    fallbackApiBase: FALLBACK_API_BASE_SKILLHUBCORE,
    upstreamPath: `api/admin/questions/${encodeURIComponent(id)}`,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyQuestionRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyQuestionRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyQuestionRequest(request, context);
}
