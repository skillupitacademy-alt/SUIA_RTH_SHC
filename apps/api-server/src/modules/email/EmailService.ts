import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import type { EmailOptions,IEmailProvider } from './types';

/**
 * EmailService now selects a provider (Mock or Resend) based on env, keeping tests hermetic.
 */
export class EmailService {
  private static instance: IEmailProvider | null = null;

  private static resolveProvider(): IEmailProvider {
    const provider = (process.env.EMAIL_PROVIDER ?? '').toLowerCase();
    if (provider === 'resend' && (process.env.RESEND_API_KEY !== undefined && process.env.RESEND_API_KEY !== '')) {
      const from = process.env.EMAIL_FROM ?? 'Quiz <noreply@example.com>';
      return new ResendEmailProvider(process.env.RESEND_API_KEY, from);
    }
    return new MockEmailProvider();
  }

  public static getInstance(): IEmailProvider {
    if (!EmailService.instance) {
      EmailService.instance = EmailService.resolveProvider();
    }
    return EmailService.instance;
  }

  static setInstance(mock: IEmailProvider | null) {
    EmailService.instance = mock;
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    return this.getInstance().sendEmail(options);
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const instance = this.getInstance() as IEmailProvider & {
      sendPasswordReset?: (email: string, resetUrl: string) => Promise<void>;
    };
    if (typeof instance.sendPasswordReset === 'function') {
      return instance.sendPasswordReset(email, resetUrl);
    }
    return instance.sendPasswordResetEmail(email, resetUrl);
  }
}
