import { TokenService } from '@quiz/auth';

const tokenService = new TokenService();

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
