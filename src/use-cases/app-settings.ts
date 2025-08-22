import {
  getAllAppSettings,
  setAppSetting,
  isEarlyAccessMode as checkEarlyAccessMode,
  isAgentsFeatureEnabled as checkAgentsFeatureEnabled,
  isLaunchKitsFeatureEnabled as checkLaunchKitsFeatureEnabled,
  isAffiliatesFeatureEnabled as checkAffiliatesFeatureEnabled,
} from "~/data-access/app-settings";

export async function getAppSettingsUseCase() {
  const settings = await getAllAppSettings();

  // Transform into a more usable format
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>
  );
}

export async function getEarlyAccessModeUseCase() {
  return checkEarlyAccessMode();
}

export async function toggleEarlyAccessModeUseCase(enabled: boolean) {
  await setAppSetting("EARLY_ACCESS_MODE", enabled.toString());
}

export async function getAgentsFeatureEnabledUseCase() {
  return checkAgentsFeatureEnabled();
}

export async function toggleAgentsFeatureUseCase(enabled: boolean) {
  await setAppSetting("AGENTS_FEATURE", enabled.toString());
}

export async function getLaunchKitsFeatureEnabledUseCase() {
  return checkLaunchKitsFeatureEnabled();
}

export async function toggleLaunchKitsFeatureUseCase(enabled: boolean) {
  await setAppSetting("LAUNCH_KITS_FEATURE", enabled.toString());
}

export async function getAffiliatesFeatureEnabledUseCase() {
  return checkAffiliatesFeatureEnabled();
}

export async function toggleAffiliatesFeatureUseCase(enabled: boolean) {
  await setAppSetting("AFFILIATES_FEATURE", enabled.toString());
}
