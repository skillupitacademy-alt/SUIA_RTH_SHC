import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as sign } from "@aws-sdk/s3-request-presigner";

import { StorageProvider } from "./types";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

export const r2Storage: StorageProvider = {
  async uploadObject(buffer, { key, contentType }) {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return key;
  },

  async uploadReport(buffer, { userId, attemptId, fileBasename }) {
    const basename = (typeof fileBasename === 'string' && fileBasename.trim() !== '') ? fileBasename.trim() : attemptId;
    const key = `reports/${userId}/${basename}.pdf`;
    return await this.uploadObject(buffer, { key, contentType: "application/pdf" });
  },

  async exists(fileRef) {
    try {
      await r2.send(
        new HeadObjectCommand({
          Bucket: BUCKET,
          Key: fileRef,
        })
      );
      return true;
    } catch {
      return false;
    }
  },

  async getDownloadUrl(fileRef) {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: fileRef,
    });

    // Casting the client sidesteps duplicate @smithy/types versions that make
    // the presigner's Client type incompatible with our S3Client instance.
    // Runtime behavior is unaffected because the presigner only calls send().
    return await sign(r2 as unknown as S3Client, command, { expiresIn: 3600 });
  },

  async getReadUrl(fileRef) {
    return await this.getDownloadUrl(fileRef);
  },

  async delete(fileRef) {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: fileRef,
      })
    );
  }
};
