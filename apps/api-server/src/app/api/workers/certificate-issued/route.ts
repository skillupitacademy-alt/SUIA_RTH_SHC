import { createQStashHandler, PlatformEventTypes } from '@quiz/events';

import { CertificateDeliveryService } from '@/modules/certificates/certificate-delivery.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = createQStashHandler(PlatformEventTypes.CERTIFICATE_ISSUED, async (envelope) => {
  const payload = envelope.data as {
    certificateId: string;
    userId: string;
    issuedAt: string;
  };

  await CertificateDeliveryService.getInstance().deliverIssuedCertificate({
    certificateId: payload.certificateId,
    userId: payload.userId,
    issuedAt: payload.issuedAt,
  });
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
