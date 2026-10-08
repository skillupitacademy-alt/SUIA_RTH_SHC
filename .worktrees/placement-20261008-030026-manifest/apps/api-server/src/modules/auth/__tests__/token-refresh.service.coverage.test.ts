import { describe, expect, it, vi } from "vitest";

import { TokenRefreshService } from "../token-refresh.service";

const hoist = vi.hoisted(() => ({
  decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, brand: "realtutorialhub" }),
}));

vi.mock("jose", () => ({
  decodeJwt: hoist.decodeJwt,
}));

describe("TokenRefreshService coverage", () => {
  it("uses user/admin specific verifiers when base verifyRefreshToken is absent", async () => {
    const tokenRepo = {
      findByHash: vi.fn().mockResolvedValue({ id: "t1", expiresAt: new Date(Date.now() + 10000) }),
      revokeAll: vi.fn(),
      revokeById: vi.fn().mockResolvedValue(undefined),
      createRefreshToken: vi.fn().mockResolvedValue(undefined),
    };
    const userRepo = {
      findByIdWithDetails: vi.fn().mockResolvedValue({
        id: "u1",
        email: "u@test.com",
        isBlocked: false,
        userRoles: [{ role: { name: "USER" } }],
      }),
      updateLastActive: vi.fn(),
    };
    const examRepo = { findActiveExam: vi.fn().mockResolvedValue(undefined) };
    const tokenService = {
      verifyUserRefreshToken: vi.fn().mockResolvedValue({ userId: "u1", isAdmin: false }),
      verifyAdminRefreshToken: vi.fn().mockResolvedValue({ userId: "u1", isAdmin: true }),
      hashToken: vi.fn().mockResolvedValue("hash"),
      generateAccessToken: vi.fn().mockResolvedValue("access"),
      generateRefreshToken: vi.fn().mockResolvedValue("refresh"),
    };
    const auditService = { log: vi.fn().mockResolvedValue(undefined) };

    const svc = new TokenRefreshService(
      tokenRepo as any,
      userRepo as any,
      examRepo as any,
      tokenService as any,
      auditService as any
    );

    const result = await svc.refresh("tok", "1.1.1.1", undefined, "user", "realtutorialhub");
    expect(result.accessToken).toBe("access");
    expect(tokenService.verifyUserRefreshToken).toHaveBeenCalled();
    expect(tokenService.verifyAdminRefreshToken).not.toHaveBeenCalled();
  });

  it("routes admin refresh through admin verifier when decodeJwt indicates admin", async () => {
    hoist.decodeJwt.mockReturnValueOnce({ isAdmin: true, brand: "realtutorialhub" });

    const tokenRepo = {
      findByHash: vi.fn().mockResolvedValue({ id: "t2", expiresAt: new Date(Date.now() + 10000) }),
      revokeById: vi.fn(),
      createRefreshToken: vi.fn(),
    };
    const userRepo = {
      findByIdWithDetails: vi.fn().mockResolvedValue({
        id: "admin1",
        email: "a@test.com",
        isBlocked: false,
        userRoles: [{ role: { name: "ADMIN" } }],
      }),
      updateLastActive: vi.fn(),
    };
    const examRepo = { findActiveExam: vi.fn().mockResolvedValue(undefined) };
    const tokenService = {
      verifyUserRefreshToken: vi.fn(),
      verifyAdminRefreshToken: vi.fn().mockResolvedValue({ userId: "admin1", isAdmin: true }),
      hashToken: vi.fn().mockResolvedValue("hash2"),
      generateAccessToken: vi.fn().mockResolvedValue("access2"),
      generateRefreshToken: vi.fn().mockResolvedValue("refresh2"),
    };
    const auditService = { log: vi.fn().mockResolvedValue(undefined) };

    const svc = new TokenRefreshService(
      tokenRepo as any,
      userRepo as any,
      examRepo as any,
      tokenService as any,
      auditService as any
    );

    const result = await svc.refresh("tok", undefined, undefined, "admin", "realtutorialhub");
    expect(result.refreshToken).toBe("refresh2");
    expect(tokenService.verifyAdminRefreshToken).toHaveBeenCalled();
    expect(tokenService.verifyUserRefreshToken).not.toHaveBeenCalled();
  });
});
