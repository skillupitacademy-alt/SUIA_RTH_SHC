import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/content/versions
 *
 * @deprecated RETIRED (OD-01, OD-05, Task 11)
 *
 * Legacy RTH monolithic tutorial content version querying is retired.
 * All tutorial versioning is managed exclusively via the SHC Admin
 * Tutorial Composer (/tools/tutorial-page-content).
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Legacy RTH tutorial content versions query is permanently retired. Use SHC Admin Tutorial Composer.',
      statusCode: 410,
    },
    { status: 410 }
  );
}
