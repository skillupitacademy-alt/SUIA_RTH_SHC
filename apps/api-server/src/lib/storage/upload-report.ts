import { storage } from "./index";

export async function uploadReport(
  buffer: Buffer,
  userId: string,
  attemptId: string
) {
  return storage.uploadReport(buffer, { userId, attemptId });
}
