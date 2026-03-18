import { r2Storage } from "./r2";

// Cloud Run now uses R2 exclusively for report/export storage.
export const storage = r2Storage;
