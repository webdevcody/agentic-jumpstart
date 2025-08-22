import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { Shield, Bot, Package, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  toggleEarlyAccessModeFn,
  getEarlyAccessModeFn,
  toggleAgentsFeatureFn,
  getAgentsFeatureEnabledFn,
  toggleLaunchKitsFeatureFn,
  getLaunchKitsFeatureEnabledFn,
  toggleAffiliatesFeatureFn,
  getAffiliatesFeatureEnabledFn,
} from "~/fn/app-settings";
import { assertIsAdminFn } from "~/fn/auth";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Page } from "./-components/page";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: () => assertIsAdminFn(),
  component: SettingsPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["earlyAccessMode"],
      queryFn: () => getEarlyAccessModeFn(),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["agentsFeature"],
      queryFn: () => getAgentsFeatureEnabledFn(),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["launchKitsFeature"],
      queryFn: () => getLaunchKitsFeatureEnabledFn(),
    });
    context.queryClient.ensureQueryData({
      queryKey: ["affiliatesFeature"],
      queryFn: () => getAffiliatesFeatureEnabledFn(),
    });
  },
});

function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: earlyAccessMode, isLoading: isLoadingEarlyAccess } = useQuery({
    queryKey: ["earlyAccessMode"],
    queryFn: () => getEarlyAccessModeFn(),
  });

  const { data: agentsFeature, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agentsFeature"],
    queryFn: () => getAgentsFeatureEnabledFn(),
  });

  const { data: launchKitsFeature, isLoading: isLoadingLaunchKits } = useQuery({
    queryKey: ["launchKitsFeature"],
    queryFn: () => getLaunchKitsFeatureEnabledFn(),
  });

  const { data: affiliatesFeature, isLoading: isLoadingAffiliates } = useQuery({
    queryKey: ["affiliatesFeature"],
    queryFn: () => getAffiliatesFeatureEnabledFn(),
  });

  const toggleEarlyAccessMutation = useMutation({
    mutationFn: toggleEarlyAccessModeFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earlyAccessMode"] });
      toast.success("Early access mode updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update early access mode");
      console.error("Failed to toggle early access mode:", error);
    },
  });

  const toggleAgentsFeatureMutation = useMutation({
    mutationFn: toggleAgentsFeatureFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentsFeature"] });
      toast.success("Agents feature updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update agents feature");
      console.error("Failed to toggle agents feature:", error);
    },
  });

  const toggleLaunchKitsFeatureMutation = useMutation({
    mutationFn: toggleLaunchKitsFeatureFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchKitsFeature"] });
      toast.success("Launch kits feature updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update launch kits feature");
      console.error("Failed to toggle launch kits feature:", error);
    },
  });

  const toggleAffiliatesFeatureMutation = useMutation({
    mutationFn: toggleAffiliatesFeatureFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliatesFeature"] });
      toast.success("Affiliates feature updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update affiliates feature");
      console.error("Failed to toggle affiliates feature:", error);
    },
  });

  const handleToggleEarlyAccess = (checked: boolean) => {
    toggleEarlyAccessMutation.mutate({ data: { enabled: checked } });
  };

  const handleToggleAgentsFeature = (checked: boolean) => {
    toggleAgentsFeatureMutation.mutate({ data: { enabled: checked } });
  };

  const handleToggleLaunchKitsFeature = (checked: boolean) => {
    toggleLaunchKitsFeatureMutation.mutate({ data: { enabled: checked } });
  };

  const handleToggleAffiliatesFeature = (checked: boolean) => {
    toggleAffiliatesFeatureMutation.mutate({ data: { enabled: checked } });
  };

  return (
    <Page>
      <PageHeader
        title="App Settings"
        description="Manage application settings and feature flags"
        highlightedWord="Settings"
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Early Access Mode
            </CardTitle>
            <CardDescription className="h-20 overflow-hidden">
              Control whether the platform is in early access mode. When
              enabled, only admins can access the full site.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="early-access-mode"
                checked={earlyAccessMode || false}
                onCheckedChange={handleToggleEarlyAccess}
                disabled={
                  isLoadingEarlyAccess || toggleEarlyAccessMutation.isPending
                }
              />
              <Label htmlFor="early-access-mode" className="cursor-pointer">
                {earlyAccessMode ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground min-h-[2.5rem]">
              {earlyAccessMode
                ? "Only administrators can currently access the site. Regular users will see the early access page."
                : "The site is open to all users."}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agents Feature
            </CardTitle>
            <CardDescription className="h-20 overflow-hidden">
              Control whether the AI agents feature is available to users. When
              disabled, agent-related functionality will be hidden.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="agents-feature"
                checked={agentsFeature || false}
                onCheckedChange={handleToggleAgentsFeature}
                disabled={
                  isLoadingAgents || toggleAgentsFeatureMutation.isPending
                }
              />
              <Label htmlFor="agents-feature" className="cursor-pointer">
                {agentsFeature ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground min-h-[2.5rem]">
              {agentsFeature
                ? "Users can access AI agent features and functionality."
                : "Agent features are hidden from users."}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Launch Kits Feature
            </CardTitle>
            <CardDescription className="h-20 overflow-hidden">
              Control whether the launch kits feature is available to users.
              When disabled, launch kit functionality will be hidden.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="launch-kits-feature"
                checked={launchKitsFeature || false}
                onCheckedChange={handleToggleLaunchKitsFeature}
                disabled={
                  isLoadingLaunchKits ||
                  toggleLaunchKitsFeatureMutation.isPending
                }
              />
              <Label htmlFor="launch-kits-feature" className="cursor-pointer">
                {launchKitsFeature ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground min-h-[2.5rem]">
              {launchKitsFeature
                ? "Users can access launch kit features and templates."
                : "Launch kit features are hidden from users."}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Affiliates Feature
            </CardTitle>
            <CardDescription className="h-20 overflow-hidden">
              Control whether the affiliate program features are available to users.
              When disabled, affiliate-related functionality will be hidden.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <Switch
                id="affiliates-feature"
                checked={affiliatesFeature || false}
                onCheckedChange={handleToggleAffiliatesFeature}
                disabled={
                  isLoadingAffiliates ||
                  toggleAffiliatesFeatureMutation.isPending
                }
              />
              <Label htmlFor="affiliates-feature" className="cursor-pointer">
                {affiliatesFeature ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <p className="mt-3 text-sm text-muted-foreground min-h-[2.5rem]">
              {affiliatesFeature
                ? "Users can access affiliate program features and registration."
                : "Affiliate features are hidden from users."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
