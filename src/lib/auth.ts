import { createMiddleware } from "@tanstack/react-start";
import { validateRequest } from "~/utils/auth";
import { redirect } from "@tanstack/react-router";
import { type User } from "~/db/schema";
import { logMiddleware } from "./server-logger";

export function isAdmin(user: User | null) {
  return user?.isAdmin ?? false;
}

export const authenticatedMiddleware = createMiddleware({ type: "function" })
  .middleware([logMiddleware])
  .server(async ({ next }) => {
    const { user } = await validateRequest();

    if (!user) {
      throw redirect({ to: "/unauthenticated" });
    }

    return next({
      context: { userId: user.id, isAdmin: isAdmin(user), email: user.email },
    });
  });

export const adminMiddleware = createMiddleware({ type: "function" })
  .middleware([logMiddleware])
  .server(async ({ next }) => {
    const { user } = await validateRequest();

    if (!user) {
      throw redirect({ to: "/unauthenticated" });
    }

    if (!isAdmin(user)) {
      throw redirect({ to: "/unauthorized" });
    }

    return next({ context: { userId: user.id } });
  });

export const userIdMiddleware = createMiddleware({ type: "function" })
  .middleware([logMiddleware])
  .server(async ({ next }) => {
    const { user } = await validateRequest();

    return next({ context: { userId: user?.id } });
  });

export const unauthenticatedMiddleware = createMiddleware({ type: "function" })
  .middleware([logMiddleware])
  .server(async ({ next }) => {
    const { user } = await validateRequest();

    return next({
      context: { userId: user?.id, isAdmin: isAdmin(user), user },
    });
  });
