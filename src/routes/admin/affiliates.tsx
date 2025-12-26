import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  adminProcessAutomaticPayoutsFn,
} from "~/fn/affiliates";
import {
  getAffiliateCommissionRateFn,
  setAffiliateCommissionRateFn,
  getAffiliateMinimumPayoutFn,
  setAffiliateMinimumPayoutFn,
} from "~/fn/app-settings";
import { AFFILIATE_CONFIG } from "~/config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  TrendingUp,
  Search,
  Clock,
  Minus,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import {
  ButtonGroup,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "~/components/ui/button-group";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableViewOptions } from "~/components/data-table/data-table-view-options";
import { useDataTable } from "~/hooks/use-data-table";
import {
  getAffiliateColumns,
  type AffiliateRow,
} from "./-affiliates-components/affiliates-columns";
import { AffiliateDetailsSheet } from "./-affiliates-components/affiliate-details-sheet";

// Skeleton components
function CountSkeleton() {
  return <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />;
}

const payoutSchema = z.object({
  amount: z.number().min(50, "Minimum payout is $50"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

function useCommissionRate() {
  const queryClient = useQueryClient();
  const [localRate, setLocalRate] = useState<string>("");
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: commissionRate, isLoading } = useQuery({
    queryKey: ["affiliateCommissionRate"],
    queryFn: () => getAffiliateCommissionRateFn(),
  });

  const displayRate = hasLocalChanges
    ? localRate
    : (commissionRate?.toString() ?? AFFILIATE_CONFIG.DEFAULT_COMMISSION_RATE.toString());

  const updateMutation = useMutation({
    mutationFn: (rate: number) =>
      setAffiliateCommissionRateFn({ data: { rate } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliateCommissionRate"] });
      toast.success("Commission rate updated successfully");
      setHasLocalChanges(false);
    },
    onError: (error) => {
      toast.error("Failed to update commission rate");
      console.error("Failed to update commission rate:", error);
    },
  });

  const handleRateChange = (value: string) => {
    setLocalRate(value);
    setHasLocalChanges(true);
  };

  const handleSave = () => {
    const rate = parseInt(displayRate, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Commission rate must be between 0 and 100");
      return;
    }
    updateMutation.mutate(rate);
  };

  const handleReset = () => {
    setLocalRate(
      commissionRate?.toString() ?? AFFILIATE_CONFIG.DEFAULT_COMMISSION_RATE.toString()
    );
    setHasLocalChanges(false);
  };

  return {
    displayRate,
    isLoading,
    isPending: updateMutation.isPending,
    hasLocalChanges,
    handleRateChange,
    handleSave,
    handleReset,
  };
}

function useMinimumPayout() {
  const queryClient = useQueryClient();
  const [localAmount, setLocalAmount] = useState<string>("");
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: minimumPayout, isLoading } = useQuery({
    queryKey: ["affiliateMinimumPayout"],
    queryFn: () => getAffiliateMinimumPayoutFn(),
  });

  // Display in dollars (cents / 100)
  const displayAmount = hasLocalChanges
    ? localAmount
    : ((minimumPayout ?? AFFILIATE_CONFIG.DEFAULT_MINIMUM_PAYOUT) / 100).toString();

  const updateMutation = useMutation({
    mutationFn: (amount: number) =>
      setAffiliateMinimumPayoutFn({ data: { amount } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliateMinimumPayout"] });
      toast.success("Minimum payout updated successfully");
      setHasLocalChanges(false);
    },
    onError: (error) => {
      toast.error("Failed to update minimum payout");
      console.error("Failed to update minimum payout:", error);
    },
  });

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    setHasLocalChanges(true);
  };

  const handleSave = () => {
    const dollars = parseInt(displayAmount, 10);
    if (isNaN(dollars) || dollars < 0) {
      toast.error("Minimum payout must be $0 or more");
      return;
    }
    // Convert dollars to cents
    updateMutation.mutate(dollars * 100);
  };

  const handleReset = () => {
    setLocalAmount(
      ((minimumPayout ?? AFFILIATE_CONFIG.DEFAULT_MINIMUM_PAYOUT) / 100).toString()
    );
    setHasLocalChanges(false);
  };

  return {
    displayAmount,
    isLoading,
    isPending: updateMutation.isPending,
    hasLocalChanges,
    handleAmountChange,
    handleSave,
    handleReset,
  };
}

export const Route = createFileRoute("/admin/affiliates")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["admin", "affiliates"],
      queryFn: () => adminGetAllAffiliatesFn(),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["affiliateCommissionRate"],
      queryFn: () => getAffiliateCommissionRateFn(),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["affiliateMinimumPayout"],
      queryFn: () => getAffiliateMinimumPayoutFn(),
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRow | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: () => adminGetAllAffiliatesFn(),
  });

  // Keep selectedAffiliate in sync when affiliates list is refreshed
  useEffect(() => {
    if (selectedAffiliate && affiliates) {
      const updated = affiliates.find((a) => a.id === selectedAffiliate.id);
      if (updated) {
        setSelectedAffiliate(updated as AffiliateRow);
      }
    }
  }, [affiliates, selectedAffiliate?.id]);

  // Filter affiliates based on debounced search query
  const filteredAffiliates = useMemo(() => {
    if (!affiliates) return [];
    if (!debouncedSearchQuery.trim()) return affiliates;

    const query = debouncedSearchQuery.toLowerCase();
    return affiliates.filter((affiliate) => {
      const searchableFields = [
        affiliate.userName,
        affiliate.userEmail,
        affiliate.affiliateCode,
        affiliate.isActive ? "active" : "inactive",
        affiliate.paymentMethod,
        String(affiliate.id),
      ];
      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(query)
      );
    });
  }, [affiliates, debouncedSearchQuery]);

  const commissionRateState = useCommissionRate();
  const minimumPayoutState = useMinimumPayout();

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

  const autoPayoutMutation = useMutation({
    mutationFn: adminProcessAutomaticPayoutsFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast.success("Auto-Payouts Triggered", {
        description: `Processed ${result.processed} affiliates: ${result.successful} successful, ${result.failed} failed`,
      });
    },
    onError: (error) => {
      toast.error("Auto-Payout Failed", {
        description: error.message || "Failed to trigger automatic payouts.",
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

  const handleTriggerAutoPayouts = async () => {
    await autoPayoutMutation.mutateAsync();
  };

  const openPayoutDialog = (affiliate: AffiliateRow) => {
    setPayoutAffiliateId(affiliate.id);
    setPayoutAffiliateName(
      affiliate.userName || affiliate.userEmail || "Unknown"
    );
    setPayoutUnpaidBalance(affiliate.unpaidBalance);
    form.setValue("amount", affiliate.unpaidBalance / 100);
  };

  const onSubmitPayout = async (values: PayoutFormValues) => {
    if (!payoutAffiliateId) return;

    await recordPayoutMutation.mutateAsync({
      data: {
        affiliateId: payoutAffiliateId,
        amount: Math.round(values.amount * 100),
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

  // Columns for DataTable
  const columns = useMemo(
    () =>
      getAffiliateColumns({
        onCopyLink: copyToClipboard,
        onViewLink: (link) => window.open(link, "_blank"),
        onRecordPayout: openPayoutDialog,
        onToggleStatus: handleToggleStatus,
        onViewDetails: (affiliate) => {
          setSelectedAffiliate(affiliate);
          setDetailsSheetOpen(true);
        },
      }),
    []
  );

  // Data table setup
  const { table } = useDataTable({
    data: (filteredAffiliates as AffiliateRow[]) ?? [],
    columns,
    pageCount: Math.ceil((filteredAffiliates?.length ?? 0) / 10),
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: "balance", desc: true }],
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <Page>
      <PageHeader
        title="Affiliate Management"
        highlightedWord="Management"
        description="Manage affiliate accounts, view earnings, and process payouts"
      />

      {/* Top Controls Row - Search + Multiplier + Batch Settle */}
      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by identity, ID or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card/60 border-border/50"
          />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Minimum Payout */}
          <ButtonGroup>
            <InputGroup className="w-36 h-10">
              <InputGroupAddon align="inline-start" className="text-xs text-muted-foreground">Min</InputGroupAddon>
              <InputGroupAddon align="inline-start">$</InputGroupAddon>
              <InputGroupInput
                id="minimum-payout"
                type="text"
                inputMode="numeric"
                value={minimumPayoutState.displayAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    let numVal = val === "" ? 0 : parseInt(val, 10);
                    if (numVal < 0) numVal = 0;
                    minimumPayoutState.handleAmountChange(numVal.toString());
                  }
                }}
                disabled={
                  minimumPayoutState.isLoading || minimumPayoutState.isPending
                }
                className="text-center text-sm h-10"
              />
            </InputGroup>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => minimumPayoutState.handleSave()}
              disabled={!minimumPayoutState.hasLocalChanges || minimumPayoutState.isPending}
            >
              {minimumPayoutState.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                const current = parseInt(minimumPayoutState.displayAmount) || 0;
                minimumPayoutState.handleAmountChange(Math.max(0, current - 10).toString());
              }}
              disabled={minimumPayoutState.isLoading || minimumPayoutState.isPending}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                const current = parseInt(minimumPayoutState.displayAmount) || 0;
                minimumPayoutState.handleAmountChange((current + 10).toString());
              }}
              disabled={minimumPayoutState.isLoading || minimumPayoutState.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </ButtonGroup>

          {/* Default Multiplier */}
          <ButtonGroup>
            <InputGroup className="w-32 h-10">
              <InputGroupAddon align="inline-start" className="text-xs text-muted-foreground">Rate</InputGroupAddon>
              <InputGroupInput
                id="commission-rate"
                type="text"
                inputMode="numeric"
                value={commissionRateState.displayRate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    let numVal = val === "" ? 0 : parseInt(val, 10);
                    if (numVal > 100) numVal = 100;
                    if (numVal < 0) numVal = 0;
                    commissionRateState.handleRateChange(numVal.toString());
                  }
                }}
                disabled={
                  commissionRateState.isLoading || commissionRateState.isPending
                }
                className="text-center text-sm h-10"
              />
              <InputGroupAddon align="inline-end">%</InputGroupAddon>
            </InputGroup>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => commissionRateState.handleSave()}
              disabled={!commissionRateState.hasLocalChanges || commissionRateState.isPending}
            >
              {commissionRateState.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                const current = parseInt(commissionRateState.displayRate) || 0;
                commissionRateState.handleRateChange(Math.max(0, current - 1).toString());
              }}
              disabled={commissionRateState.isLoading || commissionRateState.isPending}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                const current = parseInt(commissionRateState.displayRate) || 0;
                commissionRateState.handleRateChange(Math.min(100, current + 1).toString());
              }}
              disabled={commissionRateState.isLoading || commissionRateState.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </ButtonGroup>

          {/* Batch Settle Button */}
          <Button
            onClick={handleTriggerAutoPayouts}
            disabled={autoPayoutMutation.isPending}
            className="bg-theme-500 hover:bg-theme-600 h-10 px-6"
          >
            {autoPayoutMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Batch Settle
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.15s", animationFillMode: "both" }}
      >
        {/* Escrow/Unpaid */}
        <div className="bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Escrow / Unpaid
            </span>
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {isLoading ? <CountSkeleton /> : formatCurrency(totals.totalUnpaid)}
          </div>
        </div>

        {/* Settled Volume */}
        <div className="bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Settled Volume
            </span>
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-500">
            {isLoading ? <CountSkeleton /> : formatCurrency(totals.totalPaid)}
          </div>
        </div>

        {/* Gross Generated */}
        <div className="bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Gross Generated
            </span>
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-500">
            {isLoading ? <CountSkeleton /> : formatCurrency(totals.totalEarnings)}
          </div>
        </div>

        {/* Active Nodes */}
        <div className="bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Nodes
            </span>
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? <CountSkeleton /> : totals.activeCount}
          </div>
        </div>
      </div>

      {/* Affiliates Data Table */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full"
        style={{ animationDelay: "0.2s", animationFillMode: "both" }}
      >
        {/* Table toolbar */}
        <div className="flex items-center justify-end mb-3">
          <DataTableViewOptions table={table} />
        </div>

        <div className="bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl overflow-hidden w-full">
          <DataTable table={table} className="w-full [&_table]:w-full [&_.overflow-hidden]:border-0 [&_.flex.flex-col.gap-2\.5:last-child]:p-4" />
        </div>
      </div>

      {/* Affiliate Details Sheet */}
      <AffiliateDetailsSheet
        affiliate={selectedAffiliate}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
      />

      {/* Payout Dialog */}
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70" />
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
