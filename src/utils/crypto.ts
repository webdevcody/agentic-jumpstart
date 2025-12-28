import { createHmac, timingSafeEqual } from "crypto";
import { env } from "~/utils/env";

/**
 * Compares two strings in constant time to prevent timing attacks.
 * Returns false if either string is null/undefined or if lengths differ.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal
 */
export function timingSafeStringEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (a == null || b == null) {
    return false;
  }

  // Convert to buffers with consistent encoding
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");

  // timingSafeEqual requires equal-length buffers
  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Generates a cryptographically secure random state token for CSRF protection.
 *
 * This function creates a 64-character hexadecimal string using the Web Crypto API,
 * suitable for use as a CSRF state parameter in OAuth flows.
 *
 * @returns A 64-character hexadecimal string
 */
export function generateCsrfState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Signs data with HMAC-SHA256 using a dedicated token signing secret.
 * Used for creating secure, verifiable tokens (e.g., unsubscribe links).
 *
 * @param data - The data to sign
 * @returns Base64url-encoded signature
 */
export function signData(data: string): string {
  // Use dedicated TOKEN_SIGNING_SECRET for signing (independent of Stripe)
  const secret = env.TOKEN_SIGNING_SECRET;
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("base64url");
}

/**
 * Verifies a signature against the original data.
 *
 * @param data - The original data that was signed
 * @param signature - The signature to verify
 * @returns True if the signature is valid
 */
export function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = signData(data);
  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Creates a signed token containing userId and expiration timestamp.
 * Format: base64url(userId:expiration):signature
 *
 * @param userId - The user ID to encode
 * @param expirationDays - Number of days until token expires (default: 30)
 * @returns Signed token string
 */
export function createSignedUnsubscribeToken(
  userId: number,
  expirationDays: number = 30
): string {
  const expiration = Date.now() + expirationDays * 24 * 60 * 60 * 1000;
  const payload = `${userId}:${expiration}`;
  const signature = signData(payload);
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed unsubscribe token.
 *
 * @param token - The token to verify
 * @returns The userId if valid and not expired, null otherwise
 */
export function verifyUnsubscribeToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  let payload: string;

  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  // Verify signature
  if (!verifySignature(payload, signature)) {
    return null;
  }

  // Parse payload
  const payloadParts = payload.split(":");
  if (payloadParts.length !== 2) {
    return null;
  }

  const userId = parseInt(payloadParts[0], 10);
  const expiration = parseInt(payloadParts[1], 10);

  if (isNaN(userId) || isNaN(expiration)) {
    return null;
  }

  // Check expiration
  if (Date.now() > expiration) {
    return null;
  }

  return userId;
}
