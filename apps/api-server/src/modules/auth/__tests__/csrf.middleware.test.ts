import { describe, expect, it } from "vitest";

import { csrfProtection } from "../../auth/csrf.middleware";

describe("csrf middleware", () => {
  it("exempts export trigger from CSRF checks", async () => {
    const mockReq = {
      method: "POST",
      nextUrl: { pathname: "/api/export/trigger" },
      headers: new Map(),
      cookies: { get: () => undefined, has: () => false },
    };

    await expect(csrfProtection(mockReq as any)).resolves.toBeNull();
  });
});
