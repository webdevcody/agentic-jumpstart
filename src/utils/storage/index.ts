import type { IStorage } from "./storage.interface";
import { R2Storage } from "./r2";
import { MockStorage } from "./mock-storage";

let storage: IStorage | null = null;

type StorageType = "r2" | "mock";

// Storage provider factory/singleton
// - development/test: MockStorage (no R2 credentials needed)
// - production: R2Storage
export function getStorage(): { storage: IStorage; type: StorageType } {
  if (!storage) {
    const env = process.env.NODE_ENV;

    if (env === "development" || env === "test") {
      storage = new MockStorage();
      return { storage, type: "mock" };
    }

    storage = new R2Storage();
  }

  return { storage, type: storage instanceof MockStorage ? "mock" : "r2" };
}
