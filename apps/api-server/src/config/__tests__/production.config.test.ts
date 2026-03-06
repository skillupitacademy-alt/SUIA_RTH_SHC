import { describe, expect, it, vi } from 'vitest';

describe('production.config', () => {
  it('uses ALLOWED_ORIGINS when provided', async () => {
    const originalEnv = { ...process.env };
    process.env.ALLOWED_ORIGINS = ' https://a.test , https://b.test ';
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'https://web.test';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.test';

    vi.resetModules();
    const { config } = await import('../production.config');

    expect(config.cors.allowedOrigins).toEqual(['https://a.test', 'https://b.test']);
    expect(config.csrf.allowedOrigins).toEqual(['https://a.test', 'https://b.test']);
    process.env = originalEnv;
  });

  it('falls back to defaults and ignores empty cookie domain', async () => {
    const originalEnv = { ...process.env };
    delete process.env.ALLOWED_ORIGINS;
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'https://web.test';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.test';
    process.env.COOKIE_DOMAIN = '';

    vi.resetModules();
    const { config } = await import('../production.config');

    expect(config.cors.allowedOrigins).toEqual(['https://web.test', 'https://admin.test']);
    expect(config.csrf.cookieSettings.domain).toBeUndefined();
    process.env = originalEnv;
  });

  it('uses explicit cookie domain when provided', async () => {
    const originalEnv = { ...process.env };
    process.env.ALLOWED_ORIGINS = 'https://a.test';
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'https://web.test';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.test';
    process.env.COOKIE_DOMAIN = 'example.com';

    vi.resetModules();
    const { config } = await import('../production.config');

    expect(config.csrf.cookieSettings.domain).toBe('example.com');
    process.env = originalEnv;
  });
});
