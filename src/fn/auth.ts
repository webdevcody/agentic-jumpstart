import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { unauthenticatedMiddleware } from "~/lib/auth";
import { isAdminUseCase } from "~/use-cases/users";

export const isAuthenticatedFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    return !!context.userId;
  });

export const assertIsAdminFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/unauthenticated" });
    }

    if (!context.isAdmin) {
      throw redirect({ to: "/unauthorized" });
    }

    return context.user;
  });

export const assertAuthenticatedFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/unauthenticated" });
    }

    return context.user;
  });

export const isUserPremiumFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    return !!context.user?.isPremium;
  });

export const isAdminFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return isAdminUseCase();
  });

export const getCurrentUserIdFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    return context.user?.id ?? null;
  });
