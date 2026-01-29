import { EmailProvider, SendEmailOptions } from "../EmailProvider";

export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    // Mock send email
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    // Mock send reset email
  }
}
