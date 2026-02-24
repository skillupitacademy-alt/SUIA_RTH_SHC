import { del, put } from "@vercel/blob";

import { StorageProvider } from "./types";

export const blobStorage: StorageProvider = {
  async uploadReport(buffer, { userId, attemptId }) {
    // Standard fixed path for reports - clean and predictable
    const key = `reports/${userId}/${attemptId}.pdf`;

    const { url } = await put(key, buffer, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false, // Keep the exact name we specified
      allowOverwrite: true,    // Overwrite if it already exists (prevents the 400 error)
    });

    return url;
  },

  async getDownloadUrl(fileRef) {
    // Return our secure proxy URL instead of the direct private blob URL
    try {
      const url = new URL(fileRef);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const attemptId = fileName.split(".")[0];

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.realtutorialhub.com/api";
      return `${apiUrl}/reports/download?attemptId=${attemptId}`;
    } catch (_error) {
      return fileRef;
    }
  },

  async delete(fileRef) {
    await del(fileRef);
  }
};
