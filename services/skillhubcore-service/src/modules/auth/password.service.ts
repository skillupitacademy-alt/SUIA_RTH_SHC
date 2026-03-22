import bcrypt from 'bcryptjs';

export class PasswordService {
  async hash(password: string): Promise<string> {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    return bcrypt.hash(password, 12);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
