import type { IStorage, StreamFileResponse } from "./storage.interface";

/**
 * Mock storage for development when R2/S3 is unavailable.
 * Returns placeholder video/image URLs (no referrer restrictions).
 */
export class MockStorage implements IStorage {
  // Free sample videos from Google (~2MB each, fast loading)
  private readonly SAMPLE_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  ];

  // Thumbnail images from Unsplash (tech/coding themed)
  private readonly SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop", // code on screen
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&h=360&fit=crop", // laptop coding
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop", // code editor
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop", // programming
  ];

  // Store "uploaded" files in memory
  private readonly files = new Map<string, { data: Buffer; contentType: string }>();

  private isImageKey(key: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(key) || key.includes("_thumb");
  }

  private getConsistentIndex(key: string, arrayLength: number): number {
    // Use key hash for consistent results (same key = same video/image)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % arrayLength;
  }

  async upload(key: string, data: Buffer, contentType: string = "video/mp4") {
    console.log(`[MockStorage] Simulated upload: ${key} (${data.length} bytes)`);
    this.files.set(key, { data, contentType });
  }

  async delete(key: string) {
    console.log(`[MockStorage] Simulated delete: ${key}`);
    this.files.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }

  async getStream(
    key: string,
    rangeHeader: string | null
  ): Promise<StreamFileResponse> {
    throw new Error(
      "[MockStorage] getStream not supported. Use getPresignedUrl instead."
    );
  }

  async getPresignedUrl(key: string): Promise<string> {
    if (this.isImageKey(key)) {
      const index = this.getConsistentIndex(key, this.SAMPLE_IMAGES.length);
      const url = this.SAMPLE_IMAGES[index];
      console.log(`[MockStorage] Image: ${key} -> index ${index} -> ${url.split('/').pop()}`);
      return url;
    }

    const index = this.getConsistentIndex(key, this.SAMPLE_VIDEOS.length);
    const url = this.SAMPLE_VIDEOS[index];
    console.log(`[MockStorage] Video: ${key} -> index ${index} -> ${url.split('/').pop()}`);
    return url;
  }

  async getPresignedUploadUrl(key: string, contentType: string = "video/mp4"): Promise<string> {
    console.log(`[MockStorage] Returning mock upload URL for: ${key}`);
    return `http://localhost:4000/api/mock-upload?key=${encodeURIComponent(key)}`;
  }

  async getBuffer(key: string): Promise<Buffer> {
    const file = this.files.get(key);
    if (file) {
      return file.data;
    }
    console.log(`[MockStorage] Returning empty buffer for: ${key}`);
    return Buffer.alloc(0);
  }
}
