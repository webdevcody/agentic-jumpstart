import type { IStorage } from "./storage.interface";
import { R2Storage } from "./r2";

let storage: IStorage | null = null;

const isTest = process.env.IS_TEST === "true";

// Mock storage for CI tests (no actual R2 access)
class MockStorage implements IStorage {
  async upload(): Promise<void> {}
  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return false;
  }
  async getStream(): Promise<{ stream: ReadableStream; contentLength: number; contentType: string }> {
    throw new Error("Mock storage does not support streaming");
  }
  async getPresignedUrl(): Promise<string> {
    return "https://mock-storage.test/presigned-url";
  }
  async getPresignedUploadUrl(): Promise<string> {
    return "https://mock-storage.test/upload-url";
  }
  async getBuffer(): Promise<Buffer> {
    return Buffer.from("");
  }
}

// Storage provider factory/singleton - R2 only (mock in test mode)
export function getStorage(): { storage: IStorage; type: "r2" | "mock" } {
  if (!storage) {
    if (isTest) {
      storage = new MockStorage();
      return { storage, type: "mock" };
    }
    storage = new R2Storage();
  }

  return { storage, type: isTest ? "mock" : "r2" };
}
