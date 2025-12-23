const isTest = process.env.IS_TEST === "true";

// Test fallbacks for CI environment where secrets aren't available
const testFallback = (value: string | undefined, fallback: string): string =>
  isTest ? (value || fallback) : value!;

export const env = {
  DATABASE_URL: isTest
    ? process.env.DATABASE_URL_TEST!
    : process.env.DATABASE_URL!,
  GOOGLE_CLIENT_ID: testFallback(process.env.GOOGLE_CLIENT_ID, "test-google-client-id"),
  GOOGLE_CLIENT_SECRET: testFallback(process.env.GOOGLE_CLIENT_SECRET, "test-google-client-secret"),
  HOST_NAME: process.env.HOST_NAME!,
  NODE_ENV: process.env.NODE_ENV!,
  STRIPE_SECRET_KEY: testFallback(process.env.STRIPE_SECRET_KEY, "sk_test_placeholder"),
  STRIPE_PRICE_ID: testFallback(process.env.STRIPE_PRICE_ID, "price_test_placeholder"),
  STRIPE_WEBHOOK_SECRET: testFallback(process.env.STRIPE_WEBHOOK_SECRET, "whsec_test_placeholder"),
  STRIPE_DISCOUNT_COUPON_ID: process.env.STRIPE_DISCOUNT_COUPON_ID,
  RECAPTCHA_SECRET_KEY: testFallback(process.env.RECAPTCHA_SECRET_KEY, "test-recaptcha-secret"),
  MAILING_LIST_ENDPOINT: testFallback(process.env.MAILING_LIST_ENDPOINT, "https://test.example.com/mailing"),
  MAILING_LIST_PASSWORD: testFallback(process.env.MAILING_LIST_PASSWORD, "test-mailing-password"),
  AWS_SES_ACCESS_KEY_ID: testFallback(process.env.AWS_SES_ACCESS_KEY_ID, "test-ses-access-key"),
  AWS_SES_SECRET_ACCESS_KEY: testFallback(process.env.AWS_SES_SECRET_ACCESS_KEY, "test-ses-secret-key"),
  AWS_SES_REGION: process.env.AWS_SES_REGION || "us-east-1",
  FROM_EMAIL_ADDRESS: testFallback(process.env.FROM_EMAIL_ADDRESS, "test@example.com"),
};
