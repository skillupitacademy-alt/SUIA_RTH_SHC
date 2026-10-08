import { storage } from "./index";

export async function getDownloadUrl(fileRef: string) {
  return storage.getDownloadUrl(fileRef);
}
