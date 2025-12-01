export const DISCORD_INVITE_LINK = "https://discord.gg/JUDWZDN3VT";

// Pricing configuration - update prices in one place
export const PRICING_CONFIG = {
  CURRENT_PRICE: 199, // Current discounted price
  ORIGINAL_PRICE: 297, // Original price before discount
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
  COMMISSION_RATE: 20, // 30% commission
  MINIMUM_PAYOUT: 5000, // $50 minimum payout (in cents)
  AFFILIATE_CODE_LENGTH: 8, // Length of generated affiliate codes
  AFFILIATE_CODE_RETRY_ATTEMPTS: 10, // Max attempts to generate unique code
} as const;

export const FLAGS = {
  EARLY_ACCESS_MODE: "EARLY_ACCESS_MODE",
  AGENTS_FEATURE: "AGENTS_FEATURE",
  LAUNCH_KITS_FEATURE: "LAUNCH_KITS_FEATURE",
  AFFILIATES_FEATURE: "AFFILIATES_FEATURE",
  BLOG_FEATURE: "BLOG_FEATURE",
  NEWS_FEATURE: "NEWS_FEATURE",
  VIDEO_SEGMENT_CONTENT_TABS: "VIDEO_SEGMENT_CONTENT_TABS",
};

// Fallback values for when database is not available
export const FALLBACK_CONFIG = {
  EARLY_ACCESS_MODE: false,
  AGENTS_FEATURE: true,
  LAUNCH_KITS_FEATURE: true,
  AFFILIATES_FEATURE: true,
  BLOG_FEATURE: true,
  NEWS_FEATURE: true,
  VIDEO_SEGMENT_CONTENT_TABS: false,
} as const;
