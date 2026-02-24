import { del, put } from "@vercel/blob";

import { StorageProvider } from "./types";

export const blobStorage: StorageProvider = {
  async uploadReport(buffer, { userId, attemptId }) {
    // Standard path for reports
    const key = `reports/${userId}/${attemptId}.pdf`;

    const { url } = await put(key, buffer, {
      access: "private",
      contentType: "application/pdf",
    });

    return url;
  },

  async getDownloadUrl(fileRef) {
    // Vercel Blob URLs are public
    return fileRef;
  },

  async delete(fileRef) {
    await del(fileRef);
  }
};
