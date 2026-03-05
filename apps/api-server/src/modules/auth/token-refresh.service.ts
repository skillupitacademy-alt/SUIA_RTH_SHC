import { db, exams, refreshTokens, roles, userRoles, users } from '@quiz/db';
import { and, eq } from 'drizzle-orm';
import { decodeJwt } from 'jose';

import { AuditService } from '@/modules/auth/audit.service';
import { TokenService } from '@/modules/auth/token.service';

export class TokenRefreshService {
  static async refresh(token: string, ip?: string, examId?: string, requestedAudience: string = 'user') {
    const decoded = decodeJwt(token) as { isAdmin?: boolean; [key: string]: unknown };
    const isAdmin = decoded.isAdmin === true;

    let payload;
    try {
      payload = await TokenService.verifyRefreshToken(token, { isAdmin, audience: requestedAudience });
    } catch {
      await AuditService.log({ action: 'refresh_failed', metadata: { reason: 'invalid_token' }, ip });
      throw new Error('Invalid refresh _token');
    }

    const tokenHash = await TokenService.hashToken(token);

    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, tokenHash),
        eq(refreshTokens.revoked, false)
      ),
    });

    if (storedToken === undefined) {
      await db.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, payload.userId));
      
      await AuditService.log({ 
        userId: payload.userId, 
        action: 'security_alert_token_reuse', 
        metadata: { ip, severity: 'critical' } 
      });
      throw new Error('Security Alert: Session compromised. All tokens revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh _token expired');
    }

    const usersWithRoles = await db.select({
        id: users.id,
        email: users.email,
        isBlocked: users.isBlocked,
        roleName: roles.name
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.id, payload.userId));

    if (usersWithRoles.length === 0) throw new Error('User not found');
    
    if (usersWithRoles[0].isBlocked === true) {
        throw new Error('access_denied:user_blocked');
    }

    // Update Last Active on Refresh
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, payload.userId));

    const user = usersWithRoles[0];
    const roleNames = usersWithRoles.map(r => r.roleName).filter((name): name is string => name !== null);
    const isAdminNow = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN') || roleNames.includes('INFRASTRUCTURE');

    // Portal Defense: Ensure 'infra' audience is only granted to users with the INFRASTRUCTURE role
    if (requestedAudience === 'infra' && !roleNames.includes('INFRASTRUCTURE')) {
        throw new Error('Access Denied: Infrastructure privileges required for this portal session');
    }

    // EXAM GRACE WINDOW LOGIC (Phase 3 Requirement)
    let customExpiration: number | undefined;
    if (examId !== undefined && examId !== null && examId !== '' && isAdminNow === false) {
        const activeExam = await db.query.exams.findFirst({
            where: and(
                eq(exams.id, examId),
                eq(exams.userId, user.id),
                eq(exams.status, 'started')
            )
        });

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

    const newAccessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin: isAdminNow,
      aud: requestedAudience
    }, customExpiration);
    
    const newRefreshToken = await TokenService.generateRefreshToken(user.id, isAdminNow, requestedAudience);
    const newRefreshTokenHash = await TokenService.hashToken(newRefreshToken);

    await db.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id));

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await AuditService.log({ userId: user.id, action: 'refresh_success', ip });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
