import type { IStorage, StreamFileResponse } from "./storage.interface";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export class R2Storage implements IStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET must be set"
      );
    }

    this.bucket = bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(key: string, data: Buffer, contentType: string = "video/mp4") {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });

    await this.client.send(command);
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async getStream(
    _key: string,
    _rangeHeader: string | null
  ): Promise<StreamFileResponse> {
    throw new Error(
      "getStream is not supported for R2. Use getPresignedUrl instead."
    );
  }

  async getPresignedUrl(key: string) {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: 60 * 60 } // 1 hour
    );
  }

  async getPresignedUploadUrl(key: string, contentType: string = "video/mp4") {
    return await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 60 * 60 } // 1 hour
    );
  }

  async getBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`No body returned for key: ${key}`);
    }

    // Convert the readable stream to a buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}

/**
 * Generates a quality variant key from a base video key
 * @param baseKey - The original video key (e.g., "abc123.mp4")
 * @param quality - The quality variant ("720p" or "480p")
 * @returns The quality variant key (e.g., "abc123_720p.mp4")
 */
export function getVideoQualityKey(
  baseKey: string,
  quality: "720p" | "480p"
): string {
  return baseKey.replace(".mp4", `_${quality}.mp4`);
}
