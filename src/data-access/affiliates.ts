import { eq, desc, and, sql, gte, lt, lte, inArray, isNotNull, ne } from "drizzle-orm";
import { database } from "~/db";
import {
  affiliates,
  affiliateReferrals,
  affiliatePayouts,
  users,
  profiles,
  Affiliate,
  AffiliateCreate,
  AffiliateReferralCreate,
  AffiliatePayoutCreate,
} from "~/db/schema";

export async function createAffiliate(data: AffiliateCreate) {
  const [affiliate] = await database
    .insert(affiliates)
    .values(data)
    .returning();
  return affiliate;
}

export async function getAffiliateByUserId(userId: number) {
  const [affiliate] = await database
    .select()
    .from(affiliates)
    .where(eq(affiliates.userId, userId));
  return affiliate;
}

export async function getAffiliateByCode(code: string) {
  const [affiliate] = await database
    .select()
    .from(affiliates)
    .where(
      and(eq(affiliates.affiliateCode, code), eq(affiliates.isActive, true))
    );
  return affiliate;
}

export async function updateAffiliateBalances(
  affiliateId: number,
  earnings: number,
  unpaid: number
) {
  // Validate inputs
  if (!Number.isInteger(affiliateId) || affiliateId <= 0) {
    throw new Error("Affiliate ID must be a positive integer");
  }

  if (!Number.isInteger(earnings) || earnings < 0) {
    throw new Error("Earnings must be a non-negative integer");
  }

  if (!Number.isInteger(unpaid) || unpaid < 0) {
    throw new Error("Unpaid amount must be a non-negative integer");
  }

  const [updated] = await database
    .update(affiliates)
    .set({
      totalEarnings: sql`${affiliates.totalEarnings} + ${earnings}`,
      unpaidBalance: sql`${affiliates.unpaidBalance} + ${unpaid}`,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

export async function createAffiliateReferral(data: AffiliateReferralCreate) {
  const [referral] = await database
    .insert(affiliateReferrals)
    .values(data)
    .returning();
  return referral;
}

export async function getAffiliateReferrals(
  affiliateId: number,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 10, offset = 0 } = options || {};

  const referrals = await database
    .select({
      id: affiliateReferrals.id,
      purchaserId: affiliateReferrals.purchaserId,
      // Don't expose purchaser email - only show display name for privacy
      purchaserName: profiles.displayName,
      amount: affiliateReferrals.amount,
      commission: affiliateReferrals.commission,
      isPaid: affiliateReferrals.isPaid,
      createdAt: affiliateReferrals.createdAt,
      stripeSessionId: affiliateReferrals.stripeSessionId,
    })
    .from(affiliateReferrals)
    .leftJoin(users, eq(affiliateReferrals.purchaserId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(affiliateReferrals.affiliateId, affiliateId))
    .orderBy(desc(affiliateReferrals.createdAt))
    .limit(limit + 1) // Fetch one extra to check if there's more
    .offset(offset);

  const hasMore = referrals.length > limit;
  return {
    items: hasMore ? referrals.slice(0, limit) : referrals,
    hasMore,
  };
}

export async function getAffiliateStats(affiliateId: number) {
  const [stats] = await database
    .select({
      totalReferrals: sql<number>`count(*)::int`,
      totalEarnings: sql<number>`coalesce(sum(${affiliateReferrals.commission}), 0)::int`,
      unpaidEarnings: sql<number>`coalesce(sum(case when ${affiliateReferrals.isPaid} = false then ${affiliateReferrals.commission} else 0 end), 0)::int`,
      paidEarnings: sql<number>`coalesce(sum(case when ${affiliateReferrals.isPaid} = true then ${affiliateReferrals.commission} else 0 end), 0)::int`,
    })
    .from(affiliateReferrals)
    .where(eq(affiliateReferrals.affiliateId, affiliateId));

  return (
    stats || {
      totalReferrals: 0,
      totalEarnings: 0,
      unpaidEarnings: 0,
      paidEarnings: 0,
    }
  );
}

export async function createAffiliatePayout(
  data: AffiliatePayoutCreate & { affiliateId: number; stripeTransferId?: string }
) {
  // Start a transaction to ensure consistency
  return await database.transaction(async (tx) => {
    // Get unpaid referrals to calculate total unpaid amount
    const unpaidReferrals = await tx
      .select({
        id: affiliateReferrals.id,
        commission: affiliateReferrals.commission,
      })
      .from(affiliateReferrals)
      .where(
        and(
          eq(affiliateReferrals.affiliateId, data.affiliateId),
          eq(affiliateReferrals.isPaid, false)
        )
      );

    const totalUnpaidAmount = unpaidReferrals.reduce(
      (sum, referral) => sum + referral.commission,
      0
    );

    // Validate that payout amount doesn't exceed unpaid balance
    if (data.amount > totalUnpaidAmount) {
      throw new Error(
        `Payout amount ($${data.amount / 100}) exceeds unpaid balance ($${totalUnpaidAmount / 100})`
      );
    }

    // Create the payout record
    const [payout] = await tx.insert(affiliatePayouts).values({
      affiliateId: data.affiliateId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId || null,
      stripeTransferId: data.stripeTransferId || null,
      notes: data.notes || null,
      paidBy: data.paidBy,
    }).returning();

    // Update affiliate paid amount and unpaid balance
    await tx
      .update(affiliates)
      .set({
        paidAmount: sql`${affiliates.paidAmount} + ${data.amount}`,
        unpaidBalance: sql`${affiliates.unpaidBalance} - ${data.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, data.affiliateId));

    // Mark referrals as paid up to the payout amount
    let remainingPayout = data.amount;
    const referralsToUpdate: number[] = [];

    for (const referral of unpaidReferrals) {
      if (remainingPayout >= referral.commission) {
        referralsToUpdate.push(referral.id);
        remainingPayout -= referral.commission;
      } else {
        // Skip referrals that would be partially paid - only mark as paid if full commission can be covered
        break;
      }
    }

    // Update the selected referrals as paid
    if (referralsToUpdate.length > 0) {
      await tx
        .update(affiliateReferrals)
        .set({ isPaid: true })
        .where(
          and(
            eq(affiliateReferrals.affiliateId, data.affiliateId),
            inArray(affiliateReferrals.id, referralsToUpdate)
          )
        );
    }

    return payout;
  });
}

export async function getAffiliatePayouts(
  affiliateId: number,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 10, offset = 0 } = options || {};

  const payouts = await database
    .select({
      id: affiliatePayouts.id,
      amount: affiliatePayouts.amount,
      paymentMethod: affiliatePayouts.paymentMethod,
      transactionId: affiliatePayouts.transactionId,
      stripeTransferId: affiliatePayouts.stripeTransferId,
      notes: affiliatePayouts.notes,
      paidAt: affiliatePayouts.paidAt,
      status: affiliatePayouts.status,
      // Don't expose admin email - only show display name for privacy
      paidByName: profiles.displayName,
    })
    .from(affiliatePayouts)
    .leftJoin(users, eq(affiliatePayouts.paidBy, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(affiliatePayouts.affiliateId, affiliateId))
    .orderBy(desc(affiliatePayouts.paidAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = payouts.length > limit;
  return {
    items: hasMore ? payouts.slice(0, limit) : payouts,
    hasMore,
  };
}

export async function getAllAffiliatesWithStats() {
  const affiliatesWithStats = await database
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      userEmail: users.email,
      userName: profiles.displayName,
      userRealName: profiles.realName,
      useDisplayName: profiles.useDisplayName,
      userImage: profiles.image,
      affiliateCode: affiliates.affiliateCode,
      paymentLink: affiliates.paymentLink,
      paymentMethod: affiliates.paymentMethod,
      commissionRate: affiliates.commissionRate,
      totalEarnings: affiliates.totalEarnings,
      paidAmount: affiliates.paidAmount,
      unpaidBalance: affiliates.unpaidBalance,
      isActive: affiliates.isActive,
      createdAt: affiliates.createdAt,
      // Stripe Connect fields
      stripeConnectAccountId: affiliates.stripeConnectAccountId,
      stripeAccountStatus: affiliates.stripeAccountStatus,
      stripeChargesEnabled: affiliates.stripeChargesEnabled,
      stripePayoutsEnabled: affiliates.stripePayoutsEnabled,
      stripeDetailsSubmitted: affiliates.stripeDetailsSubmitted,
      lastStripeSync: affiliates.lastStripeSync,
      totalReferrals: sql<number>`(
        select count(*)::int from ${affiliateReferrals}
        where ${affiliateReferrals.affiliateId} = ${affiliates.id}
      )`,
      lastReferralDate: sql<Date | null>`(
        select max(${affiliateReferrals.createdAt})
        from ${affiliateReferrals}
        where ${affiliateReferrals.affiliateId} = ${affiliates.id}
      )`,
    })
    .from(affiliates)
    .leftJoin(users, eq(affiliates.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(affiliates.unpaidBalance), desc(affiliates.createdAt));

  return affiliatesWithStats;
}

export async function getAffiliateByStripeSession(stripeSessionId: string) {
  const [result] = await database
    .select({
      affiliate: affiliates,
      referral: affiliateReferrals,
    })
    .from(affiliateReferrals)
    .innerJoin(affiliates, eq(affiliateReferrals.affiliateId, affiliates.id))
    .where(eq(affiliateReferrals.stripeSessionId, stripeSessionId));

  return result;
}

export async function updateAffiliateProfile(
  affiliateId: number,
  data: Partial<Pick<Affiliate, "paymentLink" | "paymentMethod" | "isActive">>
) {
  const [updated] = await database
    .update(affiliates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

export async function getMonthlyAffiliateEarnings(
  affiliateId: number,
  months: number = 6
) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const earnings = await database
    .select({
      month: sql<string>`to_char(${affiliateReferrals.createdAt}, 'YYYY-MM')`,
      earnings: sql<number>`sum(${affiliateReferrals.commission})::int`,
      referrals: sql<number>`count(*)::int`,
    })
    .from(affiliateReferrals)
    .where(
      and(
        eq(affiliateReferrals.affiliateId, affiliateId),
        gte(affiliateReferrals.createdAt, startDate)
      )
    )
    .groupBy(sql`to_char(${affiliateReferrals.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${affiliateReferrals.createdAt}, 'YYYY-MM')`);

  return earnings;
}

export async function updateAffiliateStripeAccount(
  affiliateId: number,
  data: {
    stripeConnectAccountId?: string;
    stripeAccountStatus?: string;
    stripeChargesEnabled?: boolean;
    stripePayoutsEnabled?: boolean;
    stripeDetailsSubmitted?: boolean;
    stripeAccountType?: string | null;
    lastStripeSync?: Date;
  }
) {
  // If assigning a Stripe account, first clear it from any other affiliate
  // This handles the case where the same Stripe account was previously connected
  // to a different affiliate (e.g., during testing)
  if (data.stripeConnectAccountId) {
    await database
      .update(affiliates)
      .set({
        stripeConnectAccountId: null,
        stripeAccountStatus: "not_started",
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
        stripeAccountType: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(affiliates.stripeConnectAccountId, data.stripeConnectAccountId),
          ne(affiliates.id, affiliateId)
        )
      );
  }

  const [updated] = await database
    .update(affiliates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

export async function getAffiliateByStripeAccountId(stripeAccountId: string) {
  const [affiliate] = await database
    .select()
    .from(affiliates)
    .where(eq(affiliates.stripeConnectAccountId, stripeAccountId));
  return affiliate;
}

export async function getAffiliateById(id: number) {
  const [affiliate] = await database
    .select()
    .from(affiliates)
    .where(eq(affiliates.id, id));
  return affiliate;
}

export async function getEligibleAffiliatesForAutoPayout(
  minimumBalanceCents: number = 5000 // $50 default
) {
  // Find affiliates that:
  // 1. Have Stripe Connect enabled (stripePayoutsEnabled = true)
  // 2. Have balance >= minimum threshold
  // 3. Are active
  // 4. Have not exceeded max retry count (payoutRetryCount < 3)
  //    After 3 failures, admin intervention is required
  const eligibleAffiliates = await database
    .select()
    .from(affiliates)
    .where(
      and(
        eq(affiliates.isActive, true),
        eq(affiliates.stripePayoutsEnabled, true),
        gte(affiliates.unpaidBalance, minimumBalanceCents),
        lt(affiliates.payoutRetryCount, 3)
      )
    );

  return eligibleAffiliates;
}

export async function createAffiliatePayoutWithStripeTransfer(
  data: AffiliatePayoutCreate & { affiliateId: number; stripeTransferId: string }
) {
  return createAffiliatePayout(data);
}

export async function getPayoutByStripeTransferId(stripeTransferId: string) {
  const [payout] = await database
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.stripeTransferId, stripeTransferId));
  return payout;
}

export async function updateAffiliatePayoutError(
  affiliateId: number,
  error: string,
  errorAt: Date
) {
  const [updated] = await database
    .update(affiliates)
    .set({
      lastPayoutError: error,
      lastPayoutErrorAt: errorAt,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

export async function clearAffiliatePayoutError(affiliateId: number) {
  const [updated] = await database
    .update(affiliates)
    .set({
      lastPayoutError: null,
      lastPayoutErrorAt: null,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

export async function disconnectAffiliateStripeAccount(affiliateId: number) {
  const [updated] = await database
    .update(affiliates)
    .set({
      stripeConnectAccountId: null,
      stripeAccountStatus: "not_started",
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeDetailsSubmitted: false,
      lastStripeSync: null,
      lastPayoutError: null,
      lastPayoutErrorAt: null,
      paymentMethod: "link",
      paymentLink: null,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

/**
 * Get affiliate by ID with user email and profile name for notifications.
 * Used when sending payout notification emails.
 */
export async function getAffiliateWithUserEmail(affiliateId: number): Promise<{
  id: number;
  userId: number;
  affiliateCode: string;
  stripeConnectAccountId: string | null;
  unpaidBalance: number;
  userEmail: string | null;
  userName: string | null;
} | undefined> {
  const [result] = await database
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      affiliateCode: affiliates.affiliateCode,
      stripeConnectAccountId: affiliates.stripeConnectAccountId,
      unpaidBalance: affiliates.unpaidBalance,
      userEmail: users.email,
      userName: profiles.displayName,
    })
    .from(affiliates)
    .leftJoin(users, eq(affiliates.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(affiliates.id, affiliateId));
  return result;
}

/**
 * Get affiliate by Stripe account ID with user email and profile name for notifications.
 * Used when handling transfer.failed webhooks to send failure notification emails.
 */
export async function getAffiliateByStripeAccountIdWithUserEmail(
  stripeAccountId: string
): Promise<{
  id: number;
  userId: number;
  affiliateCode: string;
  stripeConnectAccountId: string | null;
  unpaidBalance: number;
  userEmail: string | null;
  userName: string | null;
} | undefined> {
  const [result] = await database
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      affiliateCode: affiliates.affiliateCode,
      stripeConnectAccountId: affiliates.stripeConnectAccountId,
      unpaidBalance: affiliates.unpaidBalance,
      userEmail: users.email,
      userName: profiles.displayName,
    })
    .from(affiliates)
    .leftJoin(users, eq(affiliates.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(affiliates.stripeConnectAccountId, stripeAccountId));
  return result;
}

/**
 * Update the last payout attempt timestamp for an affiliate.
 * Used for cooldown protection against webhook event replays.
 */
export async function updateLastPayoutAttempt(affiliateId: number): Promise<void> {
  await database
    .update(affiliates)
    .set({ lastPayoutAttemptAt: new Date(), updatedAt: new Date() })
    .where(eq(affiliates.id, affiliateId));
}

/**
 * Increment the payout retry count for an affiliate and calculate the next retry time.
 * Uses exponential backoff: 1 hour, 4 hours, 24 hours, then stops auto-retry.
 */
export async function incrementPayoutRetryCount(affiliateId: number): Promise<void> {
  const affiliate = await getAffiliateById(affiliateId);
  const currentCount = affiliate?.payoutRetryCount ?? 0;
  const newCount = currentCount + 1;

  // Exponential backoff: 1 hour, 4 hours, 24 hours, then stop auto-retry
  const backoffHours = [1, 4, 24];
  const nextRetryHours = backoffHours[Math.min(newCount - 1, backoffHours.length - 1)];
  const nextRetryAt = newCount <= 3 ? new Date(Date.now() + nextRetryHours * 60 * 60 * 1000) : null;

  await database.update(affiliates)
    .set({
      payoutRetryCount: newCount,
      nextPayoutRetryAt: nextRetryAt,
      updatedAt: new Date()
    })
    .where(eq(affiliates.id, affiliateId));
}

/**
 * Reset the payout retry count for an affiliate after a successful payout.
 */
export async function resetPayoutRetryCount(affiliateId: number): Promise<void> {
  await database.update(affiliates)
    .set({
      payoutRetryCount: 0,
      nextPayoutRetryAt: null,
      updatedAt: new Date()
    })
    .where(eq(affiliates.id, affiliateId));
}

/**
 * Get affiliates that are eligible for payout retry.
 * These are affiliates where:
 * 1. nextPayoutRetryAt is set and has passed
 * 2. payoutRetryCount <= 3 (haven't exceeded max retries)
 */
export async function getAffiliatesEligibleForRetry(): Promise<Affiliate[]> {
  return database.select().from(affiliates)
    .where(
      and(
        isNotNull(affiliates.nextPayoutRetryAt),
        lte(affiliates.nextPayoutRetryAt, new Date()),
        lte(affiliates.payoutRetryCount, 3)
      )
    );
}

/**
 * Check if an affiliate has exceeded the rate limit for connect attempts.
 * Returns true if rate limited (3+ attempts in the last hour).
 */
export async function isConnectAttemptRateLimited(affiliateId: number): Promise<boolean> {
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) return false;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // If last attempt was more than an hour ago, reset the count (not rate limited)
  if (!affiliate.lastConnectAttemptAt || affiliate.lastConnectAttemptAt < oneHourAgo) {
    return false;
  }

  // Rate limited if 3 or more attempts in the last hour
  return affiliate.connectAttemptCount >= 3;
}

/**
 * Record a connect attempt for rate limiting purposes.
 * Resets the count if the last attempt was more than an hour ago.
 */
export async function recordConnectAttempt(affiliateId: number): Promise<void> {
  const affiliate = await getAffiliateById(affiliateId);
  if (!affiliate) return;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const shouldResetCount = !affiliate.lastConnectAttemptAt || affiliate.lastConnectAttemptAt < oneHourAgo;

  await database.update(affiliates)
    .set({
      lastConnectAttemptAt: new Date(),
      connectAttemptCount: shouldResetCount ? 1 : sql`${affiliates.connectAttemptCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(affiliates.id, affiliateId));
}

/**
 * Create a pending payout record BEFORE initiating the Stripe transfer.
 * This is part of the two-phase payout approach to prevent money being
 * transferred without being recorded in the database.
 *
 * Note: This does NOT mark referrals as paid yet - that happens when
 * the payout is completed via completePendingPayout.
 */
export async function createPendingPayout(data: {
  affiliateId: number;
  amount: number;
  paidBy: number;
}): Promise<{ id: number }> {
  const [payout] = await database
    .insert(affiliatePayouts)
    .values({
      affiliateId: data.affiliateId,
      amount: data.amount,
      paymentMethod: "stripe_connect",
      status: "pending",
      notes: "Automatic payout via Stripe Connect (pending)",
      paidBy: data.paidBy,
    })
    .returning({ id: affiliatePayouts.id });
  return payout;
}

/**
 * Complete a pending payout after Stripe transfer succeeds.
 * Updates the payout record with the transfer ID, marks status as "completed",
 * updates affiliate balances, and marks referrals as paid.
 */
export async function completePendingPayout(
  payoutId: number,
  stripeTransferId: string
): Promise<void> {
  await database.transaction(async (tx) => {
    // Get the pending payout
    const [payout] = await tx
      .select()
      .from(affiliatePayouts)
      .where(eq(affiliatePayouts.id, payoutId));

    if (!payout) {
      throw new Error(`Payout ${payoutId} not found`);
    }

    if (payout.status !== "pending") {
      throw new Error(`Payout ${payoutId} is not in pending status (current: ${payout.status})`);
    }

    // Update payout with transfer ID and mark as completed
    await tx
      .update(affiliatePayouts)
      .set({
        stripeTransferId,
        status: "completed",
        notes: "Automatic payout via Stripe Connect",
      })
      .where(eq(affiliatePayouts.id, payoutId));

    // Update affiliate balances
    await tx
      .update(affiliates)
      .set({
        paidAmount: sql`${affiliates.paidAmount} + ${payout.amount}`,
        unpaidBalance: sql`${affiliates.unpaidBalance} - ${payout.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, payout.affiliateId));

    // Get unpaid referrals
    const unpaidReferrals = await tx
      .select({
        id: affiliateReferrals.id,
        commission: affiliateReferrals.commission,
      })
      .from(affiliateReferrals)
      .where(
        and(
          eq(affiliateReferrals.affiliateId, payout.affiliateId),
          eq(affiliateReferrals.isPaid, false)
        )
      );

    // Mark referrals as paid up to the payout amount
    let remainingPayout = payout.amount;
    const referralsToUpdate: number[] = [];

    for (const referral of unpaidReferrals) {
      if (remainingPayout >= referral.commission) {
        referralsToUpdate.push(referral.id);
        remainingPayout -= referral.commission;
      } else if (remainingPayout > 0) {
        referralsToUpdate.push(referral.id);
        remainingPayout = 0;
      }

      if (remainingPayout === 0) break;
    }

    // Update the selected referrals as paid
    if (referralsToUpdate.length > 0) {
      await tx
        .update(affiliateReferrals)
        .set({ isPaid: true })
        .where(
          and(
            eq(affiliateReferrals.affiliateId, payout.affiliateId),
            inArray(affiliateReferrals.id, referralsToUpdate)
          )
        );
    }
  });
}

/**
 * Mark a pending payout as failed if the Stripe transfer fails.
 * Records the error message for debugging/auditing purposes.
 */
export async function failPendingPayout(
  payoutId: number,
  error: string
): Promise<void> {
  await database
    .update(affiliatePayouts)
    .set({
      status: "failed",
      errorMessage: error,
      notes: `Automatic payout failed: ${error}`,
    })
    .where(eq(affiliatePayouts.id, payoutId));
}

/**
 * Get a payout by ID.
 * Used to check payout status.
 */
export async function getPayoutById(payoutId: number) {
  const [payout] = await database
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, payoutId));
  return payout;
}

/**
 * Update an affiliate's commission rate.
 * Used by admins to set custom commission rates for individual affiliates.
 */
export async function updateAffiliateCommissionRate(
  affiliateId: number,
  commissionRate: number
) {
  const [updated] = await database
    .update(affiliates)
    .set({
      commissionRate,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}

/**
 * Update an affiliate's discount rate (the portion of commission given to customers).
 * Used by affiliates to control how much of their commission goes to customer discount vs their earnings.
 * @param affiliateId - The affiliate's ID
 * @param discountRate - The discount percentage (must be <= commissionRate)
 */
export async function updateAffiliateDiscountRate(
  affiliateId: number,
  discountRate: number
) {
  const [updated] = await database
    .update(affiliates)
    .set({
      discountRate,
      updatedAt: new Date(),
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated;
}
