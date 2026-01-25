import { EmailProvider, SendEmailOptions } from "../EmailProvider";

export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    console.log(`[MOCK EMAIL] To: ${options.to}`);
    console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    console.log(`[MOCK EMAIL] Body: ${options.html.substring(0, 100)}...`);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    console.log(`[PASS RESET EMAIL] To: ${email}, Link: ${resetUrl}`);
  }
}
