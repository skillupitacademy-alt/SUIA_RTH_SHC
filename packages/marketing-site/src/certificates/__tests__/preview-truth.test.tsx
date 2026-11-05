import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('../CertificateQr', () => ({ CertificateQr: ({ value }: { value: string }) => <span data-qr={value} /> }));
import { PremiumCertificate } from '../PremiumCertificate';
import { buildPreviewCertificateData } from '../branding';
import type { CertificateBranding } from '../types';

const branding: CertificateBranding = {
  brandId: 'skillupitacademy', brandName: 'Fixture', brandShortName: 'FIX', tagline: 'LEARN • GROW',
  primaryColor: '#111111', secondaryColor: '#222222', logoSrc: '/logo', sealLogoSrc: '/seal',
  verificationBaseUrl: 'https://example.invalid/verify',
};
const data = buildPreviewCertificateData(branding);

describe('certificate preview canvas truth', () => {
  it('marks the exportable preview and suppresses its invented verification URL', () => {
    const markup = renderToStaticMarkup(<PremiumCertificate branding={branding} data={data} isPreview fitToViewport={false} />);
    expect(markup).toContain('SAMPLE — NOT ISSUED');
    expect(markup).toContain('Sample preview; verification unavailable');
    expect(markup).not.toContain(data.verificationUrl);
    expect(markup).not.toContain('data-qr');
  });
  it('preserves the generic renderer verification presentation', () => {
    const markup = renderToStaticMarkup(<PremiumCertificate branding={branding} data={data} fitToViewport={false} />);
    expect(markup).not.toContain('SAMPLE — NOT ISSUED');
    expect(markup).toContain(data.verificationUrl);
    expect(markup).toContain('data-qr');
  });
});
