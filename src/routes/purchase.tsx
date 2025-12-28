import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { stripe } from "~/lib/stripe";
import { authenticatedMiddleware } from "~/lib/auth";
import { env } from "~/utils/env";
import { loadStripe } from "@stripe/stripe-js";
import { publicEnv } from "~/utils/env-public";
import { Button, buttonVariants } from "~/components/ui/button";
import { z } from "zod";
import {
  Lock,
  Star,
  Users,
  Sparkles,
  Trophy,
  Code,
  RefreshCcw,
  ArrowRight,
  User,
  ShoppingCart,
} from "lucide-react";
import { GlassPanel } from "~/components/ui/glass-panel";
import { useAuth } from "~/hooks/use-auth";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { Link } from "@tanstack/react-router";
// Discount codes not implemented yet
// import { DiscountDialog } from "~/components/discount-dialog";
// import { discountStore } from "~/stores/discount-store";
import { shouldShowEarlyAccessFn } from "~/fn/early-access";
import { useAnalytics } from "~/hooks/use-analytics";
import { trackPurchaseIntentFn } from "~/fn/analytics";
import { getPricingSettingsFn } from "~/fn/app-settings";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";

/** Conversion factor: multiply dollars by this to get cents */
const CENTS_PER_DOLLAR = 100;
/** Divisor for converting percentage values (e.g., 30% -> 0.30) */
const PERCENTAGE_DIVISOR = 100;

/** Load Stripe once at module level for efficiency */
const stripePromise = loadStripe(publicEnv.VITE_STRIPE_PUBLISHABLE_KEY);

const searchSchema = z.object({
  ref: z.string().optional(),
  checkout: z.boolean().optional(),
});

const getAffiliateInfoSchema = z.object({
  code: z.string(),
});

const getAffiliateInfoFn = createServerFn()
  .inputValidator(getAffiliateInfoSchema)
  .handler(async ({ data }) => {
    const { getAffiliateByCode } = await import("~/data-access/affiliates");
    const { getProfile } = await import("~/data-access/profiles");
    const affiliate = await getAffiliateByCode(data.code);

    if (!affiliate || !affiliate.isActive) {
      return null;
    }

    // Get display name if enabled
    let displayName = "";
    const profile = await getProfile(affiliate.userId);
    if (profile?.useDisplayName && profile.displayName) {
      displayName = profile.displayName;
    }

    return {
      discountRate: affiliate.discountRate,
      commissionRate: affiliate.commissionRate - affiliate.discountRate,
      displayName,
    };
  });

export const Route = createFileRoute("/purchase")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ ref: search.ref, checkout: search.checkout }),
  loader: async ({ deps: { ref } }) => {
    // Load pricing and early access settings in parallel
    const [shouldShowEarlyAccess, pricing] = await Promise.all([
      shouldShowEarlyAccessFn(),
      getPricingSettingsFn(),
    ]);

    // Get affiliate info if ref code is present
    let affiliateInfo = null;
    if (ref) {
      affiliateInfo = await getAffiliateInfoFn({ data: { code: ref } });
    }

    return { shouldShowEarlyAccess, affiliateInfo, pricing };
  },
  component: RouteComponent,
  errorComponent: DefaultCatchBoundary,
});

const checkoutSchema = z.object({
  affiliateCode: z.string().optional(),
  discountCode: z.string().optional(),
  analyticsSessionId: z.string().optional(),
});

const checkoutFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .inputValidator(checkoutSchema)
  .handler(async ({ context, data }) => {
    if (!context.email) {
      throw new Error("Email is required");
    }

    const metadata: Record<string, string> = {
      userId: context.userId.toString(),
    };

    // Look up affiliate for discount and commission info
    let affiliateDiscount = 0;
    let affiliateCommission = 0;
    let affiliateName = "";
    let affiliateStripeAccountId: string | null = null;

    if (data.affiliateCode) {
      const { getAffiliateByCode } = await import("~/data-access/affiliates");
      const { getProfile } = await import("~/data-access/profiles");
      const affiliate = await getAffiliateByCode(data.affiliateCode);

      if (affiliate && affiliate.isActive) {
        metadata.affiliateCode = data.affiliateCode;
        metadata.affiliateId = affiliate.id.toString();
        // Store the rates at checkout time (frozen for this transaction)
        metadata.discountRate = affiliate.discountRate.toString();
        metadata.commissionRate = (affiliate.commissionRate - affiliate.discountRate).toString();
        metadata.originalCommissionRate = affiliate.commissionRate.toString();

        affiliateDiscount = affiliate.discountRate;
        affiliateCommission = affiliate.commissionRate - affiliate.discountRate;

        // Store Stripe Connect account ID for automatic transfer
        if (affiliate.stripeConnectAccountId && affiliate.stripePayoutsEnabled) {
          affiliateStripeAccountId = affiliate.stripeConnectAccountId;
        }

        // Get affiliate display name
        const profile = await getProfile(affiliate.userId);
        if (profile?.useDisplayName && profile.displayName) {
          affiliateName = profile.displayName;
        }
      }
    }

    if (data.analyticsSessionId) {
      metadata.analyticsSessionId = data.analyticsSessionId;

      // Get gclid from analytics session for internal tracking
      const { getAnalyticsSession } = await import("~/data-access/analytics");
      const session = await getAnalyticsSession(data.analyticsSessionId);

      console.log(
        `[Checkout] Analytics session lookup for ${data.analyticsSessionId}:`,
        {
          found: !!session,
          gclid: session?.gclid || "none",
        }
      );

      if (session?.gclid) {
        metadata.gclid = session.gclid;
      }
    } else {
      console.warn(
        "[Checkout] No analyticsSessionId provided - purchase won't be tracked"
      );
    }

    const successUrl = `${env.HOST_NAME}/success`;

    // Get current price from database (with fallback to config)
    const { getPricingCurrentPrice } = await import("~/data-access/app-settings");
    const currentPriceDollars = await getPricingCurrentPrice();

    // Calculate the final price (in cents)
    const basePriceInCents = currentPriceDollars * CENTS_PER_DOLLAR;
    let finalPriceInCents = basePriceInCents;

    // Apply affiliate discount if set
    if (affiliateDiscount > 0) {
      finalPriceInCents = Math.round(basePriceInCents * (1 - affiliateDiscount / PERCENTAGE_DIVISOR));
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Agentic Coding Mastery Course",
              description: "Lifetime access to AI-first development training",
            },
            unit_amount: finalPriceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      customer_email: context.email,
      cancel_url: `${env.HOST_NAME}/purchase`,
      metadata,
      allow_promotion_codes: true,
    };

    // Add automatic transfer to affiliate's Stripe Connect account
    // Stripe will automatically transfer when funds are available (no manual retry needed)
    if (affiliateStripeAccountId && affiliateCommission > 0) {
      const commissionAmountCents = Math.floor((finalPriceInCents * affiliateCommission) / PERCENTAGE_DIVISOR);
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: affiliateStripeAccountId,
          amount: commissionAmountCents,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      sessionId: session.id,
      affiliateDiscount,
      affiliateCommission,
      affiliateName,
    };
  });

const features = [
  {
    title: "Master Cursor IDE",
    description:
      "Learn AI pair programming and code generation with Cursor's advanced features",
    icon: Code,
  },
  {
    title: "Claude Code CLI Mastery",
    description:
      "Seamless AI-assisted development with Claude's command-line interface",
    icon: Sparkles,
  },
  {
    title: "Advanced Prompting Techniques",
    description:
      "Optimize Opus 4.5, Composer1, and GPT-5.1 Codex for maximum coding efficiency",
    icon: Star,
  },
  {
    title: "Agentic Development",
    description: "Build real-world projects by practing agentic coding",
    icon: Users,
  },
  {
    title: "10x Development Speed",
    description:
      "Transform your workflow with cutting-edge AI programming methods",
    icon: Trophy,
  },
  {
    title: "Lifetime Access",
    description: "Access all training modules and future AI tool updates",
    icon: RefreshCcw,
  },
];

