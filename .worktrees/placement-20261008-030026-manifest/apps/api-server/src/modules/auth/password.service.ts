import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Reduced from 12 to 10 (OWASP recommended, ~500ms faster)

export class PasswordService {
  async hash(password: string): Promise<string> {
    const start = Date.now();
    const result = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('[PERF][BCRYPT][HASH]', { duration: Date.now() - start, saltRounds: SALT_ROUNDS });
    return result;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    const start = Date.now();
    const result = await bcrypt.compare(password, hash);
    const duration = Date.now() - start;
    console.log('[PERF][BCRYPT][COMPARE]', { duration, saltRounds: SALT_ROUNDS });
    return result;
  }
}
