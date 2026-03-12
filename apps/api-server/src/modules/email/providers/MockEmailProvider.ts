import { container } from '@/modules/core/container';
import { LoggerService } from '@/modules/core/logger.service';
import type { EmailOptions, IEmailProvider } from '@/modules/email/types';

export class MockEmailProvider implements IEmailProvider {
  async sendEmail(_options: EmailOptions): Promise<void> {
    container.get(LoggerService).debug(`[MockEmail] Sending email to ${_options.to}`);
    return Promise.resolve();
  }

  async sendPasswordResetEmail(_email: string, _resetUrl: string): Promise<void> {
    container.get(LoggerService).debug(`[MockEmail] Password reset for ${_email}: ${_resetUrl}`);
  }

  async sendPasswordReset(_email: string, _resetUrl: string): Promise<void> {
    return this.sendPasswordResetEmail(_email, _resetUrl);
  }
}
