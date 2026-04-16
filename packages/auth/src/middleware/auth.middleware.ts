/**
 * Enhanced Authentication Middleware
 * Integrates RBAC, Feature Flags, and Session Tracking
 */

import type { NextRequest } from 'next/server';
import { TokenService } from '../token.service';
import { RBACService, type RBACUser } from '../rbac.service';
import { FeatureFlagService } from '../feature-flags.service';
import { SessionService } from '../session.service';
import { 
  UnauthorizedError, 
  ForbiddenError, 
  SessionExpiredError, 
  SessionRevokedError,
  FeatureNotAvailableError 
} from '../rbac.types';
import type { Permission, Role } from '../rbac.types';
import type { FeatureKey, Brand } from '../feature-flags.types';

export interface AuthenticatedRequest extends NextRequest {
  user: RBACUser;
  sessionId?: string;
}

export interface AuthMiddlewareOptions {
  permissions?: Permission[];
  features?: FeatureKey[];
  requireSession?: boolean;
  allowAnonymous?: boolean;
}

export class AuthMiddleware {
  constructor(
    private tokenService: TokenService,
    private sessionService: SessionService,
    private featureFlagService: FeatureFlagService
  ) {}

  /**
   * Main authentication middleware
   */
  async authenticate(
    req: NextRequest, 
    options: AuthMiddlewareOptions = {}
  ): Promise<RBACUser | null> {
    try {
      // Extract JWT from cookies
      const accessToken = this.tokenService.getAccessToken(req);
      
      if (!accessToken) {
        if (options.allowAnonymous) {
          return null;
        }
        throw new UnauthorizedError('No access token provided');
      }

      // Verify JWT and extract payload
      const payload = await this.tokenService.verifyAccessToken(accessToken);
      
      // Create user object from JWT payload
      const user: RBACUser = {
        id: payload.userId,
        email: payload.email || '',
        role: (payload.role || 'student') as Role,
        brand: (payload.brand || 'realtutorialhub') as Brand
      };

      // Validate session if required
      if (options.requireSession) {
        // TODO: Implement refresh token extraction from cookies
        // const refreshToken = this.tokenService.getRefreshToken(req);
        // if (refreshToken) {
        //   const session = await this.sessionService.validateSession(refreshToken);
        //   (req as any).sessionId = session.id;
        // }
      }

      // Check permissions
      if (options.permissions?.length) {
        for (const permission of options.permissions) {
          RBACService.requirePermission(user, permission);
        }
      }

      // Check feature flags
      if (options.features?.length) {
        for (const feature of options.features) {
          await this.featureFlagService.requireFeature(user.brand as Brand, feature);
        }
      }

      return user;

    } catch (error) {
      if (options.allowAnonymous && error instanceof UnauthorizedError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Middleware factory for specific permissions
   */
  requirePermissions(...permissions: Permission[]) {
    return async (req: NextRequest): Promise<RBACUser> => {
      const user = await this.authenticate(req, { permissions });
      if (!user) {
        throw new UnauthorizedError();
      }
      return user;
    };
  }

  /**
   * Middleware factory for specific features
   */
  requireFeatures(...features: FeatureKey[]) {
    return async (req: NextRequest): Promise<RBACUser> => {
      const user = await this.authenticate(req, { features });
      if (!user) {
        throw new UnauthorizedError();
      }
      return user;
    };
  }

  /**
   * Middleware factory for admin access
   */
  requireAdmin() {
    return async (req: NextRequest): Promise<RBACUser> => {
      const user = await this.authenticate(req, { 
        permissions: ['manage:users'] 
      });
      if (!user) {
        throw new UnauthorizedError();
      }
      return user;
    };
  }

  /**
   * Middleware factory for session validation
   */
  requireValidSession() {
    return async (req: NextRequest): Promise<RBACUser> => {
      const user = await this.authenticate(req, { 
        requireSession: true 
      });
      if (!user) {
        throw new UnauthorizedError();
      }
      return user;
    };
  }

  /**
   * Optional authentication (allows anonymous)
   */
  optionalAuth() {
    return async (req: NextRequest): Promise<RBACUser | null> => {
      return this.authenticate(req, { allowAnonymous: true });
    };
  }
}

/**
 * Error handler for authentication middleware
 */
export function handleAuthError(error: Error) {
  if (error instanceof UnauthorizedError) {
    return { status: 401, message: error.message };
  }
  
  if (error instanceof ForbiddenError) {
    return { status: 403, message: error.message };
  }
  
  if (error instanceof SessionExpiredError || error instanceof SessionRevokedError) {
    return { status: 401, message: 'Session invalid, please login again' };
  }
  
  if (error instanceof FeatureNotAvailableError) {
    return { status: 403, message: error.message };
  }
  
  // Generic server error
  console.error('Auth middleware error:', error);
  return { status: 500, message: 'Internal server error' };
}