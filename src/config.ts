export const DISCORD_INVITE_LINK = "https://discord.gg/JUDWZDN3VT";

// Pricing configuration - update prices in one place
export const PRICING_CONFIG = {
  CURRENT_PRICE: 249, // Current discounted price
  ORIGINAL_PRICE: 299, // Original price before discount
  get DISCOUNT_PERCENTAGE() {
    return Math.round(
      ((this.ORIGINAL_PRICE - this.CURRENT_PRICE) / this.ORIGINAL_PRICE) * 100
    );
  },
  get FORMATTED_CURRENT_PRICE() {
    return `$${this.CURRENT_PRICE}`;
  },
  get FORMATTED_ORIGINAL_PRICE() {
    return `$${this.ORIGINAL_PRICE}`;
  },
};

// Affiliate program configuration
export const AFFILIATE_CONFIG = {
  COMMISSION_RATE: 30, // 30% commission (default, can be overridden in admin settings)
  MINIMUM_PAYOUT: 5000, // $50 minimum payout (in cents)
  AFFILIATE_CODE_LENGTH: 8, // Length of generated affiliate codes
  AFFILIATE_CODE_RETRY_ATTEMPTS: 10, // Max attempts to generate unique code
  MAX_PURCHASE_AMOUNT: 100_000_00, // $100,000 in cents - reasonable max for single purchase
  CONCURRENT_PAYOUTS: 3, // Max concurrent payout processing
  BATCH_DELAY_MS: 1000, // Delay between batches in ms
} as const;

// App settings keys (not feature flags)
export const APP_SETTING_KEYS = {
  AFFILIATE_COMMISSION_RATE: "AFFILIATE_COMMISSION_RATE",
} as const;

// Company information for marketing emails
export const COMPANY_ADDRESS = {
  NAME: "Seibert Software Solutions, LLC",
  LINE1: "PO Box 913",
  CITY: "Harrison",
  STATE: "TN",
  ZIP: "37341",
  get FORMATTED() {
    return `${this.NAME}\n${this.LINE1}\n${this.CITY} ${this.STATE}, ${this.ZIP}`;
  },
} as const;

// Re-export feature flags for backwards compatibility
export {
  FLAG_KEYS,
  FLAGS,
  TARGET_MODES,
  FALLBACK_CONFIG,
  FEATURE_FLAGS_CONFIG,
  DISPLAYED_FLAGS,
  type FlagKey,
  type TargetMode,
  type FeatureFlagUIConfig,
} from "./config/feature-flags";
