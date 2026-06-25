import { afterEach, describe, expect, it, vi } from 'vitest';

import { main, normalizeBaseUrl, readRuntimeConfig } from './test-marketing-hybrid-deployment.mjs';

const baseEnv = {
  MARKETING_VALIDATION_SHC_BASE_URL: 'https://shc.example.com/',
  MARKETING_VALIDATION_COLLECTOR_BASE_URL: 'https://collector.example.com/',
  MARKETING_VALIDATION_RTH_SITE_URL: 'https://www.realtutorialhub.com/',
  MARKETING_VALIDATION_SUIA_SITE_URL: 'https://www.skillupitacademy.com/',
  MARKETING_VALIDATION_ANALYTICS_ADMIN_TOKEN: 'token-123',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('marketing hybrid deployment validator', () => {
  it('normalizes configured base URLs', () => {
    expect(normalizeBaseUrl('https://example.com///')).toBe('https://example.com');
  });

  it('rejects missing required env keys', () => {
    expect(() => readRuntimeConfig({ ...baseEnv, MARKETING_VALIDATION_SHC_BASE_URL: '' })).toThrow(
      'missing_required_env:MARKETING_VALIDATION_SHC_BASE_URL',
    );
  });

  it('passes the happy path against mocked services', async () => {
    const fetchMock = vi.fn(async (url, init = {}) => {
      if (url === 'https://shc.example.com/healthz') {
        return Response.json({ status: 'ok' });
      }

      if (url === 'https://shc.example.com/public/marketing/bootstrap/realtutorialhub') {
        return Response.json({
          content: {
            brandId: 'realtutorialhub',
            navigation: { navItems: [] },
            contact: {
              config: { phoneNumber: '+91-9999999999' },
              info: [],
            },
          },
          controlPlane: {
            experiments: [{ key: 'home-hero', enabled: true }],
          },
        });
      }

      if (url === 'https://shc.example.com/public/marketing/bootstrap/skillupitacademy') {
        return Response.json({
          content: {
            brandId: 'skillupitacademy',
            navigation: { navItems: [] },
            contact: {
              config: { phoneNumber: '+91-8888888888' },
              info: [],
            },
          },
          controlPlane: {
            experiments: [{ key: 'home-hero', enabled: true }],
          },
        });
      }

      if (url === 'https://shc.example.com/public/marketing/control-plane/realtutorialhub') {
        return Response.json({
          experiments: [{ key: 'home-hero', enabled: true }],
          personalization: { deviceHintsEnabled: true, campaignHintsEnabled: true, geoHintsEnabled: false },
        });
      }

      if (url === 'https://shc.example.com/public/marketing/control-plane/skillupitacademy') {
        return Response.json({
          experiments: [{ key: 'home-hero', enabled: true }],
          personalization: { deviceHintsEnabled: true, campaignHintsEnabled: true, geoHintsEnabled: false },
        });
      }

      if (url === 'https://shc.example.com/public/marketing/courses') {
        return Response.json({
          categories: ['Analytics'],
          courses: [{ slug: 'data-analyst' }],
        });
      }

      if (url === 'https://shc.example.com/public/marketing/courses/data-analyst') {
        return Response.json({
          course: { slug: 'data-analyst' },
        });
      }

      if (url === 'https://collector.example.com/healthz') {
        return Response.json({ status: 'ok' });
      }

      if (url === 'https://collector.example.com/track') {
        expect(init.method).toBe('POST');
        return new Response(JSON.stringify({ ok: true, eventId: 'evt_1' }), {
          status: 202,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (url === 'https://collector.example.com/observability') {
        expect(init.headers.authorization).toBe('Bearer token-123');
        return Response.json({
          ok: true,
          state: {
            deadLetterDepth: 0,
            queuedEvents: 0,
          },
        });
      }

      if (
        url ===
        'https://www.realtutorialhub.com/?utm_source=deployment-validation&utm_medium=script&utm_campaign=hybrid-rollout'
      ) {
        return new Response('<html><body>RTH</body></html>', {
          status: 200,
          headers: {
            'x-brand': 'realtutorialhub',
            'x-device-type': 'mobile',
            'x-experiment-home-hero': 'control',
            'x-personalization-hints': 'campaign,device,experiment',
            'set-cookie': 'shc_exp_home_hero=control; Path=/, shc_attr=test; Path=/',
          },
        });
      }

      if (url === 'https://www.realtutorialhub.com/courses/data-analyst') {
        return new Response('<html><body>RTH course</body></html>', {
          status: 200,
          headers: {
            'x-brand': 'realtutorialhub',
            'x-experiment-home-hero': 'control',
          },
        });
      }

      if (
        url ===
        'https://www.skillupitacademy.com/?utm_source=deployment-validation&utm_medium=script&utm_campaign=hybrid-rollout'
      ) {
        return new Response('<html><body>SUIA</body></html>', {
          status: 200,
          headers: {
            'x-brand': 'skillupitacademy',
            'x-device-type': 'mobile',
            'x-experiment-home-hero': 'variant-a',
            'x-personalization-hints': 'campaign,device,experiment',
            'set-cookie': 'shc_exp_home_hero=variant-a; Path=/, shc_attr=test; Path=/',
          },
        });
      }

      if (url === 'https://www.skillupitacademy.com/courses/data-analyst') {
        return new Response('<html><body>SUIA course</body></html>', {
          status: 200,
          headers: {
            'x-brand': 'skillupitacademy',
            'x-experiment-home-hero': 'variant-a',
          },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(main(baseEnv)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });
});
