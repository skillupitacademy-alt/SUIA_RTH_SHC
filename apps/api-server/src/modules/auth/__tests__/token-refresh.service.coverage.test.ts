import { describe, expect, it, vi } from "vitest";

import { TokenRefreshService } from "../token-refresh.service";

const hoist = vi.hoisted(() => ({
  decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, brand: "realtutorialhub" }),
}));

vi.mock("jose", () => ({
  decodeJwt: hoist.decodeJwt,
}));

describe("TokenRefreshService coverage", () => {
  it("uses verifiers and successfully rotates user refresh tokens", async () => {
    const tokenRepo = {
      findByHash: vi.fn().mockResolvedValue({ id: "t1", expiresAt: new Date(Date.now() + 10000) }),
      revokeAll: vi.fn(),
      revokeById: vi.fn().mockResolvedValue(undefined),
      consumeToken: vi.fn().mockResolvedValue({ id: "t1", userId: "u1" }),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      createRefreshToken: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function (this: any) { return this; }),
    };
    const tokenService = {
      verifyRefreshToken: vi.fn().mockResolvedValue({ userId: "u1", isAdmin: false, aud: "user" }),
      hashToken: vi.fn().mockResolvedValue("hash"),
      generateAccessToken: vi.fn().mockResolvedValue("access"),
      generateRefreshToken: vi.fn().mockResolvedValue("refresh"),
    };
    const auditService = { log: vi.fn().mockResolvedValue(undefined) };

    const svc = new TokenRefreshService(
      tokenRepo as any,
      tokenService as any,
      auditService as any
    );

    const result = await svc.refresh("tok", "1.1.1.1", undefined, "user", "realtutorialhub");
    expect(result.accessToken).toBe("access");
    expect(tokenService.verifyRefreshToken).toHaveBeenCalled();
  });

  it("routes admin refresh and successfully generates admin tokens", async () => {
    hoist.decodeJwt.mockReturnValueOnce({ isAdmin: true, brand: "realtutorialhub" });

    const tokenRepo = {
      findByHash: vi.fn().mockResolvedValue({ id: "t2", expiresAt: new Date(Date.now() + 10000) }),
      revokeById: vi.fn(),
      consumeToken: vi.fn().mockResolvedValue({ id: "t2", userId: "admin1" }),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      createRefreshToken: vi.fn(),
      withDb: vi.fn(function (this: any) { return this; }),
    };
    const tokenService = {
      verifyRefreshToken: vi.fn().mockResolvedValue({ userId: "admin1", isAdmin: true, aud: "admin" }),
      hashToken: vi.fn().mockResolvedValue("hash2"),
      generateAccessToken: vi.fn().mockResolvedValue("access2"),
      generateRefreshToken: vi.fn().mockResolvedValue("refresh2"),
    };
    const auditService = { log: vi.fn().mockResolvedValue(undefined) };

    const svc = new TokenRefreshService(
      tokenRepo as any,
      tokenService as any,
      auditService as any
    );

    const result = await svc.refresh("tok", undefined, undefined, "admin", "realtutorialhub");
    expect(result.refreshToken).toBe("refresh2");
    expect(tokenService.verifyRefreshToken).toHaveBeenCalled();
  });
});
