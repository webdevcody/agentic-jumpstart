import { randomBytes } from "crypto";
import {
  createAffiliate,
  getAffiliateByUserId,
  getAffiliateByCode,
  createAffiliatePayout,
  updateAffiliateProfile,
  getAffiliateStats,
  getAffiliateReferrals,
  getAffiliatePayouts,
  getMonthlyAffiliateEarnings,
  getAllAffiliatesWithStats,
  getAffiliateById,
  getEligibleAffiliatesForAutoPayout,
  createAffiliatePayoutWithStripeTransfer,
  getPayoutByStripeTransferId,
  updateAffiliateStripeAccount,
  getAffiliateByStripeAccountId,
  clearAffiliatePayoutError,
  disconnectAffiliateStripeAccount,
  getAffiliateWithUserEmail,
  incrementPayoutRetryCount,
  resetPayoutRetryCount,
  createPendingPayout,
  completePendingPayout,
  failPendingPayout,
  // Transaction-aware functions for processAffiliateReferralUseCase
  getAffiliateByCodeTx,
  getAffiliateByStripeSessionTx,
  createAffiliateReferralTx,
  updateAffiliateBalancesTx,
  incrementAffiliatePaidAmountTx,
} from "~/data-access/affiliates";
import { getAffiliateCommissionRate, getAffiliateMinimumPayout } from "~/data-access/app-settings";
import { ApplicationError } from "./errors";
import { AFFILIATE_CONFIG } from "~/config";
import { stripe } from "~/lib/stripe";
import { determineStripeAccountStatus } from "~/utils/stripe-status";
import { sendAffiliatePayoutSuccessEmail } from "~/utils/email";
import { logger } from "~/utils/logger";

/**
 * Validates a payment link URL.
 * Ensures the URL is valid and uses https:// scheme for security.
 * @param paymentLink - The payment link to validate
 * @throws ApplicationError if the payment link is invalid
 */
function validatePaymentLink(paymentLink: string | undefined): void {
  if (!paymentLink || paymentLink.length < 10) {
    throw new ApplicationError(
      "Please provide a valid payment link",
      "INVALID_PAYMENT_LINK"
    );
  }

  // Validate it's a URL with https:// scheme
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(paymentLink);
  } catch {
    throw new ApplicationError(
      "Payment link must be a valid URL",
      "INVALID_PAYMENT_LINK"
    );
  }

  // Require https:// for security
  if (parsedUrl.protocol !== "https:") {
    throw new ApplicationError(
      "Payment link must use https:// for security",
      "INVALID_PAYMENT_LINK"
    );
  }
}

export async function registerAffiliateUseCase({
  userId,
  paymentMethod,
  paymentLink,
}: {
  userId: number;
  paymentMethod: "link" | "stripe";
  paymentLink?: string;
}) {
  // Check if user already is an affiliate
  const existingAffiliate = await getAffiliateByUserId(userId);
  if (existingAffiliate) {
    throw new ApplicationError(
      "You are already registered as an affiliate",
      "ALREADY_REGISTERED"
    );
  }

  // Validate payment link if using link method
  if (paymentMethod === "link") {
    validatePaymentLink(paymentLink);
  }

  // Generate unique affiliate code
  const affiliateCode = await generateUniqueAffiliateCode();

  // Get commission rate from DB settings (falls back to AFFILIATE_CONFIG.COMMISSION_RATE)
  const commissionRate = await getAffiliateCommissionRate();

  // Create affiliate
  const affiliate = await createAffiliate({
    userId,
    affiliateCode,
    paymentMethod,
    paymentLink: paymentLink && paymentLink.length > 0 ? paymentLink : null,
    commissionRate,
    totalEarnings: 0,
    paidAmount: 0,
    unpaidBalance: 0,
    isActive: true,
  });

  return affiliate;
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
  paymentMethod,
  paymentLink,
}: {
  userId: number;
  paymentMethod: "link" | "stripe";
  paymentLink?: string;
}) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    throw new ApplicationError(
      "You are not registered as an affiliate",
      "NOT_AFFILIATE"
    );
  }

  // Validate payment link if using link method
  if (paymentMethod === "link") {
    validatePaymentLink(paymentLink);
  }

  // Update payment method and link in database
  return updateAffiliateProfile(affiliate.id, {
    paymentMethod,
    paymentLink: paymentLink && paymentLink.length > 0 ? paymentLink : null,
  });
}

