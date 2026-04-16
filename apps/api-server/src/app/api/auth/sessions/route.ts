/**
 * Session Management API
 * Demonstrates session tracking and device management
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
 * GET /api/auth/sessions - List user sessions
 */
export async function GET(req: NextRequest) {
  try {
    // Require valid session
    const user = await authMiddleware.requireValidSession()(req);
    const sessionService = container.get(SessionService);
    
    // Get current session ID from request
    const currentSessionId = (req as { sessionId?: string }).sessionId;
    
    // Get all user sessions
    const sessions = await sessionService.getUserSessions(user.id, currentSessionId);
    
    console.log(`[SESSIONS] User ${user.email} viewing ${sessions.length} sessions`);
    
    return NextResponse.json({
      sessions,
      currentSessionId,
      totalSessions: sessions.length
    });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/auth/sessions/[sessionId] - Revoke specific session
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await authMiddleware.requireValidSession()(req);
    const sessionService = container.get(SessionService);
    
    // Get session ID from URL
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').pop();
    
    if (sessionId === undefined || sessionId === null || sessionId === '') {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    // Verify session belongs to user
    const session = await sessionService.getSession(sessionId);
    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Revoke session
    await sessionService.revokeSession(sessionId);
    
    console.log(`[SESSIONS] User ${user.email} revoked session ${sessionId}`);
    
    return NextResponse.json({
      message: 'Session revoked successfully',
      sessionId
    });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}