import {
  createOrUpdateAnalyticsSession,
  trackAnalyticsEvent,
} from "~/data-access/analytics";
import { getAuthenticatedUser } from "~/utils/auth";
import crypto from "crypto";
import { HTTPHeaderName } from "@tanstack/react-start/server";

// Generate session ID from user agent, IP, and timestamp
export function generateSessionId(
  userAgent?: string,
  ipAddress?: string
): string {
  const timestamp = Date.now();
  const data = `${userAgent || "unknown"}_${ipAddress || "unknown"}_${timestamp}`;
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 32);
}

// Hash IP address for privacy
export function hashIpAddress(ipAddress?: string): string {
  if (!ipAddress) return "";
  return crypto.createHash("sha256").update(ipAddress).digest("hex");
}

// Extract UTM parameters from URL
export function extractUtmParams(url: string) {
  const urlObj = new URL(url); // Base URL needed for relative URLs
  return {
    utmSource: urlObj.searchParams.get("utm_source") || undefined,
    utmMedium: urlObj.searchParams.get("utm_medium") || undefined,
    utmCampaign: urlObj.searchParams.get("utm_campaign") || undefined,
    utmContent: urlObj.searchParams.get("utm_content") || undefined,
    utmTerm: urlObj.searchParams.get("utm_term") || undefined,
  };
}

// Extract referrer source (domain)
export function extractReferrerSource(referrer?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

// Track page view
export async function trackPageView({
  headers,
  url,
  sessionId,
  pagePath,
}: {
  headers: Partial<Record<HTTPHeaderName, string | undefined>>;
  url: string;
  sessionId: string;
  pagePath: string;
}) {
  const userAgent = headers["User-Agent"] || undefined;
  const referrer = headers["Referer"] || undefined;
  const ipAddress =
    headers["X-Forwarded-For"] || headers["X-Real-IP"] || undefined;

  const utmParams = extractUtmParams(url);
  const referrerSource = extractReferrerSource(referrer);
  const ipAddressHash = hashIpAddress(ipAddress);

  // Create or update session
  await createOrUpdateAnalyticsSession({
    sessionId,
    utmParams,
    referrerSource,
  });

  // Track page view event
  return trackAnalyticsEvent({
    sessionId,
    eventType: "page_view",
    pagePath,
    referrer,
    userAgent,
    ipAddressHash,
    utmParams,
  });
}

// Track purchase intent (button click)
export async function trackPurchaseIntent({
  headers,
  sessionId,
  buttonType = "purchase_button",
}: {
  headers: Partial<Record<HTTPHeaderName, string | undefined>>;
  sessionId: string;
  buttonType?: string;
}) {
  const user = await getAuthenticatedUser();
  const userId = user?.id;
  const userAgent = headers["User-Agent"] || undefined;
  const ipAddress =
    headers["X-Forwarded-For"] || headers["X-Real-IP"] || undefined;
  const ipAddressHash = hashIpAddress(ipAddress);

  return trackAnalyticsEvent({
    sessionId,
    eventType: "purchase_intent",
    pagePath: "/purchase",
    userAgent,
    ipAddressHash,
    metadata: { buttonType },
  });
}

// Track purchase completion
export async function trackPurchaseCompleted({
  sessionId,
  userId,
  amount,
  stripeSessionId,
  affiliateCode,
}: {
  sessionId: string;
  userId: number;
  amount: number;
  stripeSessionId: string;
  affiliateCode?: string;
}) {
  return trackAnalyticsEvent({
    sessionId,
    eventType: "purchase_completed",
    pagePath: "/success",
    metadata: {
      amount,
      stripeSessionId,
      affiliateCode,
    },
  });
}

// Track course access
export async function trackCourseAccess({
  request,
  sessionId,
  courseSlug,
}: {
  request: Request;
  sessionId: string;
  courseSlug: string;
}) {
  const user = await getAuthenticatedUser();
  const userId = user?.id;
  const userAgent = request.headers.get("User-Agent") || undefined;
  const ipAddress =
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("X-Real-IP") ||
    undefined;
  const ipAddressHash = hashIpAddress(ipAddress);

  return trackAnalyticsEvent({
    sessionId,
    userId,
    eventType: "course_access",
    pagePath: `/learn/${courseSlug}`,
    userAgent,
    ipAddressHash,
    metadata: { courseSlug },
  });
}
