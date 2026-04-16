import { decodeJwt, jwtVerify, SignJWT, type JWTPayload } from 'jose';

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env !== undefined) {
    const value = process.env[name];
    if (typeof value === 'string' && value !== '') {
      return value;
    }
  }

  return undefined;
}

export class TokenExpiredError extends Error {
  constructor(message = 'Token expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends Error {
  constructor(message = 'Token invalid') {
    super(message);
    this.name = 'TokenInvalidError';
  }
}

export type TokenPayload = JWTPayload & {
  userId: string;
  originalUserId?: string;
  shadowUserId?: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
  tokenType?: 'user' | 'admin';
  brand?: string;
  role?: string;
  platforms?: Array<'realtutorialhub' | 'skillup'>;
  subscriptions?: string[];
  portalIdentity?: 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';
};

export type UserTokenPayload = TokenPayload;
export type AdminTokenPayload = TokenPayload & { isAdmin: true; adminScope?: string[] };

export type RefreshTokenPayload = JWTPayload & {
  userId: string;
  originalUserId?: string;
  shadowUserId?: string;
  isAdmin: boolean;
  tokenFamily?: string;
  aud?: string;
  tokenType?: 'user' | 'admin';
  brand?: string;
};

export type SkillHubCoreTokenPayload = JWTPayload & {
  sub: string;
  shadowUserId?: string;
  originalUserId?: string;
  roles: string[];
  subscriptions: string[];
  platforms?: Array<'realtutorialhub' | 'skillup'>;
  iss: 'skillhubcore.in';
  brand?: 'realtutorialhub' | 'skillup';
};

export type AccessTokenRequestLike = {
  cookies?: { get(name: string): { value?: string } | undefined };
  headers?: { get(name: string): string | null };
};

export class TokenService {
  private static singleton: TokenService | null = null;

  static ACCESS_SECRET = new TextEncoder().encode(
    readEnv('JWT_SECRET') ?? 'test-access-secret'
  );

  static REFRESH_SECRET = new TextEncoder().encode(
    readEnv('JWT_REFRESH_SECRET') ?? 'test-refresh-secret'
  );

  static ADMIN_SECRET = new TextEncoder().encode(
    readEnv('ADMIN_JWT_SECRET')
      ?? readEnv('JWT_SECRET')
      ?? 'test-admin-secret'
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

  private readonly ACCESS_SECRET: Uint8Array;
  private readonly REFRESH_SECRET: Uint8Array;
  private readonly ADMIN_SECRET: Uint8Array;

  constructor(accessSecret?: Uint8Array, refreshSecret?: Uint8Array, adminSecret?: Uint8Array) {
    this.ACCESS_SECRET = accessSecret ?? TokenService.ACCESS_SECRET;
    this.REFRESH_SECRET = refreshSecret ?? TokenService.REFRESH_SECRET;
    this.ADMIN_SECRET = adminSecret ?? TokenService.ADMIN_SECRET;
  }

  private assertIdentityClaims(payload: Partial<TokenPayload>): asserts payload is TokenPayload {
    if (typeof payload.shadowUserId !== 'string' || payload.shadowUserId.trim().length === 0) {
      throw new TokenInvalidError('Missing shadowUserId claim');
    }

    if (typeof payload.originalUserId !== 'string' || payload.originalUserId.trim().length === 0) {
      throw new TokenInvalidError('Missing originalUserId claim');
    }
  }

  getAccessToken(req: AccessTokenRequestLike, options?: { scope?: 'admin' | 'user' | 'infrastructure' }): string | undefined {
    const scope = options?.scope;

    // Helper function to get cookie value from either cookies API or cookie header
    const getCookieValue = (name: string): string | undefined => {
      // Try Next.js cookies API first
      if (req.cookies?.get) {
        const cookie = req.cookies.get(name);
        if (cookie?.value && typeof cookie.value === 'string' && cookie.value.length > 0) {
          return cookie.value;
        }
      }

      // Fallback to parsing cookie header
      const cookieHeader = req.headers?.get('cookie');
      if (typeof cookieHeader === 'string' && cookieHeader.length > 0) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, ...valueParts] = cookie.trim().split('=');
          if (key && valueParts.length > 0) {
            acc[key.trim()] = valueParts.join('=').trim();
          }
          return acc;
        }, {} as Record<string, string>);

        const value = cookies[name];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }

