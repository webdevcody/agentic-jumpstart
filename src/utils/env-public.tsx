// This has to live in a separate file because import.meta breaks when running migrations

export const publicEnv = {
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!,
  VITE_RECAPTCHA_KEY: import.meta.env.VITE_RECAPTCHA_KEY!,
  VITE_HOST_NAME: import.meta.env.VITE_HOST_NAME ?? "http://localhost:3000",
};
