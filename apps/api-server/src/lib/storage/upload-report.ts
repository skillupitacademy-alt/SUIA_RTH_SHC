import { storage } from "./index";

export async function uploadReport(
  buffer: Buffer,
  userId: string,
  attemptId: string,
  options?: { fileBasename?: string }
) {
  return storage.uploadReport(buffer, { userId, attemptId, fileBasename: options?.fileBasename });
}
