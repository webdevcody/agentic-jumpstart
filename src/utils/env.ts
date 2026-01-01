const isTest = process.env.IS_TEST === "true";

// Test fallbacks for CI environment where secrets aren't available
// In production, throws if env var is missing for fail-fast behavior
const testFallback = (
  value: string | undefined,
  fallback: string,
  name: string
): string => {
  if (isTest) {
    return value || fallback;
  }
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Helper for required env vars without test fallback
const required = (value: string | undefined, name: string): string => {
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  DATABASE_URL: isTest
    ? required(process.env.DATABASE_URL_TEST, "DATABASE_URL_TEST")
    : required(process.env.DATABASE_URL, "DATABASE_URL"),
  GOOGLE_CLIENT_ID: testFallback(process.env.GOOGLE_CLIENT_ID, "test-google-client-id", "GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: testFallback(process.env.GOOGLE_CLIENT_SECRET, "test-google-client-secret", "GOOGLE_CLIENT_SECRET"),
  HOST_NAME: required(process.env.HOST_NAME, "HOST_NAME"),
  NODE_ENV: required(process.env.NODE_ENV, "NODE_ENV"),
  STRIPE_SECRET_KEY: testFallback(process.env.STRIPE_SECRET_KEY, "sk_test_placeholder", "STRIPE_SECRET_KEY"),
  STRIPE_PRICE_ID: testFallback(process.env.STRIPE_PRICE_ID, "price_test_placeholder", "STRIPE_PRICE_ID"),
  STRIPE_WEBHOOK_SECRET: testFallback(process.env.STRIPE_WEBHOOK_SECRET, "whsec_test_placeholder", "STRIPE_WEBHOOK_SECRET"),
  STRIPE_DISCOUNT_COUPON_ID: process.env.STRIPE_DISCOUNT_COUPON_ID,
  RECAPTCHA_SECRET_KEY: testFallback(process.env.RECAPTCHA_SECRET_KEY, "test-recaptcha-secret", "RECAPTCHA_SECRET_KEY"),
  MAILING_LIST_ENDPOINT: testFallback(process.env.MAILING_LIST_ENDPOINT, "https://test.example.com/mailing", "MAILING_LIST_ENDPOINT"),
  MAILING_LIST_PASSWORD: testFallback(process.env.MAILING_LIST_PASSWORD, "test-mailing-password", "MAILING_LIST_PASSWORD"),
  AWS_SES_ACCESS_KEY_ID: testFallback(process.env.AWS_SES_ACCESS_KEY_ID, "test-ses-access-key", "AWS_SES_ACCESS_KEY_ID"),
  AWS_SES_SECRET_ACCESS_KEY: testFallback(process.env.AWS_SES_SECRET_ACCESS_KEY, "test-ses-secret-key", "AWS_SES_SECRET_ACCESS_KEY"),
  AWS_SES_REGION: process.env.AWS_SES_REGION || "us-east-1",
  FROM_EMAIL_ADDRESS: testFallback(process.env.FROM_EMAIL_ADDRESS, "test@example.com", "FROM_EMAIL_ADDRESS"),
  OPENAI_API_KEY: testFallback(process.env.OPENAI_API_KEY, "sk-test-placeholder", "OPENAI_API_KEY"),
};
