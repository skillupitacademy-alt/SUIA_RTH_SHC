import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRE = '15m';
const REFRESH_TOKEN_EXPIRE = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export class TokenService {
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET!;
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, this.REFRESH_SECRET) as { userId: string };
  }
}
