import { randomBytes } from "crypto";
import {
  createAffiliate,
  getAffiliateByUserId,
  getAffiliateByCode,
  createAffiliateReferral,
  updateAffiliateBalances,
  createAffiliatePayout,
  getAffiliateByStripeSession,
  updateAffiliateProfile,
  getAffiliateStats,
  getAffiliateReferrals,
  getAffiliatePayouts,
  getMonthlyAffiliateEarnings,
  getAllAffiliatesWithStats,
} from "~/data-access/affiliates";
import { ApplicationError } from "./errors";
import { AFFILIATE_CONFIG } from "~/config";

export async function registerAffiliateUseCase({
  userId,
  paymentLink,
}: {
  userId: number;
  paymentLink: string;
}) {
  // Check if user already is an affiliate
  const existingAffiliate = await getAffiliateByUserId(userId);
  if (existingAffiliate) {
    throw new ApplicationError(
      "You are already registered as an affiliate",
      "ALREADY_REGISTERED"
    );
  }

  // Validate payment link (basic validation)
  if (!paymentLink || paymentLink.length < 10) {
    throw new ApplicationError(
      "Please provide a valid payment link",
      "INVALID_PAYMENT_LINK"
    );
  }

  // Validate it's a URL
  try {
    new URL(paymentLink);
  } catch {
    throw new ApplicationError(
      "Payment link must be a valid URL",
      "INVALID_PAYMENT_LINK"
    );
  }

  // Generate unique affiliate code
  const affiliateCode = await generateUniqueAffiliateCode();

  // Create affiliate
  const affiliate = await createAffiliate({
    userId,
    affiliateCode,
    paymentLink,
    commissionRate: AFFILIATE_CONFIG.COMMISSION_RATE,
    totalEarnings: 0,
    paidAmount: 0,
    unpaidBalance: 0,
    isActive: true,
  });

  return affiliate;
}

export async function processAffiliateReferralUseCase({
  affiliateCode,
  purchaserId,
  stripeSessionId,
  amount,
}: {
  affiliateCode: string;
  purchaserId: number;
  stripeSessionId: string;
  amount: number;
}) {
  // Import database for transaction support
  const { database } = await import("~/db");
  
  return await database.transaction(async (tx) => {
    // Get affiliate by code (using the imported function which uses the main database)
    const affiliate = await getAffiliateByCode(affiliateCode);
    if (!affiliate) {
      console.warn(`Invalid affiliate code: ${affiliateCode} for purchase ${stripeSessionId}`);
      return null;
    }

    // Check for self-referral
    if (affiliate.userId === purchaserId) {
      console.warn(`Self-referral attempted by user ${purchaserId} for session ${stripeSessionId}`);
      return null;
    }

    // Check if this session was already processed (database unique constraint also helps with race conditions)
    const existingReferral = await getAffiliateByStripeSession(stripeSessionId);
    if (existingReferral) {
      console.warn(`Duplicate Stripe session: ${stripeSessionId} already processed`);
      return null;
    }

    // Calculate commission
    const commission = Math.floor((amount * affiliate.commissionRate) / 100);

    // Create referral record
    const referral = await createAffiliateReferral({
      affiliateId: affiliate.id,
      purchaserId,
      stripeSessionId,
      amount,
      commission,
      isPaid: false,
    });

    // Update affiliate balances
    await updateAffiliateBalances(affiliate.id, commission, commission);

    return referral;
  });
}

export async function recordAffiliatePayoutUseCase({
  affiliateId,
  amount,
  paymentMethod,
  transactionId,
  notes,
  paidBy,
}: {
  affiliateId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  paidBy: number;
}) {
  // Validate minimum payout
  if (amount < AFFILIATE_CONFIG.MINIMUM_PAYOUT) {
    throw new ApplicationError(
      `Minimum payout amount is $${AFFILIATE_CONFIG.MINIMUM_PAYOUT / 100}`,
      "MINIMUM_PAYOUT_NOT_MET"
    );
  }

  // Create payout record (this also updates balances and marks referrals as paid)
  const payout = await createAffiliatePayout({
    affiliateId,
    amount,
    paymentMethod,
    transactionId: transactionId || null,
    notes: notes || null,
    paidBy,
  });

  return payout;
}

export async function validateAffiliateCodeUseCase(code: string) {
  if (!code) return null;

  const affiliate = await getAffiliateByCode(code);
  if (!affiliate || !affiliate.isActive) {
    return null;
  }

  return affiliate;
}

export async function updateAffiliatePaymentLinkUseCase({
  userId,
  paymentLink,
}: {
  userId: number;
  paymentLink: string;
}) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    throw new ApplicationError(
      "You are not registered as an affiliate",
      "NOT_AFFILIATE"
    );
  }

  // Validate payment link
  if (!paymentLink || paymentLink.length < 10) {
    throw new ApplicationError(
      "Please provide a valid payment link",
      "INVALID_PAYMENT_LINK"
    );
  }

  try {
    new URL(paymentLink);
  } catch {
    throw new ApplicationError(
      "Payment link must be a valid URL",
      "INVALID_PAYMENT_LINK"
    );
  }

  // Update payment link in database
  return updateAffiliateProfile(affiliate.id, { paymentLink });
}

export async function getAffiliateAnalyticsUseCase(userId: number) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    throw new ApplicationError(
      "You are not registered as an affiliate",
      "NOT_AFFILIATE"
    );
  }

  const [stats, referrals, payouts, monthlyEarnings] = await Promise.all([
    getAffiliateStats(affiliate.id),
    getAffiliateReferrals(affiliate.id),
    getAffiliatePayouts(affiliate.id),
    getMonthlyAffiliateEarnings(affiliate.id),
  ]);

  return {
    affiliate,
    stats,
    referrals,
    payouts,
    monthlyEarnings,
  };
}

export async function adminGetAllAffiliatesUseCase() {
  return getAllAffiliatesWithStats();
}

export async function adminToggleAffiliateStatusUseCase({
  affiliateId,
  isActive,
}: {
  affiliateId: number;
  isActive: boolean;
}) {
  return updateAffiliateProfile(affiliateId, { isActive });
}

async function generateUniqueAffiliateCode(): Promise<string> {
  let attempts = 0;
  
  while (attempts < AFFILIATE_CONFIG.AFFILIATE_CODE_RETRY_ATTEMPTS) {
    // Generate a random affiliate code
    const bytes = randomBytes(6);
    const code = bytes
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, AFFILIATE_CONFIG.AFFILIATE_CODE_LENGTH)
      .toUpperCase();

    // Ensure it's exactly the required length (pad if needed)
    const paddedCode = code.padEnd(AFFILIATE_CONFIG.AFFILIATE_CODE_LENGTH, "0");
    
    // Check if this code is already in use
    const existingAffiliate = await getAffiliateByCode(paddedCode);
    if (!existingAffiliate) {
      return paddedCode;
    }
    
    attempts++;
  }
  
  throw new ApplicationError(
    "Unable to generate unique affiliate code after multiple attempts",
    "CODE_GENERATION_FAILED"
  );
}
