import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET & PATCH /api/tutorial/content/[id]
 *
 * @deprecated RETIRED (OD-01, OD-05, Task 11)
 *
 * Legacy RTH monolithic tutorial content retrieval and updates are retired.
 * All tutorial authoring and publishing is managed exclusively via
 * the SHC Admin Tutorial Composer (/tools/tutorial-page-content).
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Legacy RTH tutorial content retrieval is permanently retired. Use SHC Admin Tutorial Composer.',
      statusCode: 410,
    },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'Legacy RTH tutorial content updating is permanently retired. Use SHC Admin Tutorial Composer.',
      statusCode: 410,
    },
    { status: 410 }
  );
}
