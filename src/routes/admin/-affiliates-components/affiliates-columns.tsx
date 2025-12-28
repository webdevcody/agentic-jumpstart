"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import {
  CheckCircle,
  CreditCard,
  Eye,
  UserX,
  Link,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { sanitizeImageUrl } from "~/utils/url-sanitizer";

export type AffiliateRow = {
  id: number;
  userId: number;
  userEmail: string | null;
  userName: string | null;
  userImage: string | null;
  affiliateCode: string;
  paymentLink: string | null;
  paymentMethod: string;
  commissionRate: number;
  totalEarnings: number;
  paidAmount: number;
  unpaidBalance: number;
  isActive: boolean;
  createdAt: Date;
  stripeConnectAccountId: string | null;
  stripeAccountStatus: string;
  stripeChargesEnabled: boolean | null;
  stripePayoutsEnabled: boolean | null;
  stripeDetailsSubmitted: boolean | null;
  lastStripeSync: Date | null;
  totalReferrals: number;
  lastReferralDate: Date | null;
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};


interface AffiliateColumnsOptions {
  onCopyLink: (link: string) => void;
  onViewLink: (link: string) => void;
  onRecordPayout: (affiliate: AffiliateRow) => void;
  onToggleStatus: (affiliateId: number, currentStatus: boolean) => void;
  onViewDetails?: (affiliate: AffiliateRow) => void;
}

export function getAffiliateColumns(
  options: AffiliateColumnsOptions
): ColumnDef<AffiliateRow>[] {
  return [
    {
      id: "affiliate",
      accessorKey: "userName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Affiliate" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;
        const displayName =
          affiliate.userName || affiliate.userEmail?.split("@")[0] || "Unknown";
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-3 min-w-0 py-1">
            {/* Avatar with status indicator */}
            <div className="relative shrink-0">
              {sanitizeImageUrl(affiliate.userImage) ? (
                <img
                  src={sanitizeImageUrl(affiliate.userImage)!}
                  alt={displayName}
                  className="h-10 w-10 rounded-lg object-cover border border-border/50"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground border border-border/50">
                  <span className="text-sm font-semibold">{initial}</span>
                </div>
              )}
              <div
                className={cn(
                  "absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  affiliate.isActive ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground truncate">
                  {displayName}
                </span>
                <code className="px-1.5 py-0.5 bg-muted/60 rounded text-xs font-mono text-muted-foreground shrink-0">
                  {affiliate.affiliateCode}
                </code>
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {affiliate.userEmail || "No email"}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const nameA = rowA.original.userName || rowA.original.userEmail || "";
        const nameB = rowB.original.userName || rowB.original.userEmail || "";
        return nameA.localeCompare(nameB);
      },
      enableColumnFilter: true,
      meta: {
        label: "Affiliate",
        placeholder: "Search affiliates...",
        variant: "text" as const,
      },
    },
    {
      id: "referrals",
      accessorKey: "totalReferrals",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Referrals" className="ml-auto" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;

        return (
          <div className="text-right">
            <span className="text-sm font-medium text-foreground">
              {affiliate.totalReferrals}
            </span>
          </div>
        );
      },
      enableSorting: true,
      size: 100,
      meta: {
        label: "Referrals",
      },
    },
    {
      id: "payout",
      accessorKey: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Payout" className="ml-auto" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;
        const isStripe = affiliate.paymentMethod === "stripe";
        const isStripeConnected =
          isStripe &&
          affiliate.stripeAccountStatus === "active" &&
          affiliate.stripePayoutsEnabled;

        return (
          <div className="flex justify-end">
            {isStripe ? (
              isStripeConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-medium px-2 py-0.5">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe
                </Badge>
              ) : affiliate.stripeAccountStatus === "onboarding" ? (
                <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 hover:bg-orange-500/25 text-xs font-medium px-2 py-0.5">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge className="bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/25 text-xs font-medium px-2 py-0.5">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )
            ) : (
              <Badge className="bg-violet-500/15 text-violet-500 border-violet-500/30 hover:bg-violet-500/25 text-xs font-medium px-2 py-0.5">
                <Link className="h-3 w-3 mr-1" />
                Manual
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 130,
      sortingFn: (rowA, rowB) => {
        return rowA.original.paymentMethod.localeCompare(rowB.original.paymentMethod);
      },
      meta: {
        label: "Payout",
      },
    },
    {
      id: "rate",
      accessorKey: "commissionRate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Rate" className="ml-auto" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;

        return (
          <div className="text-right">
            <span className="font-semibold text-foreground">
              {affiliate.commissionRate}%
            </span>
          </div>
        );
      },
      enableSorting: true,
      size: 80,
      meta: {
        label: "Rate",
      },
    },
    {
      id: "balance",
      accessorKey: "unpaidBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Balance" className="ml-auto" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;

        return (
          <div className="text-right">
            <div
              className={cn(
                "text-lg font-bold tabular-nums",
                affiliate.unpaidBalance > 0
                  ? "text-orange-400"
                  : "text-foreground"
              )}
            >
              {formatCurrency(affiliate.unpaidBalance)}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">{formatCurrency(affiliate.totalEarnings)}</span>
              {" "}lifetime
            </div>
          </div>
        );
      },
      enableSorting: true,
      size: 140,
      meta: {
        label: "Balance",
      },
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const affiliate = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                affiliate.isActive
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  : "text-green-400 hover:bg-green-500/10 hover:text-green-300"
              )}
              onClick={() =>
                options.onToggleStatus(affiliate.id, affiliate.isActive)
              }
              aria-label={affiliate.isActive ? `Suspend partner ${affiliate.userName || affiliate.affiliateCode}` : `Activate partner ${affiliate.userName || affiliate.affiliateCode}`}
              title={affiliate.isActive ? "Suspend Partner" : "Activate Partner"}
            >
              {affiliate.isActive ? (
                <UserX className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => options.onViewDetails?.(affiliate)}
              aria-label={`View details for ${affiliate.userName || affiliate.affiliateCode}`}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      size: 80,
    },
  ];
}