export async function adminToggleAffiliateStatusUseCase({
  affiliateId,
  isActive,
}: {
  affiliateId: number;
  isActive: boolean;
}) {
  // Verify affiliate exists before updating
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new ApplicationError(
      "Affiliate not found",
      "AFFILIATE_NOT_FOUND"
    );
  }

  return updateAffiliateProfile(affiliateId, { isActive });
}

export async function adminUpdateAffiliateCommissionRateUseCase({
  affiliateId,
  commissionRate,
}: {
  affiliateId: number;
  commissionRate: number;
}) {
  // Verify affiliate exists before updating
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new ApplicationError(
      "Affiliate not found",
      "AFFILIATE_NOT_FOUND"
    );
  }

  if (commissionRate < 0 || commissionRate > 100) {
    throw new ApplicationError(
      "Commission rate must be between 0 and 100",
      "INVALID_COMMISSION_RATE"
    );
  }

  return updateAffiliateCommissionRate(affiliateId, commissionRate);
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

export async function processAffiliateReferralUseCase({
  affiliateCode,
  purchaserId,
  stripeSessionId,
  amount,
  frozenCommissionRate,
  frozenDiscountRate,
  frozenOriginalCommissionRate,
  isAutoTransfer = false,
}: {
  affiliateCode: string;
  purchaserId: number;
  stripeSessionId: string;
  amount: number;
  /** Commission rate frozen at checkout time (effective rate = originalRate - discountRate). If not provided, uses affiliate's current rate. */
  frozenCommissionRate?: number;
  /** Discount rate frozen at checkout time. */
  frozenDiscountRate?: number;
  /** Original commission rate frozen at checkout time. */
  frozenOriginalCommissionRate?: number;
  /** If true, transfer_data was used in checkout - referral is marked as paid immediately (Stripe handles transfer) */
  isAutoTransfer?: boolean;
}) {
  // Validate amount is within safe range to prevent integer overflow in commission calculation
  if (amount < 0) {
    logger.warn("Invalid negative amount for affiliate referral", {
      fn: "processAffiliateReferralUseCase",
      amount,
      stripeSessionId,
    });
    return null;
  }

  if (amount > AFFILIATE_CONFIG.MAX_PURCHASE_AMOUNT) {
    logger.warn("Amount exceeds maximum allowed for affiliate referral", {
      fn: "processAffiliateReferralUseCase",
      amount,
      maxAllowed: AFFILIATE_CONFIG.MAX_PURCHASE_AMOUNT,
      stripeSessionId,
    });
    return null;
  }

  // Import database for transaction support
  const { database } = await import("~/db");

  return await database.transaction(async (tx) => {
    // Get affiliate by code using transaction-aware function
    const affiliate = await getAffiliateByCodeTx(tx, affiliateCode);
    if (!affiliate) {
      logger.warn("Invalid affiliate code for purchase", {
        fn: "processAffiliateReferralUseCase",
        affiliateCode,
        stripeSessionId,
      });
      return null;
    }

    // Check for self-referral
    if (affiliate.userId === purchaserId) {
      logger.warn("Self-referral attempted", {
        fn: "processAffiliateReferralUseCase",
        purchaserId,
        stripeSessionId,
      });
      return null;
    }

    // Check if this session was already processed using transaction-aware function
    // (database unique constraint also helps with race conditions)
    const existingReferral = await getAffiliateByStripeSessionTx(tx, stripeSessionId);
    if (existingReferral) {
      logger.warn("Duplicate Stripe session already processed", {
        fn: "processAffiliateReferralUseCase",
        stripeSessionId,
      });
      return null;
    }

    // Calculate commission using frozen rate (from checkout) or affiliate's current rate
    // frozenCommissionRate is the commission rate stored at checkout time (after discount split)
    const effectiveCommissionRate = frozenCommissionRate ?? affiliate.commissionRate;
    const commission = Math.floor((amount * effectiveCommissionRate) / 100);

    // Create referral record with frozen rates for audit trail using transaction
    // If isAutoTransfer (transfer_data used), mark as paid immediately - Stripe handles the transfer
    const referral = await createAffiliateReferralTx(tx, {
      affiliateId: affiliate.id,
      purchaserId,
      stripeSessionId,
      amount,
      commission,
      // Store frozen rates at checkout time for audit trail
      commissionRate: effectiveCommissionRate,
      discountRate: frozenDiscountRate ?? affiliate.discountRate,
      originalCommissionRate: frozenOriginalCommissionRate ?? affiliate.commissionRate,
      isPaid: isAutoTransfer, // Paid immediately if Stripe handles transfer
    });

    // Update affiliate balances using transaction-aware functions
    // If auto-transfer: add to totalEarnings and paidAmount (not unpaidBalance)
    // If manual: add to totalEarnings and unpaidBalance
    if (isAutoTransfer) {
      // For auto-transfer, we add to totalEarnings (unpaid stays same)
      await updateAffiliateBalancesTx(tx, affiliate.id, commission, 0);
      // Also increment paidAmount since Stripe will transfer it (using data-access layer)
      await incrementAffiliatePaidAmountTx(tx, affiliate.id, commission);
    } else {
      // For manual payout, add to both totalEarnings and unpaidBalance
      await updateAffiliateBalancesTx(tx, affiliate.id, commission, commission);
    }

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
  // Validate affiliate exists and is active
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    throw new ApplicationError("Affiliate not found", "AFFILIATE_NOT_FOUND");
  }
  if (!affiliate.isActive) {
    throw new ApplicationError(
      "Affiliate account is not active",
      "AFFILIATE_INACTIVE"
    );
  }

  // Validate minimum payout (configurable via admin settings)
  const minimumPayout = await getAffiliateMinimumPayout();
  if (amount < minimumPayout) {
    throw new ApplicationError(
      `Minimum payout amount is $${minimumPayout / 100}`,
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

/**
 * Process automatic payout for a single affiliate via Stripe Connect.
 * Uses a two-phase approach to prevent the critical scenario where Stripe transfer
 * succeeds but database recording fails (money transferred but not recorded).
 *
 * Phase 1: Create a "pending" payout record BEFORE initiating the transfer
 * Phase 2: Update the record to "completed" after successful transfer
 * Phase 3: If transfer fails, update record to "failed"
 */
export async function processAutomaticPayoutsUseCase({
  affiliateId,
  systemUserId,
}: {
  affiliateId: number;
  systemUserId: number; // Admin/system user ID to record as paidBy
}): Promise<{
  success: boolean;
  transferId?: string;
  amount?: number;
  error?: string;
}> {
  // Get affiliate details first (before creating pending payout)
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) {
    return { success: false, error: "Affiliate not found" };
  }

  // Validate Stripe Connect is enabled
  if (!affiliate.stripeConnectAccountId) {
    return { success: false, error: "Affiliate has no Stripe Connect account" };
  }

  if (!affiliate.stripePayoutsEnabled) {
    return { success: false, error: "Stripe payouts not enabled for this affiliate" };
  }

  // Validate there's a balance to pay
  // Stripe Connect affiliates: No minimum threshold - pay any positive balance
  if (affiliate.unpaidBalance <= 0) {
    return {
      success: false,
      error: "No unpaid balance to process",
    };
  }

  if (!affiliate.isActive) {
    return { success: false, error: "Affiliate account is not active" };
  }

  const payoutAmount = affiliate.unpaidBalance;

  // Phase 1: Create pending payout record BEFORE initiating Stripe transfer
  // This ensures we have a database record even if the transfer succeeds but
  // subsequent database operations fail
  let pendingPayout: { id: number };
  try {
    pendingPayout = await createPendingPayout({
      affiliateId: affiliate.id,
      amount: payoutAmount,
      paidBy: systemUserId,
    });
    logger.info("Created pending payout record", {
      fn: "processAutomaticPayoutsUseCase",
      payoutId: pendingPayout.id,
      affiliateId: affiliate.id,
      amount: payoutAmount,
    });
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
    logger.error("Failed to create pending payout record", {
      fn: "processAutomaticPayoutsUseCase",
      affiliateId,
      error: errorMessage,
    });
    return { success: false, error: `Database error: ${errorMessage}` };
  }

  // Phase 2: Create Stripe Transfer to connected account
  try {
    // Use pending payout ID as idempotency key - guarantees uniqueness and prevents duplicates
    // The pending payout ID is auto-incremented in the database, so it's always unique
    const idempotencyKey = `payout-${pendingPayout.id}`;

    const transfer = await stripe.transfers.create(
      {
        amount: payoutAmount,
        currency: "usd",
        destination: affiliate.stripeConnectAccountId,
        metadata: {
          affiliateId: affiliate.id.toString(),
          affiliateCode: affiliate.affiliateCode,
          payoutType: "automatic",
          pendingPayoutId: pendingPayout.id.toString(),
        },
      },
      {
        idempotencyKey,
      }
    );

    // Phase 3: Complete the pending payout record with transfer ID
    // This updates the record to "completed" status and marks referrals as paid
    try {
      await completePendingPayout(pendingPayout.id, transfer.id);
    } catch (completeError) {
      // Critical: Transfer succeeded but completing the payout record failed
      // The pending payout record still exists, so we have a record of the transfer
      // An admin will need to manually reconcile this
      const errorMessage = completeError instanceof Error ? completeError.message : String(completeError);
      logger.error("CRITICAL: Transfer succeeded but failed to complete payout record", {
        fn: "processAutomaticPayoutsUseCase",
        affiliateId: affiliate.id,
        payoutId: pendingPayout.id,
        transferId: transfer.id,
        error: errorMessage,
      });
      // Still return success since the transfer went through
      // The pending record exists for manual reconciliation
      return {
        success: true,
        transferId: transfer.id,
        amount: payoutAmount,
      };
    }

    // Clear any previous payout error and reset retry count on successful transfer
    await clearAffiliatePayoutError(affiliate.id);
    await resetPayoutRetryCount(affiliate.id);

    logger.info("Automatic payout processed", {
      fn: "processAutomaticPayoutsUseCase",
      affiliateId: affiliate.id,
      payoutId: pendingPayout.id,
      amount: payoutAmount / 100,
      transferId: transfer.id,
    });

    // Send success notification email to affiliate
    try {
      const affiliateWithEmail = await getAffiliateWithUserEmail(affiliate.id);
      if (affiliateWithEmail?.userEmail) {
        const formattedAmount = `$${(payoutAmount / 100).toFixed(2)}`;
        const payoutDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        await sendAffiliatePayoutSuccessEmail(affiliateWithEmail.userEmail, {
          affiliateName: affiliateWithEmail.userName || "Affiliate Partner",
          payoutAmount: formattedAmount,
          payoutDate,
          stripeTransferId: transfer.id,
        });
      }
    } catch (emailError) {
      // Log but don't fail the payout for email errors
      logger.error("Failed to send payout success email", {
        fn: "processAutomaticPayoutsUseCase",
        affiliateId: affiliate.id,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }

    return {
      success: true,
      transferId: transfer.id,
      amount: payoutAmount,
    };
  } catch (transferError) {
    // Transfer failed - mark the pending payout as failed
    const errorMessage = transferError instanceof Error ? transferError.message : String(transferError);

    try {
      await failPendingPayout(pendingPayout.id, errorMessage);
      logger.info("Marked pending payout as failed", {
        fn: "processAutomaticPayoutsUseCase",
        payoutId: pendingPayout.id,
        affiliateId,
        error: errorMessage,
      });
    } catch (failError) {
      // Failed to mark the payout as failed - log but continue
      logger.error("Failed to mark pending payout as failed", {
        fn: "processAutomaticPayoutsUseCase",
        payoutId: pendingPayout.id,
        affiliateId,
        originalError: errorMessage,
        failError: failError instanceof Error ? failError.message : String(failError),
      });
    }

    logger.error("Failed to process automatic payout", {
      fn: "processAutomaticPayoutsUseCase",
      affiliateId,
      payoutId: pendingPayout.id,
      error: errorMessage,
    });

    // Increment retry count on failure (uses exponential backoff: 1h, 4h, 24h, then stops)
    await incrementPayoutRetryCount(affiliateId);

    return { success: false, error: errorMessage };
  }
}

/**
 * Process automatic payouts for all eligible affiliates.
 * Used by admin to trigger batch processing.
 *
 * Implements controlled concurrency (3 at a time) with rate limiting
 * to respect Stripe API limits and prevent overwhelming the system.
 */
export async function processAllAutomaticPayoutsUseCase({
  systemUserId,
}: {
  systemUserId: number;
}): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    affiliateId: number;
    success: boolean;
    transferId?: string;
    amount?: number;
    error?: string;
  }>;
}> {
  // Stripe Connect affiliates have no minimum threshold - pay any positive balance
  const eligibleAffiliates = await getEligibleAffiliatesForAutoPayout(1);

  const results: Array<{
    affiliateId: number;
    success: boolean;
    transferId?: string;
    amount?: number;
    error?: string;
  }> = [];

  // Process in batches to avoid overwhelming Stripe API
  for (let i = 0; i < eligibleAffiliates.length; i += AFFILIATE_CONFIG.CONCURRENT_PAYOUTS) {
    const batch = eligibleAffiliates.slice(i, i + AFFILIATE_CONFIG.CONCURRENT_PAYOUTS);

    // Process this batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (affiliate) => {
        const result = await processAutomaticPayoutsUseCase({
          affiliateId: affiliate.id,
          systemUserId,
        });
        return { affiliateId: affiliate.id, ...result };
      })
    );

    results.push(...batchResults);

    // Add delay between batches to respect rate limits (skip after last batch)
    if (i + AFFILIATE_CONFIG.CONCURRENT_PAYOUTS < eligibleAffiliates.length) {
      await new Promise((resolve) => setTimeout(resolve, AFFILIATE_CONFIG.BATCH_DELAY_MS));
    }
  }

  return {
    processed: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Sync Stripe Connect account status from Stripe API.
 * Called when account.updated webhook is received or manually by user.
 */
export async function syncStripeAccountStatusUseCase(
  stripeAccountId: string
): Promise<{
  success: boolean;
  affiliate?: Awaited<ReturnType<typeof getAffiliateByStripeAccountId>>;
  error?: string;
}> {
  try {
    // Get affiliate by Stripe account ID
    const affiliate = await getAffiliateByStripeAccountId(stripeAccountId);
    if (!affiliate) {
      return { success: false, error: "No affiliate found with this Stripe account ID" };
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Determine account status
    const status = determineStripeAccountStatus(account);

    // Update affiliate record
    const updated = await updateAffiliateStripeAccount(affiliate.id, {
      stripeAccountStatus: status,
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
      stripeDetailsSubmitted: account.details_submitted ?? false,
      lastStripeSync: new Date(),
    });

    logger.info("Synced Stripe account status", {
      fn: "syncStripeAccountStatusUseCase",
      affiliateId: affiliate.id,
      status,
      payoutsEnabled: account.payouts_enabled,
    });

    return { success: true, affiliate: updated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to sync Stripe account", {
      fn: "syncStripeAccountStatusUseCase",
      stripeAccountId,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Refresh Stripe account status for a user's affiliate account.
 * Called manually by the user from the dashboard.
 */
export async function refreshStripeAccountStatusForUserUseCase(
  userId: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    return { success: false, error: "User is not an affiliate" };
  }

  if (!affiliate.stripeConnectAccountId) {
    return { success: false, error: "No Stripe Connect account linked" };
  }

  return syncStripeAccountStatusUseCase(affiliate.stripeConnectAccountId);
}

export async function getAffiliateAnalyticsUseCase(userId: number) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    throw new ApplicationError(
      "You are not registered as an affiliate",
      "NOT_AFFILIATE"
    );
  }

  // Fetch Stripe account details if connected
  let stripeAccountName: string | null = null;
  if (affiliate.stripeConnectAccountId && affiliate.stripeAccountStatus === "active") {
    try {
      const stripeAccount = await stripe.accounts.retrieve(affiliate.stripeConnectAccountId);
      stripeAccountName = stripeAccount.business_profile?.name ?? null;
    } catch {
      // Ignore errors - name is optional
    }
  }

  const [stats, referralsResult, payoutsResult, monthlyEarnings] = await Promise.all([
    getAffiliateStats(affiliate.id),
    getAffiliateReferrals(affiliate.id),
    getAffiliatePayouts(affiliate.id),
    getMonthlyAffiliateEarnings(affiliate.id),
  ]);

  return {
    affiliate: {
      ...affiliate,
      stripeAccountName, // Add fetched name from Stripe API
    },
    stats,
    referrals: referralsResult.items,
    payouts: payoutsResult.items,
    monthlyEarnings,
  };
}

export async function adminGetAllAffiliatesUseCase() {
  return getAllAffiliatesWithStats();
}

/**
 * Disconnect Stripe Connect account for an affiliate.
 * Resets all Stripe-related fields and switches payment method to link.
 */
export async function disconnectStripeAccountUseCase(userId: number) {
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) {
    throw new ApplicationError(
      "You are not registered as an affiliate",
      "NOT_AFFILIATE"
    );
  }

  // Validate that they have a Stripe account connected
  if (
    !affiliate.stripeConnectAccountId ||
    affiliate.stripeAccountStatus === "not_started"
  ) {
    throw new ApplicationError(
      "No Stripe Connect account is connected",
      "NO_STRIPE_ACCOUNT"
    );
  }

  // Try to revoke on Stripe's side (best effort)
  try {
    await stripe.accounts.del(affiliate.stripeConnectAccountId);
  } catch (error) {
    logger.warn("Failed to delete Stripe account", {
      fn: "disconnectStripeAccountUseCase",
      stripeConnectAccountId: affiliate.stripeConnectAccountId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue with local cleanup
  }

  return disconnectAffiliateStripeAccount(affiliate.id);
}
