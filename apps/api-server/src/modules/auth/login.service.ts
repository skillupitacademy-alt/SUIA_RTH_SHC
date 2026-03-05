import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { SecurityService } from '@/modules/auth/security.service';
import { TokenService } from '@/modules/auth/token.service';

const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();

export class LoginService {
  static async login(email: string, password: string, ip: string = '0.0.0.0') {
    if (await SecurityService.isAccountLocked(email, ip)) {
      await AuditService.log({ action: 'login_locked', metadata: { email }, ip });
      throw new Error('Account temporarily locked. Try again later.');
    }

    const user = await userRepo.findWithDetails(email);

    if (user === undefined || (await PasswordService.compare(password, user.passwordHash)) === false) {
      await SecurityService.trackLoginAttempt(ip, email, false);
      await AuditService.log({ action: 'login_failed', metadata: { email }, ip });
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked === true) {
        await AuditService.log({ action: 'login_blocked_user', metadata: { email }, ip });
        throw new Error('Account has been blocked. Contact administrator.');
    }

    // Update Last Active
    await userRepo.updateLastActive(user.id);

    await SecurityService.trackLoginAttempt(ip, email, true);
    await AuditService.log({ userId: user.id, action: 'login_success', ip });

    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN') || roleNames.includes('INFRASTRUCTURE');

    const accessToken = await TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin,
    });

    const refreshToken = await TokenService.generateRefreshToken(user.id, isAdmin);
    const refreshTokenHash = await TokenService.hashToken(refreshToken);

    await tokenRepo.createRefreshToken({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { _user: user, accessToken, refreshToken, isAdmin };
  }

  static async logout(token: string, userId?: string, ip?: string) {
    const tokenHash = await TokenService.hashToken(token);
    
    await tokenRepo.revokeToken(tokenHash);

    // Force Offline status by setting lastActiveAt to null or old date
    if (userId !== undefined) {
        // Set to 1 hour ago to ensure they appear offline immediately
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
        await userRepo.updateLastActive(userId, oneHourAgo);
    }

    await AuditService.log({ userId, action: 'logout_success', ip });
  }

  static async heartbeat(userId: string) {
    await userRepo.updateLastActive(userId);
    return true;
  }

  static async touchUserSession(userId: string) {
      await tokenRepo.touchSession(userId);
  }
}
