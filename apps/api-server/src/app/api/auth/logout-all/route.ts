/**
 * Logout All Devices API
 * Revokes all sessions for the user
 */

import { TokenService } from '@quiz/auth';
import { FeatureFlagService } from '@quiz/auth/feature-flags.service';
import { AuthMiddleware, handleAuthError } from '@quiz/auth/middleware/auth.middleware';
import { SessionService } from '@quiz/auth/session.service';
import { NextRequest, NextResponse } from 'next/server';

import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

// Initialize auth middleware
const authMiddleware = new AuthMiddleware(
  container.get(TokenService),
  container.get(SessionService),
  container.get(FeatureFlagService)
);

/**
 * POST /api/auth/logout-all - Logout from all devices
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authMiddleware.requireValidSession()(req);
    const sessionService = container.get(SessionService);
    
    // Get session count before revoking
    const sessions = await sessionService.getUserSessions(user.id);
    const sessionCount = sessions.length;
    
    // Revoke all sessions for user
    await sessionService.revokeAllSessions(user.id);
    
    console.log(`[LOGOUT_ALL] User ${user.email} logged out from ${sessionCount} devices`);
    
    return NextResponse.json({
      message: 'Logged out from all devices successfully',
      revokedSessions: sessionCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}