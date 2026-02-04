import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';
import { verifyAdmin } from '@/modules/auth/rbac.service';

/**
 * GET QUIZ RESULT
 * GET /api/quiz/result?examId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    if (!examId) return NextResponse.json({ error: 'examId required' }, { status: 400 });

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        dimensions: true,
        blueprint: true,
        examQuestions: {
          with: {
            question: true,
          },
          orderBy: (eq, { asc }) => [asc(eq.order)],
        },
      }
    });

    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // SEC-003: Ownership check
    if (exam.userId !== payload.userId) {
      const isAdmin = await verifyAdmin(payload);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: You do not own this exam' }, { status: 403 });
      }
      // TODO: Audit log for admin access (SEC-003 requirement)
      console.log(`[AUDIT] Admin ${payload.userId} accessed Exam ${examId} owned by ${exam.userId}`);
    }

    if (exam.status === 'processing' || exam.status === 'started') {
      return NextResponse.json({ 
        id: exam.id,
        status: exam.status,
        message: 'Exam is still being processed. Please poll again in a few seconds.' 
      }, { status: 202 });
    }

    if (exam.status === 'failed') {
      return NextResponse.json({ 
        id: exam.id,
        status: 'failed',
        error: 'Background scoring failed. Please contact support.' 
      }, { status: 500 });
    }

    if (exam.status !== 'completed') {
      return NextResponse.json({ error: `Exam status is ${exam.status}` }, { status: 400 });
    }

    // Resolve human-readable names for dimensions
    const topicIds = exam.dimensions
      .filter(d => d.dimensionType === 'topic' && d.dimensionId)
      .map(d => d.dimensionId);

    const topicsData = await db.query.topics.findMany({
      where: (topics, { inArray }) => inArray(topics.id, topicIds as string[]),
    });

    const topicMap = new Map(topicsData.map(t => [t.id, t.name]));

    const enrichedDimensions = exam.dimensions.map(d => ({
      ...d,
      name: d.dimensionType === 'topic' ? topicMap.get(d.dimensionId as string) : 
            d.dimensionType === 'difficulty' ? (d.dimensionId || 'Difficulty') : d.dimensionType
    }));

    // Calculate time taken
    const startTime = new Date(exam.startedAt).getTime();
    const endTime = new Date(exam.completedAt!).getTime();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeTaken = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Calculate Growth Zones
    const growthZones = enrichedDimensions
      .filter(d => d.dimensionType === 'topic' && (d.accuracy || 0) < 70)
      .map(d => ({
        topic: d.name,
        accuracy: d.accuracy,
        suggestion: `Review ${d.name} more deeply. You achieved ${d.accuracy}% accuracy in this session.`
      }));

    return NextResponse.json({
      ...exam,
      dimensions: enrichedDimensions,
      timeTaken,
      growthZones
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
