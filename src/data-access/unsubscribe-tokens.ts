import { database } from "~/db";
import { unsubscribeTokens } from "~/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { randomBytes } from "crypto";

// Generate a secure unsubscribe token
export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

// Create an unsubscribe token for a user or newsletter subscriber
export async function createUnsubscribeToken(
  emailAddress: string,
  userId?: number
): Promise<string> {
  const token = generateUnsubscribeToken();

  // Token expires in 1 year (marketing emails need long-lived tokens)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await database.insert(unsubscribeTokens).values({
    token,
    userId: userId,
    emailAddress,
    expiresAt,
  });

  return token;
}

// Validate and consume an unsubscribe token
export async function validateAndConsumeUnsubscribeToken(
  token: string
): Promise<{ userId: number | null; emailAddress: string } | null> {
  const [tokenData] = await database
    .select()
    .from(unsubscribeTokens)
    .where(
      and(
        eq(unsubscribeTokens.token, token),
        eq(unsubscribeTokens.isUsed, false),
        gt(unsubscribeTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenData) {
    return null;
  }

  // Mark token as used
  await database
    .update(unsubscribeTokens)
    .set({ isUsed: true })
    .where(eq(unsubscribeTokens.id, tokenData.id));

  return {
    userId: tokenData.userId,
    emailAddress: tokenData.emailAddress,
  };
}

// Clean up expired tokens (optional, for maintenance)
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();
  await database
    .delete(unsubscribeTokens)
    .where(lt(unsubscribeTokens.expiresAt, now));
}
