import { getBrandConfig } from '@/lib/brand-config';
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
    return getBrandConfig(brand).displayName;
  }

  private static getBrandFromAddress(brand: RequestBrand): string | undefined {
    return getBrandConfig(brand).sender;
  }

  private static renderEmailShell(title: string, body: string, ctaLabel: string, ctaUrl: string, brand: RequestBrand): string {
    const config = getBrandConfig(brand);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <p style="margin: 0 0 8px; color: ${config.primaryColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">${config.accentLabel}</p>
        <h2 style="margin: 0 0 12px; font-size: 24px; line-height: 1.2; color: ${config.primaryColor};">${title}</h2>
        <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">${body}</p>
        <a href="${ctaUrl}" style="display: inline-block; background-color: ${config.primaryColor}; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 10px; font-weight: 700;">${ctaLabel}</a>
        <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin: 8px 0 0; word-break: break-all; color: #334155;">${ctaUrl}</p>
        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px;">${config.displayName}</p>
      </div>
    `;
  }

  private static getVerificationEmailHtml(verificationUrl: string, brand: RequestBrand): string {
    const config = getBrandConfig(brand);
    return this.renderEmailShell(
      `${config.displayName} account verification`,
      config.verificationMessage,
      'Verify email',
      verificationUrl,
      brand,
    );
  }

  private static getPasswordResetEmailHtml(resetUrl: string, brand: RequestBrand): string {
    const config = getBrandConfig(brand);
    return this.renderEmailShell(
      `${config.displayName} password reset`,
      config.passwordResetMessage,
      'Reset password',
      resetUrl,
      brand,
    );
  }

  private static getWelcomeEmailHtml(name: string, brand: RequestBrand): string {
    const config = getBrandConfig(brand);
    return this.renderEmailShell(
      `Welcome to ${config.displayName}`,
      `Hi ${name}, ${config.welcomeHeadline}`,
      'Open portal',
      config.userPortalUrl,
      brand,
    );
  }

  private static getLockoutEmailHtml(brand: RequestBrand): string {
    const config = getBrandConfig(brand);
    return this.renderEmailShell(
      `${config.displayName} account lockout notice`,
      config.lockoutMessage,
      'Open portal',
      config.userPortalUrl,
      brand,
    );
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

  static async sendWelcomeEmail(email: string, name: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} — Welcome`,
      html: this.getWelcomeEmailHtml(name, brand),
      from: this.getBrandFromAddress(brand),
    });
  }

  static async sendEmailVerification(email: string, verificationUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} — Verify your email`,
      html: this.getVerificationEmailHtml(verificationUrl, brand),
      from: this.getBrandFromAddress(brand),
    });
  }

  static async sendVerificationEmail(email: string, verificationUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmailVerification(email, verificationUrl, brand);
  }

  static async sendPasswordReset(email: string, resetUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} — Reset your password`,
      html: this.getPasswordResetEmailHtml(resetUrl, brand),
      from: this.getBrandFromAddress(brand),
    });
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendPasswordReset(email, resetUrl, brand);
  }

  static async sendAccountLockout(email: string, brand: RequestBrand = 'realtutorialhub'): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `${this.getBrandDisplayName(brand)} — Account temporarily locked`,
      html: this.getLockoutEmailHtml(brand),
      from: this.getBrandFromAddress(brand),
    });
  }
}
