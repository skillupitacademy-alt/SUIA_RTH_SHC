/**
 * AI Labs API - Feature Flag Example
 * Demonstrates feature-based access control
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
 * GET /api/features/ai-labs - Access AI Labs (Feature flag required)
 */
export async function GET(req: NextRequest) {
  try {
    // Require AI_LABS feature and read permissions
    const user = await authMiddleware.authenticate(req, {
      permissions: ['read:course'],
      features: ['AI_LABS']
    });

    if (user === null || user === undefined) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log(`[AI_LABS] User ${user.email} accessing AI Labs for ${user.brand}`);
    
    // TODO: Implement AI Labs logic
    const aiLabsData = {
      available: true,
      labs: [
        { id: '1', name: 'Python Fundamentals AI Tutor', type: 'interactive' },
        { id: '2', name: 'JavaScript Code Review AI', type: 'analysis' },
        { id: '3', name: 'Algorithm Optimization AI', type: 'optimization' }
      ],
      userProgress: {
        completedLabs: 0,
        totalLabs: 3,
        lastAccessed: null
      }
    };
    
    return NextResponse.json({
      data: aiLabsData,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        brand: user.brand
      }
    });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/features/ai-labs/start - Start AI Lab session
 */
export async function POST(req: NextRequest) {
  try {
    // Require AI_LABS feature and course permissions
    const user = await authMiddleware.authenticate(req, {
      permissions: ['read:course', 'attempt:exam'],
      features: ['AI_LABS']
    });

    if (user === null || user === undefined) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await req.json();
    const { labId } = body;
    
    console.log(`[AI_LABS] User ${user.email} starting lab ${labId}`);
    
    // TODO: Implement AI Lab session creation
    const session = {
      id: `session_${Date.now()}`,
      labId,
      userId: user.id,
      startedAt: new Date().toISOString(),
      status: 'active'
    };
    
    return NextResponse.json({
      session,
      message: 'AI Lab session started successfully'
    }, { status: 201 });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}