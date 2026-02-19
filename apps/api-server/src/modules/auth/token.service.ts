import { decodeJwt, type JWTPayload,jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';


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
  private static readonly ADMIN_SECRET = new TextEncoder().encode((process.env.ADMIN_JWT_SECRET !== undefined && process.env.ADMIN_JWT_SECRET !== null && process.env.ADMIN_JWT_SECRET !== '') ? process.env.ADMIN_JWT_SECRET : (process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== null && process.env.JWT_SECRET !== '') ? process.env.JWT_SECRET : '');

  /**
   * Universal _token extraction: Scope-Aware
   */
  static getAccessToken(_req: NextRequest, options?: { scope?: 'admin' | 'user' }): string | undefined {
    const scope = options?.scope;

    // 1. Check Cookies based on scope
    if (scope === 'admin') {
        const adminToken = _req.cookies.get('admin_accessToken')?.value;
        if (adminToken !== undefined && adminToken !== null && adminToken !== '') return adminToken;
    } else if (scope === 'user') {
        const userToken = _req.cookies.get('accessToken')?.value;
        if (userToken !== undefined && userToken !== null && userToken !== '') return userToken;
    } else {
        // Fallback for non-scoped requests (legacy/default behavior)
        const _accessToken = _req.cookies.get('accessToken')?.value;
        const _adminToken = _req.cookies.get('admin_accessToken')?.value;
        const cookieToken = (_accessToken !== undefined && _accessToken !== null && _accessToken !== '') ? _accessToken : (_adminToken !== undefined && _adminToken !== null && _adminToken !== '') ? _adminToken : undefined;
        if (cookieToken !== undefined && cookieToken !== null && cookieToken !== '') return cookieToken;
    }

    // 2. Check Authorization Header (Fallback for legacy/mobile/tooling)
    const headerToken = _req.headers.get('authorization')?.replace('Bearer ', '');
    return (headerToken !== null && headerToken !== '') ? headerToken : undefined;
  }

  /**
   * Universal SHA-256 hashing using Web Crypto API.
   * Works in both Node.js 16+ and Edge Runtime.
   */
  static async hashToken(_token: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(_token);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async generateAccessToken(_payload: TokenPayload, customExpiration?: string | number): Promise<string> {
    const secret = _payload.isAdmin === true ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    const expiration = (customExpiration !== undefined && customExpiration !== null && customExpiration !== '') ? customExpiration : ACCESS_TOKEN_EXPIRE;
    
    return await new SignJWT({ ..._payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(secret);
  }

  static async generateRefreshToken(userId: string, isAdmin: boolean = false): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return await new SignJWT({ userId, isAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  static async verifyAccessToken(_token: string, isAdmin?: boolean): Promise<TokenPayload> {
    // If specific scope requested, enforce it
    if (typeof isAdmin === 'boolean') {
        const secret = isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
        const { payload: _payload } = await jwtVerify(_token, secret);
        return _payload as unknown as TokenPayload;
    }

    // Otherwise, try User Secret first (common case)
    try {
        const { payload: _payload } = await jwtVerify(_token, this.ACCESS_SECRET);
        return _payload as unknown as TokenPayload;
    } catch (_err) {
        // Fallback to Admin Secret
        try {
             const { payload: _payload } = await jwtVerify(_token, this.ADMIN_SECRET);
             return _payload as unknown as TokenPayload;
        } catch {
            throw new Error('Invalid _token signature');
        }
    }
  }

  static async verifyRefreshToken(_token: string, isAdmin: boolean = false): Promise<{ userId: string; isAdmin: boolean }> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    const { payload: _payload } = await jwtVerify(_token, secret);
    return _payload as unknown as { userId: string; isAdmin: boolean };
  }

  /**
   * Extract expiration timestamp from a _token without verifying signature.
   * Useful for informing the client about session duration.
   */
  static getExpiration(_token: string): string | null {
    try {
      const decoded = decodeJwt(_token);
      if (decoded.exp !== undefined) {
        return this.getExpiryISO(decoded);
      }
      return null;
    } catch {
      return null;
    }
  }

  static getExpiryISO(_payload: JWTPayload): string {
    return new Date((_payload.exp as number) * 1000).toISOString();
  }
}
