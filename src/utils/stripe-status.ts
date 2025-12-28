import type Stripe from "stripe";

export const StripeAccountStatus = {
  NOT_STARTED: "not_started",
  ONBOARDING: "onboarding",
  ACTIVE: "active",
  RESTRICTED: "restricted",
} as const;

export type StripeAccountStatusType = typeof StripeAccountStatus[keyof typeof StripeAccountStatus];

/**
 * Determines the status of a Stripe Connect account based on its properties.
 *
 * @param account - The Stripe account object
 * @returns The account status
 *
 * Status flow:
 * - not_started: No account created yet (default in database)
 * - onboarding: Account created but details not submitted or not yet fully activated
 * - restricted: Account has restrictions or disabled_reason
 * - active: Fully activated with charges and payouts enabled
 */
export function determineStripeAccountStatus(account: Stripe.Account): StripeAccountStatusType {
  if (!account.details_submitted) {
    return StripeAccountStatus.ONBOARDING;
  }

  if (account.requirements?.disabled_reason) {
    return StripeAccountStatus.RESTRICTED;
  }

  if (account.charges_enabled && account.payouts_enabled) {
    return StripeAccountStatus.ACTIVE;
  }

  // Details submitted but not fully activated yet - still onboarding
  return StripeAccountStatus.ONBOARDING;
}
