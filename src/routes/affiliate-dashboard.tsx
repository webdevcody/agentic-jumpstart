import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { assertFeatureEnabled } from "~/lib/feature-flags";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";
import {
  getAffiliateDashboardFn,
  updateAffiliatePaymentLinkFn,
  checkIfUserIsAffiliateFn,
  refreshStripeAccountStatusFn,
  disconnectStripeAccountFn,
  updateAffiliateDiscountRateFn,
} from "~/fn/affiliates";
import { getPricingSettingsFn } from "~/fn/app-settings";
import { authenticatedMiddleware } from "~/lib/auth";
import {
  Copy,
  DollarSign,
  TrendingUp,
  Users,
  ExternalLink,
  Edit2,
  Check,
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Link as LinkIcon,
  Zap,
  Unlink,
  Gift,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { env } from "~/utils/env";
import { AFFILIATE_CONFIG, PRICING_CONFIG } from "~/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { publicEnv } from "~/utils/env-public";
import { assertAuthenticatedFn } from "~/fn/auth";
import { isFeatureEnabledForUserFn } from "~/fn/app-settings";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Slider } from "~/components/ui/slider";

const paymentFormSchema = z.object({
  paymentMethod: z.enum(["link", "stripe"]),
  paymentLink: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === "link") {
    if (!data.paymentLink || data.paymentLink.length === 0) {
      return false;
    }
    try {
      new URL(data.paymentLink);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "Please provide a valid payment URL",
  path: ["paymentLink"],
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 20,
    },
  },
};

