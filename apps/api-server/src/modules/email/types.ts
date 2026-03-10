export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<void>;
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
}
