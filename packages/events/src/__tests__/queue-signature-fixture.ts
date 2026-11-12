// Structurally valid destination for tests that explicitly mock the verifier.
// Cryptographic tests sign their own JWTs and use the real QStash Receiver.
export const queueSignatureFixture = `header.${Buffer.from(JSON.stringify({ sub: 'https://isolated.invalid/' })).toString('base64url')}.signature`;
