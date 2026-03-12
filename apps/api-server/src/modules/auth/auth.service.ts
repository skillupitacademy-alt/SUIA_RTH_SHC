import type { LoginService } from '@/modules/auth/login.service';
import type { PasswordRecoveryService } from '@/modules/auth/password-recovery.service';
import type { SignupService } from '@/modules/auth/signup.service';
import type { TokenRefreshService } from '@/modules/auth/token-refresh.service';

export class AuthService {
  constructor(
    private signupService?: SignupService,
    private loginService?: LoginService,
    private tokenRefreshService?: TokenRefreshService,
    private passwordRecoveryService?: PasswordRecoveryService
  ) {}

  private async getSignupService() {
    if (this.signupService !== undefined) return this.signupService;
    const { SignupService } = await import('@/modules/auth/signup.service');
    this.signupService = new SignupService();
    return this.signupService;
  }

  private async getLoginService() {
    if (this.loginService !== undefined) return this.loginService;
    const { LoginService } = await import('@/modules/auth/login.service');
    this.loginService = new LoginService();
    return this.loginService;
  }

  private async getTokenRefreshService() {
    if (this.tokenRefreshService !== undefined) return this.tokenRefreshService;
    const { TokenRefreshService } = await import('@/modules/auth/token-refresh.service');
    this.tokenRefreshService = new TokenRefreshService();
    return this.tokenRefreshService;
  }

  private async getPasswordRecoveryService() {
    if (this.passwordRecoveryService !== undefined) return this.passwordRecoveryService;
    const { PasswordRecoveryService } = await import('@/modules/auth/password-recovery.service');
    this.passwordRecoveryService = new PasswordRecoveryService();
    return this.passwordRecoveryService;
  }

  async signup(email: string, password: string, name: string, ip?: string) {
    const service = await this.getSignupService();
    return service.signup(email, password, name, ip);
  }

  async login(email: string, password: string, ip: string = '0.0.0.0') {
    const service = await this.getLoginService();
    return service.login(email, password, ip);
  }

  async refresh(token: string, ip?: string, examId?: string, requestedAudience: string = 'user') {
    const service = await this.getTokenRefreshService();
    return service.refresh(token, ip, examId, requestedAudience);
  }

  async logout(token: string, userId?: string, ip?: string) {
    const service = await this.getLoginService();
    return service.logout(token, userId, ip);
  }

  async heartbeat(userId: string) {
    const service = await this.getLoginService();
    return service.heartbeat(userId);
  }

  async touchUserSession(userId: string) {
    const service = await this.getLoginService();
    return service.touchUserSession(userId);
  }

  async verifyEmail(token: string, ip?: string) {
    const service = await this.getSignupService();
    return service.verifyEmail(token, ip);
  }

  async resendVerification(userId: string, ip?: string) {
    const service = await this.getSignupService();
    return service.resendVerification(userId, ip);
  }

  async forgotPassword(email: string, ip?: string) {
    const service = await this.getPasswordRecoveryService();
    return service.forgotPassword(email, ip);
  }

  async validateResetToken(token: string) {
    const service = await this.getPasswordRecoveryService();
    return service.validateResetToken(token);
  }

  async resetPassword(token: string, newPassword: string, ip?: string) {
    const service = await this.getPasswordRecoveryService();
    return service.resetPassword(token, newPassword, ip);
  }
}
