import { TokenService, type TokenPayload } from './token.service';

export async function verifyAccessToken(token: string, options?: { audience?: string; isAdmin?: boolean }): Promise<TokenPayload> {
  return TokenService.verifyAccessToken(token, options);
}
