import { LoginService } from '@/modules/auth/login.service';
import { PasswordRecoveryService } from '@/modules/auth/password-recovery.service';
import { SignupService } from '@/modules/auth/signup.service';
import { TokenRefreshService } from '@/modules/auth/token-refresh.service';

export class AuthService {
  static async signup(email: string, password: string, name: string, ip?: string) {
    return SignupService.signup(email, password, name, ip);
  }

  static async login(email: string, password: string, ip: string = '0.0.0.0') {
    return LoginService.login(email, password, ip);
  }

  static async refresh(token: string, ip?: string, examId?: string, requestedAudience: string = 'user') {
    return TokenRefreshService.refresh(token, ip, examId, requestedAudience);
  }

  static async logout(token: string, userId?: string, ip?: string) {
    return LoginService.logout(token, userId, ip);
  }

  static async heartbeat(userId: string) {
    return LoginService.heartbeat(userId);
  }

  static async touchUserSession(userId: string) {
    return LoginService.touchUserSession(userId);
  }

  static async verifyEmail(token: string, ip?: string) {
    return SignupService.verifyEmail(token, ip);
  }

  static async resendVerification(userId: string, ip?: string) {
    return SignupService.resendVerification(userId, ip);
  }

  static async forgotPassword(email: string, ip?: string) {
    return PasswordRecoveryService.forgotPassword(email, ip);
  }

  static async validateResetToken(token: string) {
    return PasswordRecoveryService.validateResetToken(token);
  }

  static async resetPassword(token: string, newPassword: string, ip?: string) {
    return PasswordRecoveryService.resetPassword(token, newPassword, ip);
  }
}
