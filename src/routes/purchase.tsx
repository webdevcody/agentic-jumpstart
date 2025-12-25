import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
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
import { PRICING_CONFIG } from "~/config";

const searchSchema = z.object({
  ref: z.string().optional(),
  checkout: z.boolean().optional(),
});

export const Route = createFileRoute("/purchase")({
  validateSearch: searchSchema,
  loader: async () => {
    const shouldShowEarlyAccess = await shouldShowEarlyAccessFn();
    return { shouldShowEarlyAccess };
  },
  component: RouteComponent,
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

    if (data.affiliateCode) {
      metadata.affiliateCode = data.affiliateCode;
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

    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      customer_email: context.email,
      cancel_url: `${env.HOST_NAME}/purchase`,
      metadata,
    };

    // Apply discount if a valid discount code is provided
    if (data.discountCode && env.STRIPE_DISCOUNT_COUPON_ID) {
      sessionConfig.discounts = [
        {
          coupon: env.STRIPE_DISCOUNT_COUPON_ID,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return { sessionId: session.id };
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
  }, [user, checkout, ref, navigate, sessionId]);

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

  const proceedToCheckout = async (affiliateCode: string) => {
    const stripePromise = loadStripe(publicEnv.VITE_STRIPE_PUBLISHABLE_KEY);
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
                  Limited Time Offer - {PRICING_CONFIG.DISCOUNT_PERCENTAGE}% OFF
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
                      <div className="text-slate-600 dark:text-slate-400 mb-2">
                        Regular price{" "}
                        <span className="line-through">
                          {PRICING_CONFIG.FORMATTED_ORIGINAL_PRICE}
                        </span>
                      </div>
                      <div className="text-6xl font-bold text-slate-900 dark:text-white mb-2">
                        {PRICING_CONFIG.FORMATTED_CURRENT_PRICE}
                      </div>
                      <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                        Limited Time Offer
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        One-time payment, lifetime access
                      </div>
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
