import { NextResponse } from 'next/server';
import { z } from 'zod';

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonData<T>(data: T): NextResponse {
  return NextResponse.json(data);
}

export function csvResponse(filename: string, rows: string[]): NextResponse {
  return new NextResponse(rows.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  return request
    .json()
    .then((body) => schema.parse(body))
    .catch(() => {
      throw new Error('Invalid JSON body');
    });
}

export async function parseOptionalJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  const text = await request.text();
  if (text.trim().length === 0) {
    return null;
  }

  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new Error('Invalid JSON body');
  }
}
