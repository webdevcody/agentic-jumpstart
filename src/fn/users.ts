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

export const getUserInfoFn = createServerFn().handler(async () => {
  const user = await getCurrentUser();
  return { user };
});

export const getAllUsersWithProfilesFn = createServerFn({
  method: "GET",
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return getAllUsersWithProfiles();
  });
