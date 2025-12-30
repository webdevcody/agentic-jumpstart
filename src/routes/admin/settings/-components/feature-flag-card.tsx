import type { LucideIcon } from "lucide-react";
import { Settings2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { TARGET_MODES, type TargetMode, type FlagKey } from "~/config";

const TARGET_MODE_LABELS: Record<TargetMode, string> = {
  [TARGET_MODES.ALL]: "All Users",
  [TARGET_MODES.PREMIUM]: "Premium Only",
  [TARGET_MODES.NON_PREMIUM]: "Non-Premium Only",
  [TARGET_MODES.CUSTOM]: "Custom",
};

interface FeatureFlagCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  switchId: string;
  checked: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
  isPending: boolean;
  targeting: { targetMode: TargetMode; users: unknown[] } | undefined;
  onConfigureTargeting: () => void;
  animationDelay: string;
  dependsOn?: FlagKey[];
  featureStates: Record<string, boolean | undefined>;
  flagConfigs: Record<string, { title: string }>;
}

export function FeatureFlagCard({
  icon: Icon,
  title,
  description,
  switchId,
  checked,
  onCheckedChange,
  isPending,
  targeting,
  onConfigureTargeting,
  animationDelay,
  dependsOn,
  featureStates,
  flagConfigs,
}: FeatureFlagCardProps) {
  const disabledDependencies = dependsOn?.filter(dep => !featureStates[dep]) ?? [];
  const isDisabledByDependency = disabledDependencies.length > 0;

  return (
    <Card
      className="flex flex-col h-full"
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Icon className="h-5 w-5" />
          {title}
          <div className="basis-full mt-1">
            <Badge variant="invert" className="text-xs w-full justify-center">
              {targeting
                ? targeting.targetMode === TARGET_MODES.CUSTOM
                  ? `${targeting.users.length} ${targeting.users.length === 1 ? "user" : "users"}`
                  : TARGET_MODE_LABELS[targeting.targetMode]
                : "All Users"}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="h-20 overflow-hidden mt-4">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <fieldset className={`text-xs border rounded-md px-3 py-2 min-w-0 overflow-hidden ${isDisabledByDependency ? "border-destructive text-destructive" : "border-border"}`}>
          <legend className="px-1 text-muted-foreground">Requirements</legend>
          <div className="overflow-hidden text-center">
            {!dependsOn || dependsOn.length === 0 ? (
              <span>All met</span>
            ) : (
              <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
                <span className={`${isDisabledByDependency ? "opacity-0" : "opacity-100"}`}>
                  All met
                </span>
                <span className={`inline-flex gap-1 justify-center ${isDisabledByDependency ? "opacity-100" : "opacity-0"}`}>
                  {dependsOn?.map((dep, i) => {
                    const isUnmet = !featureStates[dep];
                    return (
                      <span
                        key={dep}
                        className={`whitespace-nowrap ${isUnmet ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0 overflow-hidden"}`}
                      >
                        {flagConfigs[dep]?.title}{i < (dependsOn?.length ?? 0) - 1 && isUnmet ? "," : ""}
                      </span>
                    );
                  })}
                </span>
              </div>
            )}
          </div>
        </fieldset>
      </CardContent>
      <CardFooter className="border-t pt-3">
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onConfigureTargeting}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
            Config
          </button>
          <Switch
            id={switchId}
            checked={checked ?? false}
            onCheckedChange={onCheckedChange}
            disabled={isPending || isDisabledByDependency}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
