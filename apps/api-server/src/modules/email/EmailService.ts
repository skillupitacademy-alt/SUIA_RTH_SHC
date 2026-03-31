import type { RequestBrand } from '@/lib/request-brand';

import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import type { EmailOptions, IEmailProvider } from './types';

/**
 * EmailService now selects a provider (Mock or Resend) based on env, keeping tests hermetic.
 */
export class EmailService {
  private static instance: IEmailProvider | null = null;

  private static getBrandDisplayName(brand: RequestBrand): string {
    return brand === 'skillup' ? 'SkillUp IT Academy' : 'Real Tutorial Hub';
  }

  private static getBrandFromAddress(brand: RequestBrand): string | undefined {
    const brandFrom = brand === 'skillup'
      ? process.env.SKILLUP_EMAIL_FROM
      : process.env.RTH_EMAIL_FROM;

    return brandFrom !== undefined && brandFrom.trim().length > 0
      ? brandFrom
      : process.env.EMAIL_FROM;
  }

  private static getVerificationEmailHtml(verificationUrl: string, brand: RequestBrand): string {
    const primaryColor = brand === 'skillup' ? '#0EA5E9' : '#FF4B91';
    const brandName = this.getBrandDisplayName(brand);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="margin: 0 0 12px; font-size: 24px; line-height: 1.2; color: ${primaryColor};">${brandName} account verification</h2>
        <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 10px; font-weight: 700;">Verify email</a>
        <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin: 8px 0 0; word-break: break-all; color: #334155;">${verificationUrl}</p>
      </div>
    `;
  }

  private static getPasswordResetEmailHtml(resetUrl: string, brand: RequestBrand): string {
    const primaryColor = brand === 'skillup' ? '#0EA5E9' : '#FF4B91';
    const brandName = this.getBrandDisplayName(brand);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="margin: 0 0 12px; font-size: 24px; line-height: 1.2; color: ${primaryColor};">${brandName} password reset</h2>
        <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">We received a request to reset your password.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 10px; font-weight: 700;">Reset password</a>
        <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin: 8px 0 0; word-break: break-all; color: #334155;">${resetUrl}</p>
      </div>
    `;
  }

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

  static async sendVerificationEmail(email: string, verificationUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} \u2014 Verify your email`,
      html: this.getVerificationEmailHtml(verificationUrl, brand),
      from: this.getBrandFromAddress(brand),
    });
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} \u2014 Reset your password`,
      html: this.getPasswordResetEmailHtml(resetUrl, brand),
      from: this.getBrandFromAddress(brand),
    });
  }
}
