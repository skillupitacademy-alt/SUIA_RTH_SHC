import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodTypeAny } from 'zod';

import { requireAdminAccess } from './admin-route-guards';

export function jsonData<TData>(data: TData, init?: number | ResponseInit) {
  return NextResponse.json({ data }, typeof init === 'number' ? { status: init } : init);
}

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...(extra ?? {}) }, { status });
}

export async function requireAdminOrForbidden(request: NextRequest) {
  return requireAdminAccess(request);
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(request: NextRequest, schema: TSchema) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false as const, response: jsonError('Invalid JSON payload', 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, response: jsonError('Invalid payload', 400, { issues: parsed.error.issues }) };
  }

  return { ok: true as const, data: parsed.data };
}

export async function parseJsonOrFormBody<TSchema extends ZodTypeAny>(request: NextRequest, schema: TSchema) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return parseJsonBody(request, schema);
  }

  const formData = await request.formData().catch(() => null);
  if (formData === null) {
    return { ok: false as const, response: jsonError('Invalid payload', 400) };
  }

  const body = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, response: jsonError('Invalid payload', 400, { issues: parsed.error.issues }) };
  }

  return { ok: true as const, data: parsed.data };
}

export function csvResponse(filename: string, rows: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const row of rows) {
        controller.enqueue(encoder.encode(`${row}\n`));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}

export function toInteger(value: FormDataEntryValue | undefined, fallback = 0) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toStringValue(value: FormDataEntryValue | undefined, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function zodStringOrNumber(schema = z.string().min(1)) {
  return schema;
}
