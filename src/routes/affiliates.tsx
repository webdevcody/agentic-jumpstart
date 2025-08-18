import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AFFILIATE_CONFIG } from "~/config";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "~/hooks/use-toast";
import { useAuth } from "~/hooks/use-auth";
import { registerAffiliateFn, checkIfUserIsAffiliateFn } from "~/fn/affiliates";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Award,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "~/lib/utils";

const affiliateFormSchema = z.object({
  paymentLink: z.url("Please provide a valid URL"),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms of service",
  }),
});

type AffiliateFormValues = z.infer<typeof affiliateFormSchema>;

export const Route = createFileRoute("/affiliates")({
  loader: async ({ context }) => {
    const isAffiliate = await context.queryClient.ensureQueryData({
      queryKey: ["user", "isAffiliate"],
      queryFn: () => checkIfUserIsAffiliateFn(),
    });
    return isAffiliate;
  },
  component: AffiliatesPage,
});

function AffiliatesPage() {
  const user = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [termsOpen, setTermsOpen] = useState(false);
  const { data: affiliateStatus } = useSuspenseQuery({
    queryKey: ["user", "isAffiliate"],
    queryFn: () => checkIfUserIsAffiliateFn(),
  });

  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: {
      paymentLink: "",
      agreedToTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerAffiliateFn,
    onSuccess: () => {
      toast({
        title: "Welcome to the Affiliate Program!",
        description:
          "You can now access your affiliate dashboard to get your unique link.",
      });
      router.navigate({ to: "/affiliate-dashboard" });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description:
          error.message ||
          "Failed to register as an affiliate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: AffiliateFormValues) => {
    await registerMutation.mutateAsync({ data: values });
  };

  if (!user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero background matching the app's main theme */}
        <div className="absolute inset-0 hero-background-ai"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

        {/* Circuit pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="circuit-pattern absolute inset-0"></div>
        </div>

        {/* Floating elements for ambiance */}
        <div className="floating-elements">
          <div className="floating-element-1"></div>
          <div className="floating-element-2"></div>
          <div className="floating-element-3"></div>
          <div className="floating-element-small top-20 right-20"></div>
          <div className="floating-element-small bottom-20 left-20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              Earn {AFFILIATE_CONFIG.COMMISSION_RATE}% Commission
            </div>

            {/* Hero title with gradient text */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent animate-gradient leading-normal pb-1">
              Join Our Affiliate Program
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Partner with us and earn generous commissions
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
              Join our exclusive affiliate program and start earning $60 per
              sale by sharing our AI coding mastery course with your audience.
            </p>

            {/* Benefits preview */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="video-wrapper p-6 text-center">
                <DollarSign className="h-10 w-10 text-theme-500 dark:text-theme-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{AFFILIATE_CONFIG.COMMISSION_RATE}% Commission</h3>
                <p className="text-sm text-muted-foreground">$60 per sale</p>
              </div>
              <div className="video-wrapper p-6 text-center">
                <Clock className="h-10 w-10 text-theme-500 dark:text-theme-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">30-Day Cookie</h3>
                <p className="text-sm text-muted-foreground">
                  Long attribution window
                </p>
              </div>
              <div className="video-wrapper p-6 text-center">
                <TrendingUp className="h-10 w-10 text-theme-500 dark:text-theme-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Real-Time Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your earnings
                </p>
              </div>
            </div>

            {/* Call to action */}
            <div className="space-y-4">
              <a
                href={`/api/login/google?redirect_uri=${encodeURIComponent("/affiliates")}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "text-lg px-8 py-3 h-auto"
                )}
              >
                <Zap className="mr-2 h-5 w-5" />
                Login to Join Program
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <p className="text-sm text-muted-foreground">
                Sign in with Google to access the affiliate program
              </p>
            </div>
          </div>
        </div>

        {/* Bottom gradient divider */}
        <div className="section-divider-glow-bottom"></div>
      </div>
    );
  }

  if (affiliateStatus?.isAffiliate) {
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
              Earn {AFFILIATE_CONFIG.COMMISSION_RATE}% Commission
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
              <h3 className="text-xl font-semibold mb-2">{AFFILIATE_CONFIG.COMMISSION_RATE}% Commission</h3>
              <p className="text-muted-foreground">
                Earn $60 for every sale you refer. One of the highest commission
                rates in the industry.
              </p>
            </div>

            <div className="video-wrapper p-6">
              <Clock className="h-12 w-12 text-theme-500 dark:text-theme-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">30-Day Cookie</h3>
              <p className="text-muted-foreground">
                Long attribution window ensures you get credit for purchases
                made within 30 days.
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

          {/* Registration Form */}
          <div className="max-w-2xl mx-auto">
            <div className="video-wrapper p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Join the Program
              </h2>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
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
                            className="bg-background/50"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your PayPal, Venmo, or other payment link where
                          you'd like to receive affiliate payouts.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreedToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the{" "}
                            <Dialog
                              open={termsOpen}
                              onOpenChange={setTermsOpen}
                            >
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="text-theme-600 dark:text-theme-400 underline"
                                >
                                  Terms of Service
                                </button>
                              </DialogTrigger>
                              <DialogContent
                                animation="fade"
                                className="max-w-4xl max-h-[85vh] overflow-y-auto video-wrapper p-0"
                              >
                                <div className="relative">
                                  {/* Decorative background elements */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 via-transparent to-theme-600/5"></div>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-theme-500/10 rounded-full blur-3xl"></div>
                                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-theme-400/10 rounded-full blur-2xl"></div>

                                  <div className="relative z-10 p-8">
                                    <DialogHeader className="text-center mb-8">
                                      {/* Badge */}
                                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/30 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-4 mx-auto">
                                        <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                                        Legal Agreement
                                      </div>

                                      <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
                                        Affiliate Program Terms of Service
                                      </DialogTitle>

                                      <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                                        Please review these terms carefully
                                        before joining our affiliate program
                                      </p>
                                    </DialogHeader>

                                    <div className="space-y-6 text-sm max-w-3xl mx-auto">
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              1
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Commission Structure
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          Affiliates earn {AFFILIATE_CONFIG.COMMISSION_RATE}% commission on all
                                          referred sales. Commissions are
                                          calculated based on the net sale price
                                          after any discounts.
                                        </p>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              2
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Payment Terms
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          Payments are processed monthly with a
                                          minimum payout threshold of $50.
                                          Payments are made via the payment link
                                          provided during registration.
                                        </p>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              3
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Cookie Duration
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          Affiliate links have a 30-day cookie
                                          duration. You will receive credit for
                                          any purchases made within 30 days of a
                                          user clicking your affiliate link.
                                        </p>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              4
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Prohibited Activities
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed mb-3">
                                          The following activities are strictly
                                          prohibited:
                                        </p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                                          <li>Spam or unsolicited emails</li>
                                          <li>
                                            Misleading or false advertising
                                          </li>
                                          <li>
                                            Self-referrals or fraudulent
                                            purchases
                                          </li>
                                          <li>
                                            Trademark or brand misrepresentation
                                          </li>
                                          <li>
                                            Paid search advertising on
                                            trademarked terms
                                          </li>
                                        </ul>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              5
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Termination
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          We reserve the right to terminate
                                          affiliate accounts that violate these
                                          terms or engage in fraudulent
                                          activity. Pending commissions may be
                                          forfeited in cases of violation.
                                        </p>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              6
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Modifications
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          We may modify these terms at any time.
                                          Continued participation in the program
                                          constitutes acceptance of any
                                          modifications.
                                        </p>
                                      </div>
                                      <div className="bg-background/30 backdrop-blur-sm rounded-lg p-6 border border-theme-200/20 dark:border-border/20">
                                        <div className="flex items-center mb-3">
                                          <div className="w-8 h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-theme-600 dark:text-theme-400 font-bold text-sm">
                                              7
                                            </span>
                                          </div>
                                          <h3 className="text-lg font-semibold text-theme-700 dark:text-theme-300">
                                            Liability
                                          </h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">
                                          We are not liable for indirect,
                                          special, or consequential damages
                                          arising from your participation in the
                                          affiliate program.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      "Registering..."
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Join Affiliate Program
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
