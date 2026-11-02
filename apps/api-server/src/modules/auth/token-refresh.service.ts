import { db } from '@quiz/db';

import type { RequestBrand } from '@/lib/request-brand';
import { AuditService } from '@/modules/auth/audit.service';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import type { DeviceContext } from '@/modules/auth/repositories/token.repository';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export class TokenRefreshService {
  constructor(
    private tokenRepo = container.get(TokenRepository),
    private tokenService = container.get(TokenService),
    private auditService = container.get(AuditService)
  ) {}

  /**
   * 🔄 REFRESH TOKEN ROTATION
   * 
   * Enterprise-grade token refresh with rotation:
   * 1. Validate old refresh token
   * 2. Check for session hijacking (IP mismatch)
   * 3. Generate new access + refresh tokens (CPU-only, no DB)
   * 4. ATOMIC: Revoke old token + store new token in one DB transaction (AUTH-47/48)
   * 5. Audit log the refresh
   */
  async refresh(
    oldRefreshToken: string,
    ip?: string,
    examId?: string,
    requestedAudience: string = 'user',
    brand: RequestBrand = 'realtutorialhub',
    deviceContext?: DeviceContext
  ) {
    // Hash the old token
    const oldTokenHash = await this.tokenService.hashToken(oldRefreshToken);

    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    
    const brandTokenRepo = useBrandBinding && typeof this.tokenRepo.withDb === 'function'
      ? this.tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : this.tokenRepo;

    // 🔐 STEP 1: Validate old token exists and is valid
    const existingSession = await brandTokenRepo.findByHash(oldTokenHash);

    if (!existingSession) {
      await this.auditService.log({
        action: 'token_refresh_failed',
        metadata: { reason: 'token_not_found', brand },
        ip,
        brand,
      });
      throw new Error('Invalid refresh token');
    }

    if (existingSession.revoked) {
      await this.auditService.log({
        userId: existingSession.userId,
        action: 'token_refresh_failed',
        metadata: { reason: 'token_revoked', brand },
        ip,
        brand,
      });
      throw new Error('Refresh token has been revoked');
    }

    if (new Date(existingSession.expiresAt) < new Date()) {
      await this.auditService.log({
        userId: existingSession.userId,
        action: 'token_refresh_failed',
        metadata: { reason: 'token_expired', brand },
        ip,
        brand,
      });
      throw new Error('Refresh token has expired');
    }

    // 🔐 STEP 2: Session Hijack Detection (IP mismatch)
    if (typeof ip === 'string' && ip.length > 0 && typeof existingSession.ipAddress === 'string' && existingSession.ipAddress.length > 0 && existingSession.ipAddress !== ip) {
      console.warn('[SECURITY] IP mismatch during token refresh', {
        userId: existingSession.userId,
        originalIp: existingSession.ipAddress,
        currentIp: ip,
        sessionId: existingSession.id,
      });

      await this.auditService.log({
        userId: existingSession.userId,
        action: 'suspicious_token_refresh',
        metadata: {
          reason: 'ip_mismatch',
          originalIp: existingSession.ipAddress,
          currentIp: ip,
          brand,
        },
        ip,
        brand,
      });

      // Optional: Revoke all sessions for this user (aggressive security)
      // await brandTokenRepo.revokeAll(existingSession.userId);
      // throw new Error('Suspicious activity detected. Please log in again.');
      
      // For now, we'll allow it but log the warning (mobile IPs change frequently)
    }

    // 🔐 STEP 2.5: Update last_used_at before rotation (for "Last active" display)
    await brandTokenRepo.updateLastUsed(oldTokenHash);

    // 🔐 STEP 3: Generate new tokens (CPU-only, no DB)
    // JWT generation happens outside the transaction to minimize DB lock duration.
    const userId = existingSession.userId;
    
    // Verify the old refresh token to get payload
    const oldPayload = await this.tokenService.verifyRefreshToken(oldRefreshToken, {
      audience: requestedAudience,
    });

    const isAdmin = oldPayload.isAdmin === true;
    const tokenType = oldPayload.tokenType ?? (isAdmin ? 'admin' : 'user');
    const shadowUserId = oldPayload.shadowUserId ?? userId;
    const originalUserId = oldPayload.originalUserId ?? userId;

    // 🔐 SECURITY FIX (API-40): Populate email and roles from the old token payload
    // instead of using empty values. The old refresh token was verified above,
    // so its claims are trustworthy for the new access token.
    const email: string = typeof oldPayload.email === 'string' ? oldPayload.email : '';
    const roles: string[] = Array.isArray(oldPayload.roles)
      ? oldPayload.roles.filter((r): r is string => typeof r === 'string')
      : [];

    // Generate new access token
    const newAccessToken = await this.tokenService.generateAccessToken({
      userId,
      originalUserId,
      shadowUserId,
      email,
      roles,
      isAdmin,
      tokenType,
      brand,
      aud: requestedAudience,
    });

    // Generate new refresh token
    const newRefreshToken = await this.tokenService.generateRefreshToken(
      userId,
      isAdmin,
      requestedAudience,
      {
        tokenType,
        brand,
        originalUserId,
        shadowUserId,
      }
    );

    const newRefreshTokenHash = await this.tokenService.hashToken(newRefreshToken);

    // 🔐 STEP 4: ATOMIC TOKEN ROTATION (AUTH-47/48)
    // Revoke old token + store new token in a single DB transaction.
    // If the server crashes between these operations, both roll back —
    // preventing orphaned sessions (old revoked, new never created).
    const mergedDeviceContext = deviceContext ?? {
      deviceId: existingSession.deviceId ?? undefined,
      ipAddress: ip,
      userAgent: existingSession.userAgent ?? undefined,
      deviceName: existingSession.deviceName ?? undefined,
    };

    const targetDb = useBrandBinding ? brandContext.db : db;
    await targetDb.transaction(async (tx) => {
      const txTokenRepo = typeof brandTokenRepo.withDb === 'function'
        ? brandTokenRepo.withDb(tx, { refreshTokens: brandContext.tables.refreshTokens })
        : brandTokenRepo;
      const consumedParent = await txTokenRepo.consumeToken(oldTokenHash, userId);
      if (!consumedParent) {
        throw new Error('Refresh token has been revoked or already consumed');
      }
      await txTokenRepo.createRefreshToken({
        userId,
        token: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        deviceContext: {
          deviceId: mergedDeviceContext.deviceId,
          ipAddress: mergedDeviceContext.ipAddress,
          userAgent: mergedDeviceContext.userAgent,
          deviceName: mergedDeviceContext.deviceName,
        },
      });
    });

    // 🔐 STEP 5: Audit log
    await this.auditService.log({
      userId,
      action: 'token_refresh_success',
      metadata: {
        brand,
        deviceId: deviceContext?.deviceId ?? existingSession.deviceId,
        ipChanged: existingSession.ipAddress !== ip,
      },
      ip,
      brand,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userId,
      isAdmin,
    };
  }
}
