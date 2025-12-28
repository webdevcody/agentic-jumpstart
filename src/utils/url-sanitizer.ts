/**
 * Validates and sanitizes a URL for safe use in img src attributes.
 * Prevents XSS via javascript: or data: protocols.
 *
 * @param url - The URL to validate
 * @returns The original URL if safe, null if unsafe or invalid
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    return url;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Checks if a URL is safe for use in img src attributes.
 *
 * @param url - The URL to check
 * @returns True if the URL is safe
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  return sanitizeImageUrl(url) !== null;
}
