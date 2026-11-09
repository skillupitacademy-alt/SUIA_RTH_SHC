import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tutorial/content
 *
 * @deprecated RETIRED (OD-01, OD-05, Task 11)
 *
 * Legacy RTH monolithic tutorial content creation is retired.
 * All tutorial authoring and publishing is managed exclusively via
 * the SHC Admin Tutorial Composer (/tools/tutorial-page-content).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Legacy RTH tutorial content authoring is permanently retired. Use SHC Admin Tutorial Composer.',
      statusCode: 410,
    },
    { status: 410 }
  );
}
