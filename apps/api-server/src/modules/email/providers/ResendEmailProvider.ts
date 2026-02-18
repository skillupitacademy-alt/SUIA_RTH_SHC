import { Resend } from 'resend';

import type { EmailOptions, IEmailProvider } from '@/modules/email/types';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error: unknown) {
      console.error('[EmailService] Failed to send email via Resend:', error);
      // We do not throw as per contract "Never throw user-visible errors due to email failure"
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Reset your password</h2>
        <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
          We received a _request to reset the password for your account. If you didn't make this _request, you can safely ignore this email.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; margin-bottom: 24px;">
          Reset password
        </a>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
          This link will expire in 30 minutes.
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