export const Route = createFileRoute("/affiliate-dashboard")({
  beforeLoad: async () => {
    await assertFeatureEnabled("AFFILIATES_FEATURE");
    await assertAuthenticatedFn();

    // Check if onboarding is complete - redirect if not
    const { data: affiliateCheck } = await checkIfUserIsAffiliateFn();
    if (!affiliateCheck.isAffiliate) {
      throw redirect({ to: "/affiliates" });
    }
    if (!affiliateCheck.isOnboardingComplete) {
      throw redirect({ to: "/affiliate-onboarding" });
    }
  },
  loader: async ({ context }) => {
    // Fetch dashboard data, feature flags, and pricing settings in parallel
    const [dashboardResponse, discountSplitEnabled, customPaymentLinkEnabled, pricingSettings] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["affiliate", "dashboard"],
        queryFn: () => getAffiliateDashboardFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["featureFlag", "AFFILIATE_DISCOUNT_SPLIT"],
        queryFn: () => isFeatureEnabledForUserFn({ data: { flagKey: "AFFILIATE_DISCOUNT_SPLIT" } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["featureFlag", "AFFILIATE_CUSTOM_PAYMENT_LINK"],
        queryFn: () => isFeatureEnabledForUserFn({ data: { flagKey: "AFFILIATE_CUSTOM_PAYMENT_LINK" } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["pricing", "settings"],
        queryFn: () => getPricingSettingsFn(),
      }),
    ]);

    return {
      isAffiliate: true,
      dashboard: dashboardResponse.data,
      discountSplitEnabled,
      customPaymentLinkEnabled,
      pricingSettings,
    };
  },
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const loaderData = Route.useLoaderData();

  // The beforeLoad guard already redirects non-affiliates, so dashboard is guaranteed to exist
  // Use the dashboard data, feature flags, and pricing settings from loader
  const dashboard = loaderData.dashboard!;
  const discountSplitEnabled = loaderData.discountSplitEnabled ?? true;
  const customPaymentLinkEnabled = loaderData.customPaymentLinkEnabled ?? true;
  const pricingSettings = loaderData.pricingSettings ?? { currentPrice: PRICING_CONFIG.CURRENT_PRICE, originalPrice: PRICING_CONFIG.ORIGINAL_PRICE, promoLabel: "" };

  const user = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [localDiscountRate, setLocalDiscountRate] = useState(dashboard.affiliate.discountRate);

  // Sync local discount rate with server data when it changes
  useEffect(() => {
    setLocalDiscountRate(dashboard.affiliate.discountRate);
  }, [dashboard.affiliate.discountRate]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: dashboard.affiliate.paymentMethod || "link",
      paymentLink: dashboard.affiliate.paymentLink || "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const updatePaymentMutation = useMutation({
    mutationFn: updateAffiliatePaymentLinkFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      toast.success("Payment Method Updated", {
        description: "Your payment method has been successfully updated.",
      });
      setEditPaymentOpen(false);
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update payment method.",
      });
    },
  });

  const refreshStripeStatusMutation = useMutation({
    mutationFn: refreshStripeAccountStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      toast.success("Status Refreshed", {
        description: "Your Stripe Connect status has been updated.",
      });
    },
    onError: (error) => {
      toast.error("Refresh Failed", {
        description: error.message || "Failed to refresh Stripe account status.",
      });
    },
  });

  const disconnectStripeAccountMutation = useMutation({
    mutationFn: disconnectStripeAccountFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      toast.success("Stripe Disconnected", {
        description: "Your Stripe Connect account has been disconnected. You can now set up a payment link.",
      });
      setDisconnectDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Disconnect Failed", {
        description: error.message || "Failed to disconnect Stripe account.",
      });
    },
  });

  const updateDiscountRateMutation = useMutation({
    mutationFn: updateAffiliateDiscountRateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      toast.success("Discount Split Updated", {
        description: "Your commission split has been updated.",
      });
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update discount split.",
      });
    },
  });

  const onSubmitPaymentForm = async (values: PaymentFormValues) => {
    await updatePaymentMutation.mutateAsync({ data: values });
  };

  const affiliateLink = `${publicEnv.VITE_HOST_NAME}/purchase?ref=${dashboard.affiliate.affiliateCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success("Link Copied!", {
      description: "Your affiliate link has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Dashboard Header */}
      <section className="relative w-full py-8 pb-2">
        {/* Modern AI-themed gradient background */}
        <div className="absolute inset-0 hero-background-ai"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

        {/* AI circuit pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="circuit-pattern absolute inset-0"></div>
        </div>

        {/* AI-themed floating elements */}
        <div className="floating-elements">
          <div className="floating-element-1"></div>
          <div className="floating-element-2"></div>
          <div className="floating-element-small top-20 right-10"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Affiliate Dashboard
              </div>
              <h1 className="text-5xl font-bold mb-4">
                Track Your{" "}
                <span className="text-theme-400">Affiliate Success</span>
              </h1>
              <p className="text-description max-w-2xl mx-auto">
                Monitor your referrals, earnings, and manage your affiliate
                account with comprehensive analytics
              </p>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="section-divider-glow-bottom"></div>
      </section>

      {/* Main Dashboard Content */}
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 pt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Migration Prompt - Show when custom payment link is disabled but affiliate uses it */}
        {!customPaymentLinkEnabled && dashboard.affiliate.paymentMethod === "link" && (
          <motion.div variants={itemVariants}>
            <Card className="mb-8 border-amber-500/50 bg-amber-50/10 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Payment Method Update Required
                </CardTitle>
                <CardDescription>
                  Custom payment links are no longer supported. Please connect a Stripe account to continue receiving payouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/api/connect/stripe"
                    className={cn(buttonVariants({ variant: "default" }), "flex items-center gap-2")}
                  >
                    <Zap className="h-4 w-4" />
                    Create New Stripe Account
                  </a>
                  <a
                    href="/api/connect/stripe/oauth"
                    className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connect Existing Stripe Account
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Affiliate Link Card */}
        <motion.div variants={itemVariants}>
          <Card className="mb-8 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardHeader>
              <CardTitle>Your Affiliate Link</CardTitle>
              <CardDescription>
                Share this link to earn commissions on referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={affiliateLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="secondary"
                  aria-label={copied ? "Link copied" : "Copy affiliate link to clipboard"}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{AFFILIATE_CONFIG.COOKIE_DURATION_DAYS}-day cookie duration</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{dashboard.affiliate.commissionRate - localDiscountRate}% commission</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share the Benefit Card - only shown when discount split feature is enabled */}
        {discountSplitEnabled && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-500" />
                    Share the Benefit
                  </CardTitle>
                  <CardDescription>
                    Offer your audience a discount and boost your conversions. The more you share, the more attractive your offer becomes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <Gift className="h-4 w-4" />
                    Customer Discount
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                    {localDiscountRate}%
                  </span>
                </div>
                <Slider
                  value={[localDiscountRate]}
                  max={dashboard.affiliate.commissionRate}
                  min={0}
                  step={1}
                  onValueChange={(value) => {
                    setLocalDiscountRate(value[0]);
                  }}
                  onValueCommit={(value) => {
                    updateDiscountRateMutation.mutate({ data: { discountRate: value[0] } });
                  }}
                  disabled={updateDiscountRateMutation.isPending}
                  className="w-full"
                />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-theme-600 dark:text-theme-400 font-medium flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Your Earnings
                  </span>
                  <span className="font-bold text-theme-600 dark:text-theme-400 text-lg">
                    {dashboard.affiliate.commissionRate - localDiscountRate}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 border border-green-200/60 dark:border-green-700/40">
                  <Gift className="h-5 w-5 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Customer saves</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${((pricingSettings.currentPrice * localDiscountRate) / 100).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">on ${pricingSettings.currentPrice} course</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-theme-50 to-theme-100/50 dark:from-theme-900/30 dark:to-theme-800/20 border border-theme-200/60 dark:border-theme-700/40">
                  <DollarSign className="h-5 w-5 text-theme-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">You earn</p>
                  <p className="text-2xl font-bold text-theme-600 dark:text-theme-400">
                    ${((pricingSettings.currentPrice * (dashboard.affiliate.commissionRate - localDiscountRate)) / 100).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">per sale</p>
                </div>
              </div>

              {localDiscountRate > 0 && (
                <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
                  Customers using your link will see a {localDiscountRate}% discount applied at checkout
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={statsVariants} className="group relative">
            <Card className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 transition-all duration-300 hover:shadow-glow-cyan hover:border-theme-400/80 hover:-translate-y-1">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Total Earnings
                </CardTitle>
                <div className="w-12 h-12 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                  <DollarSign className="h-6 w-6 text-theme-500 dark:text-theme-400 group-hover:text-theme-600 dark:group-hover:text-theme-300 transition-colors duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  {formatCurrency(dashboard.stats.totalEarnings)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Lifetime earnings
                </p>
              </CardContent>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-theme-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-theme-400/50"></div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants} className="group relative">
            <Card className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 transition-all duration-300 hover:shadow-glow-cyan hover:border-theme-400/80 hover:-translate-y-1">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Unpaid Balance
                </CardTitle>
                <div className="w-12 h-12 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                  <CreditCard className="h-6 w-6 text-theme-500 dark:text-theme-400 group-hover:text-theme-600 dark:group-hover:text-theme-300 transition-colors duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  {formatCurrency(dashboard.stats.unpaidEarnings)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pending payment
                </p>
              </CardContent>

              {/* Decorative elements */}
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-theme-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-theme-500/50"></div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants} className="group relative">
            <Card className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 transition-all duration-300 hover:shadow-glow-cyan hover:border-theme-400/80 hover:-translate-y-1">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Total Referrals
                </CardTitle>
                <div className="w-12 h-12 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                  <Users className="h-6 w-6 text-theme-500 dark:text-theme-400 group-hover:text-theme-600 dark:group-hover:text-theme-300 transition-colors duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  {dashboard.stats.totalReferrals}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Successful conversions
                </p>
              </CardContent>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-theme-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-theme-400/50"></div>
            </Card>
          </motion.div>

          <motion.div variants={statsVariants} className="group relative">
            <Card className="relative overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 transition-all duration-300 hover:shadow-glow-cyan hover:border-theme-400/80 hover:-translate-y-1">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Paid Out
                </CardTitle>
                <div className="w-12 h-12 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                  <TrendingUp className="h-6 w-6 text-theme-500 dark:text-theme-400 group-hover:text-theme-600 dark:group-hover:text-theme-300 transition-colors duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  {formatCurrency(dashboard.stats.paidEarnings)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Total paid</p>
              </CardContent>

              {/* Decorative elements */}
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-theme-500/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-theme-500/50"></div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Payment Information */}
        <motion.div variants={itemVariants}>
          <Card className="mb-8 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Your payment details for receiving commissions
                  </CardDescription>
                </div>
                {customPaymentLinkEnabled && (
                <Dialog
                  open={editPaymentOpen}
                  onOpenChange={setEditPaymentOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Payment Method</DialogTitle>
                      <DialogDescription>
                        Choose how you want to receive affiliate payouts
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmitPaymentForm)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className={cn("grid gap-4", customPaymentLinkEnabled ? "grid-cols-2" : "grid-cols-1")}
                                >
                                  {customPaymentLinkEnabled && (
                                    <label
                                      className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                                        field.value === "link"
                                          ? "border-theme-500 bg-theme-500/10"
                                          : "border-border hover:border-theme-500/50"
                                      )}
                                    >
                                      <RadioGroupItem value="link" className="sr-only" />
                                      <DollarSign className="h-8 w-8 mb-2 text-theme-500" />
                                      <span className="font-medium">Payment Link</span>
                                      <span className="text-xs text-muted-foreground">PayPal, Venmo, etc.</span>
                                    </label>
                                  )}
                                  <label
                                    className={cn(
                                      "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                                      field.value === "stripe"
                                        ? "border-theme-500 bg-theme-500/10"
                                        : "border-border hover:border-theme-500/50"
                                    )}
                                  >
                                    <RadioGroupItem value="stripe" className="sr-only" />
                                    <CreditCard className="h-8 w-8 mb-2 text-theme-500" />
                                    <span className="font-medium">Stripe Connect</span>
                                    <span className="text-xs text-muted-foreground">Direct deposits</span>
                                  </label>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {customPaymentLinkEnabled && paymentMethod === "link" ? (
                          <FormField
                            control={form.control}
                            name="paymentLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Link</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="https://paypal.me/yourname"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  PayPal, Venmo, or other payment link
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className="p-4 rounded-lg border border-dashed border-theme-500/50 bg-theme-500/5">
                            <div className="flex items-center gap-3 mb-2">
                              <CreditCard className="h-5 w-5 text-theme-500" />
                              <p className="font-medium">Stripe Connect</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {dashboard.affiliate.stripeAccountStatus === "active" && dashboard.affiliate.stripePayoutsEnabled
                                ? "Your Stripe account is connected and payouts are enabled"
                                : dashboard.affiliate.stripeConnectAccountId
                                  ? "Complete your Stripe setup to enable payouts"
                                  : "Connect your Stripe account to enable automatic payouts"}
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={updatePaymentMutation.isPending}
                        >
                          {updatePaymentMutation.isPending
                            ? "Updating..."
                            : "Update Payment Method"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              {/* Payment Method Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Payment Method:
                  </span>
                  <Badge variant="secondary">
                    {dashboard.affiliate.paymentMethod === "stripe"
                      ? "Stripe Connect"
                      : "Payment Link"}
                  </Badge>
                </div>
                {/* Refresh Button - only for onboarding/restricted states */}
                {dashboard.affiliate.paymentMethod === "stripe" &&
                  (dashboard.affiliate.stripeAccountStatus === "onboarding" ||
                   dashboard.affiliate.stripeAccountStatus === "restricted") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshStripeStatusMutation.mutate({ data: undefined })}
                    disabled={refreshStripeStatusMutation.isPending}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 mr-2",
                        refreshStripeStatusMutation.isPending && "animate-spin"
                      )}
                    />
                    {refreshStripeStatusMutation.isPending ? "Refreshing..." : "Refresh"}
                  </Button>
                )}
              </div>

              {/* Payment Link Info (for link method) */}
              {dashboard.affiliate.paymentMethod === "link" && dashboard.affiliate.paymentLink && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Payment Link:
                  </span>
                  {dashboard.affiliate.paymentLink.startsWith("https://") ? (
                    <a
                      href={dashboard.affiliate.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-theme-600 dark:text-theme-400 hover:underline flex items-center gap-1"
                    >
                      {dashboard.affiliate.paymentLink}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {dashboard.affiliate.paymentLink}
                    </span>
                  )}
                </div>
              )}

              {/* Stripe Account Status (for stripe method) */}
              {dashboard.affiliate.paymentMethod === "stripe" && (
                <>
                  {/* Payout Error Banner */}
                  {dashboard.affiliate.lastPayoutError && (
                    <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 dark:bg-red-900/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Payout Failed</p>
                          <p className="text-sm text-red-600/90 dark:text-red-300/90 mb-2">
                            {dashboard.affiliate.lastPayoutError}
                          </p>
                          {dashboard.affiliate.lastPayoutErrorAt && (
                            <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-2">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Failed on {formatDate(dashboard.affiliate.lastPayoutErrorAt)}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Please verify your Stripe Connect account settings or contact support if this issue persists.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Not Started State */}
                  {dashboard.affiliate.stripeAccountStatus === "not_started" && (
                    <div className="p-4 rounded-lg border border-dashed border-theme-500/50 bg-theme-500/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-theme-500/10 flex items-center justify-center">
                          <LinkIcon className="h-5 w-5 text-theme-500" />
                        </div>
                        <div>
                          <p className="font-medium">Connect Your Stripe Account</p>
                          <p className="text-sm text-muted-foreground">
                            Set up Stripe to receive automatic payouts on every sale
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <a
                          href="/api/connect/stripe"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 w-full",
                            "bg-theme-500 hover:bg-theme-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                          )}
                        >
                          <Zap className="h-4 w-4" />
                          Create New Stripe Account
                        </a>
                        <a
                          href="/api/connect/stripe/oauth"
                          className={cn(
                            "inline-flex items-center justify-center gap-2 w-full",
                            "border border-theme-500/50 hover:bg-theme-500/10 text-theme-600 dark:text-theme-400 font-medium py-2.5 px-4 rounded-lg transition-colors"
                          )}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Connect Existing Stripe Account
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Onboarding State */}
                  {dashboard.affiliate.stripeAccountStatus === "onboarding" && (
                    <div className="p-4 rounded-lg border border-dashed border-orange-500/50 bg-orange-500/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-600 dark:text-orange-400">Complete Your Onboarding</p>
                          <p className="text-sm text-muted-foreground">
                            Your Stripe account setup is incomplete. Please complete onboarding to enable payouts.
                          </p>
                        </div>
                      </div>
                      <a
                        href="/api/connect/stripe/refresh"
                        className={cn(
                          "inline-flex items-center justify-center gap-2 w-full",
                          "bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        )}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Complete Onboarding
                      </a>
                    </div>
                  )}

                  {/* Active State - simple confirmation with account info */}
                  {dashboard.affiliate.stripeAccountStatus === "active" && dashboard.affiliate.stripePayoutsEnabled && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Zap className="h-4 w-4" />
                          <p className="text-sm font-medium">Instant Payouts Active</p>
                        </div>
                        {dashboard.affiliate.stripeAccountType && (
                          <Badge variant="outline" className="text-xs">
                            {dashboard.affiliate.stripeAccountType}
                          </Badge>
                        )}
                      </div>
                      {dashboard.affiliate.stripeAccountName && (
                        <p className="text-sm font-medium text-foreground mt-2">
                          {dashboard.affiliate.stripeAccountName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Commissions are automatically transferred with each sale
                      </p>
                    </div>
                  )}

                  {/* Restricted Account Warning - this one IS important */}
                  {dashboard.affiliate.stripeAccountStatus === "restricted" && (
                    <div className="p-3 rounded-lg border border-orange-500/50 bg-orange-500/5">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Account Restricted</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your Stripe account has restrictions. Please visit your Stripe dashboard to resolve any issues.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Minimum Payout Info - only for manual link payouts */}
              {dashboard.affiliate.paymentMethod === "link" && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Minimum Payout:{" "}
                  </span>
                  <span className="text-sm font-medium">$50.00</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Earnings Chart */}
        {dashboard.monthlyEarnings.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="mb-8 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Monthly Earnings
                </CardTitle>
                <CardDescription className="text-lg">
                  Your earnings performance over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {dashboard.monthlyEarnings.map((month, index) => (
                    <div
                      key={month.month}
                      className="group/item hover:bg-theme-50/50 dark:hover:bg-theme-950/20 p-4 rounded-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-20 text-sm font-medium text-foreground group-hover/item:text-theme-600 dark:group-hover/item:text-theme-400 transition-colors duration-300">
                          {month.month}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-theme-500 to-theme-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                  style={{
                                    width: `${(month.earnings / Math.max(...dashboard.monthlyEarnings.map((m) => m.earnings))) * 100}%`,
                                    minWidth: "4px",
                                    animationDelay: `${index * 100}ms`,
                                  }}
                                >
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000"></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-foreground group-hover/item:text-theme-600 dark:group-hover/item:text-theme-400 transition-colors duration-300">
                                {formatCurrency(month.earnings)}
                              </span>
                              <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                {month.referrals}{" "}
                                {month.referrals === 1 ? "sale" : "sales"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Referrals */}
        <motion.div variants={itemVariants}>
          <Card className="mb-8 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                Recent Referrals
              </CardTitle>
              <CardDescription className="text-lg">
                Your latest successful conversions
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {dashboard.referrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center">
                    <Users className="h-10 w-10 text-theme-500 dark:text-theme-400 opacity-60" />
                  </div>
                  <p className="text-lg font-medium mb-2">No referrals yet</p>
                  <p className="text-sm">
                    Share your affiliate link to start earning commissions!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="group/ref flex items-center justify-between p-6 rounded-xl border border-border/50 hover:border-theme-400/60 bg-background/50 hover:bg-theme-50/30 dark:hover:bg-theme-950/20 transition-all duration-300 hover:shadow-elevation-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg group-hover/ref:text-theme-600 dark:group-hover/ref:text-theme-400 transition-colors duration-300">
                            {referral.purchaserName || "Anonymous"}
                          </span>
                          {referral.isPaid ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-orange-300 text-orange-600 dark:border-orange-600 dark:text-orange-400"
                            >
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(referral.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground group-hover/ref:text-theme-600 dark:group-hover/ref:text-theme-400 transition-colors duration-300">
                          {formatCurrency(referral.commission)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          from {formatCurrency(referral.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout History */}
        {dashboard.payouts.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 hover:shadow-glow-cyan hover:border-theme-400/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                  Payout History
                </CardTitle>
                <CardDescription className="text-lg">
                  Your complete payment history
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {dashboard.payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="group/payout flex items-center justify-between p-6 rounded-xl border border-border/50 hover:border-theme-400/60 bg-background/50 hover:bg-theme-50/30 dark:hover:bg-theme-950/20 transition-all duration-300 hover:shadow-elevation-2"
                    >
                      <div className="flex-1">
                        <div className="text-2xl font-bold text-foreground group-hover/payout:text-theme-600 dark:group-hover/payout:text-theme-400 transition-colors duration-300 mb-2">
                          {formatCurrency(payout.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {formatDate(payout.paidAt)} via {payout.paymentMethod}
                        </div>
                        {payout.transactionId && (
                          <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                            Transaction: {payout.transactionId}
                          </div>
                        )}
                      </div>
                      {payout.status === "completed" ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Paid
                        </Badge>
                      ) : payout.status === "pending" ? (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-4 py-2"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-4 py-2"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
