import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { assertFeatureEnabled } from "~/lib/feature-flags";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "~/hooks/use-auth";
import {
  registerAffiliateFn,
  checkIfUserIsAffiliateFn,
} from "~/fn/affiliates";
import { isFeatureEnabledForUserFn, getPublicAffiliateCommissionRateFn, getPublicAffiliateMinimumPayoutFn } from "~/fn/app-settings";
import { AFFILIATE_CONFIG } from "~/config";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  CreditCard,
  Link as LinkIcon,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Wizard steps
type WizardStep = "payment-method" | "payment-setup" | "terms" | "complete";

// Payment method types
type PaymentMethodType = "stripe-express" | "stripe-oauth" | "link";

const paymentLinkSchema = z.object({
  paymentLink: z.string().url("Please enter a valid URL"),
});

const searchSchema = z.object({
  step: z.enum(["payment-method", "payment-setup", "terms", "complete"]).optional(),
  method: z.enum(["stripe-express", "stripe-oauth", "link"]).optional(),
  stripeComplete: z.boolean().optional(),
});

export const Route = createFileRoute("/affiliate-onboarding")({
  validateSearch: searchSchema,
  beforeLoad: () => assertFeatureEnabled("AFFILIATES_FEATURE"),
  loader: async ({ context }) => {
    // Check if user is already an affiliate (always fetch fresh data)
    const affiliateCheck = await context.queryClient.fetchQuery({
      queryKey: ["affiliate", "check"],
      queryFn: () => checkIfUserIsAffiliateFn(),
    });

    // Check feature flags
    const customPaymentLinkEnabled = await context.queryClient.ensureQueryData({
      queryKey: ["featureFlag", "AFFILIATE_CUSTOM_PAYMENT_LINK"],
      queryFn: () =>
        isFeatureEnabledForUserFn({
          data: { flagKey: "AFFILIATE_CUSTOM_PAYMENT_LINK" },
        }),
    });

    // Get commission rate and minimum payout from settings
    const [commissionRate, minimumPayout] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["affiliateCommissionRate"],
        queryFn: () => getPublicAffiliateCommissionRateFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["affiliateMinimumPayout"],
        queryFn: () => getPublicAffiliateMinimumPayoutFn(),
      }),
    ]);

    return {
      isAffiliate: affiliateCheck.isAffiliate,
      isOnboardingComplete: affiliateCheck.isOnboardingComplete,
      paymentMethod: affiliateCheck.paymentMethod,
      stripeAccountStatus: affiliateCheck.stripeAccountStatus,
      hasStripeAccount: affiliateCheck.hasStripeAccount,
      customPaymentLinkEnabled,
      commissionRate,
      minimumPayout,
    };
  },
  component: AffiliateOnboarding,
});

