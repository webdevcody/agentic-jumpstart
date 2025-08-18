import { database } from "~/db";
import { newsletterSignups } from "~/db/schema";
import { NewsletterSignupCreate, NewsletterSignup } from "~/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

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