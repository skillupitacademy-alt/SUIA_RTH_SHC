import type { NextRequest } from 'next/server';
import { validateRequest } from '@/middleware/internal-auth.middleware';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import type { RequestBrand } from '@/lib/request-brand';

/**
 * 🔐 UNIFIED AUTH CONTEXT
 * 
 * Single source of truth for authentication across all API routes.
 * Combines internal service auth, gateway auth, and JWT fallback.
 * 
 * Returns null if authentication fails.
 */

export interface AuthContext {
  userId: string;
  brand: RequestBrand;
  correlationId: string;
  source: 'internal' | 'gateway' | 'jwt';
  email?: string;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  // Try internal/gateway authentication first (fastest)
  const authResult = validateRequest(req);
  
  if (authResult.context) {
    return {
      userId: authResult.context.userId,
      brand: authResult.context.brand as RequestBrand,
      correlationId: authResult.context.correlationId,
      source: authResult.context.authMode,
      email: authResult.context.userEmail,
    };
  }

  // Fallback to JWT authentication
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    
    if (typeof token !== 'string' || token.trim().length === 0) {
      console.log(`[AUTH][${correlationId}] No token found`);
      return null;
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    
    if (!payload || typeof payload.userId !== 'string' || payload.userId.length === 0) {
      console.log(`[AUTH][${correlationId}] Invalid token payload`);
      return null;
    }

    return {
      userId: payload.userId,
      brand: (payload.brand as RequestBrand) || 'realtutorialhub',
      correlationId,
      source: 'jwt',
      email: payload.email,
    };
  } catch (error) {
    console.error(`[AUTH][${correlationId}] JWT validation failed:`, error);
    return null;
  }
}
