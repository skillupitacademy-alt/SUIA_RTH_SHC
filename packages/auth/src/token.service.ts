import { decodeJwt, jwtVerify, SignJWT, type JWTPayload } from 'jose';

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

export type AccessTokenRequestLike = {
  cookies?: { get(name: string): { value?: string } | undefined };
  headers?: { get(name: string): string | null };
};

export class TokenService {
  private static singleton: TokenService | null = null;

  static ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== ''
      ? process.env.JWT_SECRET
      : 'test-access-secret'
  );

  static REFRESH_SECRET = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET !== undefined && process.env.JWT_REFRESH_SECRET !== ''
      ? process.env.JWT_REFRESH_SECRET
      : 'test-refresh-secret'
  );

  static ADMIN_SECRET = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET !== undefined && process.env.ADMIN_JWT_SECRET !== ''
      ? process.env.ADMIN_JWT_SECRET
      : process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET !== ''
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

  getAccessToken(req: AccessTokenRequestLike, options?: { scope?: 'admin' | 'user' | 'infrastructure' }): string | undefined {
    const scope = options?.scope;

    if (scope === 'admin') {
      const adminToken = req.cookies?.get('admin_accessToken')?.value;
      if (typeof adminToken === 'string' && adminToken.length > 0) return adminToken;
    } else if (scope === 'user') {
      const userToken = req.cookies?.get('accessToken')?.value;
      if (typeof userToken === 'string' && userToken.length > 0) return userToken;
    } else if (scope === 'infrastructure') {
      const infraToken = req.cookies?.get('infra_accessToken')?.value;
      if (typeof infraToken === 'string' && infraToken.length > 0) return infraToken;
    } else {
      const accessToken = req.cookies?.get('accessToken')?.value;
      const adminToken = req.cookies?.get('admin_accessToken')?.value;
      const infraToken = req.cookies?.get('infra_accessToken')?.value;

      let cookieToken: string | undefined;
      if (typeof accessToken === 'string' && accessToken.length > 0) cookieToken = accessToken;
      else if (typeof adminToken === 'string' && adminToken.length > 0) cookieToken = adminToken;
      else if (typeof infraToken === 'string' && infraToken.length > 0) cookieToken = infraToken;

      if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;
    }

    const headerToken = req.headers?.get('authorization')?.replace('Bearer ', '');
    return typeof headerToken === 'string' && headerToken.length > 0 ? headerToken : undefined;
  }

  async hashToken(token: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(token);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async generateAccessToken(payload: TokenPayload, customExpiration?: string | number): Promise<string> {
    const secret = payload.isAdmin === true ? this.ADMIN_SECRET : this.ACCESS_SECRET;
    const expiration = customExpiration !== undefined && customExpiration !== null && customExpiration !== ''
      ? customExpiration
      : ACCESS_TOKEN_EXPIRE;
    const audience = payload.aud ?? (payload.isAdmin === true ? 'admin' : 'user');

    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(secret);
  }

  async generateRefreshToken(userId: string, isAdmin: boolean = false, audience: string = 'user'): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    return new SignJWT({ userId, isAdmin, aud: audience })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  async verifyUserAccessToken(token: string, options?: { audience?: string }): Promise<UserTokenPayload> {
    const { payload } = await jwtVerify(token, this.ACCESS_SECRET);
    const tokenAud = payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
    const audValues = Array.isArray(tokenAud)
      ? tokenAud
      : hasAud
        ? [tokenAud as string]
        : [];

    const requestedAudience = options?.audience ?? 'user';

    if (!hasAud) {
      throw new Error(`Audience mismatch: expected ${requestedAudience}`);
    }

    if (!audValues.includes(requestedAudience)) {
      throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
    }

    return payload as unknown as UserTokenPayload;
  }

  async verifyAdminAccessToken(token: string, options?: { audience?: string }): Promise<AdminTokenPayload> {
    const { payload } = await jwtVerify(token, this.ADMIN_SECRET);
    const tokenAud = payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
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
    } else if (audValues.length > 0 && audValues.some((aud) => aud !== 'admin' && aud !== 'infra')) {
      throw new Error(`Audience violation: admin scope received unexpected aud ${String(tokenAud)}`);
    }

    return payload as unknown as AdminTokenPayload;
  }

  async verifyAccessToken(token: string, options?: { audience?: string; isAdmin?: boolean }): Promise<TokenPayload> {
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

      if (enforceAudience && !audValues.includes(requestedAudience as string)) {
        throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
      }

      return payload as unknown as TokenPayload;
    };

    const normalizeError = (err: unknown) => (err instanceof Error ? err : new Error('Invalid token signature or audience mismatch'));

    try {
      const { payload } = await jwtVerify(token, this.ACCESS_SECRET);
      return validateAudience(payload);
    } catch (err) {
      if (options?.isAdmin === false) {
        throw normalizeError(err);
      }
    }

    try {
      const { payload } = await jwtVerify(token, this.ADMIN_SECRET);
      return validateAudience(payload);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async verifyRefreshToken(token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
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

      if (enforceAudience && !audValues.includes(requestedAudience as string)) {
        throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
      }

      return payload as unknown as RefreshTokenPayload;
    };

    try {
      const { payload } = await jwtVerify(token, this.REFRESH_SECRET, audienceOption);
      return validateAudience(payload);
    } catch (err) {
      try {
        const { payload } = await jwtVerify(token, this.ADMIN_SECRET, audienceOption);
        return validateAudience(payload);
      } catch (err2) {
        if (err2 instanceof Error) throw err2;
        if (err instanceof Error) throw err;
        throw new Error('Invalid refresh token signature or audience mismatch');
      }
    }
  }

  async verifyInfraAccessToken(token: string, options?: { audience?: string }): Promise<AdminTokenPayload> {
    const { payload } = await jwtVerify(token, this.ACCESS_SECRET);
    const tokenAud = payload.aud as string | string[] | undefined;
    const hasAud = tokenAud !== undefined && tokenAud !== null && tokenAud !== '';
    const audValues = Array.isArray(tokenAud) ? tokenAud : hasAud ? [tokenAud as string] : [];
    const requestedAudience = options?.audience ?? 'infra';

    if (!audValues.includes(requestedAudience)) {
      throw new Error(`Audience mismatch: expected ${requestedAudience}, got ${String(tokenAud)}`);
    }

    return payload as unknown as AdminTokenPayload;
  }

  async verifyUserRefreshToken(token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, this.REFRESH_SECRET, { audience: options?.audience });
    return payload as unknown as RefreshTokenPayload;
  }

  async verifyAdminRefreshToken(token: string, options?: { audience?: string }): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, this.ADMIN_SECRET, { audience: options?.audience });
    return payload as unknown as RefreshTokenPayload;
  }

  getExpiration(token: string): string | null {
    try {
      const decoded = decodeJwt(token);
      if (decoded.exp !== undefined) return this.getExpiryISO(decoded);
      return null;
    } catch {
      return null;
    }
  }

  getExpiryISO(payload: JWTPayload): string {
    return new Date((payload.exp as number) * 1000).toISOString();
  }

  static generateAccessToken(payload: TokenPayload, customExpiration?: string | number) {
    return this.getInstance().generateAccessToken(payload, customExpiration);
  }

  static generateRefreshToken(userId: string, isAdmin: boolean = false, audience: string = 'user') {
    return this.getInstance().generateRefreshToken(userId, isAdmin, audience);
  }

  static verifyUserAccessToken(token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserAccessToken(token, options);
  }

  static verifyAccessToken(token: string, options?: { audience?: string; isAdmin?: boolean }) {
    return this.getInstance().verifyAccessToken(token, options);
  }

  static async verifyAdminAccessToken(token: string, options?: { audience?: string }) {
    const inst = this.getInstance();
    if (typeof inst.verifyAdminAccessToken === 'function') {
      return inst.verifyAdminAccessToken(token, options);
    }
    if (typeof inst.verifyAccessToken === 'function') {
      return inst.verifyAccessToken(token, { audience: options?.audience, isAdmin: true }) as Promise<AdminTokenPayload>;
    }
    if (typeof inst.verifyUserAccessToken === 'function') {
      return inst.verifyUserAccessToken(token, options) as Promise<AdminTokenPayload>;
    }
    throw new Error('verifyAdminAccessToken not implemented');
  }

  static verifyInfraAccessToken(token: string, options?: { audience?: string }) {
    return this.getInstance().verifyInfraAccessToken(token, options);
  }

  static verifyUserRefreshToken(token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserRefreshToken(token, options);
  }

  static verifyAdminRefreshToken(token: string, options?: { audience?: string }) {
    return this.getInstance().verifyAdminRefreshToken(token, options);
  }

  static verifyRefreshToken(token: string, options?: { audience?: string }) {
    const inst = this.getInstance();
    const fn =
      typeof inst.verifyRefreshToken === 'function'
        ? inst.verifyRefreshToken.bind(inst)
        : typeof inst.verifyUserRefreshToken === 'function'
          ? inst.verifyUserRefreshToken.bind(inst)
          : null;
    if (fn === null) throw new Error('verifyRefreshToken not implemented');
    return fn(token, options);
  }

  static hashToken(token: string) {
    return this.getInstance().hashToken(token);
  }

  static getExpiration(token: string) {
    return this.getInstance().getExpiration(token);
  }

  static getExpiryISO(payload: JWTPayload) {
    return this.getInstance().getExpiryISO(payload);
  }
}
