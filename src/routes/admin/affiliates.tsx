import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  adminGetAllAffiliatesFn,
  adminToggleAffiliateStatusFn,
  adminRecordPayoutFn,
} from "~/fn/affiliates";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Users,
  ExternalLink,
  MoreVertical,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";

// Skeleton components
function CountSkeleton() {
  return <div className="h-8 w-20 bg-muted/50 rounded animate-pulse"></div>;
}

function AffiliateCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 bg-muted/50 rounded animate-pulse"></div>
          <div className="h-6 w-16 bg-muted/30 rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-muted/20 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-20 bg-muted/30 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-muted/50 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <div className="h-4 w-24 bg-muted/30 rounded animate-pulse"></div>
          <div className="h-4 w-28 bg-muted/30 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

const payoutSchema = z.object({
  amount: z.number().min(50, "Minimum payout is $50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

export const Route = createFileRoute("/admin/affiliates")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["admin", "affiliates"],
      queryFn: () => adminGetAllAffiliatesFn(),
    });
  },
  component: AdminAffiliates,
});

function AdminAffiliates() {
  const queryClient = useQueryClient();
  const [payoutAffiliateId, setPayoutAffiliateId] = useState<number | null>(
    null
  );
  const [payoutAffiliateName, setPayoutAffiliateName] = useState<string>("");
  const [payoutUnpaidBalance, setPayoutUnpaidBalance] = useState<number>(0);

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: () => adminGetAllAffiliatesFn(),
  });

  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "PayPal",
      transactionId: "",
      notes: "",
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminToggleAffiliateStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast.success("Status Updated", {
        description: "Affiliate status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update affiliate status.",
      });
    },
  });

  const recordPayoutMutation = useMutation({
    mutationFn: adminRecordPayoutFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast.success("Payout Recorded", {
        description: "The payout has been recorded successfully.",
      });
      setPayoutAffiliateId(null);
      form.reset();
    },
    onError: (error) => {
      toast.error("Payout Failed", {
        description: error.message || "Failed to record payout.",
      });
    },
  });

  const handleToggleStatus = async (
    affiliateId: number,
    currentStatus: boolean
  ) => {
    await toggleStatusMutation.mutateAsync({
      data: { affiliateId, isActive: !currentStatus },
    });
  };

  const openPayoutDialog = (affiliate: any) => {
    setPayoutAffiliateId(affiliate.id);
    setPayoutAffiliateName(
      affiliate.userName || affiliate.userEmail || "Unknown"
    );
    setPayoutUnpaidBalance(affiliate.unpaidBalance);
    form.setValue("amount", affiliate.unpaidBalance / 100); // Convert cents to dollars
  };

  const onSubmitPayout = async (values: PayoutFormValues) => {
    if (!payoutAffiliateId) return;

    await recordPayoutMutation.mutateAsync({
      data: {
        affiliateId: payoutAffiliateId,
        amount: Math.round(values.amount * 100), // Convert dollars to cents
        paymentMethod: values.paymentMethod,
        transactionId: values.transactionId || undefined,
        notes: values.notes || undefined,
      },
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", {
      description: "Link copied to clipboard.",
    });
  };

  // Calculate totals
  const totals = affiliates?.reduce(
    (acc, affiliate) => ({
      totalUnpaid: acc.totalUnpaid + affiliate.unpaidBalance,
      totalPaid: acc.totalPaid + affiliate.paidAmount,
      totalEarnings: acc.totalEarnings + affiliate.totalEarnings,
      activeCount: acc.activeCount + (affiliate.isActive ? 1 : 0),
    }),
    { totalUnpaid: 0, totalPaid: 0, totalEarnings: 0, activeCount: 0 }
  ) || { totalUnpaid: 0, totalPaid: 0, totalEarnings: 0, activeCount: 0 };

  return (
    <Page>
      <PageHeader
        title="Affiliate Management"
        highlightedWord="Management"
        description="Manage affiliate accounts, view earnings, and process payouts"
      />

      {/* Stats Overview */}
      <div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12"
      >
        {/* Total Unpaid */}
        <div
          className="group relative"
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Unpaid
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 dark:bg-orange-400/20 flex items-center justify-center group-hover:bg-orange-500/20 dark:group-hover:bg-orange-400/30">
                <AlertCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400">
              {isLoading ? (
                <CountSkeleton />
              ) : (
                formatCurrency(totals.totalUnpaid)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Pending payouts</p>
          </div>
        </div>

        {/* Total Paid */}
        <div
          className="group relative"
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Paid
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 dark:bg-green-400/20 flex items-center justify-center group-hover:bg-green-500/20 dark:group-hover:bg-green-400/30">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
              {isLoading ? <CountSkeleton /> : formatCurrency(totals.totalPaid)}
            </div>
            <p className="text-sm text-muted-foreground">Lifetime payouts</p>
          </div>
        </div>

        {/* Total Earnings */}
        <div
          className="group relative"
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </div>
              <div className="w-10 h-10 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30">
                <DollarSign className="h-5 w-5 text-theme-500 dark:text-theme-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400">
              {isLoading ? (
                <CountSkeleton />
              ) : (
                formatCurrency(totals.totalEarnings)
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Generated for affiliates
            </p>
          </div>
        </div>

        {/* Active Affiliates */}
        <div
          className="group relative"
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Active Affiliates
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/30">
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {isLoading ? <CountSkeleton /> : totals.activeCount}
            </div>
            <p className="text-sm text-muted-foreground">
              of {isLoading ? "..." : affiliates?.length || 0} total
            </p>
          </div>
        </div>
      </div>

      {/* Affiliates List */}
      <div
        className="module-card"
      >
        <div className="p-6 border-b border-border/50">
          <h2 className="text-2xl font-semibold mb-2">All Affiliates</h2>
          <p className="text-muted-foreground">
            View and manage all affiliate accounts
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, idx) => (
                <AffiliateCardSkeleton key={idx} />
              ))}
            </div>
          ) : affiliates?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <p className="text-lg">No affiliates registered yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {affiliates?.map((affiliate, index) => (
                <div
                  key={affiliate.id}
                  className="group relative overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6 hover:bg-card/80 dark:hover:bg-card/60 hover:border-theme-400/30 hover:shadow-elevation-2"
                >
                  {/* Subtle hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 pointer-events-none rounded-xl"></div>

                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-lg font-semibold text-foreground">
                          {/* Show public name based on useDisplayName setting */}
                          {affiliate.useDisplayName === false && affiliate.userRealName
                            ? affiliate.userRealName
                            : affiliate.userName || affiliate.userEmail || "Unknown User"}
                          {/* Show alternative name for admin context */}
                          {affiliate.useDisplayName === false && affiliate.userName && (
                            <span className="text-muted-foreground font-normal ml-2 text-sm">
                              (alias: {affiliate.userName})
                            </span>
                          )}
                          {affiliate.useDisplayName !== false && affiliate.userRealName && (
                            <span className="text-muted-foreground font-normal ml-2 text-sm">
                              (real: {affiliate.userRealName})
                            </span>
                          )}
                        </span>
                        {affiliate.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                          {affiliate.affiliateCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Unpaid Balance
                          </div>
                          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(affiliate.unpaidBalance)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Total Paid
                          </div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(affiliate.paidAmount)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Total Earnings
                          </div>
                          <div className="text-xl font-bold text-theme-600 dark:text-theme-400">
                            {formatCurrency(affiliate.totalEarnings)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Sales Count
                          </div>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {affiliate.totalReferrals}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(affiliate.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>
                            Last sale {formatDate(affiliate.lastReferralDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative z-10"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(affiliate.paymentLink, "_blank")
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Payment Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(affiliate.paymentLink)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Payment Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openPayoutDialog(affiliate)}
                          disabled={affiliate.unpaidBalance < 5000}
                          className={
                            affiliate.unpaidBalance < 5000 ? "opacity-50" : ""
                          }
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Payout
                          {affiliate.unpaidBalance < 5000 && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              Min $50
                            </span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleStatus(affiliate.id, affiliate.isActive)
                          }
                        >
                          {affiliate.isActive ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={payoutAffiliateId !== null}
        onOpenChange={(open) => !open && setPayoutAffiliateId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Record Payout
            </DialogTitle>
            <DialogDescription className="text-base">
              Record a payment to{" "}
              <span className="font-medium text-foreground">
                {payoutAffiliateName}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitPayout)}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-theme-50 to-theme-100/50 dark:from-theme-950 dark:to-theme-900/50 border border-theme-200/60 dark:border-theme-700/60">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Current Unpaid Balance
                </div>
                <div className="text-3xl font-bold text-theme-600 dark:text-theme-400">
                  {formatCurrency(payoutUnpaidBalance)}
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="50.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Minimum payout is $50.00</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Input placeholder="PayPal, Venmo, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayoutAffiliateId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordPayoutMutation.isPending}
                  className="btn-gradient flex-1"
                >
                  {recordPayoutMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70"></div>
                      <span>Recording...</span>
                    </div>
                  ) : (
                    "Record Payout"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
