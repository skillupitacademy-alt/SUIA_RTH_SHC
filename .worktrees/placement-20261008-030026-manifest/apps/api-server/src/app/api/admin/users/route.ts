/**
 * Admin Users API - RBAC Example
 * Demonstrates permission-based access control
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
 * GET /api/admin/users - List users (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin permissions
    const user = await authMiddleware.requirePermissions('user.manage')(req);
    
    console.log(`[ADMIN_USERS] Admin ${user.email} accessing user list`);
    
    // TODO: Implement user listing logic
    // const users = await userService.listUsers(user.brand);
    
    return NextResponse.json({
      users: [],
      message: 'User list retrieved successfully',
      requestedBy: {
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
 * POST /api/admin/users - Create user (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin permissions
    const user = await authMiddleware.requirePermissions('user.manage')(req);
    
    const body = await req.json();
    
    console.log(`[ADMIN_USERS] Admin ${user.email} creating user:`, body.email);
    
    // TODO: Implement user creation logic
    // const newUser = await userService.createUser(body, user.brand);
    
    return NextResponse.json({
      message: 'User created successfully',
      createdBy: {
        id: user.id,
        email: user.email,
        role: user.role,
        brand: user.brand
      }
    }, { status: 201 });

  } catch (error) {
    const { status, message } = handleAuthError(error as Error);
    return NextResponse.json({ error: message }, { status });
  }
}