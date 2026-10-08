import { Receiver } from '@upstash/qstash';

let receiver: Receiver | null | undefined;

function getReceiver() {
  if (receiver !== undefined) {
    return receiver;
  }

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (
    typeof currentSigningKey !== 'string' ||
    currentSigningKey.trim() === '' ||
    typeof nextSigningKey !== 'string' ||
    nextSigningKey.trim() === ''
  ) {
    receiver = null;
    return receiver;
  }

  receiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
  return receiver;
}

export async function verifyQStashSignature(
  req: Request
): Promise<{ valid: boolean; body: string }> {
  const signature = req.headers.get('upstash-signature');
  if (signature === null || signature.trim() === '') {
    return { valid: false, body: '' };
  }
  const qstashReceiver = getReceiver();
  if (qstashReceiver === null) {
    return { valid: false, body: '' };
  }
  const body = await req.text();
  try {
    await qstashReceiver.verify({ signature: signature.trim(), body, clockTolerance: 60 });
    return { valid: true, body };
  } catch {
    return { valid: false, body: '' };
  }
}
