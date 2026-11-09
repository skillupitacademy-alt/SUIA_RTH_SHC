import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial/content/:subtopicId
 *
 * @deprecated RETIRED (OD-01, OD-02, Phase B Task 06)
 *
 * This legacy content route querying the old monolithic tutorial_content table
 * is completely retired. The canonical block-based learning experience is
 * served exclusively via /tutorial-v2/[domainSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/[navigationNodeId]
 * powered by tutorial_sections and TutorialDeliveryService.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ subtopicId: string }> }
) {
  const { subtopicId } = await context.params;
  return NextResponse.json(
    {
      error: 'Gone',
      message: `Legacy tutorial content route for subtopic "${subtopicId}" is permanently retired. Use canonical /tutorial-v2 block routes.`,
      statusCode: 410,
    },
    { status: 410 }
  );
}
