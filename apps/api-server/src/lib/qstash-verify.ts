import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function verifyQStashSignature(
  req: Request
): Promise<{ valid: boolean; body: string }> {
  const signature = req.headers.get('upstash-signature');
  if (signature === null || signature.trim() === '') {
    return { valid: false, body: '' };
  }
  const body = await req.text();
  try {
    await receiver.verify({ signature: signature.trim(), body });
    return { valid: true, body };
  } catch {
    return { valid: false, body: '' };
  }
}
