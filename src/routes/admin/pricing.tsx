import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import {
  getPricingSettingsFn,
  updatePricingSettingsFn,
} from "~/fn/app-settings";
import { assertIsAdminFn } from "~/fn/auth";
import { Tag, Users } from "lucide-react";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";
import { NumberInputWithControls } from "~/components/blocks/number-input-with-controls";

export const Route = createFileRoute("/admin/pricing")({
  beforeLoad: () => assertIsAdminFn(),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["pricingSettings"],
      queryFn: () => getPricingSettingsFn(),
    });
  },
  component: PricingPage,
});

function PricingPage() {
  const queryClient = useQueryClient();

  const { data: pricing } = useSuspenseQuery({
    queryKey: ["pricingSettings"],
    queryFn: () => getPricingSettingsFn(),
  });

  const [currentPrice, setCurrentPrice] = useState(pricing.currentPrice.toString());
  const [originalPrice, setOriginalPrice] = useState(pricing.originalPrice.toString());
  const [promoLabel, setPromoLabel] = useState(pricing.promoLabel);
  const [hasCurrentPriceChanges, setHasCurrentPriceChanges] = useState(false);
  const [hasOriginalPriceChanges, setHasOriginalPriceChanges] = useState(false);
  const [hasPromoLabelChanges, setHasPromoLabelChanges] = useState(false);

  // Sync state when server data changes
  useEffect(() => {
    setCurrentPrice(pricing.currentPrice.toString());
    setOriginalPrice(pricing.originalPrice.toString());
    setPromoLabel(pricing.promoLabel);
    setHasCurrentPriceChanges(false);
    setHasOriginalPriceChanges(false);
    setHasPromoLabelChanges(false);
  }, [pricing]);

  const updateCurrentPriceMutation = useMutation({
    mutationFn: (price: number) => updatePricingSettingsFn({ data: { currentPrice: price } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingSettings"] });
      toast.success("Current price updated");
      setHasCurrentPriceChanges(false);
    },
    onError: () => {
      toast.error("Failed to update current price");
    },
  });

  const updateOriginalPriceMutation = useMutation({
    mutationFn: (price: number) => updatePricingSettingsFn({ data: { originalPrice: price } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingSettings"] });
      toast.success("Original price updated");
      setHasOriginalPriceChanges(false);
    },
    onError: () => {
      toast.error("Failed to update original price");
    },
  });

  const updatePromoLabelMutation = useMutation({
    mutationFn: (label: string) => updatePricingSettingsFn({ data: { promoLabel: label } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricingSettings"] });
      toast.success("Promo label updated");
      setHasPromoLabelChanges(false);
    },
    onError: () => {
      toast.error("Failed to update promo label");
    },
  });

  const handleCurrentPriceChange = (value: string) => {
    setCurrentPrice(value);
    setHasCurrentPriceChanges(value !== pricing.currentPrice.toString());
  };

  const handleOriginalPriceChange = (value: string) => {
    setOriginalPrice(value);
    setHasOriginalPriceChanges(value !== pricing.originalPrice.toString());
  };

  const handlePromoLabelChange = (value: string) => {
    setPromoLabel(value);
    setHasPromoLabelChanges(value !== pricing.promoLabel);
  };

  const currentPriceNum = parseInt(currentPrice) || 0;
  const originalPriceNum = parseInt(originalPrice) || 0;

  const discountPercentage =
    originalPriceNum > currentPriceNum
      ? Math.round(((originalPriceNum - currentPriceNum) / originalPriceNum) * 100)
      : 0;

  return (
    <Page>
      <PageHeader
        title="Pricing Settings"
        description="Configure course pricing displayed on the purchase page"
      />

      {/* Controls Row */}
      <div
        className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        {/* Current Price */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Current Price</Label>
          <NumberInputWithControls
            value={currentPrice}
            onChange={handleCurrentPriceChange}
            onSave={() => updateCurrentPriceMutation.mutate(parseInt(currentPrice) || 0)}
            prefix="$"
            step={10}
            min={0}
            isPending={updateCurrentPriceMutation.isPending}
            hasChanges={hasCurrentPriceChanges}
            inputWidth="w-28"
          />
        </div>

        {/* Original Price */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Original Price</Label>
          <NumberInputWithControls
            value={originalPrice}
            onChange={handleOriginalPriceChange}
            onSave={() => updateOriginalPriceMutation.mutate(parseInt(originalPrice) || 0)}
            prefix="$"
            step={10}
            min={0}
            isPending={updateOriginalPriceMutation.isPending}
            hasChanges={hasOriginalPriceChanges}
            inputWidth="w-28"
          />
        </div>

        {/* Promo Label */}
        <div className="flex items-center gap-2 flex-1">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Promo Label</Label>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              type="text"
              value={promoLabel}
              onChange={(e) => handlePromoLabelChange(e.target.value)}
              placeholder="e.g., Cyber Monday deal"
              className="h-10"
            />
            <button
              onClick={() => updatePromoLabelMutation.mutate(promoLabel)}
              disabled={!hasPromoLabelChanges || updatePromoLabelMutation.isPending}
              className="h-10 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              {updatePromoLabelMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Cards */}
      <div
        className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.15s", animationFillMode: "both" }}
      >
        {/* Preview - Direct Purchase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Direct Purchase Preview
            </CardTitle>
            <CardDescription>
              How it appears without affiliate link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-6 text-center">
              {originalPriceNum > currentPriceNum && (
                <div className="text-slate-400 mb-2 text-sm">
                  Regular price{" "}
                  <span className="line-through">${originalPriceNum}</span>
                </div>
              )}
              <div className="text-4xl font-bold text-white mb-2">
                ${currentPriceNum}
              </div>
              {promoLabel && (
                <div className="text-cyan-400 font-medium text-sm mb-1">
                  {promoLabel}
                  {discountPercentage > 0 && ` - ${discountPercentage}% OFF`}
                </div>
              )}
              <div className="text-slate-400 text-xs">
                One-time payment, lifetime access
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview - With Affiliate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Affiliate Link Preview
            </CardTitle>
            <CardDescription>
              Example with 12% extra affiliate discount
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const exampleAffiliateDiscount = 12;
              const affiliatePrice = Math.round(currentPriceNum * (1 - exampleAffiliateDiscount / 100));
              const totalDiscount = originalPriceNum > 0
                ? Math.round(((originalPriceNum - affiliatePrice) / originalPriceNum) * 100)
                : 0;

              return (
                <div className="bg-slate-900 rounded-lg p-6 text-center">
                  <div className="text-slate-400 mb-2 text-sm">
                    Regular price{" "}
                    <span className="line-through">${originalPriceNum}</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${affiliatePrice}
                  </div>
                  {/* Promo as main */}
                  {promoLabel && (
                    <div className="text-cyan-400 font-medium text-sm">
                      {promoLabel}
                      {discountPercentage > 0 && ` - ${discountPercentage}% OFF`}
                    </div>
                  )}
                  {/* Affiliate as extra */}
                  <div className="text-green-400 text-xs mt-1">
                    + {exampleAffiliateDiscount}% extra via affiliate
                  </div>
                  <div className="text-slate-400 text-xs mt-2">
                    One-time payment, lifetime access
                  </div>

                  {totalDiscount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <span className="text-xs text-slate-500">
                        Total savings: {totalDiscount}% off original price
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
