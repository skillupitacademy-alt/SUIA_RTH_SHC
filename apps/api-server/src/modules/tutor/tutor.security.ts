import { createHmac, timingSafeEqual } from "node:crypto";

export class TutorSecurityService {
  private static readonly SECRET =
    typeof process.env.AUTH_SECRET === "string" && process.env.AUTH_SECRET.length > 0
      ? process.env.AUTH_SECRET
      : "tutor-notes-secret-key-123";

  /**
   * Generates a signed URL for a specific topic note.
   * @param topicId The unique ID of the topic.
   * @param expiresAt Unix timestamp (seconds) when the URL expires.
   */
  static signNotesUrl(topicId: string, expiresAt: number): string {
    const data = `${topicId}:${expiresAt}`;
    const signature = createHmac("sha256", this.SECRET)
      .update(data)
      .digest("hex");

    // Return the query params that should be attached
    return `expires=${expiresAt}&signature=${signature}`;
  }

  /**
   * Verifies if a signature for a topicId and expiration is valid.
   */
  static verifySignature(topicId: string, expires: string, signature: string): boolean {
    const expiresNum = parseInt(expires, 10);
    if (isNaN(expiresNum) || expiresNum < Math.floor(Date.now() / 1000)) {
      return false;
    }

    const expectedData = `${topicId}:${expires}`;
    const expectedSignature = createHmac("sha256", this.SECRET)
      .update(expectedData)
      .digest("hex");

    try {
      return timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch {
      return false;
    }
  }
}
