import { EmailProvider } from './EmailProvider';
import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';

export class EmailService {
  private static instance: EmailProvider;

  static getInstance(): EmailProvider {
    if (!this.instance) {
      const provider = process.env.EMAIL_PROVIDER || 'mock';
      
      if (provider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM || 'QuizPlatform <onboarding@resend.dev>';
        

        if (!apiKey) {
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

  static async sendPasswordResetEmail(email: string, resetUrl: string) {
    return this.getInstance().sendPasswordResetEmail(email, resetUrl);
  }
}
