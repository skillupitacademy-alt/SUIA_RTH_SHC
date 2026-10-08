import { describe, it, expect, vi, beforeEach } from "vitest";

import { UsageService } from "../usage.service";

describe("UsageService Cloudflare success path", () => {
  beforeEach(() => {
    process.env.CLOUDFLARE_API_TOKEN = "token";
    process.env.CLOUDFLARE_ZONE_ID = "zone";
  });

  it("returns ok status when fetch succeeds", async () => {
    const fakeJson = {
      data: {
        viewer: {
          zones: [
            {
              httpRequests1dGroups: [
                { sum: { requests: 10, bytes: 2048 } },
              ],
            },
          ],
        },
      },
    };

    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeJson),
      } as any)
    );

    const res = await (UsageService as any).getCloudflareStats();
    expect(res.status).toBe("ok");
    expect(res.metrics?.bytes24h).toBe(2048);
    vi.unstubAllGlobals();
  });
});
