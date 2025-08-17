import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "~/hooks/use-toast";
import {
  adminGetAllAffiliatesFn,
  adminToggleAffiliateStatusFn,
  adminRecordPayoutFn,
} from "~/fn/affiliates";
import { adminMiddleware } from "~/lib/auth";
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
import { assertIsAdminFn } from "~/fn/auth";

const payoutSchema = z.object({
  amount: z.number().min(50, "Minimum payout is $50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

export const Route = createFileRoute("/admin/affiliates")({
  beforeLoad: () => assertIsAdminFn(),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["admin", "affiliates"],
      queryFn: () => adminGetAllAffiliatesFn(),
    });
    return data;
  },
  component: AdminAffiliates,
});

function AdminAffiliates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payoutAffiliateId, setPayoutAffiliateId] = useState<number | null>(
    null
  );
  const [payoutAffiliateName, setPayoutAffiliateName] = useState<string>("");
  const [payoutUnpaidBalance, setPayoutUnpaidBalance] = useState<number>(0);

  const { data: affiliates } = useSuspenseQuery({
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
      toast({
        title: "Status Updated",
        description: "Affiliate status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update affiliate status.",
        variant: "destructive",
      });
    },
  });

  const recordPayoutMutation = useMutation({
    mutationFn: adminRecordPayoutFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast({
        title: "Payout Recorded",
        description: "The payout has been recorded successfully.",
      });
      setPayoutAffiliateId(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Payout Failed",
        description: error.message || "Failed to record payout.",
        variant: "destructive",
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
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  // Calculate totals
  const totals = affiliates.reduce(
    (acc, affiliate) => ({
      totalUnpaid: acc.totalUnpaid + affiliate.unpaidBalance,
      totalPaid: acc.totalPaid + affiliate.paidAmount,
      totalEarnings: acc.totalEarnings + affiliate.totalEarnings,
      activeCount: acc.activeCount + (affiliate.isActive ? 1 : 0),
    }),
    { totalUnpaid: 0, totalPaid: 0, totalEarnings: 0, activeCount: 0 }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
        <p className="text-muted-foreground">
          Manage affiliate accounts, view earnings, and process payouts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalUnpaid)}
            </div>
            <p className="text-xs text-muted-foreground">Pending payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated for affiliates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Affiliates
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              of {affiliates.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>
            View and manage all affiliate accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No affiliates registered yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {affiliates.map((affiliate) => (
                <div
                  key={affiliate.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {affiliate.userName ||
                            affiliate.userEmail ||
                            "Unknown User"}
                        </span>
                        {affiliate.isActive ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Code: {affiliate.affiliateCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Unpaid:</span>
                          <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                            {formatCurrency(affiliate.unpaidBalance)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Paid:</span>
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(affiliate.paidAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(affiliate.totalEarnings)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sales:</span>
                          <span className="ml-2 font-medium">
                            {affiliate.totalReferrals}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined: {formatDate(affiliate.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>
                            Last sale: {formatDate(affiliate.lastReferralDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Payout
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
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <Dialog
        open={payoutAffiliateId !== null}
        onOpenChange={(open) => !open && setPayoutAffiliateId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payout</DialogTitle>
            <DialogDescription>
              Record a payment to {payoutAffiliateName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitPayout)}
              className="space-y-4"
            >
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Unpaid Balance
                </div>
                <div className="text-2xl font-bold">
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayoutAffiliateId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={recordPayoutMutation.isPending}>
                  {recordPayoutMutation.isPending
                    ? "Recording..."
                    : "Record Payout"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
