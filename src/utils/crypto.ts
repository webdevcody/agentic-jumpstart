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
