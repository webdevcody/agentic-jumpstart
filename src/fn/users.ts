import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { getProfile } from "~/data-access/profiles";
import { getCurrentUser } from "~/utils/session";
import { getAllUsersWithProfiles } from "~/data-access/users";

export const getUserProfileFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) {
      return null;
    }
    return getProfile(context.userId);
  });

export const getUserInfoFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) {
      return { user: null, profile: null };
    }
    const user = await getCurrentUser();
    const profile = user ? await getProfile(user.id) : null;
    // Don't expose email in response - only return safe user data
    return {
      user: user
        ? {
            id: user.id,
            isPremium: user.isPremium,
            isAdmin: user.isAdmin,
            isEarlyAccess: user.isEarlyAccess,
            emailVerified: user.emailVerified,
          }
        : null,
      profile,
    };
  });

export const getAllUsersWithProfilesFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getAllUsersWithProfiles();
  });
