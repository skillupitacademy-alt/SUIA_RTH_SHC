export interface UploadParams {
  userId: string;
  attemptId: string;
  /**
   * Optional basename override for the stored report file.
   * Defaults to attemptId, keeping legacy behavior.
   *
   * Example: `${attemptId}-student-insight`
   */
  fileBasename?: string;
}

export interface StorageProvider {
  uploadReport(buffer: Buffer, params: UploadParams): Promise<string>;
  getDownloadUrl(fileRef: string): Promise<string>;
  exists(fileRef: string): Promise<boolean>;
  delete?(fileRef: string): Promise<void>;
}
