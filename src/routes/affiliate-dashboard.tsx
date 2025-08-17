import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
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
import { useToast } from "~/hooks/use-toast";
import { useAuth } from "~/hooks/use-auth";
import {
  getAffiliateDashboardFn,
  updateAffiliatePaymentLinkFn,
} from "~/fn/affiliates";
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
} from "lucide-react";
import { cn } from "~/lib/utils";
import { env } from "~/utils/env";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
import { motion } from "framer-motion";

const paymentLinkSchema = z.object({
  paymentLink: z.url("Please provide a valid URL"),
});

type PaymentLinkFormValues = z.infer<typeof paymentLinkSchema>;

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
  beforeLoad: () => assertAuthenticatedFn(),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["affiliate", "dashboard"],
      queryFn: () => getAffiliateDashboardFn(),
    });
    return data;
  },
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const user = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);

  const { data: dashboard } = useSuspenseQuery({
    queryKey: ["affiliate", "dashboard"],
    queryFn: () => getAffiliateDashboardFn(),
  });

  const form = useForm<PaymentLinkFormValues>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      paymentLink: dashboard.affiliate.paymentLink,
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: updateAffiliatePaymentLinkFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      toast({
        title: "Payment Link Updated",
        description: "Your payment link has been successfully updated.",
      });
      setEditPaymentOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment link.",
        variant: "destructive",
      });
    },
  });

  const onSubmitPaymentLink = async (values: PaymentLinkFormValues) => {
    await updatePaymentMutation.mutateAsync({ data: values });
  };

  const affiliateLink = `${publicEnv.VITE_HOST_NAME}/purchase?ref=${dashboard.affiliate.affiliateCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
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
                <Button onClick={copyToClipboard} variant="secondary">
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
                  <span>30-day cookie duration</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{dashboard.affiliate.commissionRate}% commission</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                      <DialogTitle>Update Payment Link</DialogTitle>
                      <DialogDescription>
                        Enter your new payment link for receiving affiliate
                        payouts
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmitPaymentLink)}
                        className="space-y-4"
                      >
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
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={updatePaymentMutation.isPending}
                        >
                          {updatePaymentMutation.isPending
                            ? "Updating..."
                            : "Update Payment Link"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Payment Link:
                </span>
                <a
                  href={dashboard.affiliate.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-600 dark:text-theme-400 hover:underline flex items-center gap-1"
                >
                  {dashboard.affiliate.paymentLink}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  Minimum Payout:{" "}
                </span>
                <span className="text-sm font-medium">$50.00</span>
              </div>
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
                            {referral.purchaserName ||
                              referral.purchaserEmail ||
                              "Anonymous"}
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
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Paid
                      </Badge>
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
