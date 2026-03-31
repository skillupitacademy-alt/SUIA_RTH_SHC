import { AuditService } from '@/modules/auth/audit.service';
import { PasswordService } from '@/modules/auth/password.service';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { SecurityService } from '@/modules/auth/security.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import type { RequestBrand } from '@/lib/request-brand';

export class LoginService {
  constructor(
    private userRepo = container.get(UserRepository),
    private tokenRepo = container.get(TokenRepository),
    private auditService = container.get(AuditService),
    private passwordService = container.get(PasswordService),
    private securityService = container.get(SecurityService),
    private tokenService = container.get(TokenService)
  ) {}

  async login(email: string, password: string, ip: string = 'unknown', brand: RequestBrand = 'realtutorialhub') {
    if (await this.securityService.isAccountLocked(email, ip, brand)) {
      await this.auditService.log({ action: 'login_locked', metadata: { email }, ip });
      throw new Error('Account temporarily locked. Try again later.');
    }

    const user = await this.userRepo.findWithDetails(email);

    if (user === undefined || (await this.passwordService.compare(password, user.passwordHash)) === false) {
      await this.securityService.trackLoginAttempt(ip, email, false, brand);
      await this.auditService.log({ action: 'login_failed', metadata: { email }, ip });
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked === true) {
        await this.auditService.log({ action: 'login_blocked_user', metadata: { email }, ip });
        throw new Error('Account has been blocked. Contact administrator.');
    }

    // Update Last Active
    await this.userRepo.updateLastActive(user.id);

    await this.securityService.trackLoginAttempt(ip, email, true, brand);
    await this.auditService.log({ userId: user.id, action: 'login_success', ip });

    const roleNames = user.userRoles.map(ur => ur.role.name);
    const isAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN') || roleNames.includes('INFRASTRUCTURE');

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: roleNames,
      isAdmin,
      tokenType: isAdmin ? 'admin' : 'user',
      brand,
    });

    const refreshToken = await this.tokenService.generateRefreshToken(user.id, isAdmin, isAdmin ? 'admin' : 'user', {
      tokenType: isAdmin ? 'admin' : 'user',
      brand,
    });
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);

    await this.tokenRepo.createRefreshToken({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { _user: user, accessToken, refreshToken, isAdmin };
  }

  async logout(token: string, userId?: string, ip?: string) {
    const tokenHash = await this.tokenService.hashToken(token);
    
    await this.tokenRepo.revokeToken(tokenHash);

    // Force Offline status by setting lastActiveAt to null or old date
    if (userId !== undefined) {
        // Set to 1 hour ago to ensure they appear offline immediately
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); 
        await this.userRepo.updateLastActive(userId, oneHourAgo);
    }

    await this.auditService.log({ userId, action: 'logout_success', ip });
  }

  async heartbeat(userId: string) {
    await this.userRepo.updateLastActive(userId);
    return true;
  }

  async touchUserSession(userId: string) {
      await this.tokenRepo.touchSession(userId);
  }
}
