import { del, put } from "@vercel/blob";

import { StorageProvider } from "./types";

export const blobStorage: StorageProvider = {
  async uploadObject(buffer, { key, contentType }) {
    const { url } = await put(key, buffer, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return url;
  },

  async uploadReport(buffer, { userId, attemptId, fileBasename }) {
    // Standard fixed path for reports - clean and predictable
    const basename = (typeof fileBasename === 'string' && fileBasename.trim() !== '') ? fileBasename.trim() : attemptId;
    const key = `reports/${userId}/${basename}.pdf`;
    return await this.uploadObject(buffer, { key, contentType: "application/pdf" });
  },

  async exists(fileRef) {
    try {
      const { head } = await import("@vercel/blob");
      await head(fileRef);
      return true;
    } catch {
      return false;
    }
  },

  async getDownloadUrl(fileRef) {
    // Return our secure proxy URL instead of the direct private blob URL
    try {
      const url = new URL(fileRef);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      // Filenames may be suffixed (e.g. "{attemptId}-student-infograph-report.pdf").
      // The download proxy expects the raw attemptId UUID.
      const uuidMatch = fileName.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const attemptId = uuidMatch?.[0] ?? fileName.split(".")[0];

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl === undefined || apiUrl === "") return fileRef;
      return `${apiUrl}/reports/download?attemptId=${attemptId}`;
    } catch (_error) {
      return fileRef;
    }
  },

  async getReadUrl(fileRef) {
    return fileRef;
  },

  async delete(fileRef) {
    await del(fileRef);
  }
};
