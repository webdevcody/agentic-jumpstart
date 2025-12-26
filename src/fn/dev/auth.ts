import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, like } from "drizzle-orm";
import { z } from "zod";
import { database } from "~/db";
import { accounts, profiles, users } from "~/db/schema";
import { getAccountByGoogleIdUseCase } from "~/use-cases/accounts";
import type { GoogleUser } from "~/use-cases/types";
import { createGoogleUserUseCase } from "~/use-cases/users";
import { getCurrentUser, setSession } from "~/utils/session";
import { DevGuardMiddleware } from "./middleware";

type DevLoginInput = { email: string; name: string; isAdmin: boolean; isPremium: boolean };

const DICEBEAR_STYLES = [
  "lorelei",
  "avataaars",
  "bottts",
  "fun-emoji",
  "notionists",
  "open-peeps",
  "personas",
  "pixel-art"
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash = hash & hash; }
  return Math.abs(hash);
}

function getDevAvatarUrl(email: string): string {
  const style = DICEBEAR_STYLES[simpleHash(email) % DICEBEAR_STYLES.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(email)}&size=200`;
}

function createMockGoogleUser(email: string, name: string): GoogleUser {
  const nameParts = name.split(" ");
  return {
    sub: `dev-${email.replace(/[^a-z0-9]/gi, "-")}`,
    name,
    given_name: nameParts[0] || "Dev",
    family_name: nameParts.slice(1).join(" ") || "User",
    picture: getDevAvatarUrl(email),
    email,
    email_verified: true,
    locale: "en",
  };
}

export const devLoginFn = createServerFn({ method: "POST" })
  .inputValidator((data: DevLoginInput) => data)
  .middleware([DevGuardMiddleware])
  .handler(async ({ data }: { data: DevLoginInput }) => {
    const { email, name, isAdmin, isPremium } = data;
    const mockGoogleUser = createMockGoogleUser(email, name);
    const existingAccount = await getAccountByGoogleIdUseCase(mockGoogleUser.sub);

    if (existingAccount) {
      await database.update(users).set({ isAdmin, isPremium }).where(eq(users.id, existingAccount.userId));
      await setSession(existingAccount.userId);
      return { success: true, userId: existingAccount.userId };
    }

    const userId = await createGoogleUserUseCase(mockGoogleUser);
    await database.update(users).set({ isAdmin, isPremium }).where(eq(users.id, userId));
    await setSession(userId);
    return { success: true, userId };
  });

export const getDevUsersFn = createServerFn({ method: "GET" })
  .middleware([DevGuardMiddleware])
  .handler(async () => {
    const devAccounts = await database.query.accounts.findMany({ where: like(accounts.googleId, "dev-%") });
    const userIds = devAccounts.map((a) => a.userId);
    if (userIds.length === 0) return [];

    const devUsers = await Promise.all(
      userIds.map(async (userId) => {
        const user = await database.query.users.findFirst({ where: eq(users.id, userId) });
        const profile = await database.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
        return {
          id: userId,
          email: user?.email ?? "",
          name: profile?.displayName ?? "",
          image: profile?.image ?? "",
          isAdmin: user?.isAdmin ?? false,
          isPremium: user?.isPremium ?? false,
        };
      })
    );
    return devUsers;
  });

export const switchDevUserFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.number() }))
  .middleware([DevGuardMiddleware])
  .handler(async ({ data }: { data: { userId: number } }) => {
    const { userId } = data;
    const account = await database.query.accounts.findFirst({ where: eq(accounts.userId, userId) });
    if (!account || !account.googleId?.startsWith("dev-")) throw new Error("Not a dev user");
    await setSession(userId);
    return { success: true };
  });

export const getDevMenuConfigFn = createServerFn({ method: "GET" })
  .middleware([DevGuardMiddleware])
  .handler(async () => {
    const user = await getCurrentUser();
    return { isEnabled: true, currentUserId: user?.id ?? null };
  });

export const assertDevModeFn = createServerFn().handler(async () => {
  if (process.env.NODE_ENV !== "development") {
    throw redirect({ to: "/" });
  }
});