      return undefined;
    };

    if (scope === 'admin') {
      const adminToken = getCookieValue('admin_accessToken');
      if (adminToken) return adminToken;
    } else if (scope === 'user') {
      const userToken = getCookieValue('accessToken');
      if (userToken) return userToken;
    } else if (scope === 'infrastructure') {
      const infraToken = getCookieValue('infra_accessToken');
      if (infraToken) return infraToken;
    }

    // When no scope is specified, ONLY check accessToken cookie (not admin or infra)
    if (!scope) {
      const userToken = getCookieValue('accessToken');
      if (userToken) return userToken;
    }

    // Fallback to Authorization header
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
    const tokenType = payload.tokenType ?? (payload.isAdmin === true ? 'admin' : 'user');
    const brand = typeof payload.brand === 'string' && payload.brand.trim().length > 0 ? payload.brand.trim().toLowerCase() : undefined;

    const originalUserId = typeof payload.originalUserId === 'string' && payload.originalUserId.trim().length > 0
      ? payload.originalUserId.trim()
      : payload.userId;
    const shadowUserId = typeof payload.shadowUserId === 'string' && payload.shadowUserId.trim().length > 0
      ? payload.shadowUserId.trim()
      : payload.userId;

    return new SignJWT({ ...payload, originalUserId, shadowUserId, tokenType, brand })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(secret);
  }

  async generateRefreshToken(
    userId: string,
    isAdmin: boolean = false,
    audience: string = 'user',
    metadata?: { tokenType?: 'user' | 'admin'; brand?: string; originalUserId?: string; shadowUserId?: string },
  ): Promise<string> {
    const secret = isAdmin ? this.ADMIN_SECRET : this.REFRESH_SECRET;
    const tokenType = metadata?.tokenType ?? (isAdmin === true ? 'admin' : 'user');
    const brand = typeof metadata?.brand === 'string' && metadata.brand.trim().length > 0
      ? metadata.brand.trim().toLowerCase()
      : undefined;

    const originalUserId = typeof metadata?.originalUserId === 'string' && metadata.originalUserId.trim().length > 0
      ? metadata.originalUserId.trim()
      : userId;
    const shadowUserId = typeof metadata?.shadowUserId === 'string' && metadata.shadowUserId.trim().length > 0
      ? metadata.shadowUserId.trim()
      : userId;

    return new SignJWT({ userId, originalUserId, shadowUserId, isAdmin, aud: audience, tokenType, brand })
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(secret);
  }

  async signSkillHubCoreAccessToken(
    userId: string,
    roles: string[],
    subscriptions: string[],
    platforms: Array<'realtutorialhub' | 'skillup'> = ['realtutorialhub'],
    metadata?: { originalUserId?: string; shadowUserId?: string; brand?: 'realtutorialhub' | 'skillup' },
  ): Promise<string> {
    const shadowUserId = typeof metadata?.shadowUserId === 'string' && metadata.shadowUserId.trim().length > 0
      ? metadata.shadowUserId.trim()
      : userId;
    const originalUserId = typeof metadata?.originalUserId === 'string' && metadata.originalUserId.trim().length > 0
      ? metadata.originalUserId.trim()
      : userId;
    const brand = metadata?.brand ?? platforms[0] ?? 'realtutorialhub';

    return new SignJWT({
      sub: userId,
      shadowUserId,
      originalUserId,
      brand,
      roles,
      subscriptions,
      platforms,
    } as Omit<SkillHubCoreTokenPayload, 'iat' | 'exp' | 'iss'>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setJti(globalThis.crypto.randomUUID())
      .setExpirationTime(ACCESS_TOKEN_EXPIRE)
      .sign(this.ACCESS_SECRET);
  }

  async signSkillHubCoreRefreshToken(userId: string, familyId: string): Promise<string> {
    return new SignJWT({
      sub: userId,
      family: familyId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setJti(globalThis.crypto.randomUUID())
      .setExpirationTime(REFRESH_TOKEN_EXPIRE)
      .sign(this.REFRESH_SECRET);
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

    const typedPayload = payload as unknown as UserTokenPayload;
    this.assertIdentityClaims(typedPayload);
    if (typedPayload.tokenType !== 'user') {
      throw new TokenInvalidError('Invalid user token type');
    }
    return typedPayload;
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

    const typedPayload = payload as unknown as AdminTokenPayload;
    this.assertIdentityClaims(typedPayload);
    if (typedPayload.tokenType !== 'admin') {
      throw new TokenInvalidError('Invalid admin token type');
    }
    return typedPayload;
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
      const typedPayload = validateAudience(payload);
      this.assertIdentityClaims(typedPayload);
      if (typedPayload.tokenType !== 'user') {
        throw new TokenInvalidError('Invalid user token type');
      }
      return typedPayload;
    } catch (err) {
      if (options?.isAdmin === false) {
        throw normalizeError(err);
      }
    }

    try {
        const { payload } = await jwtVerify(token, this.ADMIN_SECRET);
        const typedPayload = validateAudience(payload);
        this.assertIdentityClaims(typedPayload);
        if (typedPayload.tokenType !== 'admin') {
          throw new TokenInvalidError('Invalid admin token type');
        }
        return typedPayload;
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async verifySkillHubCoreJWT(token: string): Promise<SkillHubCoreTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.ACCESS_SECRET, { issuer: 'skillhubcore.in' });

      const shadowUserId =
        typeof payload.shadowUserId === 'string' && payload.shadowUserId.trim().length > 0
          ? payload.shadowUserId.trim()
          : undefined;
      const originalUserId =
        typeof payload.originalUserId === 'string' && payload.originalUserId.trim().length > 0
          ? payload.originalUserId.trim()
          : undefined;
      const platforms = Array.isArray((payload as { platforms?: unknown }).platforms)
        ? (payload as { platforms: Array<'realtutorialhub' | 'skillup'> }).platforms
        : undefined;

      if (
        shadowUserId === undefined ||
        originalUserId === undefined ||
        platforms === undefined ||
        platforms.length === 0 ||
        !Array.isArray((payload as { roles?: unknown }).roles) ||
        !Array.isArray((payload as { subscriptions?: unknown }).subscriptions)
      ) {
        throw new Error('Invalid SkillHubCore token payload');
      }

      return {
        ...(payload as SkillHubCoreTokenPayload),
        sub: shadowUserId,
        shadowUserId,
        originalUserId,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'JWTExpired') {
        throw new TokenExpiredError('Token expired');
      }

      throw new TokenInvalidError('Invalid SkillHubCore token');
    }
  }

  async verifySkillHubCoreRefreshToken(token: string): Promise<JWTPayload & { sub: string; family: string; iss: 'skillhubcore.in' }> {
    try {
      const { payload } = await jwtVerify(token, this.REFRESH_SECRET, { issuer: 'skillhubcore.in' });
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      const family = typeof (payload as { family?: unknown }).family === 'string'
        ? (payload as { family: string }).family.trim()
        : '';

      if (sub.length === 0 || family.length === 0) {
        throw new TokenInvalidError('Invalid SkillHubCore refresh token payload');
      }

      return payload as JWTPayload & { sub: string; family: string; iss: 'skillhubcore.in' };
    } catch (error) {
      if (error instanceof Error && error.name === 'JWTExpired') {
        throw new TokenExpiredError(error.message);
      }

      if (error instanceof TokenInvalidError) {
        throw error;
      }

      throw new TokenInvalidError(error instanceof Error ? error.message : 'Invalid SkillHubCore refresh token');
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

  static generateFamilyId(): string {
    return globalThis.crypto.randomUUID();
  }

  static generateRefreshToken(
    userId: string,
    isAdmin: boolean = false,
    audience: string = 'user',
    metadata?: { tokenType?: 'user' | 'admin'; brand?: string; originalUserId?: string; shadowUserId?: string },
  ) {
    return this.getInstance().generateRefreshToken(userId, isAdmin, audience, metadata);
  }

  static verifyUserAccessToken(token: string, options?: { audience?: string }) {
    return this.getInstance().verifyUserAccessToken(token, options);
  }

  static verifyAccessToken(token: string, options?: { audience?: string; isAdmin?: boolean }) {
    return this.getInstance().verifyAccessToken(token, options);
  }

  static verifySkillHubCoreJWT(token: string) {
    return this.getInstance().verifySkillHubCoreJWT(token);
  }

  static signSkillHubCoreAccessToken(
    userId: string,
    roles: string[],
    subscriptions: string[],
    platforms?: Array<'realtutorialhub' | 'skillup'>,
    metadata?: { originalUserId?: string; shadowUserId?: string; brand?: 'realtutorialhub' | 'skillup' },
  ) {
    return this.getInstance().signSkillHubCoreAccessToken(userId, roles, subscriptions, platforms, metadata);
  }

  static signSkillHubCoreRefreshToken(userId: string, familyId: string) {
    return this.getInstance().signSkillHubCoreRefreshToken(userId, familyId);
  }

  static verifySkillHubCoreRefreshToken(token: string) {
    return this.getInstance().verifySkillHubCoreRefreshToken(token);
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
