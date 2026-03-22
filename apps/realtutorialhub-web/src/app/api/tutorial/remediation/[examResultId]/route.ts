import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AssignmentAuthError, requireStudent } from '../../../../../lib/assignment-auth'
import { RemediationService } from '../../../../../server/remediation.service'

export const dynamic = 'force-dynamic'

const examResultParamsSchema = z.object({
  examResultId: z.string().uuid(),
})

const remediationService = new RemediationService()

export async function GET(
  req: Request,
  context: { params: Promise<{ examResultId: string }> }
): Promise<Response> {
  try {
    const user = await requireStudent(req)
    const params = examResultParamsSchema.parse(await context.params)
    const plan = await remediationService.getPlan(user.userId, params.examResultId)

    if (plan === undefined) {
      return NextResponse.json({ error: 'Remediation plan not found' }, { status: 404 })
    }

    return NextResponse.json(plan, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    if (
      error instanceof AssignmentAuthError ||
      (typeof error === 'object' && error !== null && 'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number')
    ) {
      const statusCode = error instanceof AssignmentAuthError
        ? error.statusCode
        : ((error as { statusCode: 401 | 403 }).statusCode ?? 401)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: statusCode })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to load remediation plan' }, { status: 500 })
  }
}
