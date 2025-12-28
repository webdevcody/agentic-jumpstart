import { useQuery } from "@tanstack/react-query";
import { isFeatureEnabledForUserFn, getFeatureFlagEnabledFn } from "~/fn/app-settings";
import { type FlagKey } from "~/config";

interface FeatureFlagProps {
  flag: FlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** If true, respects flag state even for admins (no admin override). Useful for admin panel. */
  strict?: boolean;
}

export function FeatureFlag({ flag, children, fallback, strict = false }: FeatureFlagProps) {
  const { isEnabled, isLoading, isError } = useFeatureFlag(flag, { strict });

  if (isError) {
    console.error("Feature flag check failed for:", flag);
    return fallback ?? null;
  }

  if (isLoading) return fallback ?? null;

  if (!isEnabled) return fallback ?? null;

  return children;
}

interface UseFeatureFlagOptions {
  /** If true, respects flag state even for admins (no admin override). Useful for admin panel. */
  strict?: boolean;
}

export function useFeatureFlag(flag: FlagKey, options: UseFeatureFlagOptions = {}) {
  const { strict = false } = options;

  const { data: isEnabled, isLoading, isError } = useQuery({
    queryKey: ["featureFlag", flag, { strict }],
    queryFn: () => strict
      ? getFeatureFlagEnabledFn({ data: { flagKey: flag } })
      : isFeatureEnabledForUserFn({ data: { flagKey: flag } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { isEnabled: isEnabled ?? false, isLoading, isError };
}