function RouteComponent() {
  const user = useAuth();
  const continueSlug = useContinueSlug();
  const { ref, checkout } = Route.useSearch();
  const { sessionId } = useAnalytics();
  const navigate = Route.useNavigate();
  const hasTriggeredCheckout = React.useRef(false);
  const { affiliateInfo, pricing } = Route.useLoaderData();

  // Calculate discounted price if affiliate has discount
  const hasAffiliateDiscount = affiliateInfo && affiliateInfo.discountRate > 0;
  const discountedPrice = hasAffiliateDiscount
    ? Math.round(pricing.currentPrice * (1 - affiliateInfo.discountRate / PERCENTAGE_DIVISOR))
    : pricing.currentPrice;


  const proceedToCheckout = React.useCallback(async (affiliateCode: string) => {
    const stripeResolved = await stripePromise;
    if (!stripeResolved) throw new Error("Stripe failed to initialize");

    try {
      const { sessionId: stripeSessionId } = await checkoutFn({
        data: {
          affiliateCode: affiliateCode || undefined,
          // discountCode: affiliateCode || undefined, // Discount codes not implemented yet
          analyticsSessionId: sessionId || undefined, // Pass analytics session ID (convert null to undefined)
        },
      });
      const { error } = await stripeResolved.redirectToCheckout({
        sessionId: stripeSessionId,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Payment error:", error);
    }
  }, [sessionId]);

  // Calculate discount percentage from original to current price
  const discountPercentage = pricing.originalPrice > pricing.currentPrice
    ? Math.round(((pricing.originalPrice - pricing.currentPrice) / pricing.originalPrice) * 100)
    : 0;

  // Auto-trigger checkout if user just logged in with checkout intent
  // Wait for sessionId to be available (from sessionStorage after OAuth redirect)
  React.useEffect(() => {
    if (
      user &&
      !user.isPremium &&
      checkout &&
      !hasTriggeredCheckout.current &&
      sessionId
    ) {
      hasTriggeredCheckout.current = true;
      // Remove the checkout param from URL to prevent re-triggering on refresh
      navigate({
        search: { ref, checkout: undefined },
        replace: true,
      });
      // Proceed to checkout
      proceedToCheckout(ref || "");
    }
  }, [user, checkout, ref, navigate, sessionId, proceedToCheckout]);

  const handlePurchaseClick = async () => {
    // Track purchase intent
    if (sessionId) {
      try {
        await trackPurchaseIntentFn({
          data: {
            sessionId,
            buttonType: "main_purchase_button",
          },
        });
      } catch (error) {
        console.error("Failed to track purchase intent:", error);
      }
    }

    // Go directly to checkout (discount codes not implemented yet)
    await proceedToCheckout(ref || "");
  };



  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-[#0b101a] text-slate-800 dark:text-slate-200">
      <div className="prism-bg" />

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-5xl">
              {/* Badge - matching hero style */}
              <GlassPanel
                variant="cyan"
                padding="sm"
                className="inline-block mb-8"
              >
                <div className="inline-flex items-center text-sm font-medium text-slate-700 dark:text-cyan-400">
                  <span className="w-2 h-2 bg-cyan-600 dark:bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                  {pricing.promoLabel}{discountPercentage > 0 ? ` - ${discountPercentage}% OFF` : ""}
                  {hasAffiliateDiscount && (
                    <span className="text-green-600 dark:text-green-400 ml-2">
                      + {affiliateInfo.discountRate}% extra
                    </span>
                  )}
                </div>
              </GlassPanel>

              <h1 className="text-6xl leading-tight mb-8 text-slate-900 dark:text-white">
                Agentic Coding{" "}
                <span className="text-cyan-600 dark:text-cyan-400">
                  Mastery Course
                </span>
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-xl mb-12 max-w-3xl mx-auto">
                Transform your development workflow with AI-first programming.
                Master Cursor IDE, Claude Code CLI, and advanced AI models to
                build applications 10x faster than traditional methods. Get
                lifetime access to cutting-edge techniques.
              </p>

              <GlassPanel
                variant="cyan"
                padding="lg"
                className="max-w-4xl mx-auto mb-16 relative"
              >
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                      Complete Learning Package
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Everything you need to master AI-first development
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {features.map((feature) => (
                      <GlassPanel
                        key={feature.title}
                        variant="default"
                        padding="md"
                        className="group transition-all duration-200 hover:border-cyan-600/30 dark:hover:border-cyan-500/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="text-left">
                            <p className="text-slate-900 dark:text-white font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              {feature.title}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </GlassPanel>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="text-center space-y-6">
                    <div>
                      {hasAffiliateDiscount ? (
                        <>
                          {/* Always show original price as crossed out */}
                          <div className="text-slate-600 dark:text-slate-400 mb-2">
                            Regular price{" "}
                            <span className="line-through">
                              ${pricing.originalPrice}
                            </span>
                          </div>
                          <div className="text-6xl font-bold text-slate-900 dark:text-white mb-2">
                            ${discountedPrice}
                          </div>
                          {/* Promo as main discount */}
                          {pricing.promoLabel && (
                            <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                              {pricing.promoLabel}
                              {discountPercentage > 0 && ` - ${discountPercentage}% OFF`}
                            </div>
                          )}
                          {/* Affiliate discount as extra */}
                          <div className="text-green-600 dark:text-green-400 text-sm mt-1">
                            + {affiliateInfo.discountRate}% extra
                            {affiliateInfo.displayName && (
                              <span className="text-slate-600 dark:text-slate-400 font-normal">
                                {" "}via {affiliateInfo.displayName}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                            One-time payment, lifetime access
                          </div>
                          {/* Show total savings from original */}
                          {pricing.originalPrice > discountedPrice && (
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              Total savings: {Math.round(((pricing.originalPrice - discountedPrice) / pricing.originalPrice) * 100)}% off original
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {pricing.originalPrice > pricing.currentPrice && (
                            <div className="text-slate-600 dark:text-slate-400 mb-2">
                              Regular price{" "}
                              <span className="line-through">
                                ${pricing.originalPrice}
                              </span>
                            </div>
                          )}
                          <div className="text-6xl font-bold text-slate-900 dark:text-white mb-2">
                            ${pricing.currentPrice}
                          </div>
                          {pricing.promoLabel && (
                            <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                              {pricing.promoLabel}
                              {discountPercentage > 0 && ` - ${discountPercentage}% OFF`}
                            </div>
                          )}
                          <div className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                            One-time payment, lifetime access
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {user ? (
                        !user.isPremium ? (
                          <Button
                            variant="cyan"
                            size="lg"
                            onClick={handlePurchaseClick}
                            className="rounded-xl px-6 py-2.5 text-sm font-bold"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Get Instant Access
                          </Button>
                        ) : (
                          <Link
                            to="/learn/$slug"
                            params={{ slug: continueSlug }}
                            className={buttonVariants({
                              variant: "glass",
                              size: "lg",
                              className:
                                "rounded-xl px-5 py-2.5 text-xs font-bold",
                            })}
                          >
                            Continue with Course
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        )
                      ) : (
                        <a
                          href={`/api/login/google?redirect_uri=${encodeURIComponent(`/purchase?checkout=true${ref ? `&ref=${ref}` : ""}`)}`}
                          onClick={async () => {
                            if (sessionId) {
                              try {
                                await trackPurchaseIntentFn({
                                  data: {
                                    sessionId,
                                    buttonType: "login_to_purchase_button",
                                  },
                                });
                              } catch (error) {
                                console.error(
                                  "Failed to track purchase intent:",
                                  error
                                );
                              }
                            }
                          }}
                        >
                          <Button
                            variant="cyan"
                            size="lg"
                            className="rounded-xl px-6 py-2.5 text-sm font-bold"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Login to Purchase
                          </Button>
                        </a>
                      )}

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">
                          Secure payment with Stripe
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative elements - matching hero */}
                <div className="video-decorative-1"></div>
                <div className="video-decorative-2"></div>
              </GlassPanel>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0b101a] dark:via-[#0b101a]/80"></div>
      <div className="section-divider-glow-bottom"></div>

      {/* Discount Dialog - Hidden until discount codes are implemented */}
      {/* <DiscountDialog
        open={showDiscountDialog}
        onOpenChange={setShowDiscountDialog}
        onApplyDiscount={handleApplyDiscount}
        initialCode={discountStore.getDiscountCode() || ""}
      /> */}
    </div>
  );
}
