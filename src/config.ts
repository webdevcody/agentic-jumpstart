export const DISCORD_INVITE_LINK = "https://discord.gg/ckQPZGxY";

// Affiliate program configuration
export const AFFILIATE_CONFIG = {
  COMMISSION_RATE: 20, // 30% commission
  MINIMUM_PAYOUT: 5000, // $50 minimum payout (in cents)
  AFFILIATE_CODE_LENGTH: 8, // Length of generated affiliate codes
  AFFILIATE_CODE_RETRY_ATTEMPTS: 10, // Max attempts to generate unique code
} as const;
