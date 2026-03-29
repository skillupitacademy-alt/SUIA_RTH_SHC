import { TokenService } from '@quiz/auth';
import { TutorialProgressRepository } from '@quiz/db-tutorial';

const tokenService = new TokenService();
const progressRepository = new TutorialProgressRepository();

export class AssignmentAuthError extends Error {
  constructor(message: string, public readonly statusCode: 401 | 403 = 401) {
    super(message);
    this.name = 'AssignmentAuthError';
  }
}

export async function requireStudent(request: Request) {
  const token = tokenService.getAccessToken(request, { scope: 'user' });
  if (token == null || token.trim() === '') {
    throw new AssignmentAuthError('Unauthorized', 401);
  }

  try {
    return await TokenService.verifyAccessToken(token, { audience: 'user', isAdmin: false });
  } catch {
    throw new AssignmentAuthError('Unauthorized', 401);
  }
}

export async function requireAssignmentAccess(request: Request, subtopicId: string) {
  const user = await requireStudent(request);
  const isComplete = await progressRepository.isSubtopicComplete(user.userId, subtopicId);

  if (!isComplete) {
    throw new AssignmentAuthError('Complete the tutorial content (all 6 blocks) to unlock assignments', 403);
  }

  return user;
}
