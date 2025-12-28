import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  toggleEarlyAccessModeFn,
  toggleAgentsFeatureFn,
  toggleLaunchKitsFeatureFn,
  toggleAffiliatesFeatureFn,
  toggleBlogFeatureFn,
  toggleNewsFeatureFn,
  toggleFeatureFlagFn,
} from "~/fn/app-settings";
import { getAllFeatureFlagsFn } from "~/fn/feature-flags";
import { assertIsAdminFn } from "~/fn/auth";
import { toast } from "sonner";
import { Page } from "./-components/page";
import { TargetingDialog } from "./settings/-components/targeting-dialog";
import { FeatureFlagCard } from "./settings/-components/feature-flag-card";
import { FLAGS, type FlagKey, DISPLAYED_FLAGS, FLAG_GROUPS, type FlagGroup, type TargetMode } from "~/config";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";

type FlagState = { enabled: boolean; targeting: { targetMode: TargetMode; users: unknown[] } | undefined };

/** Toggle functions for each flag */
const FLAG_TOGGLE_FNS: Record<FlagKey, (params: { data: { enabled: boolean } }) => Promise<unknown>> = {
  [FLAGS.EARLY_ACCESS_MODE]: toggleEarlyAccessModeFn,
  [FLAGS.AGENTS_FEATURE]: toggleAgentsFeatureFn,
  [FLAGS.ADVANCED_AGENTS_FEATURE]: (params) =>
    toggleFeatureFlagFn({ data: { flagKey: FLAGS.ADVANCED_AGENTS_FEATURE, enabled: params.data.enabled } }),
  [FLAGS.LAUNCH_KITS_FEATURE]: toggleLaunchKitsFeatureFn,
  [FLAGS.AFFILIATES_FEATURE]: toggleAffiliatesFeatureFn,
  [FLAGS.AFFILIATE_CUSTOM_PAYMENT_LINK]: (params) =>
    toggleFeatureFlagFn({ data: { flagKey: FLAGS.AFFILIATE_CUSTOM_PAYMENT_LINK, enabled: params.data.enabled } }),
  [FLAGS.AFFILIATE_DISCOUNT_SPLIT]: (params) =>
    toggleFeatureFlagFn({ data: { flagKey: FLAGS.AFFILIATE_DISCOUNT_SPLIT, enabled: params.data.enabled } }),
  [FLAGS.BLOG_FEATURE]: toggleBlogFeatureFn,
  [FLAGS.NEWS_FEATURE]: toggleNewsFeatureFn,
  [FLAGS.VIDEO_SEGMENT_CONTENT_TABS]: (params) =>
    toggleFeatureFlagFn({ data: { flagKey: FLAGS.VIDEO_SEGMENT_CONTENT_TABS, enabled: params.data.enabled } }),
};

export const Route = createFileRoute("/admin/feature-flags")({
  beforeLoad: () => assertIsAdminFn(),
  component: SettingsPage,
  loader: ({ context }) => {
    // Prefetch all feature flags in one request
    context.queryClient.ensureQueryData({
      queryKey: ["allFeatureFlags"],
      queryFn: () => getAllFeatureFlagsFn(),
    });
  },
});

function useToggleFlag(flagKey: FlagKey) {
  const queryClient = useQueryClient();
  const flagConfig = DISPLAYED_FLAGS.find((f) => f.key === flagKey);

  const toggleMutation = useMutation({
    mutationFn: FLAG_TOGGLE_FNS[flagKey],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allFeatureFlags"] });
      toast.success(`${flagConfig?.title ?? `Feature`} updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update ${flagConfig?.title ?? `feature`}`);
      console.error(`Failed to update ${flagKey}:`, error);
    },
  });

  return {
    toggle: (checked: boolean) => toggleMutation.mutate({ data: { enabled: checked } }),
    isPending: toggleMutation.isPending,
  };
}

/** Wrapper component that handles toggle mutation for each flag */
function FeatureFlagCardWrapper({
  flag,
  state,
  animationDelay,
  onConfigureTargeting,
  featureStates,
  flagConfigs,
}: {
  flag: (typeof DISPLAYED_FLAGS)[number];
  state: FlagState | undefined;
  animationDelay: string;
  onConfigureTargeting: () => void;
  featureStates: Record<string, boolean | undefined>;
  flagConfigs: Record<string, { title: string }>;
}) {
  const { toggle, isPending } = useToggleFlag(flag.key);

  return (
    <FeatureFlagCard
      icon={flag.icon}
      title={flag.title}
      description={flag.description}
      switchId={flag.key.toLowerCase().replace(/_/g, "-")}
      checked={state?.enabled}
      onCheckedChange={toggle}
      isPending={isPending}
      targeting={state?.targeting}
      onConfigureTargeting={onConfigureTargeting}
      animationDelay={animationDelay}
      dependsOn={flag.dependsOn}
      featureStates={featureStates}
      flagConfigs={flagConfigs}
    />
  )
}

