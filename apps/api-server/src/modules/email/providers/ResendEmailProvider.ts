import { Resend } from 'resend';

import { container } from '@/modules/core/container';
import { LoggerService } from '@/modules/core/logger.service';
import type { EmailOptions, IEmailProvider } from '@/modules/email/types';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  private from: string;
  private logger: LoggerService;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
    this.logger = container.get(LoggerService);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error !== null && error !== undefined) {
        this.logger.error(error, '[EmailService] Resend API returned an error');
        // We log it carefully to see why it fails (likely domain verification)
        return;
      }

      if (data !== null && data !== undefined) {
        this.logger.info({ emailId: data.id }, '[EmailService] Email sent successfully via Resend.');
      }
    } catch (err: unknown) {
      this.logger.error(err, '[EmailService] Unexpected fault while sending email via Resend');
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Reset your password</h2>
        <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-bottom: 24px;">
          Reset password
        </a>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
          This link will expire in 60 minutes.
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          If the button above doesn't work, copy and paste this URL into your browser:<br>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your password',
      html,
    });
  }
}
