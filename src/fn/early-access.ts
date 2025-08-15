import { createServerFn } from "@tanstack/react-start";
import { env } from "~/utils/env";
import { isAdminUseCase } from "~/use-cases/users";

export const checkEarlyAccessFn = createServerFn().handler(async () => {
  return { earlyAccessEnabled: env.EARLY_ACCESS_MODE };
});

export const shouldShowEarlyAccessFn = createServerFn().handler(async () => {
  const earlyAccessMode = env.EARLY_ACCESS_MODE;
  
  if (!earlyAccessMode) {
    return false;
  }
  
  // If early access mode is enabled, check if user is admin
  // Admins should bypass early access mode
  const isAdmin = await isAdminUseCase();
  return !isAdmin;
});