/** Order of groups for display */
const GROUP_ORDER: FlagGroup[] = [
  FLAG_GROUPS.PLATFORM,
  FLAG_GROUPS.AI_AGENTS,
  FLAG_GROUPS.LAUNCH_KITS,
  FLAG_GROUPS.AFFILIATES,
  FLAG_GROUPS.CONTENT,
];

function SettingsPage() {
  const [targetingDialog, setTargetingDialog] = useState<{
    open: boolean;
    flagKey: FlagKey | null;
    flagName: string;
  }>({ open: false, flagKey: null, flagName: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<FlagGroup | null>(null);

  // Single query for all feature flags - no hooks violation!
  const { data: flagStates } = useQuery({
    queryKey: ["allFeatureFlags"],
    queryFn: () => getAllFeatureFlagsFn(),
  });

  // Create featureStates record for dependency checking
  const featureStatesRecord: Record<string, boolean | undefined> = Object.fromEntries(
    DISPLAYED_FLAGS.map((flag) => [flag.key, flagStates?.[flag.key]?.enabled])
  );

  // Create flagConfigs record for dependency titles
  const flagConfigsRecord: Record<string, { title: string }> = Object.fromEntries(
    DISPLAYED_FLAGS.map((flag) => [flag.key, { title: flag.title }])
  );

  // Filter and group flags
  const filteredAndGroupedFlags = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter flags based on search and selected group
    const filtered = DISPLAYED_FLAGS.filter((flag) => {
      // Filter by group if selected
      if (selectedGroup && flag.group !== selectedGroup) return false;

      // Filter by search query
      if (!query) return true;
      return (
        flag.title.toLowerCase().includes(query) ||
        flag.description.toLowerCase().includes(query) ||
        flag.key.toLowerCase().includes(query) ||
        flag.group.toLowerCase().includes(query)
      );
    });

    // Group flags by their group property
    const grouped = GROUP_ORDER.map((group) => ({
      group,
      flags: filtered.filter((flag) => flag.group === group),
    })).filter((g) => g.flags.length > 0);

    return grouped;
  }, [searchQuery, selectedGroup]);

  const openTargetingDialog = (flagKey: FlagKey, flagName: string) => {
    setTargetingDialog({ open: true, flagKey, flagName });
  };

  // Track global animation index across groups
  let animationIndex = 0;

  return (
    <Page>
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags to control application functionality"
        highlightedWord="Flags"
      />

      {/* Search Bar */}
      <div
        className="mt-6 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feature flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Group Filter Tabs */}
      <div
        className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.12s", animationFillMode: "both" }}
      >
        <button
          type="button"
          onClick={() => setSelectedGroup(null)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            selectedGroup === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }`}
        >
          All
        </button>
        {GROUP_ORDER.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setSelectedGroup(group)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedGroup === group
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Feature Flags Grid */}
      <div
        className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.15s", animationFillMode: "both" }}
      >
        {filteredAndGroupedFlags.flatMap((groupData) =>
          groupData.flags.map((flag) => {
            const currentIndex = animationIndex++;
            return (
              <FeatureFlagCardWrapper
                key={flag.key}
                flag={flag}
                state={flagStates?.[flag.key]}
                animationDelay={`${0.2 + currentIndex * 0.05}s`}
                onConfigureTargeting={() => openTargetingDialog(flag.key, flag.title)}
                featureStates={featureStatesRecord}
                flagConfigs={flagConfigsRecord}
              />
            );
          })
        )}
      </div>

      {filteredAndGroupedFlags.length === 0 && (searchQuery || selectedGroup) && (
        <div className="text-center py-12 text-muted-foreground">
          No feature flags found{searchQuery ? ` matching "${searchQuery}"` : ""}{selectedGroup ? ` in ${selectedGroup}` : ""}
        </div>
      )}

      {targetingDialog.flagKey && (
        <TargetingDialog
          open={targetingDialog.open}
          onOpenChange={(open) => setTargetingDialog((prev) => ({ ...prev, open }))}
          flagKey={targetingDialog.flagKey}
          flagName={targetingDialog.flagName}
        />
      )}
    </Page>
  );
}
