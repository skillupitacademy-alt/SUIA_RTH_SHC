import type { EmailOptions,IEmailProvider } from '../types';

export class MockEmailProvider implements IEmailProvider {
  async sendEmail(_options: EmailOptions): Promise<void> {
    // console.log(`[MockEmail] Sending email to ${_options.to}`);
    return Promise.resolve();
  }

  async sendPasswordReset(_email: string, _resetUrl: string): Promise<void> {
    // console.log(`[MockEmail] Password reset for ${_email}: ${_resetUrl}`);
  }
}
