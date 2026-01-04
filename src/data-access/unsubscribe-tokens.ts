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
    userId: userId ?? null, // Explicitly use null for newsletter-only subscribers
    emailAddress,
    expiresAt,
  });

  return token;
}

// Batch create unsubscribe tokens for multiple recipients in a single query
// Returns a Map of email -> token for easy lookup
export async function createUnsubscribeTokensBatch(
  recipients: Array<{ email: string; userId?: number }>
): Promise<Map<string, string>> {
  if (recipients.length === 0) {
    return new Map();
  }

  // Token expires in 1 year (marketing emails need long-lived tokens)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Generate tokens for all recipients
  const tokenData = recipients.map((recipient) => ({
    token: generateUnsubscribeToken(),
    userId: recipient.userId ?? null,
    emailAddress: recipient.email,
    expiresAt,
  }));

  // Batch insert all tokens in a single query
  await database.insert(unsubscribeTokens).values(tokenData);

  // Create a map of email -> token for easy lookup
  const tokenMap = new Map<string, string>();
  for (const data of tokenData) {
    tokenMap.set(data.emailAddress, data.token);
  }

  return tokenMap;
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
