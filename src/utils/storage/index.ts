import { MockStorage } from "./mock-storage";
import { R2Storage } from "./r2";
import type { IStorage } from "./storage.interface";

let mockStorage: MockStorage | null = null;
let r2Storage: R2Storage | null = null;
let r2Available: boolean | null = null;
let devStoragePreference: StorageType | null = null;

export type StorageType = "r2" | "mock";

/**
 * Set dev storage preference (called by dev menu)
 */
export function setDevStoragePreference(mode: StorageType | null): void {
  devStoragePreference = mode;
}

/**
 * Check if R2 credentials are configured and valid
 */
export function isR2Available(): boolean {
  if (r2Available !== null) return r2Available;

  try {
    // Check if all required env vars are present
    const hasCredentials = !!(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
    );

    if (!hasCredentials) {
      r2Available = false;
      return false;
    }

    // Try to instantiate R2Storage - will throw if credentials invalid
    if (!r2Storage) {
      r2Storage = new R2Storage();
    }
    r2Available = true;
    return true;
  } catch (error) {
    console.log("[Storage] R2 not available:", error);
    r2Available = false;
    return false;
  }
}

/**
 * Get storage instance based on environment
 * - Production: always R2
 * - Development: uses devStoragePreference if set, otherwise mock
 */
export function getStorage(modeOverride?: StorageType): { storage: IStorage; type: StorageType } {
  const env = process.env.NODE_ENV;

  // Production always uses R2
  if (env !== "development" && env !== "test") {
    if (!r2Storage) {
      r2Storage = new R2Storage();
    }
    return { storage: r2Storage, type: "r2" };
  }

  // Use explicit override first, then dev preference
  const mode = modeOverride ?? devStoragePreference;

  // Development/test: use r2 if requested and available
  if (mode === "r2" && isR2Available()) {
    return { storage: r2Storage!, type: "r2" };
  }

  // Default to mock
  if (!mockStorage) {
    mockStorage = new MockStorage();
  }
  return { storage: mockStorage, type: "mock" };
}

/**
 * Reset storage instances (useful for testing or after preference change)
 */
export function resetStorageInstances(): void {
  mockStorage = null;
  r2Storage = null;
  r2Available = null;
}
