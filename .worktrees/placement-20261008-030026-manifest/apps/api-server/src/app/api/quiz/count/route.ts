import { type NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExamBlueprintService } from '@/services/exams/ExamBlueprintService';

export const dynamic = 'force-dynamic';

async function postHandler(req: NextRequest) {
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    if (token === null || token === undefined || token === '') {
      throw unauthorized("Unauthorized");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    
    // Ingest and sanitize JSON body
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const body = sanitizeJsonField(raw) as { 
      domainId: string; 
      subjectIds?: string[]; 
      topicIds?: string[]; 
      subtopicIds?: string[] 
    };

    const blueprintService = new ExamBlueprintService();
    const result = await blueprintService.getAvailableCounts(body);
    return ApiResponse.success(result);
  } catch (error: unknown) {
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'quiz', operation: 'count_available_questions' });
