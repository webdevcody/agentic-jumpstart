import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminUseCase } from "~/use-cases/users";
import { getEarlyAccessModeUseCase } from "~/use-cases/app-settings";
import { unauthenticatedMiddleware } from "~/lib/auth";

export const checkEarlyAccessFn = createServerFn()
  .validator(z.void())
  .handler(async () => {
    try {
      const earlyAccessEnabled = await getEarlyAccessModeUseCase();
      return { earlyAccessEnabled };
    } catch (error) {
      console.error("Error checking early access:", error);
      return { earlyAccessEnabled: false };
    }
  });

export const shouldShowEarlyAccessFn = createServerFn()
  .validator(z.void())
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    try {
      const earlyAccessMode = await getEarlyAccessModeUseCase();

      if (!earlyAccessMode) {
        return false;
      }

      if (context.user?.isEarlyAccess || context.isAdmin) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking should show early access:", error);
      // Default to showing early access if there's an error
      return true;
    }
  });
