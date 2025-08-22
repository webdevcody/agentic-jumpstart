import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import {
  getAppSettingsUseCase,
  toggleEarlyAccessModeUseCase,
  getEarlyAccessModeUseCase,
  getAgentsFeatureEnabledUseCase,
  toggleAgentsFeatureUseCase,
  getLaunchKitsFeatureEnabledUseCase,
  toggleLaunchKitsFeatureUseCase,
  getAffiliatesFeatureEnabledUseCase,
  toggleAffiliatesFeatureUseCase,
} from "~/use-cases/app-settings";

export const getAppSettingsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return getAppSettingsUseCase();
  });

export const toggleEarlyAccessModeFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    await toggleEarlyAccessModeUseCase(data.enabled);
    return { success: true };
  });

export const getEarlyAccessModeFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getEarlyAccessModeUseCase();
  });

export const getAgentsFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getAgentsFeatureEnabledUseCase();
  });

export const toggleAgentsFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    await toggleAgentsFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getLaunchKitsFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getLaunchKitsFeatureEnabledUseCase();
  });

export const toggleLaunchKitsFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    await toggleLaunchKitsFeatureUseCase(data.enabled);
    return { success: true };
  });

export const getAffiliatesFeatureEnabledFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return getAffiliatesFeatureEnabledUseCase();
  });

export const toggleAffiliatesFeatureFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { enabled: boolean }) => data)
  .handler(async ({ data, context }) => {
    await toggleAffiliatesFeatureUseCase(data.enabled);
    return { success: true };
  });
