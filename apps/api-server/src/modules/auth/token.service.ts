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

    const requestedAudience = options?.audience;
    const enforceAudience = requestedAudience !== undefined && requestedAudience !== null && requestedAudience !== '';

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
   * @deprecated Use verifyUserAccessToken or verifyAdminAccessToken instead
   */
  async verifyAccessToken(_token: string, optionsOrIsAdmin?: { isAdmin?: boolean; audience?: string } | boolean): Promise<TokenPayload> {
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
   * @deprecated Use verifyUserRefreshToken or verifyAdminRefreshToken instead
   */
  async verifyRefreshToken(_token: string, options: { isAdmin?: boolean; audience?: string } = {}): Promise<{ userId: string; isAdmin: boolean; aud?: string }> {
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

  static verifyUserAccessToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserAccessToken(_token, options);
  }

  static verifyAdminAccessToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyAdminAccessToken(_token, options);
  }

  /**
   * @deprecated Use verifyUserAccessToken or verifyAdminAccessToken instead
   */
  static verifyAccessToken(_token: string, optionsOrIsAdmin?: { isAdmin?: boolean; audience?: string } | boolean) {
    return this.getInstance().verifyAccessToken(_token, optionsOrIsAdmin);
  }

  static verifyUserRefreshToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserRefreshToken(_token, options);
  }

  static verifyAdminRefreshToken(_token: string, options?: { audience?: string }) {
    return this.getInstance().verifyAdminRefreshToken(_token, options);
  }

  /**
   * @deprecated Use verifyUserRefreshToken or verifyAdminRefreshToken instead
   */
  static verifyRefreshToken(_token: string, options?: { isAdmin?: boolean; audience?: string }) {
    return this.getInstance().verifyRefreshToken(_token, options ?? {});
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
