import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import type { FlagKey } from "~/config";
import { isFeatureEnabledForUser } from "~/data-access/app-settings";

const authContextSchema = z.looseObject({
  userId: z.number().nullish(),
  isAdmin: z.boolean().nullish(),
});

export function createFeatureFlagMiddleware(flagKey: FlagKey) {
  return createMiddleware({ type: "function" }).server(async ({ next, context }) => {
    const ctx = authContextSchema.parse(context);

    // Admins always have access to all features
    if (ctx.isAdmin) {
      return next();
    }

    const userId = ctx.userId ?? null;
    const enabled = await isFeatureEnabledForUser(flagKey, userId);
    if (!enabled) {
      throw new Error(`Feature "${flagKey}" is not available`);
    }
    return next();
  });
}

export async function assertFeatureEnabled(flagKey: FlagKey) {
  const { isFeatureEnabledForUserFn } = await import("~/fn/app-settings");
  const enabled = await isFeatureEnabledForUserFn({ data: { flagKey } });
  if (!enabled) {
    throw redirect({ to: "/" });
  }
}
