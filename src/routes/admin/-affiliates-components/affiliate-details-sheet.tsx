"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import {
  Calendar,
  CreditCard,
  Clock,
  DollarSign,
  CheckCircle,
  Percent,
  Loader2,
  Copy,
  Activity,
  ArrowUpRight,
  User,
  Minus,
  Plus,
  Save,
} from "lucide-react";
import {
  ButtonGroup,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "~/components/ui/button-group";
import { cn } from "~/lib/utils";
import type { AffiliateRow } from "./affiliates-columns";
import {
  adminToggleAffiliateStatusFn,
  adminUpdateAffiliateCommissionRateFn,
} from "~/fn/affiliates";

interface AffiliateDetailsSheetProps {
  affiliate: AffiliateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (date: Date | string | null) => {
  if (!date) return "N/A";
  return new Date(date)
    .toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    .toUpperCase()
    .replace(" ", " '");
};

export function AffiliateDetailsSheet({
  affiliate,
  open,
  onOpenChange,
}: AffiliateDetailsSheetProps) {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState<string>("");

  const toggleStatusMutation = useMutation({
    mutationFn: adminToggleAffiliateStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast.success("Status Updated");
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update affiliate status.",
      });
    },
  });

  const updateCommissionRateMutation = useMutation({
    mutationFn: adminUpdateAffiliateCommissionRateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      toast.success("Commission Rate Updated");
      setEditingRate(false);
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update commission rate.",
      });
    },
  });

  const handleToggleStatus = async () => {
    if (!affiliate) return;
    await toggleStatusMutation.mutateAsync({
      data: { affiliateId: affiliate.id, isActive: !affiliate.isActive },
    });
  };

  const handleSaveCommissionRate = async () => {
    if (!affiliate) return;
    const rate = parseInt(newCommissionRate, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Invalid rate", { description: "Must be between 0-100" });
      setEditingRate(false);
      return;
    }
    await updateCommissionRateMutation.mutateAsync({
      data: { affiliateId: affiliate.id, commissionRate: rate },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!affiliate) return null;

  const displayName =
    affiliate.userName || affiliate.userEmail?.split("@")[0] || "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  const isStripe = affiliate.paymentMethod === "stripe";
  const isStripeConnected =
    isStripe &&
    affiliate.stripeAccountStatus === "active" &&
    affiliate.stripePayoutsEnabled;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground border border-border/50">
                <User className="h-7 w-7" />
              </div>
              <div
                className={cn(
                  "absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                  affiliate.isActive ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>

            {/* Name & Code */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold truncate">
                  {displayName}
                </SheetTitle>
                <button
                  onClick={() => copyToClipboard(affiliate.affiliateCode)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-muted/60 rounded text-xs font-mono text-muted-foreground hover:bg-muted transition-colors"
                >
                  {affiliate.affiliateCode}
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {formatShortDate(affiliate.createdAt)}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Financial Stats - Compact List */}
        <div className="px-6 pb-6">
          <div className="bg-card border border-border/50 rounded-xl divide-y divide-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">Unpaid Balance</span>
              </div>
              <span className="text-lg font-bold text-orange-400">
                {formatCurrency(affiliate.unpaidBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Paid Out</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(affiliate.paidAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lifetime Earnings</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(affiliate.totalEarnings)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Referrals</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {affiliate.totalReferrals}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="px-6 pb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Settings
          </h3>
          <div className="bg-card border border-border/50 rounded-xl divide-y divide-border/50">
            {/* Commission Rate */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Commission Rate</span>
              </div>
              <ButtonGroup>
                <InputGroup className="w-24 h-8">
                  <InputGroupInput
                    type="text"
                    inputMode="numeric"
                    value={editingRate ? newCommissionRate : affiliate.commissionRate.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        let numVal = val === "" ? 0 : parseInt(val, 10);
                        if (numVal > 100) numVal = 100;
                        if (numVal < 0) numVal = 0;
                        setNewCommissionRate(numVal.toString());
                        if (!editingRate) setEditingRate(true);
                      }
                    }}
                    className="text-center text-sm h-8"
                  />
                  <InputGroupAddon align="inline-end">%</InputGroupAddon>
                </InputGroup>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSaveCommissionRate}
                  disabled={!editingRate || newCommissionRate === affiliate.commissionRate.toString() || updateCommissionRateMutation.isPending}
                >
                  {updateCommissionRateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const current = editingRate ? parseInt(newCommissionRate) : affiliate.commissionRate;
                    const newVal = Math.max(0, current - 1);
                    setNewCommissionRate(newVal.toString());
                    if (!editingRate) setEditingRate(true);
                  }}
                  disabled={updateCommissionRateMutation.isPending}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const current = editingRate ? parseInt(newCommissionRate) : affiliate.commissionRate;
                    const newVal = Math.min(100, current + 1);
                    setNewCommissionRate(newVal.toString());
                    if (!editingRate) setEditingRate(true);
                  }}
                  disabled={updateCommissionRateMutation.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </ButtonGroup>
            </div>

            {/* Partner Status */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Partner Status</span>
              </div>
              <Switch
                checked={affiliate.isActive}
                onCheckedChange={handleToggleStatus}
                disabled={toggleStatusMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Payout Connection - Consolidated */}
        <div className="px-6 pb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Payout
          </h3>
          <div className="bg-card border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {isStripe ? "Stripe Connect" : "Payment Link"}
                    </span>
                    {isStripe && (
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isStripeConnected ? "bg-green-500" : affiliate.stripeAccountStatus === "onboarding" ? "bg-orange-500" : "bg-red-500"
                          )}
                        />
                        <span className={cn(
                          "text-xs",
                          isStripeConnected ? "text-green-500" : affiliate.stripeAccountStatus === "onboarding" ? "text-orange-500" : "text-red-500"
                        )}>
                          {isStripeConnected ? "Connected" : affiliate.stripeAccountStatus === "onboarding" ? "Onboarding" : "Not Connected"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isStripe ? (
                      affiliate.lastStripeSync ? `Last synced ${formatDate(affiliate.lastStripeSync)}` : "Never synced"
                    ) : (
                      affiliate.paymentLink ? (
                        <span className="truncate max-w-[200px] block">{affiliate.paymentLink}</span>
                      ) : "No payment link set"
                    )}
                  </div>
                </div>
              </div>
              {!isStripe && affiliate.paymentLink && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(affiliate.paymentLink!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="px-6 pb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Activity
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {affiliate.lastReferralDate && (
                <div className="flex items-start gap-3 relative">
                  <div className="h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background z-10 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">New referral converted</p>
                    <p className="text-xs text-muted-foreground">{formatDate(affiliate.lastReferralDate)}</p>
                  </div>
                </div>
              )}

              {affiliate.paidAmount > 0 && (
                <div className="flex items-start gap-3 relative">
                  <div className="h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-background z-10 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">Payout processed</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(affiliate.paidAmount)} total paid</p>
                  </div>
                </div>
              )}

              {isStripe && affiliate.stripeConnectAccountId && (
                <div className="flex items-start gap-3 relative">
                  <div className="h-3.5 w-3.5 rounded-full bg-purple-500 border-2 border-background z-10 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">Stripe account connected</p>
                    <p className="text-xs text-muted-foreground">
                      {affiliate.lastStripeSync ? formatDate(affiliate.lastStripeSync) : "Recently"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 relative">
                <div className="h-3.5 w-3.5 rounded-full bg-muted border-2 border-background z-10 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Partner account created</p>
                  <p className="text-xs text-muted-foreground">{formatDate(affiliate.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
