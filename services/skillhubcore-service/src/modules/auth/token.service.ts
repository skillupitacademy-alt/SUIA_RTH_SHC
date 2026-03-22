import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import type { AccessTokenPayload, RefreshTokenPayload, PlatformName, UserRole } from './auth.types';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

const toSecret = (value: string | undefined, fallback: string): Uint8Array => {
  const raw = value !== undefined && value.trim().length > 0 ? value : fallback;
  return new TextEncoder().encode(raw);
};

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

export class TokenService {
  constructor(
    private readonly accessSecret = toSecret(process.env.JWT_SECRET, 'test-access-secret'),
    private readonly refreshSecret = toSecret(process.env.JWT_REFRESH_SECRET, 'test-refresh-secret')
  ) {}

  private ensureDifferentSecrets(): void {
    if (Buffer.from(this.accessSecret).toString('hex') === Buffer.from(this.refreshSecret).toString('hex')) {
      throw new TokenInvalidError('JWT secret and refresh secret must differ');
    }
  }

  async signAccessToken(
    userId: string,
    roles: UserRole[],
    subscriptions: string[],
    platforms: PlatformName[] = ['realtutorialhub']
  ): Promise<string> {
    this.ensureDifferentSecrets();
    return new SignJWT({
      sub: userId,
      roles,
      subscriptions,
      platforms,
    } as Omit<AccessTokenPayload, 'iat' | 'exp' | 'iss'>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setJti(globalThis.crypto.randomUUID())
      .setExpirationTime(ACCESS_TOKEN_TTL)
      .sign(this.accessSecret);
  }

  async signRefreshToken(userId: string, familyId: string): Promise<string> {
    this.ensureDifferentSecrets();
    return new SignJWT({
      sub: userId,
      family: familyId,
    } as Omit<RefreshTokenPayload, 'iat' | 'exp' | 'iss'>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setJti(globalThis.crypto.randomUUID())
      .setExpirationTime(REFRESH_TOKEN_TTL)
      .sign(this.refreshSecret);
  }

  async verifyToken(token: string): Promise<AccessTokenPayload | RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret, { issuer: 'skillhubcore.in' });
      return payload as unknown as AccessTokenPayload;
    } catch (error) {
      if (error instanceof Error && error.name === 'JWTExpired') {
        throw new TokenExpiredError(error.message);
      }

      try {
        const { payload } = await jwtVerify(token, this.refreshSecret, { issuer: 'skillhubcore.in' });
        return payload as unknown as RefreshTokenPayload;
      } catch (refreshError) {
        if (refreshError instanceof Error && refreshError.name === 'JWTExpired') {
          throw new TokenExpiredError(refreshError.message);
        }
        throw new TokenInvalidError(refreshError instanceof Error ? refreshError.message : 'Token invalid');
      }
    }
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.verifyToken(token);
    if (!('subscriptions' in payload)) {
      throw new TokenInvalidError('Access token required');
    }
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.verifyToken(token);
    if (!('family' in payload)) {
      throw new TokenInvalidError('Refresh token required');
    }
    return payload;
  }

  static generateFamilyId(): string {
    return globalThis.crypto.randomUUID();
  }

  static isAccessTokenPayload(payload: JWTPayload): payload is JWTPayload & AccessTokenPayload {
    const candidate = payload as unknown as AccessTokenPayload;
    return Array.isArray(candidate.roles) && Array.isArray(candidate.subscriptions);
  }
}
