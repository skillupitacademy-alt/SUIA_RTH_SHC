import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
}

export class TokenService {
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET!;
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET!;

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateAccessToken(payload: TokenPayload): string {
    const secret = payload.isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRE });
  }

  static generateRefreshToken(userId: string, isAdmin: boolean = false): string {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return jwt.sign({ userId, isAdmin }, secret, { expiresIn: REFRESH_TOKEN_EXPIRE });
  }

  static verifyAccessToken(token: string, isAdmin: boolean = false): TokenPayload {
    const secret = isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  }

  static verifyRefreshToken(token: string, isAdmin: boolean = false): { userId: string; isAdmin: boolean } {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return jwt.verify(token, secret) as { userId: string; isAdmin: boolean };
  }
}
