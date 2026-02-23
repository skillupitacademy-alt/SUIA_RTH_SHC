import { blobStorage } from "./blob";
import { r2Storage } from "./r2";

// Choose provider based on environment variable
// Defaults to blob (Vercel)
export const storage =
  process.env.STORAGE_PROVIDER === "r2"
    ? r2Storage
    : blobStorage;