function AffiliateOnboarding() {
  const loaderData = Route.useLoaderData();
  const search = useSearch({ from: "/affiliate-onboarding" });
  const router = useRouter();
  const user = useAuth();
  const queryClient = useQueryClient();

  // Determine initial step based on URL params and affiliate status
  const getInitialStep = (): WizardStep => {
    if (search.step) return search.step;
    if (search.stripeComplete) return "complete"; // Return from Stripe = complete

    // If onboarding is complete, show complete step
    if (loaderData.isOnboardingComplete) {
      return "complete";
    }

    // If affiliate has Stripe account (even if not fully active), they completed Stripe setup
    // Show "complete" step with status message
    if (loaderData.hasStripeAccount && loaderData.paymentMethod === "stripe") {
      return "complete";
    }

    // If affiliate exists but no payment configured, they need to select payment method
    if (loaderData.isAffiliate) {
      return "payment-method";
    }

    return "terms"; // New users start with terms
  };

  const [currentStep, setCurrentStep] = useState<WizardStep>(getInitialStep);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(
    search.method || null
  );
  const [paymentLink, setPaymentLink] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const form = useForm<z.infer<typeof paymentLinkSchema>>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      paymentLink: "",
    },
  });

  // No auto-redirect - let users access onboarding to change settings if needed

  // Handle Stripe callback return
  useEffect(() => {
    if (search.stripeComplete && search.method) {
      setSelectedMethod(search.method);
      setCurrentStep("terms");
    }
  }, [search.stripeComplete, search.method]);

  const registerMutation = useMutation({
    mutationFn: registerAffiliateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
      // After registration, go to payment method selection
      setCurrentStep("payment-method");
    },
    onError: (error) => {
      toast.error("Registration Failed", {
        description: error.message || "Failed to complete registration. Please try again.",
      });
    },
  });

  // Mutation to update payment method to link (must be before early returns!)
  const updatePaymentMutation = useMutation({
    mutationFn: async (paymentLink: string) => {
      const { updatePaymentMethodFn } = await import("~/fn/affiliates");
      return updatePaymentMethodFn({
        data: { paymentMethod: "link", paymentLink },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
      toast.success("Payment method updated!", {
        description: "Your payment settings have been saved.",
      });
      setCurrentStep("complete");
    },
    onError: (error) => {
      toast.error("Failed to save payment link", {
        description: error.message || "Please try again.",
      });
    },
  });

  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Join Our Affiliate Program</h1>
        <p className="text-muted-foreground mb-8">
          Please login to join our affiliate program
        </p>
        <a
          href={`/api/login/google?redirect_uri=${encodeURIComponent("/affiliate-onboarding")}`}
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Login to Continue
        </a>
      </div>
    );
  }

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
  };

  const handleContinueFromMethodStep = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedMethod === "stripe-express") {
      document.cookie = `affiliate_onboarding=stripe-express; path=/; max-age=3600`;
      window.location.href = "/api/connect/stripe";
    } else if (selectedMethod === "stripe-oauth") {
      document.cookie = `affiliate_onboarding=stripe-oauth; path=/; max-age=3600`;
      window.location.href = "/api/connect/stripe/oauth";
    } else {
      // For link: go to payment-setup
      setCurrentStep("payment-setup");
    }
  };

  const handlePaymentLinkSubmit = async (values: z.infer<typeof paymentLinkSchema>) => {
    await updatePaymentMutation.mutateAsync(values.paymentLink);
  };

  const handleAcceptTerms = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms of service");
      return;
    }

    // Register affiliate with stripe as default (they'll configure payment next)
    await registerMutation.mutateAsync({
      data: {
        paymentMethod: "stripe",
        agreedToTerms: true,
      },
    });
  };

  const handleGoToDashboard = () => {
    router.navigate({ to: "/affiliate-dashboard" });
  };

  // Steps - terms FIRST, then payment method
  const steps = [
    { id: "terms", label: "Terms" },
    { id: "payment-method", label: "Payment Method" },
    { id: "payment-setup", label: "Setup" },
    { id: "complete", label: "Complete" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    index < currentStepIndex
                      ? "bg-theme-500 text-white"
                      : index === currentStepIndex
                        ? "bg-theme-500 text-white ring-4 ring-theme-500/20"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-1 w-16 md:w-24 mx-2",
                      index < currentStepIndex ? "bg-theme-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step) => (
              <span key={step.id} className="text-center w-20">
                {step.label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Payment Method Selection */}
          {currentStep === "payment-method" && (
            <motion.div
              key="payment-method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Choose Your Payment Method</CardTitle>
                  <CardDescription>
                    Select how you'd like to receive your affiliate payouts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stripe Express */}
                  <button
                    onClick={() => handleMethodSelect("stripe-express")}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all",
                      selectedMethod === "stripe-express"
                        ? "border-theme-500 bg-theme-500/10"
                        : "border-border hover:border-theme-500/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-theme-500/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-theme-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Create New Stripe Account</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quick setup - create a new Stripe Express account to receive direct deposits
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-theme-600 dark:text-theme-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Instant payouts to your bank account</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Stripe OAuth */}
                  <button
                    onClick={() => handleMethodSelect("stripe-oauth")}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all",
                      selectedMethod === "stripe-oauth"
                        ? "border-theme-500 bg-theme-500/10"
                        : "border-border hover:border-theme-500/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-theme-500/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-theme-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Connect Existing Stripe Account</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Link your existing Stripe account to receive payouts
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-theme-600 dark:text-theme-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Use your current Stripe dashboard</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Custom Link - only if feature enabled */}
                  {loaderData.customPaymentLinkEnabled && (
                    <button
                      onClick={() => handleMethodSelect("link")}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all",
                        selectedMethod === "link"
                          ? "border-theme-500 bg-theme-500/10"
                          : "border-border hover:border-theme-500/50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-theme-500/10 flex items-center justify-center">
                          <LinkIcon className="h-6 w-6 text-theme-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Custom Payment Link</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Use PayPal, Venmo, or another payment service
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>Manual payouts processed monthly</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )}

                  <Button
                    onClick={handleContinueFromMethodStep}
                    disabled={!selectedMethod}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Payment Setup (only for custom link) */}
          {currentStep === "payment-setup" && selectedMethod === "link" && (
            <motion.div
              key="payment-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Enter Your Payment Link</CardTitle>
                  <CardDescription>
                    We'll use this link to send your affiliate payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePaymentLinkSubmit)} className="space-y-6">
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
                              Enter your PayPal.me, Venmo, or other payment link
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep("payment-method")}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={updatePaymentMutation.isPending}>
                          {updatePaymentMutation.isPending ? "Saving..." : (
                            <>
                              Complete Setup
                              <CheckCircle className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Terms Agreement */}
          {currentStep === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Accept Terms of Service</CardTitle>
                  <CardDescription>
                    Please review and accept our affiliate program terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-theme-500" />
                      <span className="font-medium">{loaderData.commissionRate}% Commission Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-theme-500" />
                      <span className="font-medium">{AFFILIATE_CONFIG.COOKIE_DURATION_DAYS}-Day Cookie Duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-theme-500" />
                      <span className="font-medium">Automatic Stripe Payouts</span>
                    </div>
                    {loaderData.customPaymentLinkEnabled && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <LinkIcon className="h-4 w-4" />
                        <span>${loaderData.minimumPayout / 100} minimum for custom payment links</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed">
                      I agree to the{" "}
                      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                        <DialogTrigger asChild>
                          <button className="text-theme-600 dark:text-theme-400 underline">
                            Terms of Service
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Affiliate Program Terms of Service</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 text-sm text-muted-foreground">
                            <p><strong>1. Commission Structure:</strong> Affiliates earn {loaderData.commissionRate}% commission on all referred sales.</p>
                            <p><strong>2. Payment Terms:</strong> Stripe payouts are processed automatically. {loaderData.customPaymentLinkEnabled && `Custom payment links have a $${loaderData.minimumPayout / 100} minimum threshold.`}</p>
                            <p><strong>3. Cookie Duration:</strong> {AFFILIATE_CONFIG.COOKIE_DURATION_DAYS}-day attribution window for referrals.</p>
                            <p><strong>4. Prohibited Activities:</strong> Spam, misleading advertising, and self-referrals are prohibited.</p>
                            <p><strong>5. Termination:</strong> Accounts violating terms may be terminated with forfeited commissions.</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </label>
                  </div>

                  <Button
                    onClick={handleAcceptTerms}
                    disabled={!agreedToTerms || registerMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {registerMutation.isPending ? (
                      "Creating account..."
                    ) : (
                      <>
                        Accept & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {currentStep === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="text-center">
                <CardContent className="pt-12 pb-8">
                  {loaderData.isOnboardingComplete ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Welcome to the Team!</h2>
                      <p className="text-muted-foreground mb-8">
                        Your affiliate account is ready. Start sharing your unique link to earn commissions.
                      </p>
                      <Button onClick={handleGoToDashboard} size="lg">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : loaderData.hasStripeAccount && loaderData.stripeAccountStatus === "onboarding" ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                        <Zap className="h-10 w-10 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Almost There!</h2>
                      <p className="text-muted-foreground mb-4">
                        Your Stripe account setup is in progress. Please complete the verification to enable payouts.
                      </p>
                      <p className="text-sm text-muted-foreground mb-8">
                        Status: <span className="text-orange-500 font-medium">Onboarding</span>
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={() => window.location.href = "/api/connect/stripe"} variant="default" size="lg">
                          Complete Stripe Setup
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : loaderData.hasStripeAccount && loaderData.stripeAccountStatus === "restricted" ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                        <Shield className="h-10 w-10 text-yellow-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Action Required</h2>
                      <p className="text-muted-foreground mb-4">
                        Your Stripe account has restrictions. Please complete the required verifications.
                      </p>
                      <p className="text-sm text-muted-foreground mb-8">
                        Status: <span className="text-yellow-500 font-medium">Restricted</span>
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={() => window.location.href = "/api/connect/stripe"} variant="default" size="lg">
                          Complete Verification
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
                      <p className="text-muted-foreground mb-8">
                        Your affiliate account has been configured.
                      </p>
                      <Button onClick={handleGoToDashboard} size="lg">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
