import { describe, expect, it } from 'vitest';
import { resolveTrustedRequestBrand } from '../request-brand';

function context(url: string, headers: Record<string, string>, expected = 'disposable-gateway-key') {
  const values = new Headers(headers);
  return { env: { INTERNAL_GATEWAY_SECRET: expected }, req: { url, header: (name: string) => values.get(name) ?? undefined } } as never;
}
describe('gateway trusted host resolution', () => {
  it('uses the external request host despite forged forwarded host and brand', () => {
    expect(resolveTrustedRequestBrand(context('https://user.realtutorialhub.com/path', { 'x-forwarded-host': 'user.skillupitacademy.com', 'x-brand': 'skillup' }))).toMatchObject({ brand: 'realtutorialhub', source: 'gateway-hostname' });
  });
  it('accepts forwarded host only with its configured internal gateway secret', () => {
    expect(resolveTrustedRequestBrand(context('https://common.example.test/path', { 'x-forwarded-host': 'user.skillupitacademy.com', 'x-internal-secret': 'disposable-gateway-key' }))).toMatchObject({ brand: 'skillup', source: 'trusted-original-host' });
    expect(resolveTrustedRequestBrand(context('https://common.example.test/path', { 'x-forwarded-host': 'user.skillupitacademy.com', 'x-internal-secret': 'invalid' }))).toBeUndefined();
    expect(resolveTrustedRequestBrand(context('https://common.example.test/path', { 'x-forwarded-host': 'user.skillupitacademy.com' }, ''))).toBeUndefined();
  });
});
