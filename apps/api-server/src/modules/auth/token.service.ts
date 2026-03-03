import { decodeJwt, type JWTPayload,jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';


const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
}

export class TokenService {
  private static readonly ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
  private static readonly REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
  private static readonly ADMIN_SECRET = new TextEncoder().encode((process.env.ADMIN_JWT_SECRET !== undefined && process.env.ADMIN_JWT_SECRET !== null && process.env.ADMIN_JWT_SECRET !== '') ? process.env.ADMIN_JWT_SECRET : (process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== null && process.env.JWT_SECRET !== '') ? process.env.JWT_SECRET : '');

  /**
   * Universal _token extraction: Scope-Aware
   */
  static getAccessToken(_req: NextRequest, options?: { scope?: 'admin' | 'user' | 'infrastructure' }): string | undefined {
    const scope = options?.scope;

    // 1. Check Cookies based on scope
    if (scope === 'admin') {
        const adminToken = _req.cookies.get('admin_accessToken')?.value;
        if (adminToken !== undefined && adminToken !== null && adminToken !== '') return adminToken;
    } else if (scope === 'user') {
        const userToken = _req.cookies.get('accessToken')?.value;
        if (userToken !== undefined && userToken !== null && userToken !== '') return userToken;
    } else if (scope === 'infrastructure') {
        const infraToken = _req.cookies.get('infra_accessToken')?.value;
        if (infraToken !== undefined && infraToken !== null && infraToken !== '') return infraToken;
    } else {
        // Fallback for non-scoped requests (legacy/default behavior)
        const _accessToken = _req.cookies.get('accessToken')?.value;
        const _adminToken = _req.cookies.get('admin_accessToken')?.value;
        const _infraToken = _req.cookies.get('infra_accessToken')?.value;
        
        let cookieToken = undefined;
        if (_accessToken !== undefined && _accessToken !== null && _accessToken !== '') cookieToken = _accessToken;
        else if (_adminToken !== undefined && _adminToken !== null && _adminToken !== '') cookieToken = _adminToken;
        else if (_infraToken !== undefined && _infraToken !== null && _infraToken !== '') cookieToken = _infraToken;
        
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
    
    // Explicitly set audience if not provided (default to 'user' or 'admin')
    const audience = _payload.aud ?? (_payload.isAdmin === true ? 'admin' : 'user');
    
    return await new SignJWT({ ..._payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(secret);
  }

  static async generateRefreshToken(userId: string, isAdmin: boolean = false, audience: string = 'user'): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return await new SignJWT({ userId, isAdmin, aud: audience })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  static async verifyAccessToken(_token: string, optionsOrIsAdmin?: { isAdmin?: boolean; audience?: string } | boolean): Promise<TokenPayload> {
    let isAdmin: boolean | undefined;
    let requiredAud: string | undefined;

    if (typeof optionsOrIsAdmin === 'boolean') {
        isAdmin = optionsOrIsAdmin;
    } else {
        isAdmin = optionsOrIsAdmin?.isAdmin;
        requiredAud = optionsOrIsAdmin?.audience;
    }

    // Default audience handling:
    // - If caller passes an audience, we enforce it strictly.
    // - If caller omits audience but isAdmin === true, accept either 'admin' or 'infra' token aud values.
    // - If caller omits audience and isAdmin is false/undefined, accept 'user' (and legacy audience-less tokens).
    const enforceAud = (requiredAud !== undefined && requiredAud !== null && requiredAud !== '');

    const verify = async (secret: Uint8Array): Promise<TokenPayload> => {
        const { payload: _payload } = await jwtVerify(_token, secret);
        const tokenAud = _payload.aud as string | string[] | undefined;

        const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
        const audValues = Array.isArray(tokenAud)
            ? tokenAud
            : hasAud
                ? [tokenAud as string]
                : [];

        if (enforceAud) {
            const hasMatch = audValues.length > 0 ? audValues.includes(requiredAud!) : false;
            if (hasMatch === false) {
                throw new Error(`Audience mismatch: expected ${requiredAud}, got ${String(tokenAud)}`);
            }
        } else if (isAdmin === true) {
            // When admin scope but audience not enforced, allow either admin or infra,
            // but still disallow unknown audiences for defense-in-depth.
            if (audValues.length > 0 && audValues.some(aud => aud !== 'admin' && aud !== 'infra')) {
                throw new Error(`Audience violation: admin scope received unexpected aud ${String(tokenAud)}`);
            }
        }
        return _payload as unknown as TokenPayload;
    };

    // If specific scope requested (or defaulted), enforce it
    if (typeof isAdmin === 'boolean') {
        const secret = isAdmin ? this.ADMIN_SECRET : this.ACCESS_SECRET;
        return await verify(secret);
    }

    // Otherwise, try User Secret first (common case)
    try {
        return await verify(this.ACCESS_SECRET);
    } catch (_err) {
        // Fallback to Admin Secret
        try {
             return await verify(this.ADMIN_SECRET);
        } catch (innerErr) {
            const msg = innerErr instanceof Error ? innerErr.message : 'Invalid _token signature or audience mismatch';
            throw new Error(msg);
        }
    }
  }

  static async verifyRefreshToken(_token: string, options: { isAdmin?: boolean; audience?: string } = {}): Promise<{ userId: string; isAdmin: boolean; aud?: string }> {
    const isAdmin = options.isAdmin ?? false;
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    const { payload: _payload } = await jwtVerify(_token, secret, {
        audience: options.audience
    });
    return _payload as unknown as { userId: string; isAdmin: boolean; aud?: string };
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
