import * as jose from 'jose';


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
   * Universal token extraction: Scope-Aware
   */
  static getAccessToken(req: any, options?: { scope?: 'admin' | 'user' }): string | undefined {
    const scope = options?.scope;

    // 1. Check Cookies based on scope
    if (scope === 'admin') {
        const adminToken = req.cookies.get('admin_accessToken')?.value;
        if (adminToken) return adminToken;
    } else if (scope === 'user') {
        const userToken = req.cookies.get('accessToken')?.value;
        if (userToken) return userToken;
    } else {
        // Fallback for non-scoped requests (legacy/default behavior)
        const cookieToken = req.cookies.get('accessToken')?.value || 
                            req.cookies.get('admin_accessToken')?.value;
        if (cookieToken) return cookieToken;
    }

    // 2. Check Authorization Header (Fallback for legacy/mobile/tooling)
    const headerToken = req.headers.get('authorization')?.replace('Bearer ', '');
    return headerToken || undefined;
  }

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

  static async verifyAccessToken(token: string, isAdmin?: boolean): Promise<TokenPayload> {
    // If specific scope requested, enforce it
    if (typeof isAdmin === 'boolean') {
        const secret = isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as unknown as TokenPayload;
    }

    // Otherwise, try User Secret first (common case)
    try {
        const { payload } = await jose.jwtVerify(token, this.ACCESS_SECRET);
        return payload as unknown as TokenPayload;
    } catch (err) {
        // Fallback to Admin Secret
        try {
             const { payload } = await jose.jwtVerify(token, this.ADMIN_SECRET);
             return payload as unknown as TokenPayload;
        } catch {
            throw new Error('Invalid token signature');
        }
    }
  }

  static async verifyRefreshToken(token: string, isAdmin: boolean = false): Promise<{ userId: string; isAdmin: boolean }> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as { userId: string; isAdmin: boolean };
  }

  /**
   * Extract expiration timestamp from a token without verifying signature.
   * Useful for informing the client about session duration.
   */
  static getExpiration(token: string): string | null {
    try {
      const decoded = jose.decodeJwt(token);
      if (decoded.exp) {
        return new Date(decoded.exp * 1000).toISOString();
      }
      return null;
    } catch {
      return null;
    }
  }
}
