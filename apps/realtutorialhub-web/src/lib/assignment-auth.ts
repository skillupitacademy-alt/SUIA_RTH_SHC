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
    const payload = await TokenService.verifyAccessToken(token, { audience: 'user', isAdmin: false });
    
    // 🔥 CRITICAL FIX: Add role validation that was missing
    // This was a security gap - RTH had no role checking!
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    
    // 🔥 CRITICAL: Normalize roles to prevent security bypass
    // This is the ONLY place in RTH auth where normalization happens
    const normalizedRoles = roles.map(role => role.toLowerCase().trim());
    
    // 📊 SECURITY AUDIT: Log role normalization (dev only)
    const hadMixedCase = roles.some(role => role !== role.toLowerCase());
    if (hadMixedCase && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ SECURITY: Role normalization in RTH auth', JSON.stringify({
        tag: 'RTH_ROLE_NORMALIZATION',
        original: roles,
        normalized: normalizedRoles,
        timestamp: new Date().toISOString(),
      }));
    }
    
    // Validate user has required role (this was missing before!)
    const allowedRoles = ['student', 'user', 'admin', 'super_admin', 'faculty'];
    const hasValidRole = normalizedRoles.some(role => allowedRoles.includes(role));
    
    if (!hasValidRole) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ SECURITY: RTH access denied - invalid role', JSON.stringify({
          tag: 'RTH_ROLE_DENIED',
          roles: normalizedRoles,
          userId: payload.userId?.slice(0, 8),
          timestamp: new Date().toISOString(),
        }));
      }
      throw new AssignmentAuthError('Forbidden - invalid role', 403);
    }
    
    return payload;
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      throw error;
    }
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
