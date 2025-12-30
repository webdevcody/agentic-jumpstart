import { useState } from "react";
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
import { FLAGS, type FlagKey, DISPLAYED_FLAGS } from "~/config";

/** Toggle functions for each flag */
const FLAG_TOGGLE_FNS: Record<FlagKey, (params: { data: { enabled: boolean } }) => Promise<unknown>> = {
  [FLAGS.EARLY_ACCESS_MODE]: toggleEarlyAccessModeFn,
  [FLAGS.AGENTS_FEATURE]: toggleAgentsFeatureFn,
  [FLAGS.ADVANCED_AGENTS_FEATURE]: (params) =>
    toggleFeatureFlagFn({ data: { flagKey: FLAGS.ADVANCED_AGENTS_FEATURE, enabled: params.data.enabled } }),
  [FLAGS.LAUNCH_KITS_FEATURE]: toggleLaunchKitsFeatureFn,
  [FLAGS.AFFILIATES_FEATURE]: toggleAffiliatesFeatureFn,
  [FLAGS.BLOG_FEATURE]: toggleBlogFeatureFn,
  [FLAGS.NEWS_FEATURE]: toggleNewsFeatureFn,
  [FLAGS.VIDEO_SEGMENT_CONTENT_TABS]: () => Promise.resolve(undefined),
};

export const Route = createFileRoute("/admin/settings")({
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
      toast.success(`${flagConfig?.title ?? "Feature"} updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update ${flagConfig?.title ?? "feature"}`);
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
  state: { enabled: boolean; targeting: unknown } | undefined;
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
  );
}

function SettingsPage() {
  const [targetingDialog, setTargetingDialog] = useState<{
    open: boolean;
    flagKey: FlagKey | null;
    flagName: string;
  }>({ open: false, flagKey: null, flagName: "" });

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

  const openTargetingDialog = (flagKey: FlagKey, flagName: string) => {
    setTargetingDialog({ open: true, flagKey, flagName });
  };

  return (
    <Page>
      <PageHeader
        title="App Settings"
        description="Manage application settings and feature flags"
        highlightedWord="Settings"
      />

      {/* Feature Flags Section */}
      <div
        className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
      >
        {DISPLAYED_FLAGS.map((flag, index) => (
          <FeatureFlagCardWrapper
            key={flag.key}
            flag={flag}
            state={flagStates?.[flag.key]}
            animationDelay={`${0.2 + index * 0.1}s`}
            onConfigureTargeting={() => openTargetingDialog(flag.key, flag.title)}
            featureStates={featureStatesRecord}
            flagConfigs={flagConfigsRecord}
          />
        ))}
      </div>

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
