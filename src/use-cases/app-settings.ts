import {
  getAllAppSettings,
  setAppSetting,
  isEarlyAccessMode as checkEarlyAccessMode,
  isAgentsFeatureEnabled as checkAgentsFeatureEnabled,
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
