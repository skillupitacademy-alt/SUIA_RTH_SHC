import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenService } from "../token.service";

const mocks = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
}));

vi.mock("jose", () => {
  class SignJWTMock {
    setProtectedHeader() { return this; }
    setAudience() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() { return Promise.resolve("signed"); }
  }

  return {
    jwtVerify: mocks.jwtVerify,
    SignJWT: SignJWTMock,
    decodeJwt: vi.fn(),
  };
});

describe("TokenService coverage additions", () => {
  const service = new TokenService();

  afterEach(() => {
    mocks.jwtVerify.mockReset();
  });

  it("verifyUserAccessToken enforces audience", async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["user"], userId: "u1" } });
    await expect(service.verifyUserAccessToken("t", { audience: "user" })).resolves.toMatchObject({ userId: "u1" });

    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["admin"] } });
    await expect(service.verifyUserAccessToken("t", { audience: "user" })).rejects.toThrow(/Audience mismatch/);
  });

  it("verifyAdminAccessToken rejects unexpected audience", async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["user"] } });
    await expect(service.verifyAdminAccessToken("t")).rejects.toThrow(/Audience violation/);

    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["infra"], userId: "u1" } });
    await expect(service.verifyAdminAccessToken("t", { audience: "infra" })).resolves.toMatchObject({ aud: ["infra"] });

    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["admin"] } });
    await expect(service.verifyAdminAccessToken("t", { audience: "infra" })).rejects.toThrow(/Audience mismatch/);
  });

  it("verifyAccessToken handles enforced audience and admin fallback", async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { aud: ["user"], userId: "u1" } });
    await expect(service.verifyAccessToken("t", { audience: "user" })).resolves.toMatchObject({ userId: "u1" });

    mocks.jwtVerify
      .mockResolvedValueOnce({ payload: { aud: ["admin"], userId: "u1" } })
      .mockResolvedValueOnce({ payload: { aud: ["infra"], userId: "u2" } });
    await expect(service.verifyAdminAccessToken("t")).resolves.toMatchObject({ aud: ["admin"] });
  });

  it("verifyRefreshToken variants return payloads", async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { userId: "u1", isAdmin: false } });
    await expect(service.verifyUserRefreshToken("t", { audience: "user" })).resolves.toMatchObject({ userId: "u1" });

    mocks.jwtVerify.mockResolvedValue({ payload: { userId: "u2", isAdmin: true } });
    await expect(service.verifyAdminRefreshToken("t", { audience: "admin" })).resolves.toMatchObject({ userId: "u2" });

    mocks.jwtVerify.mockResolvedValue({ payload: { userId: "u3", isAdmin: false } });
    await expect(service.verifyUserRefreshToken("t")).resolves.toMatchObject({ userId: "u3" });
  });

  it("static wrappers delegate to instance methods", async () => {
    const instance = TokenService as unknown as { singleton: TokenService | null };
    instance.singleton = service;

    const spyUser = vi.spyOn(service, "verifyUserAccessToken").mockResolvedValue({ userId: "u1" } as any);
    await expect(TokenService.verifyUserAccessToken("t")).resolves.toMatchObject({ userId: "u1" });
    expect(spyUser).toHaveBeenCalled();
    spyUser.mockRestore();

    const spyAdmin = vi.spyOn(service, "verifyAdminAccessToken").mockResolvedValue({ userId: "a1" } as any);
    await expect(TokenService.verifyAdminAccessToken("t")).resolves.toMatchObject({ userId: "a1" });
    expect(spyAdmin).toHaveBeenCalled();
    spyAdmin.mockRestore();

    const spyAdminRefresh = vi.spyOn(service, "verifyAdminRefreshToken").mockResolvedValue({ userId: "a2", isAdmin: true } as any);
    await expect(TokenService.verifyAdminRefreshToken("t")).resolves.toMatchObject({ userId: "a2" });
    expect(spyAdminRefresh).toHaveBeenCalled();
    spyAdminRefresh.mockRestore();

    const spyUserRefresh = vi.spyOn(service, "verifyUserRefreshToken").mockResolvedValue({ userId: "u4", isAdmin: false } as any);
    await expect(TokenService.verifyUserRefreshToken("t")).resolves.toMatchObject({ userId: "u4" });
    expect(spyUserRefresh).toHaveBeenCalled();
    spyUserRefresh.mockRestore();

    const spyRefresh = vi.spyOn(service, "verifyRefreshToken").mockResolvedValue({ userId: "u3", isAdmin: false } as any);
    await expect(TokenService.verifyRefreshToken("t")).resolves.toMatchObject({ userId: "u3" });
    expect(spyRefresh).toHaveBeenCalled();
    spyRefresh.mockRestore();
  });
});
