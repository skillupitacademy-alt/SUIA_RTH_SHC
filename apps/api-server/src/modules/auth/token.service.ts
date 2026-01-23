import * as jose from 'jose';
import jwt from 'jsonwebtoken'; // Left as unused import per user request, but will use jose for logic to fix build

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
}

export class TokenService {
  private static readonly ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
  private static readonly REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
  private static readonly ADMIN_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET!);

  /**
   * Universal SHA-256 hashing using Web Crypto API.
   * Works in both Node.js 16+ and Edge Runtime.
   */
  static async hashToken(token: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(token);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async generateAccessToken(payload: TokenPayload): Promise<string> {
    const secret = payload.isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    return await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRE)
      .sign(secret);
  }

  static async generateRefreshToken(userId: string, isAdmin: boolean = false): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return await new jose.SignJWT({ userId, isAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  static async verifyAccessToken(token: string, isAdmin: boolean = false): Promise<TokenPayload> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  }

  static async verifyRefreshToken(token: string, isAdmin: boolean = false): Promise<{ userId: string; isAdmin: boolean }> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as { userId: string; isAdmin: boolean };
  }
}
