export interface UploadParams {
  userId: string;
  attemptId: string;
}

export interface StorageProvider {
  uploadReport(buffer: Buffer, params: UploadParams): Promise<string>;
  getDownloadUrl(fileRef: string): Promise<string>;
  exists(fileRef: string): Promise<boolean>;
  delete?(fileRef: string): Promise<void>;
}
