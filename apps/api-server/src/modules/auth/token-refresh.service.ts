import { decodeJwt } from 'jose';

import { AuditService } from '@/modules/auth/audit.service';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository';

export class TokenRefreshService {
  constructor(
    private tokenRepo = container.get(TokenRepository),
    private userRepo = container.get(UserRepository),
    private examRepo = container.get(ExamRepository),
    private tokenService = container.get(TokenService),
    private auditService = container.get(AuditService)
  ) {}

  async refresh(token: string, ip?: string, examId?: string, requestedAudience: string = 'user') {
    const decoded = decodeJwt(token) as { isAdmin?: boolean; [key: string]: unknown };
    const isAdmin = decoded.isAdmin === true;

    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(token, { isAdmin, audience: requestedAudience });
    } catch {
      await this.auditService.log({ action: 'refresh_failed', metadata: { reason: 'invalid_token' }, ip });
      throw new Error('Invalid refresh _token');
    }

    const tokenHash = await this.tokenService.hashToken(token);

    const storedToken = await this.tokenRepo.findByHash(tokenHash);

    if (storedToken === undefined) {
      await this.tokenRepo.revokeAll(payload.userId);
      
      await this.auditService.log({ 
        userId: payload.userId, 
        action: 'security_alert_token_reuse', 
        metadata: { ip, severity: 'critical' } 
      });
      throw new Error('Security Alert: Session compromised. All tokens revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh _token expired');
    }

    const userWithDetails = await this.userRepo.findByIdWithDetails(payload.userId);

    if (userWithDetails === undefined) throw new Error('User not found');
    
    if (userWithDetails.isBlocked === true) {
        throw new Error('access_denied:user_blocked');
    }

    // Update Last Active on Refresh
    await this.userRepo.updateLastActive(userWithDetails.id);

    const user = userWithDetails;
    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdminNow = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN') || roleNames.includes('INFRASTRUCTURE');

    // Portal Defense: Ensure 'infra' audience is only granted to users with the INFRASTRUCTURE role
    if (requestedAudience === 'infra' && !roleNames.includes('INFRASTRUCTURE')) {
        throw new Error('Access Denied: Infrastructure privileges required for this portal session');
    }

    // EXAM GRACE WINDOW LOGIC (Phase 3 Requirement)
    let customExpiration: number | undefined;
    if (examId !== undefined && examId !== null && examId !== '' && isAdminNow === false) {
        const activeExam = await this.examRepo.findActiveExam(examId, user.id);

        if (activeExam !== undefined && activeExam.durationSeconds !== null && activeExam.durationSeconds > 0) {
            const now = Date.now();
            const startedAt = activeExam.startedAt.getTime();
            const totalDurationWithGrace = (activeExam.durationSeconds + 300) * 1000; // Duration + 5 mins
            const remainingTimeMs = (startedAt + totalDurationWithGrace) - now;

            if (remainingTimeMs > 0) {
                // Return expiresIn in seconds (jose format)
                customExpiration = Math.ceil(remainingTimeMs / 1000);
            }
        }
    }

    const newAccessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin: isAdminNow,
      aud: requestedAudience
    }, customExpiration);
    
    const newRefreshToken = await this.tokenService.generateRefreshToken(user.id, isAdminNow, requestedAudience);
    const newRefreshTokenHash = await this.tokenService.hashToken(newRefreshToken);

    await this.tokenRepo.revokeById(storedToken.id);

    await this.tokenRepo.createRefreshToken({
      userId: user.id,
      token: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.auditService.log({ userId: user.id, action: 'refresh_success', ip });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
