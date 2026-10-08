import { Receiver, SignatureError } from '@upstash/qstash';

const getReceiver = () => {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (
    typeof currentSigningKey !== 'string' || currentSigningKey.trim().length === 0 ||
    typeof nextSigningKey !== 'string' || nextSigningKey.trim().length === 0
  ) {
    throw new Error('QStash signing keys are required to verify worker requests');
  }

  return new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
};

export async function verifyQStashRequest(request: Request): Promise<string> {
  const signature = request.headers.get('upstash-signature');
  if (signature === null || signature.trim().length === 0) {
    throw new SignatureError('Missing QStash signature');
  }

  const body = await request.text();
  await getReceiver().verify({
    signature: signature.trim(),
    body,
    clockTolerance: 60,
  });

  return body;
}
