import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { TokenService } from '@/modules/auth/token.service';
import { ExamBlueprintService } from '@/services/exams/ExamBlueprintService';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    await TokenService.verifyAccessToken(_token, false);
    const body = (await _req.json()) as { 
      domainId: string; 
      subjectIds?: string[]; 
      topicIds?: string[]; 
      subtopicIds?: string[] 
    };

    const blueprintService = new ExamBlueprintService();
    const result = await blueprintService.getAvailableCounts(body);
    return NextResponse.json(result);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}
