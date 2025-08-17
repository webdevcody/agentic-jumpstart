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

const paymentLinkSchema = z.object({
  paymentLink: z.string().url("Please provide a valid URL"),
});

type PaymentLinkFormValues = z.infer<typeof paymentLinkSchema>;

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">
          Track your referrals, earnings, and manage your affiliate account
        </p>
      </div>

      {/* Affiliate Link Card */}
      <Card className="mb-8">
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.stats.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unpaid Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.stats.unpaidEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.stats.totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.stats.paidEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Total paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Information */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Your payment details for receiving commissions
              </CardDescription>
            </div>
            <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
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
                    Enter your new payment link for receiving affiliate payouts
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
            <span className="text-sm text-muted-foreground">Payment Link:</span>
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

      {/* Monthly Earnings Chart */}
      {dashboard.monthlyEarnings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>
              Your earnings over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.monthlyEarnings.map((month) => (
                <div key={month.month} className="flex items-center">
                  <div className="w-24 text-sm text-muted-foreground">
                    {month.month}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 bg-theme-500/20 dark:bg-theme-500/10 rounded"
                        style={{
                          width: `${(month.earnings / Math.max(...dashboard.monthlyEarnings.map((m) => m.earnings))) * 100}%`,
                          minWidth: "2px",
                        }}
                      />
                      <span className="text-sm font-medium">
                        {formatCurrency(month.earnings)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({month.referrals}{" "}
                        {month.referrals === 1 ? "sale" : "sales"})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Your latest successful conversions</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet. Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {referral.purchaserName ||
                          referral.purchaserEmail ||
                          "Anonymous"}
                      </span>
                      {referral.isPaid ? (
                        <Badge variant="secondary">Paid</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(referral.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(referral.commission)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      from {formatCurrency(referral.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {dashboard.payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatCurrency(payout.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(payout.paidAt)} via {payout.paymentMethod}
                    </div>
                    {payout.transactionId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Transaction: {payout.transactionId}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Paid
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
