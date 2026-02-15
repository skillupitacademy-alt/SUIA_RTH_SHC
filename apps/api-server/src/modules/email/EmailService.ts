import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import type { IEmailProvider } from './types';

export class EmailService {
  private static instance: IEmailProvider | null = null;

  static getInstance(): IEmailProvider {
    if (this.instance === null) {
      const provider = process.env.EMAIL_PROVIDER ?? 'mock';
      
      if (provider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM ?? 'QuizPlatform <onboarding@resend.dev>';

        if (apiKey === undefined || apiKey.trim() === '') {
          this.instance = new MockEmailProvider();
        } else {
          this.instance = new ResendEmailProvider(apiKey, from);
        }
      } else {
        this.instance = new MockEmailProvider();
      }
    }
    return this.instance;
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    await this.getInstance().sendPasswordReset(email, resetUrl);
  }
}
