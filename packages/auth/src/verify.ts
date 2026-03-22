import { TokenService, type SkillHubCoreTokenPayload, type TokenPayload } from './token.service';

export async function verifyAccessToken(token: string, options?: { audience?: string; isAdmin?: boolean }): Promise<TokenPayload> {
  return TokenService.verifyAccessToken(token, options);
}

export async function verifySkillHubCoreJWT(token: string): Promise<SkillHubCoreTokenPayload> {
  return TokenService.verifySkillHubCoreJWT(token);
}
