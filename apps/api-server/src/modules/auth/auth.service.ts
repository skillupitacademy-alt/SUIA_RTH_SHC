import { LoginService } from '@/modules/auth/login.service';
import { PasswordRecoveryService } from '@/modules/auth/password-recovery.service';
import { SignupService } from '@/modules/auth/signup.service';
import { TokenRefreshService } from '@/modules/auth/token-refresh.service';
import { container } from '@/modules/core/container';

export class AuthService {
  constructor(
    private signupService = container.get(SignupService),
    private loginService = container.get(LoginService),
    private tokenRefreshService = container.get(TokenRefreshService),
    private passwordRecoveryService = container.get(PasswordRecoveryService)
  ) {}

  async signup(email: string, password: string, name: string, ip?: string) {
    return this.signupService.signup(email, password, name, ip);
  }

  async login(email: string, password: string, ip: string = '0.0.0.0') {
    return this.loginService.login(email, password, ip);
  }

  async refresh(token: string, ip?: string, examId?: string, requestedAudience: string = 'user') {
    return this.tokenRefreshService.refresh(token, ip, examId, requestedAudience);
  }

  async logout(token: string, userId?: string, ip?: string) {
    return this.loginService.logout(token, userId, ip);
  }

  async heartbeat(userId: string) {
    return this.loginService.heartbeat(userId);
  }

  async touchUserSession(userId: string) {
    return this.loginService.touchUserSession(userId);
  }

  async verifyEmail(token: string, ip?: string) {
    return this.signupService.verifyEmail(token, ip);
  }

  async resendVerification(userId: string, ip?: string) {
    return this.signupService.resendVerification(userId, ip);
  }

  async forgotPassword(email: string, ip?: string) {
    return this.passwordRecoveryService.forgotPassword(email, ip);
  }

  async validateResetToken(token: string) {
    return this.passwordRecoveryService.validateResetToken(token);
  }

  async resetPassword(token: string, newPassword: string, ip?: string) {
    return this.passwordRecoveryService.resetPassword(token, newPassword, ip);
  }
}
