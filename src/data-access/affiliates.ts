import { eq, desc, and, sql, gte, lt, inArray } from "drizzle-orm";
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

export async function getAffiliateReferrals(affiliateId: number) {
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
    .orderBy(desc(affiliateReferrals.createdAt));
  return referrals;
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
  data: AffiliatePayoutCreate & { affiliateId: number }
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
    const [payout] = await tx.insert(affiliatePayouts).values(data).returning();

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
      } else if (remainingPayout > 0) {
        // Partial payout - mark this referral as paid for the remaining amount
        // Note: This creates a potential issue with partial payments that may need business logic review
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
            eq(affiliateReferrals.affiliateId, data.affiliateId),
            inArray(affiliateReferrals.id, referralsToUpdate)
          )
        );
    }

    return payout;
  });
}

export async function getAffiliatePayouts(affiliateId: number) {
  const payouts = await database
    .select({
      id: affiliatePayouts.id,
      amount: affiliatePayouts.amount,
      paymentMethod: affiliatePayouts.paymentMethod,
      transactionId: affiliatePayouts.transactionId,
      notes: affiliatePayouts.notes,
      paidAt: affiliatePayouts.paidAt,
      // Don't expose admin email - only show display name for privacy
      paidByName: profiles.displayName,
    })
    .from(affiliatePayouts)
    .leftJoin(users, eq(affiliatePayouts.paidBy, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(affiliatePayouts.affiliateId, affiliateId))
    .orderBy(desc(affiliatePayouts.paidAt));
  return payouts;
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
      affiliateCode: affiliates.affiliateCode,
      paymentLink: affiliates.paymentLink,
      commissionRate: affiliates.commissionRate,
      totalEarnings: affiliates.totalEarnings,
      paidAmount: affiliates.paidAmount,
      unpaidBalance: affiliates.unpaidBalance,
      isActive: affiliates.isActive,
      createdAt: affiliates.createdAt,
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
  data: Partial<Pick<Affiliate, "paymentLink" | "isActive">>
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
