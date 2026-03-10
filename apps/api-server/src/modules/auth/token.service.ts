import { decodeJwt, type JWTPayload,jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export type TokenPayload = JWTPayload & {
  userId: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
};
export type UserTokenPayload = TokenPayload;
export type AdminTokenPayload = TokenPayload & { isAdmin: true; adminScope?: string[] };
export type RefreshTokenPayload = JWTPayload & {
  userId: string;
  isAdmin: boolean;
  tokenFamily?: string;
  aud?: string;
};

export class TokenService {
  /**
   * Allow legacy static usage in tests (e.g., TokenService.generateAccessToken).
   * We create the singleton lazily so tests can inject a mock via setInstance first.
   */
  private static singleton: TokenService | null = null;
  static ACCESS_SECRET = new TextEncoder().encode(
    (process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== '' ? process.env.JWT_SECRET : 'test-access-secret')
  );
  static REFRESH_SECRET = new TextEncoder().encode(
    (process.env.JWT_REFRESH_SECRET !== undefined && process.env.JWT_REFRESH_SECRET !== '' ? process.env.JWT_REFRESH_SECRET : 'test-refresh-secret')
  );
  static ADMIN_SECRET = new TextEncoder().encode(
      (process.env.ADMIN_JWT_SECRET !== undefined && process.env.ADMIN_JWT_SECRET !== '')
        ? process.env.ADMIN_JWT_SECRET
        : (process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== '')
          ? process.env.JWT_SECRET
          : 'test-admin-secret'
  );

  private static getInstance(): TokenService {
    if (this.singleton === null) {
      this.singleton = new TokenService();
    }
    return this.singleton;
  }

  static setInstance(mock: TokenService) {
    this.singleton = mock;
  }

  private readonly ACCESS_SECRET = TokenService.ACCESS_SECRET;
  private readonly REFRESH_SECRET = TokenService.REFRESH_SECRET;
  private readonly ADMIN_SECRET = TokenService.ADMIN_SECRET;

  /**
   * Universal _token extraction: Scope-Aware
   */
  getAccessToken(_req: NextRequest, options?: { scope?: 'admin' | 'user' | 'infrastructure' }): string | undefined {
    const scope = options?.scope;

    // 1. Check Cookies based on scope
    if (scope === 'admin') {
        const adminToken = _req.cookies.get('admin_accessToken')?.value;
        if (typeof adminToken === 'string' && adminToken.length > 0) return adminToken;
    } else if (scope === 'user') {
        const userToken = _req.cookies.get('accessToken')?.value;
        if (typeof userToken === 'string' && userToken.length > 0) return userToken;
    } else if (scope === 'infrastructure') {
        const infraToken = _req.cookies.get('infra_accessToken')?.value;
        if (typeof infraToken === 'string' && infraToken.length > 0) return infraToken;
    } else {
        // Fallback for non-scoped requests (legacy/default behavior)
        const _accessToken = _req.cookies.get('accessToken')?.value;
        const _adminToken = _req.cookies.get('admin_accessToken')?.value;
        const _infraToken = _req.cookies.get('infra_accessToken')?.value;
        
        let cookieToken: string | undefined = undefined;
        if (typeof _accessToken === 'string' && _accessToken.length > 0) cookieToken = _accessToken;
        else if (typeof _adminToken === 'string' && _adminToken.length > 0) cookieToken = _adminToken;
        else if (typeof _infraToken === 'string' && _infraToken.length > 0) cookieToken = _infraToken;
        
        if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;
    }

    // 2. Check Authorization Header (Fallback for legacy/mobile/tooling)
    const headerToken = _req.headers.get('authorization')?.replace('Bearer ', '');
    return (typeof headerToken === 'string' && headerToken.length > 0) ? headerToken : undefined;
  }

  /**
   * Universal SHA-256 hashing using Web Crypto API.
   * Works in both Node.js 16+ and Edge Runtime.
   */
  async hashToken(_token: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(_token);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async generateAccessToken(_payload: TokenPayload, customExpiration?: string | number): Promise<string> {
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

  async generateRefreshToken(userId: string, isAdmin: boolean = false, audience: string = 'user'): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return await new SignJWT({ userId, isAdmin, aud: audience })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  async verifyUserAccessToken(_token: string, options?: { audience?: string }): Promise<UserTokenPayload> {
    const { payload: _payload } = await jwtVerify(_token, this.ACCESS_SECRET);
    const tokenAud = _payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
    /* c8 ignore next 4 -- Array aud branch exercised via mocked jwtVerify in token.service.aud.array.test */
    const audValues = Array.isArray(tokenAud)
      ? tokenAud
      : hasAud
        ? [tokenAud as string]
        : [];

    const requestedAudience = options?.audience ?? 'user';
    const enforceAudience = requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== '';

    if (!hasAud) {
      throw new Error(`Audience mismatch: expected ${requestedAudience}`);
    }

    if (enforceAudience) {
      if (!audValues.includes(requestedAudience)) {
        throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
      }
    }

    return _payload as unknown as UserTokenPayload;
  }

  async verifyAdminAccessToken(_token: string, options?: { audience?: string }): Promise<AdminTokenPayload> {
    const { payload: _payload } = await jwtVerify(_token, this.ADMIN_SECRET);
    const tokenAud = _payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
    /* c8 ignore next 4 -- Array aud branch exercised via mocked jwtVerify in token.service.aud.array.test */
    const audValues = Array.isArray(tokenAud)
      ? tokenAud
      : hasAud
        ? [tokenAud as string]
        : [];

    const requestedAudience = options?.audience;
    const enforceAudience = requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== '';

    if (enforceAudience) {
      if (!audValues.includes(requestedAudience)) {
        throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
      }
    } else if (audValues.length > 0 && audValues.some(aud => aud !== 'admin' && aud !== 'infra')) {
      throw new Error(`Audience violation: admin scope received unexpected aud ${String(tokenAud)}`);
    }

    return _payload as unknown as AdminTokenPayload;
  }

  /**
   * @deprecated Use verifyUserAccessToken, verifyAdminAccessToken, or verifyInfraAccessToken.
   * Generic access-token verifier with user-first then admin fallback.
   * Honors optional audience enforcement and supports legacy behaviour where
   * callers did not differentiate admin/user methods.
   */
  async verifyAccessToken(_token: string, options?: { audience?: string; isAdmin?: boolean }): Promise<TokenPayload> {
    const requestedAudience = options?.audience;
    const enforceAudience = requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== '';

    const validateAudience = (payload: JWTPayload) => {
      const tokenAud = payload.aud as string | string[] | undefined;
      const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
      const audValues = Array.isArray(tokenAud)
        ? tokenAud
        : hasAud
          ? [tokenAud as string]
          : [];

      if (enforceAudience) {
        if (!audValues.includes(requestedAudience as string)) {
          throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
        }
      }
      return payload as unknown as TokenPayload;
    };

    const normalizeError = (err: unknown) => {
      if (err instanceof Error) return err;
      return new Error('Invalid _token signature or audience mismatch');
    };

    // Attempt with user secret first (legacy default)
    try {
      const { payload } = await jwtVerify(_token, this.ACCESS_SECRET);
      return validateAudience(payload);
    } catch (err) {
      // If explicitly told "user only", rethrow
      if (options?.isAdmin === false) {
        throw normalizeError(err);
      }
    }

    // Fallback: try admin secret
    try {
      const { payload } = await jwtVerify(_token, this.ADMIN_SECRET);
      return validateAudience(payload);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Unified refresh-token verifier. Defaults to user secret but falls back
   * to admin refresh secret for admin-issued refresh tokens.
   */
  async verifyRefreshToken(_token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
    const requestedAudience = options?.audience;
    const enforceAudience = requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== '';
    const audienceOption =
      requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== ''
        ? { audience: requestedAudience }
        : undefined;
    const validateAudience = (payload: JWTPayload) => {
      const tokenAud = payload.aud as string | string[] | undefined;
      const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
      const audValues = Array.isArray(tokenAud)
        ? tokenAud
        : hasAud
          ? [tokenAud as string]
          : [];

      if (enforceAudience) {
        if (!audValues.includes(requestedAudience as string)) {
          throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
        }
      }
      return payload as unknown as RefreshTokenPayload;
    };

    try {
      const { payload } = await jwtVerify(_token, this.REFRESH_SECRET, audienceOption);
      return validateAudience(payload);
    } catch (err) {
      try {
        const { payload } = await jwtVerify(_token, this.ADMIN_SECRET, audienceOption);
        return validateAudience(payload);
      } catch (err2) {
        if (err2 instanceof Error) throw err2;
        if (err instanceof Error) throw err;
        throw new Error('Invalid refresh _token signature or audience mismatch');
      }
    }
  }

  async verifyInfraAccessToken(_token: string, options?: { audience?: string }): Promise<AdminTokenPayload> {
    const { payload: _payload } = await jwtVerify(_token, this.ACCESS_SECRET);
    const tokenAud = _payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
    const audValues = Array.isArray(tokenAud) ? tokenAud : (hasAud ? [tokenAud as string] : []);
    
    const requestedAudience = options?.audience ?? 'infra';
    if (!audValues.includes(requestedAudience)) {
      throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
    }
    return _payload as unknown as AdminTokenPayload;
  }



  async verifyUserRefreshToken(_token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
    const { payload: _payload } = await jwtVerify(_token, this.REFRESH_SECRET, {
      audience: options?.audience
    });
    return _payload as unknown as RefreshTokenPayload;
  }

  async verifyAdminRefreshToken(_token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
    const { payload: _payload } = await jwtVerify(_token, this.ADMIN_SECRET, {
      audience: options?.audience
    });
    return _payload as unknown as RefreshTokenPayload;
  }

  /**
   * Extract expiration timestamp from a _token without verifying signature.
   * Useful for informing the client about session duration.
   */
  getExpiration(_token: string): string | null {
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

  getExpiryISO(_payload: JWTPayload): string {
    return new Date((_payload.exp as number) * 1000).toISOString();
  }

  // ---- Static facades for legacy tests ----
  static generateAccessToken(_payload: TokenPayload, customExpiration?: string | number) {
    return this.getInstance().generateAccessToken(_payload, customExpiration);
  }

  static generateRefreshToken(userId: string, isAdmin: boolean = false, audience: string = 'user') {
    return this.getInstance().generateRefreshToken(userId, isAdmin, audience);
  }

  /** @deprecated Use verifyUserAccessToken */
  static verifyUserAccessToken(_token: string, options?: { audience?: string }) {
    const inst = this.getInstance();
    return inst.verifyUserAccessToken(_token, options);
  }

  /** @deprecated Use verifyAdminAccessToken */
  static async verifyAdminAccessToken(_token: string, options?: { audience?: string }) {
    const inst = this.getInstance();
    if (typeof inst.verifyAdminAccessToken === 'function') {
      return inst.verifyAdminAccessToken(_token, options);
    }
    if (typeof inst.verifyAccessToken === 'function') {
      return inst.verifyAccessToken(_token, { audience: options?.audience, isAdmin: true }) as Promise<AdminTokenPayload>;
    }
    if (typeof inst.verifyUserAccessToken === 'function') {
      return inst.verifyUserAccessToken(_token, options) as Promise<AdminTokenPayload>;
    }
    throw new Error('verifyAdminAccessToken not implemented');
  }

  static async verifyInfraAccessToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyInfraAccessToken(_token, options);
  }

  static async verifyUserRefreshToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserRefreshToken(_token, options);
  }

  static async verifyAdminRefreshToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyAdminRefreshToken(_token, options);
  }

  static async verifyRefreshToken(_token: string, options?: { audience?: string }) {
    const inst = this.getInstance();
    const fn =
      typeof inst.verifyRefreshToken === 'function'
        ? inst.verifyRefreshToken.bind(inst)
        : typeof inst.verifyUserRefreshToken === 'function'
          ? inst.verifyUserRefreshToken.bind(inst)
          : null;
    if (fn === null) throw new Error('verifyRefreshToken not implemented');
    return fn(_token, options);
  }

  static hashToken(_token: string) {
    return this.getInstance().hashToken(_token);
  }

  static getExpiration(_token: string) {
    return this.getInstance().getExpiration(_token);
  }

  static getExpiryISO(_payload: JWTPayload) {
    return this.getInstance().getExpiryISO(_payload);
  }

}
