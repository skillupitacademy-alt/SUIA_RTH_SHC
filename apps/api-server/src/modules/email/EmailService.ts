import { emailQueue } from '@/lib/queue/queues';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Service for handling email operations via BullMQ (Task 109).
 */
export class EmailService {
  private static singleton: EmailService | null = null;

  constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.singleton) {
      EmailService.singleton = new EmailService();
    }
    return EmailService.singleton;
  }

  /**
   * Offloads generic email to background queue (Task 109).
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    await emailQueue.add('send_generic_email', {
      to: options.to,
      subject: options.subject,
      html: options.html,
      // template field is optional as per job-types.ts
    });
  }

  /**
   * Offloads password reset email to background queue (Task 109).
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    await emailQueue.add('send_password_reset', {
      to: email,
      subject: 'Reset your password',
      template: 'password_reset',
      data: { resetUrl }
    });
  }
}
