import { createFileRoute, Link } from "@tanstack/react-router";
import { assertFeatureEnabled } from "~/lib/feature-flags";
import { buttonVariants } from "~/components/ui/button";
import { useAuth } from "~/hooks/use-auth";
import { checkIfUserIsAffiliateFn } from "~/fn/affiliates";
import { getPublicAffiliateCommissionRateFn, getPricingSettingsFn } from "~/fn/app-settings";
import { AFFILIATE_CONFIG } from "~/config";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Award,
  ArrowRight,
  Zap,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/affiliates")({
  beforeLoad: () => assertFeatureEnabled("AFFILIATES_FEATURE"),
  loader: async ({ context }) => {
    const [affiliateCheck, commissionRate, pricingSettings] = await Promise.all([
      context.queryClient.fetchQuery({
        queryKey: ["affiliate", "check"],
        queryFn: () => checkIfUserIsAffiliateFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["affiliateCommissionRate"],
        queryFn: () => getPublicAffiliateCommissionRateFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["pricingSettings"],
        queryFn: () => getPricingSettingsFn(),
      }),
    ]);

    // Calculate max per-sale commission (originalPrice in dollars, commissionRate in percent)
    const maxCommissionPerSale = Math.floor(pricingSettings.originalPrice * (commissionRate / 100));

    return {
      isAffiliate: affiliateCheck.isAffiliate,
      isOnboardingComplete: affiliateCheck.isOnboardingComplete,
      commissionRate,
      maxCommissionPerSale,
    };
  },
  component: AffiliatesPage,
});

function AffiliatesPage() {
  const user = useAuth();
  const loaderData = Route.useLoaderData();
  const { isAffiliate, isOnboardingComplete = false, commissionRate, maxCommissionPerSale } = loaderData;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Join Our Affiliate Program</h1>
        <p className="text-muted-foreground mb-8">
          Please login to join our affiliate program
        </p>
        <a
          href={`/api/login/google?redirect_uri=${encodeURIComponent("/affiliates")}`}
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Login to Continue
        </a>
      </div>
    );
  }

  if (isAffiliate && isOnboardingComplete) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          You're Already an Affiliate!
        </h1>
        <p className="text-muted-foreground mb-8">
          Access your dashboard to view your stats and get your affiliate link
        </p>
        <Link
          to="/affiliate-dashboard"
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (isAffiliate && !isOnboardingComplete) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Complete Your Setup
        </h1>
        <p className="text-muted-foreground mb-8">
          You've started the affiliate registration. Complete your payment setup to start earning.
        </p>
        <Link
          to="/affiliate-onboarding"
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Continue Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-background-ai"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

      {/* Floating elements */}
      <div className="floating-elements">
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              Earn {commissionRate}% Commission
            </div>

            <h1 className="text-6xl font-bold mb-6">
              Partner With{" "}
              <span className="text-theme-400">Agentic Jumpstart</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Join our affiliate program and earn generous commissions by
              sharing our AI coding mastery course with your audience. Help
              developers transform their workflow while building a sustainable
              income stream.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="video-wrapper p-6">
              <DollarSign className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{commissionRate}% Commission</h3>
              <p className="text-muted-foreground">
                Earn generous commissions for every sale you refer. One of the highest commission
                rates in the industry.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <Clock className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{AFFILIATE_CONFIG.COOKIE_DURATION_DAYS}-Day Cookie</h3>
              <p className="text-muted-foreground">
                Long attribution window ensures you get credit for purchases
                made within {AFFILIATE_CONFIG.COOKIE_DURATION_DAYS} days.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <TrendingUp className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your clicks, conversions, and earnings in real-time from
                your dashboard.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <Users className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Marketing Support</h3>
              <p className="text-muted-foreground">
                Access promotional materials, email templates, and social media
                content.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <Shield className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trusted Platform</h3>
              <p className="text-muted-foreground">
                Promote a high-quality course that delivers real value to
                developers.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <Award className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Monthly Payouts</h3>
              <p className="text-muted-foreground">
                Receive monthly payments via your preferred payment method. $50
                minimum payout.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-theme-600 dark:text-theme-400">
                    1
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  Register with your payment link
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-theme-600 dark:text-theme-400">
                    2
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Get Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Receive your unique affiliate link
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-theme-600 dark:text-theme-400">
                    3
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Share & Promote</h3>
                <p className="text-sm text-muted-foreground">
                  Share with your audience
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-theme-600 dark:text-theme-400">
                    4
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Earn Commissions</h3>
                <p className="text-sm text-muted-foreground">
                  Get paid monthly for referrals
                </p>
              </div>
            </div>
          </div>

          {/* Join CTA */}
          <div className="max-w-2xl mx-auto">
            <div className="video-wrapper p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join our affiliate program in just a few minutes and start earning {commissionRate}% commission on every referral.
              </p>
              <Link
                to="/affiliate-onboarding"
                className={buttonVariants({ size: "lg" })}
              >
                <Zap className="mr-2 h-4 w-4" />
                Become an Affiliate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-8">
              Why Partners Love Our Program
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-theme-600 dark:text-theme-400 mb-2">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  12%
                </div>
                <p className="text-muted-foreground">Average conversion rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-theme-600 dark:text-theme-400 mb-2">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  Up to ${maxCommissionPerSale}
                </div>
                <p className="text-muted-foreground">Per sale commission</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-theme-600 dark:text-theme-400 mb-2">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  98%
                </div>
                <p className="text-muted-foreground">Customer satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
