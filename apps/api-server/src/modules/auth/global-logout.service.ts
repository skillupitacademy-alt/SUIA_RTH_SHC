import type { RequestBrand } from '@/lib/request-brand';
import { AuditService } from '@/modules/auth/audit.service';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { container } from '@/modules/core/container';

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
    await brandTokenRepo.revokeAll(userId);

    // 🔥 Force user offline
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await brandUserRepo.updateLastActive(userId, oneHourAgo);

    // 🔥 Audit log
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
  async getActiveSessions(userId: string, brand: RequestBrand = 'realtutorialhub') {
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    const sessions = await brandTokenRepo.getUserSessions(userId);

    return sessions.map(session => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastUsedAt: session.lastUsedAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * 🔐 REVOKE SPECIFIC SESSION
   * 
   * Revokes a specific session by ID (for "Logout this device" functionality)
   */
  async revokeSession(userId: string, sessionId: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    // Revoke the specific session
    await brandTokenRepo.revokeById(sessionId);

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
