import { db, exams } from '@quiz/db';
import { and, desc, eq, or } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === undefined || token === null || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    
    // Find the most recent started or processing exam for this user
    const activeExam = await db.query.exams.findFirst({
      where: and(
        eq(exams.userId, payload.userId),
        or(
          eq(exams.status, 'started'),
          eq(exams.status, 'processing')
        )
      ),
      orderBy: [desc(exams.startedAt)],
      with: {
        blueprint: {
          columns: {
            name: true
          }
        }
      }
    });

    if (!activeExam) {
      return ApiResponse.success({ active: false });
    }

    return ApiResponse.success({
      active: true,
      examId: activeExam.id,
      status: activeExam.status,
      title: activeExam.blueprint?.name ?? 'Self-Paced Quiz',
      startedAt: activeExam.startedAt
    });
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'quiz-recovery', operation: 'get_active_exam' });
