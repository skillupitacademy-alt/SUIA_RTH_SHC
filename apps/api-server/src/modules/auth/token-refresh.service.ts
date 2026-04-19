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
   * 3. Revoke old token
   * 4. Issue new access + refresh tokens
   * 5. Store new refresh token with device context
   * 6. Audit log the refresh
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

    // 🔐 STEP 3: Revoke old refresh token (rotation)
    await brandTokenRepo.revokeToken(oldTokenHash);

    // 🔐 STEP 4: Generate new tokens
    const userId = existingSession.userId;
    
    // Verify the old refresh token to get payload
    const oldPayload = await this.tokenService.verifyRefreshToken(oldRefreshToken, {
      audience: requestedAudience,
    });

    const isAdmin = oldPayload.isAdmin === true;
    const tokenType = oldPayload.tokenType ?? (isAdmin ? 'admin' : 'user');
    const shadowUserId = oldPayload.shadowUserId ?? userId;
    const originalUserId = oldPayload.originalUserId ?? userId;

    // Generate new access token
    const newAccessToken = await this.tokenService.generateAccessToken({
      userId,
      originalUserId,
      shadowUserId,
      email: '', // Will be populated from user record if needed
      roles: [], // Will be populated from user record if needed
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

    // 🔐 STEP 5: Store new refresh token with device context
    const mergedDeviceContext = deviceContext ?? {
      deviceId: existingSession.deviceId ?? undefined,
      ipAddress: ip,
      userAgent: existingSession.userAgent ?? undefined,
      deviceName: existingSession.deviceName ?? undefined,
    };

    await brandTokenRepo.createRefreshToken({
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

    // 🔐 STEP 6: Audit log
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
