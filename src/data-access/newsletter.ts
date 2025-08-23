import { database } from "~/db";
import { newsletterSignups } from "~/db/schema";
import { NewsletterSignupCreate, NewsletterSignup } from "~/db/schema";
import { eq, desc, and, or, gte, lt, sql } from "drizzle-orm";

// Create a new newsletter signup
export async function createNewsletterSignup(
  signup: NewsletterSignupCreate
): Promise<NewsletterSignup> {
  const [newsletterSignup] = await database
    .insert(newsletterSignups)
    .values(signup)
    .returning();
  return newsletterSignup;
}

// Get all newsletter signups
export async function getNewsletterSignups(): Promise<NewsletterSignup[]> {
  return await database
    .select()
    .from(newsletterSignups)
    .orderBy(desc(newsletterSignups.createdAt));
}

// Get newsletter signups by type
export async function getNewsletterSignupsByType(
  subscriptionType: "newsletter" | "waitlist"
): Promise<NewsletterSignup[]> {
  return await database
    .select()
    .from(newsletterSignups)
    .where(eq(newsletterSignups.subscriptionType, subscriptionType))
    .orderBy(desc(newsletterSignups.createdAt));
}

// Get newsletter signup by email
export async function getNewsletterSignupByEmail(
  email: string
): Promise<NewsletterSignup | null> {
  const [signup] = await database
    .select()
    .from(newsletterSignups)
    .where(eq(newsletterSignups.email, email))
    .limit(1);

  return signup || null;
}

// Update newsletter signup
export async function updateNewsletterSignup(
  email: string,
  updates: Partial<{
    isVerified: boolean;
    subscriptionType: string;
    source: string;
  }>
): Promise<void> {
  await database
    .update(newsletterSignups)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(newsletterSignups.email, email));
}

// Delete newsletter signup
export async function deleteNewsletterSignup(email: string): Promise<void> {
  await database
    .delete(newsletterSignups)
    .where(eq(newsletterSignups.email, email));
}

// Get newsletter and waitlist emails for emailing
export async function getNewsletterEmailsForEmailing(): Promise<
  Array<{ email: string }>
> {
  return await database
    .select({
      email: newsletterSignups.email,
    })
    .from(newsletterSignups)
    .where(
      or(
        eq(newsletterSignups.subscriptionType, "newsletter"),
        eq(newsletterSignups.subscriptionType, "waitlist")
      )
    );
}

// Get newsletter signups count by type
export async function getNewsletterSignupsCount(): Promise<{
  newsletter: number;
  waitlist: number;
  total: number;
}> {
  const allSignups = await database.select().from(newsletterSignups);

  const newsletter = allSignups.filter(
    (signup) => signup.subscriptionType === "newsletter"
  ).length;

  const waitlist = allSignups.filter(
    (signup) => signup.subscriptionType === "waitlist"
  ).length;

  return {
    newsletter,
    waitlist,
    total: allSignups.length,
  };
}

// Get email signup analytics for a specific month
export async function getEmailSignupAnalytics(
  year: number,
  month: number,
  subscriptionType: "newsletter" | "waitlist" = "waitlist"
): Promise<Array<{ date: string; count: number }>> {
  // Calculate the start and end of the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await database
    .select({
      // Extract date directly without timezone conversion
      // The frontend will handle displaying in the user's local timezone
      date: sql<string>`DATE(${newsletterSignups.createdAt})`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(newsletterSignups)
    .where(
      and(
        eq(newsletterSignups.subscriptionType, subscriptionType),
        gte(newsletterSignups.createdAt, startDate),
        lt(newsletterSignups.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${newsletterSignups.createdAt})`)
    .orderBy(sql`DATE(${newsletterSignups.createdAt})`);

  // Fill in missing dates with 0 count
  const dailyData: Array<{ date: string; count: number }> = [];
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const existing = result.find((r) => r.date === dateStr);
    dailyData.push({
      date: dateStr,
      count: existing ? Number(existing.count) : 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyData;
}
