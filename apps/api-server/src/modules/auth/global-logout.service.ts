import type { RequestBrand } from '@/lib/request-brand';
import { AuditService } from '@/modules/auth/audit.service';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { container } from '@/modules/core/container';

export class RevocationStageError extends Error {
  constructor(message = 'Session revocation outcome unknown; retry with valid credentials') {
    super(message);
    this.name = 'RevocationStageError';
  }
}

export class PresenceStageError extends Error {
  constructor(message = 'Sessions revoked; presence update could not be confirmed') {
    super(message);
    this.name = 'PresenceStageError';
  }
}

export class GlobalLogoutService {
  constructor(
    private tokenRepo = container.get(TokenRepository),
    private userRepo = container.get(UserRepository),
    private auditService = container.get(AuditService)
  ) {}

  /**
   * 🔐 GLOBAL LOGOUT (ALL DEVICES)
   * 
   * Revokes ALL refresh tokens for a user across all devices.
   * Use cases:
   * - User clicks "Logout from all devices"
   * - Security breach detected
   * - Password change
   * - Account compromise
   */
  async logoutAllDevices(userId: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;
    
    const brandUserRepo = useBrandBinding && typeof this.userRepo.withDb === 'function'
      ? this.userRepo.withDb(brandContext.db, brandContext.tables)
      : this.userRepo;

    // 🔥 Revoke ALL refresh tokens for this user
    try {
      await brandTokenRepo.revokeAll(userId);
    } catch (_err) {
      throw new RevocationStageError();
    }

    // 🔥 Force user offline
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await brandUserRepo.updateLastActive(userId, oneHourAgo);
    } catch (_err) {
      throw new PresenceStageError();
    }

    // 🔥 Audit log (absorbed internally by AuditService)
    await this.auditService.log({
      userId,
      action: 'global_logout',
      metadata: { brand, reason: 'user_initiated' },
      ip,
      brand,
    });

    return { success: true, message: 'Logged out from all devices' };
  }

  /**
   * 🔐 GET ACTIVE SESSIONS
   * 
   * Returns all active sessions for a user (for session management UI)
   */
  async getActiveSessions(userId: string, brand: RequestBrand = 'realtutorialhub', currentDeviceId?: string) {
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    const sessions = await brandTokenRepo.getUserSessions(userId);

    // 🔥 CRITICAL: Mark current session
    // If no currentDeviceId provided, mark the most recently used session as current
    let markedCurrent = false;

    return sessions.map((session, index) => {
      const isCurrent = typeof currentDeviceId === 'string' && currentDeviceId.length > 0
        ? session.deviceId === currentDeviceId
        : !markedCurrent && index === 0; // First session (most recent) is current if no deviceId

      if (isCurrent) {
        markedCurrent = true;
      }

      return {
        id: session.id,
        deviceId: session.deviceId ?? 'unknown',
        deviceName: session.deviceName ?? 'Unknown Device',
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastUsedAt: session.lastUsedAt,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent,
      };
    });
  }

  /**
   * 🔐 REVOKE SPECIFIC SESSION (W1.2-SESS-01: Owner-scoped)
   * 
   * Revokes a specific session by ID (for "Logout this device" functionality).
   * Enforces ownership: only the verified userId can revoke their own sessions.
   */
  async revokeSession(userId: string, sessionId: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    // 🔐 W1.2-SESS-01: Pass verified brand-local userId to enforce ownership
    const revoked = await brandTokenRepo.revokeById(sessionId, userId);
    if (!revoked) return null;

    // Audit log
    await this.auditService.log({
      userId,
      action: 'session_revoked',
      metadata: { brand, sessionId },
      ip,
      brand,
    });

    return { success: true, message: 'Session revoked' };
  }
}
